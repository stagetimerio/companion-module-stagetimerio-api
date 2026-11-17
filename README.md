# companion-module-stagetimerio-api

A [Bitfocus Companion](https://bitfocus.io/companion) module for controlling [Stagetimer.io](https://stagetimer.io/) timers remotely.

## Features

- **Transport controls** – Start, stop, reset, next, previous, add/subtract time
- **Timer actions** – Control specific timers by ID
- **Viewer controls** – Flash screen, blackout mode, focus mode
- **Message actions** – Show, hide, toggle, and create messages
- **Real-time feedback** – Playback state, timer phases (yellow/red warnings), viewer modes
- **Variables** – Room info, current/next timer details, time display values
- **Presets** – Pre-configured buttons for common operations

The module connects via the [Stagetimer HTTP RPC API](https://stagetimer.io/docs/api-v1) and [Socket.io endpoint](https://stagetimer.io/docs/api-v1/#socket-io-endpoint) for real-time updates.

## Usage

See [HELP.md](./companion/HELP.md) for configuration and usage instructions.

**Requirements:** Stagetimer Pro or Premium plan, Room ID, and API Key.

## Development Setup

Refer to the [Companion Module Base Wiki](https://github.com/bitfocus/companion-module-base/wiki) for detailed instructions.

**Quick start:**

1. Install Node.js 22 (recommended via [fnm](https://github.com/Schniz/fnm)):
   ```sh
   fnm install 22 && fnm use 22 && corepack enable
   ```

2. Clone this repository into your Companion dev modules folder:
   ```sh
   git clone https://github.com/stagetimerio/companion-module-stagetimerio-api.git
   ```

3. Install dependencies:
   ```sh
   yarn install
   ```

4. In Companion settings, set **Developer modules path** to your dev folder.

5. The module will auto-reload on file changes. Run linting and tests with:
   ```sh
   yarn lint
   yarn test
   ```

## Releasing

1. **Write the changelog.** Add a `## vX.Y.Z` section to the top of `CHANGELOG.md` and commit it.

2. **Bump the version.** This changes `package.json`, commits and creates the tag. `companion/manifest.json` keeps `0.0.0`, because the build writes the version.
   ```sh
   npm version patch  # or minor, or major
   ```

3. **Push to your fork and create a PR:**
   ```sh
   git push origin main --follow-tags
   ```
   Then open a PR to the [bitfocus repository](https://github.com/bitfocus/companion-module-stagetimerio-api).

4. **After the PR is merged**, push the tag to the Bitfocus remote and publish a GitHub release with the changelog section:
   ```sh
   git push bitfocus vX.Y.Z
   awk '/^## vX.Y.Z/{f=1;next} f&&/^## /{exit} f' CHANGELOG.md > notes.md
   gh release create vX.Y.Z -R bitfocus/companion-module-stagetimerio-api --notes-file notes.md
   ```
   Publishing the release starts `.github/workflows/release.yaml`. It builds the module and attaches `stagetimerio-api-X.Y.Z.tgz` to the release. To build again, re-run the workflow in the Actions tab.

5. **Submit via Developer Portal:**
   - Go to the [Bitfocus Developer Portal](https://developer.bitfocus.io/) and log in with GitHub
   - Navigate to **My Connections** → select this module
   - Click **Submit Version** and choose the git tag you just pushed
   - Mark as prerelease if applicable, then submit for review

6. **Review:** Community volunteers review submissions. Once approved, the new version becomes available to Companion users (v4.0.0+).
