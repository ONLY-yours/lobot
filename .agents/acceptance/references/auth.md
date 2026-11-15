# Auth for Lobot acceptance

**Auth is the gate for every automated run.** Lobot has no server, so there is no
seeded test user: the Electron instance runs on a **real LobeHub Cloud login**
restored from a snapshot, and the CLI uses the user's own `lh` login. Two rules
follow from that:

- Never start a sign-in flow from automation (below).
- Everything a run creates goes into the test workspace and is removed afterwards
  (`PROJECT.md` §3 and §6): `app-probe.sh workspace` right after the auth check.

| Surface  | Mechanism                                | Persistence                                                    | Human interaction             |
| -------- | ---------------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| Electron | The app's own Cloud login                | `~/.lobehub/agent-testing/electron-login` (snapshot on `stop`) | One manual sign-in, ever      |
| CLI      | The user's own `lh login`                | `~/.lobehub`                                                   | None — already signed in      |
| Bot      | Native apps (Discord/WeChat/…) logged in | Each app's own session                                         | Once per app                  |

## What the login copy changes

`start` copies the snapshot into the instance's own userData
(`scripts/devInstance.mts`, `copyLoginItems`) and rewrites what must not follow it:

- `gatewayDeviceId` — dropped, so two instances never replace each other's
  device-gateway socket.
- `gatewayUrl` — dropped. A hand-set address (often a local `wrangler dev` that is
  not running) would leave the device gateway offline; the server's own is
  discovered instead. `DEVICE_GATEWAY_URL` in the shell still overrides it.
- `storagePath` — pointed at the instance's own `lobehub-storage`. Left as is it
  names the source profile's folder, and the instance would read and write the
  user's own dev data.

## Electron

The desktop app keeps its login in its user-data directory. Pool instances get a
throwaway userData, so `electron-dev.sh` persists the login **for you**: `stop`
snapshots it into `~/.lobehub/agent-testing/electron-login` before wiping the dir,
and `start` seeds every new instance from that snapshot. Sign in once, not once
per run.

```bash
EDEV=.agents/acceptance/scripts/electron-dev.sh
$EDEV login-status        # which source seeds the next instance, and its expiry
$EDEV save-login <id>     # snapshot a live instance without stopping it
```

The standard check (do NOT hand-roll a store eval) once Electron is up with CDP:

```bash
.agents/acceptance/scripts/app-probe.sh auth
# → {"ok":true,"isSignedIn":true,"userId":"user_xxx"}
```

### When the instance comes up signed out

**NEVER trigger the OAuth sign-in flow (`requestAuthorization` / opening
`/oidc/auth` in any form).** `AuthCtr` runs it through `shell.openExternal`, so
it **hijacks the user's default browser with a login/authorize page** — visibly,
on their machine, possibly repeatedly — and an automated run cannot complete it.
This recipe used to live here; it was a mistake.

Login state must be **injected directly**, never acquired through a login page:

1. **Restore the login snapshot** — `$EDEV login-status` to inspect
   `~/.lobehub/agent-testing/electron-login`, and let `start` seed the instance
   from it. A signed-out boot usually means the snapshot is stale because a
   previous instance was killed instead of stopped (see the traps below) — a
   `save-login <id>` from any still-live signed-in instance repairs it.
2. **It does not work → report auth as ❌ Blocked and stop.** There is no local
   server to seed a session from: the login is a Cloud login. → report auth as ❌ Blocked and stop.** Tell the user the
   Electron surface needs one manual sign-in (once — the snapshot then covers
   future runs). Do not open any login page on their behalf.

Three traps behind a signed-out instance:

- **The refresh token rotates on every boot.** Only the instance that booted last
  holds a usable one, so a `stop` is what keeps the snapshot alive. If an instance is
  _killed_ instead (crash, command timeout) its rotated token dies with it —
  `save-login <id>` before anything risky.
- **`encryptedTokens.expiresAt` is the ACCESS token's expiry, not the refresh
  token's.** It is `Date.now() + data.expires_in * 1000` in
  `RemoteServerConfigCtr.saveTokens`, so it goes stale on a perfectly refreshable
  login and must never gate whether a profile is kept. The signal that _does_ mean
  signed out is a **missing `refreshToken`**: the app calls `clearTokens()` (deleting
  the whole `encryptedTokens` key) when a refresh fails non-retryably
  (`invalid_grant` \&co), and preserves it on transient failures.
- **Even a missing token does not always mean signed out.** A better-auth cookie can
  outlive it. `stop` / `save-login` probe the _running renderer_ for a user id, so a
  live cookie-only session is captured too; the on-disk token alone would miss it.

## Scope

- These recipes restore a Cloud login into throwaway dev instances. They never
  touch the user's own Lobot or dev profile.
- Tests of the login UI itself need a signed-out instance and a human at the keyboard;
  they are out of scope for automated runs.
