import { InstanceStatus } from '@companion-module/base'
import { io } from 'socket.io-client'
import {
  updatePlaybackState,
  updateRoomState,
  updateTimerState,
  updateFlashingState,
  updateMessageState,
} from './state.js'
import { actionIdType } from './actions.js'

/** @type {import('socket.io-client').Socket} */
let socket = null

/**
 * Enum of allowed Stagetimer.io socket events
 *
 * @readonly
 * @enum {string}
 */
export const stagetimerEvents = {
  playback_status: 'playback_status',
  room: 'room',
  flash: 'flash',
  message: 'message',
}

/**
 * Disconnect existing Socket.io connection
 *
 * @returns {void}
 */
export function socketStop() {
  if (socket) {
    socket.disconnect()
  }
}

/**
 * Configure and start Socket.io connection
 *
 * @param {ModuleInstance} instance
 * @returns {void}
 */
export function socketStart(instance) {

  if (!instance || !instance.config) {
    throw Error('Module instance required')
  }

  const { apiUrl, roomId, apiKey } = instance.config
  const url = new URL(apiUrl)

  socketStop()

  instance.log('info', 'Connecting to Stagetimer.io...')
  instance.updateStatus(InstanceStatus.Connecting)

  // Configure socket
  socket = io(url.origin, {
    path: url.pathname + 'socket.io',
    auth: {
      room_id: roomId,
      api_key: apiKey,
    },
    // Prevent infinite retries
    reconnectionAttempts: 5,
    // Prevent infinite exponential backoff
    reconnectionDelayMax: 10000,
  })

  //
  // Socket events
  //

  socket.on('connect', () => {
    instance.log('info', 'Connected!')
    instance.updateStatus(InstanceStatus.Ok)

    instance.apiClient.send(actionIdType.get_room, {})
      .then(({ data }) => {

        const { _id, name, blackout, focus_message } = data

        updateRoomState({
          roomId: _id,
          roomName: name,
          roomBlackout: blackout,
          roomFocus: focus_message,
        })
      })
      .catch((error) => {
        instance.log('error', error.toString())
      })

    instance.apiClient.send(actionIdType.get_status, {})
      .then(({ data }) => {

        const { timer_id, running, start, finish, pause } = data

        updatePlaybackState({
          currentTimerId: timer_id,
          isRunning: running,
          kickoff: start,
          deadline: finish,
          lastStop: pause,
        })

        return timer_id
      })
      .then((timer_id) => {
        if (!timer_id) { return false }
        getTimerAndUpdateState(instance, timer_id)
      })
      .catch((error) => {
        instance.log('error', error.toString())
      })
  })

  socket.on('connect_error', (error) => {
    instance.log('warn', `Failed to connect! (${error.message})`)
    instance.updateStatus(InstanceStatus.ConnectionFailure)
  })

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') { return }
    instance.log('warn', `Disconnected! Reason: ${reason}`)
    instance.updateStatus(InstanceStatus.Disconnected)
  })

  socket.on('error', (error) => {
    instance.log('error', `Unexpected error: ${error.message}`)
    instance.updateStatus(InstanceStatus.UnknownError)
  })

  //
  // Socket IO Manager events
  //

  socket.io.on('reconnect_attempt', (attempt) => {
    instance.log('warn', `Reconnecting... (Attempt #${attempt})`)
    instance.updateStatus(InstanceStatus.Connecting)
  })

  socket.io.on('reconnect', (attempt) => {
    instance.log('info', `Reconnected on attempt #${attempt}!`)
    instance.updateStatus(InstanceStatus.Ok)
  })

  socket.io.on('reconnect_failed', () => {
    instance.log('error', `Unable to connect to Stagetimer.io!`)
    instance.updateStatus(InstanceStatus.ConnectionFailure)
  })

  socket.io.on('error', (error) => {
    instance.log('debug', `[Socket manager] Unexpected error: ${error}`)
  })

  //
  // Stagetimer events
  //

  socket.on(stagetimerEvents.playback_status, (payload) => {
    instance.log('debug', 'Event: playback_status')

    const { timer_id, running, start, finish, pause } = payload

    updatePlaybackState({
      currentTimerId: timer_id,
      isRunning: running,
      kickoff: start,
      deadline: finish,
      lastStop: pause,
    })

    getTimerAndUpdateState(instance, timer_id)
  })

  socket.on(stagetimerEvents.room, (payload) => {
    instance.log('debug', 'Event: room')

    const { blackout, focus_message } = payload

    updateRoomState({
      roomBlackout: blackout,
      roomFocus: focus_message,
    })
  })

  socket.on(stagetimerEvents.message, (payload) => {
    instance.log('debug', 'Event: message')

    const { showing, text, color, bold, uppercase } = payload

    updateMessageState({
      showing,
      text,
      color,
      bold,
      uppercase,
    })
  })

  socket.on(stagetimerEvents.flash, (payload) => {
    instance.log('debug', 'Event: flash')

    const { count } = payload

    updateFlashingState(count)
  })

  // Start
  socket.connect()
}

/**
 *
 * @param {ModuleInstance} instance
 * @param {string} timer_id
 */
function getTimerAndUpdateState(instance, timer_id) {

  instance.apiClient.send(actionIdType.get_timer, { timer_id })
    .then(({ data }) => {

      const { name, speaker, notes, duration, wrap_up_yellow, wrap_up_red } = data

      updateTimerState({
        name,
        speaker,
        notes,
        duration,
        wrap_up_yellow,
        wrap_up_red,
      })
    })
    .catch((error) => {
      instance.log('error', error.toString())
    })
}
