# PROJECT.md — acceptance adapter for Lobot

This file is the **commands** layer of Lobot's acceptance setup: every
Lobot-specific command, port, service, surface, and probe. The `acceptance`
skill reads it — it never guesses Lobot's commands.

Its two siblings:

- [`PROCESS.md`](./PROCESS.md) — the run process (plan gate, execution rules,
  publishing, teardown).
- `.agents/skills/acceptance/` — the portable skill: what a check, evidence,
  report, and round are. This is a committed, generated snapshot of
  [`lobehub/acceptance`](https://github.com/lobehub/acceptance), the only maintenance
  source. Update it from the repository's current default branch with
  `bun apps/cli/src/index.ts acceptance update --json`, then review and commit the
  downloaded files. The JSON records the exact source commit; publishing a tag
  or release is not required. Do not hand-edit this installed copy.
  `.claude/skills` shares `.agents/skills`.

Project helpers (`report-init.sh`, `record-gif.sh`, `capture-app-window.sh`, …)
live under `.agents/acceptance/scripts/`. Generic CDP capture and screen-recording
preflight live only under `.agents/skills/acceptance/scripts/`; invoke their shell
scripts with `bash`. See the installed skill's
[`screenshot-helpers.md`](../skills/acceptance/references/screenshot-helpers.md)
for commands, prerequisites, and exit codes. Do not copy these implementations
into the project layer.

## 1. Project summary

Lobot is LobeHub's IM-style desktop client: an Electron shell (`electron/`) around
the React SPA (`src/`), plus the `lh` CLI (`apps/cli`). It was split out of the
lobehub monorepo **without the server**: there is no `apps/server`, no Next.js
backend, no database and no migrations here. The backend is **LobeHub Cloud**
(`app.lobehub.com`); `@/server/*` types resolve to `any`, which is why
`bun run type-check` carries a baseline of ~190 errors.

What that means for acceptance:

- **Electron against Cloud is the product surface.** Every UI change, including one
  that also ships on the web app, is verified in a local Electron dev instance
  running this checkout.
- **There is no Web surface.** Nothing here serves the SPA in a browser with a
  backend behind it.
- **Runs use a real Cloud account.** Everything a run creates lands in that account,
  so it goes into the dedicated test workspace (§3) and is cleaned up afterwards.
- A backend change belongs to the lobehub repository (`../lobehub`) and is accepted
  there with its own adapter.

Repo layout that matters for testing:

- `electron/main/` — Electron main process (`pre-app-init.ts`, `core/App.ts`).
- `scripts/dev.mjs` → `scripts/devOrchestrator.mjs` — `pnpm dev`: Vite + Electron.
- `scripts/devInstance.mts` — dev-instance rules (ports, profile env, login seeding),
  driven by `.agents/acceptance/scripts/electron-dev.sh` through `devInstanceCli.mts`.
- `src/` — the SPA. `apps/cli/` — the `lh` CLI, run from source.
- The root `pnpm install` covers `packages/**`, `electron/main` and `apps/cli`.

## 2. Environment

- **Start:** `.agents/acceptance/scripts/electron-dev.sh start [<id>]` launches an
  isolated dev instance of this checkout (default id 1): CDP `9222+id`, Vite
  `5173+id`, its own userData under `/tmp/lobe-electron-pool/ud-<id>`, its own IPC
  id, and a `#<id>` label on every window. Its login is seeded from the saved
  snapshot (§3). The user's own `pnpm dev` and profile are never touched.
- **Stop (only what this run started):** `.agents/acceptance/scripts/electron-dev.sh stop [<id>]`.
  It stops the instance's own process tree and port holders, snapshots the rotated
  login, and removes the instance's userData. `KEEP_DATA=1` keeps the userData.
  Never `pkill -f Electron` — that also closes every other Electron app on the machine.
- **Status / list:** `electron-dev.sh status [<id>]`, `electron-dev.sh list`.
- **Required services:** none locally. The instance talks to LobeHub Cloud.
  - The device gateway is discovered from the server. `DEVICE_GATEWAY_URL` in the
    calling shell overrides it for a local `wrangler dev` gateway.
  - The login copy drops the source install's hand-set `gatewayUrl` and its
    `gatewayDeviceId`, and points `storagePath` at the instance's own folder.
- **Dependencies:** `pnpm install` at the root. A stale install fails at launch with
  `Rolldown failed to resolve import "@lobechat/<pkg>"`.
- **Already-running detection:** `electron-dev.sh status <id>`, or
  `.agents/acceptance/scripts/app-probe.sh ready`.
- **Main-process changes:** `electron-dev.sh restart <id>`. Renderer changes hot-reload.
- **Local backend (manual, rarely needed):** start the server from `../lobehub`
  with its own adapter, then switch the instance to self-hosted mode
  (`storageMode: selfHost`, `remoteServerUrl` pointing at it). Nothing here
  automates this.
- Multiple instances (several worktrees, parallel runs):
  `.agents/acceptance/references/multi-instance.md`.

## 3. Auth

- **Electron:** the saved login snapshot at `~/.lobehub/agent-testing/electron-login`
  seeds every new instance. `stop` re-snapshots it, because the refresh token
  rotates on every boot.
  - **Check:** `electron-dev.sh login-status` (snapshot) and
    `app-probe.sh auth` (live instance).
  - **Signed out:** restore the snapshot. With none left, report auth ❌ Blocked and
    ask the user for one manual sign-in inside the instance, then
    `electron-dev.sh save-login <id>`.
  - **Never trigger the OAuth flow** (`requestAuthorization`) from automation: it
    opens a login page in the user's default browser.
  - Details and token-rotation traps: `.agents/acceptance/references/auth.md`.
- **CLI:** `lh` uses the user's own Cloud login. Use it to read state and to publish
  (PROCESS.md, Publish auth preflight). Never write to the account through it
  outside the test workspace.
- **Test workspace (required before creating anything):** after `ready`, run
  `.agents/acceptance/scripts/app-probe.sh workspace`.
  - It finds the account's `lobot-acceptance-*` workspace and creates
    `Lobot Acceptance` on first use.
  - It switches the instance into it with the silent store switch, then lands on the
    Messages home through the app's router, as the rail does. The switch does not
    write the user's `lastWorkspaceId` preference, so their own apps keep opening
    where they were.
  - A new workspace comes with Cloud's own welcome conversation (`Lobe AI`). That
    conversation is not test data.
  - A page reload drops the switch: run it again after `goto` or a restart.
  - Create agents, groups and Channels only inside this workspace.

## 4. Surfaces

### Electron (primary)

- Launch: §2. Drive it with `agent-browser --session s<port> --cdp <port>`. For
  instance 1 that is `agent-browser --session s9223 --cdp 9223 snapshot -i`; use a
  distinct session per instance.
- Every UI check runs here, including features that also ship on the web app: the
  SPA is the same code.
- Order for a run: `start` → `app-probe.sh ready` → `app-probe.sh auth` →
  `app-probe.sh workspace` → checks → clean up the test data → `stop`.

### CLI (driver and read-back)

- Invocation from source: `cd apps/cli && bun src/index.ts <cmd>` (`$CLI`), or the
  installed `lh`. It runs against Cloud with the user's login.
- Use it to drive an agent run or to read back server state for a check:
  `lh agent run -a <agentId> --json -p '<prompt>' [-t <topicId>] [--device local]`.
  Use the Electron instance only to capture the rendered evidence.
- Pass the test workspace explicitly when the command scopes by workspace.

### Web

Not available in this repository. The `_dangerous_local_dev_proxy` (local SPA over
production) is a development convenience, never acceptance evidence. A criterion
that only the web app can show is recorded `blocked` and accepted in the lobehub
repository.

### Bot channels (project skill)

Bot-channel surfaces (Discord / Slack / Telegram / WeChat / Lark / QQ / iMessage) live
in a separate project skill, `agent-testing-bot` (`.agents/skills/agent-testing-bot/`).
It extends this same process and report pipeline for the native-app surfaces
(osascript / bridge, macOS-only). Route bot tests there.

## 5. Project probes & quick navigation

`.agents/acceptance/scripts/app-probe.sh` is the fast path into app state. Use it
instead of hand-rolling `window.__LOBE_STORES` eval snippets. It targets instance 1
(`--cdp 9223`) by default; set `CDP_PORT` or `AB_TARGET="--cdp <port>"` for
another instance.

```bash
PROBE=.agents/acceptance/scripts/app-probe.sh
$PROBE ready          # app root + exposed-store readiness
$PROBE auth           # login check → { isSignedIn, userId }
$PROBE server-auth    # authenticated server request → 200 vs 401
$PROBE workspace      # enter the test workspace, creating it on first use
$PROBE route          # current SPA route
$PROBE stores         # exposed store names
$PROBE ops            # running chat operations (type / startTime)
$PROBE wait-ops 60    # wait until no chat operation is running
$PROBE topic          # active topic + metadata from its paged view
$PROBE goto /agents   # jump the SPA straight to a route (full reload)
$PROBE errors-install # install console.error interceptor
$PROBE errors         # dump captured errors
```

Routes worth jumping to:

| Route                     | Where it lands                            |
| ------------------------- | ----------------------------------------- |
| `/`                       | Messages: the conversation list           |
| `/channels/<channelId>`   | A Channel conversation (direct or group)  |
| `/agents`                 | Contacts: the agents wall                 |
| `/agents/<id>`            | An agent's or group's contact card        |
| `/agent/<agentId>`        | The agent's own page                      |
| `/agent/<agentId>/profile`| The agent's profile editor                |
| `/settings`               | Settings                                  |

The Zustand stores are at `window.__LOBE_STORES` (dev builds, or Desktop with remote
debugging on); `workspace` is among them. The chat input is `contenteditable`
(snapshot with `-C`). For a one-off read, fall back to raw
`agent-browser --cdp <port> eval`.

`.agents/acceptance/scripts/acceptance-guard.sh` bounds a run's memory. It wraps the
skill's [resource guard](../skills/acceptance/references/resource-guard.md) with this
repository's groups and thresholds and pins a per-run state directory, so a round
that boots a browser, a dev server and type-check workers cannot swap the host out
and freeze the client driving the run. Run and teardown discipline:
[`PROCESS.md`](./PROCESS.md) Step 4 and Step 6.

```bash
GUARD=.agents/acceptance/scripts/acceptance-guard.sh
export ACCEPTANCE_RUN_TAG="acceptance-<subject>-<timestamp>-$$"   # required

bash "$GUARD" start                     # before the first heavy command
bash "$GUARD" claim <pid>...            # a process this run started
bash "$GUARD" claim-browser <session>   # the browser behind an agent-browser session
bash "$GUARD" check --json              # 0 green, 10 yellow, 20 red, 2 unknown/error
bash "$GUARD" status --json             # samples, tiers, recorded stops
bash "$GUARD" stop                      # teardown, always
```

| Setting                   | Default                                       | Why                                                        |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `ACCEPTANCE_RUN_TAG`      | — (required)                                  | Proves ownership; must be ≥ 8 chars and `[A-Za-z0-9._-]+`  |
| `ACCEPTANCE_GUARD_DIR`    | `${TMPDIR:-/tmp}/lobe-acceptance/guard/<tag>` | Keeps the run's samples and claims out of the working tree |
| `ACCEPTANCE_GUARD_YELLOW` | `swap=60,free=20`                             | Linux host warning thresholds                              |
| `ACCEPTANCE_GUARD_RED`    | `swap=80,free=8`                              | Linux host stop thresholds                                 |

Thresholds are host-level on purpose. The groups (`Google Chrome for Testing`,
`next-server|vite`, `tsrs`) also match other worktrees' servers and other runs'
browsers — five such processes held \~20 GB here — so a group or total RSS cap turns a
merely busy machine red and stops a healthy run. The groups select what
`stop-owned` may stop; they do not determine this adapter's tier.

On **macOS**, kernel pressure (`kern.memorystatus_vm_pressure_level`: 1 normal,
2 warning, 4 critical) determines the tier. Free-page and swap percentages are
diagnostics only: neither low unused RAM nor a high fraction of dynamically
allocated swap proves exhaustion. Three consecutive red samples are required
before automatic termination. Unknown pressure exits 2 and never kills processes.
On **Linux**, the existing `MemAvailable` and swap thresholds apply; cgroup/PSI
support is not implemented. Native Windows is unsupported. See the skill's
[platform policy](../skills/acceptance/references/resource-guard.md#platform-policy).

## 6. Known constraints

- **The account is real, so test data is scoped and removed.**
  - Create agents, groups and Channels only inside the test workspace (§3).
  - Delete them before `stop`, and list what was deleted in the report.
  - Never edit or delete anything the run did not create.
- **The test workspace changes what some flows offer.** For example, a workspace
  agent may bind only workspace devices. When a check is about personal-space
  behavior, say so in the plan and switch back
  (`window.__LOBE_STORES.workspace().switchToPersonal()`).
- **No server-side verification here.** There are no server logs, operation rows
  or queue steps to read. A change whose claim lives on the server is accepted in
  `../lobehub`. Here, CLI read-back of Cloud state is the server evidence.
- **Type-check baseline:** `bun run type-check` reports ~190 errors from the missing
  server modules. Compare the count, not zero. It is a quality gate, not an
  acceptance check.
- **OS-capture surfaces are macOS-only** (bot channels, `capture-app-window.sh`,
  osascript screenshots). They come out black without Screen Recording (TCC)
  permission, or when the display is asleep or locked. CDP evidence
  (`agent-browser screenshot`, `bash .agents/skills/acceptance/scripts/cdp-screenshot.sh --port <port>`,
  `record-app-screen.sh`) is unaffected.
- **Paths in the field notes are historical.** `common-mistakes.md`,
  `probe-mock-patterns.md` and `references/*-field-notes.md` were written in the
  lobehub monorepo. There, `apps/desktop/src/main` is now `electron/main` and
  `apps/server`/`src/server` live in `../lobehub`. Their recipes that need a local
  server do not apply here.

## Project references

- `.agents/acceptance/references/auth.md` — Electron login snapshot mechanics,
  injection recipes and the token-rotation traps.
- `.agents/acceptance/references/multi-instance.md` — the Electron instance pool:
  per-instance CDP port, userData, Vite port, IPC id, the collision matrix, and the
  login-copy recipe.
- `.agents/acceptance/references/agent-gateway.md` — closed-loop agent-gateway
  probing. Its local-gateway setup needs a local lobehub server (`../lobehub`).
- `.agents/acceptance/references/probe-field-notes.md`,
  `.agents/acceptance/references/common-mistakes-field-notes.md` — historical
  incidents from the lobehub monorepo (see §6 on paths).

The living logs (`.agents/acceptance/common-mistakes.md`,
`.agents/acceptance/probe-mock-patterns.md`) hold the project-specific probe/mock
and mistake recipes; the generic layer lives in the installed skill's `references/`.
