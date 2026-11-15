---
name: heterogeneous-agent
description: 'Use for external-agent launchers and execution identity, the `lh hetero exec` device path, Claude Code/Codex adapters, event mapping, sessions, persistence and tool-call chains.'
---

# Heterogeneous Agent Development

Use this skill when the bug or feature lives in the external CLI agent pipeline, not the normal server-side agent runtime.

## Use This Skill For

- Editing an adapter under `packages/heterogeneous-agents/src/adapters/`
- Changing `lh hetero exec` (`apps/cli/src/commands/hetero.ts`) or the desktop device spawn
  (`electron/main/controllers/HeterogeneousAgentCtr.ts` — `spawnLhHeteroExec`)
- Changing CLI/Desktop dispatch launchers, including OpenClaw/Hermes, or debugging task-comment authorship
- Fixing Claude Code stream-json bugs such as duplicate partial/full chunks, broken `message.id` boundaries, missing `tool_result`, TodoWrite state drift, or subagent thread routing
- Fixing Codex JSONL bugs such as mixed multi-tool messages, broken turn boundaries, or missing tool-result mapping
- Fixing step-boundary, tool persistence, subagent thread, or resume bugs in Claude Code / Codex flows
- Reproducing multi-tool mixing, orphan tool messages, or stuck tool-result loading

## Pipeline Map

Lobot never runs a CLI agent inside Electron main. Every run is dispatched by the
server through the device gateway:

1. The renderer dispatches the run via the gateway (`agentDispatcher` always picks `'gateway'`)
2. On this desktop, `GatewayConnectionCtr` → `executeGatewayAgentRun` → `HeterogeneousAgentCtr.spawnLhHeteroExec`
   spawns the embedded `lh hetero exec` (`ELECTRON_RUN_AS_NODE`, own process group, prompt on stdin)
3. `lh hetero exec` spawns the agent CLI, reads its raw stdout / JSONL, and the adapter maps it into
   `AgentStreamEvent`s
4. The CLI posts the adapted events to the server (`heteroIngest` / `heteroFinish`), which persists them
5. The renderer hydrates the UI from gateway events (`createGatewayEventHandler`)
6. Only after this path looks correct should you move on to `agent-tracing` or context-engine debugging

Cancellation: the server's `cancelHeteroTask` reaches `GatewayConnectionCtr`, which calls
`HeterogeneousAgentCtr.cancelLhHeteroExec` to signal the whole process group and wait for it to exit.

## Read These Files First

- `electron/main/controllers/HeterogeneousAgentCtr.ts` (`spawnLhHeteroExec`, `cancelLhHeteroExec`)
- `electron/main/controllers/gatewayAgentRun.ts`
- `electron/main/modules/heterogeneousAgent/lhHeteroExecEnv.ts`
- `apps/cli/src/commands/hetero.ts`
- `packages/heterogeneous-agents/src/adapters/claudeCode.ts`
- `packages/heterogeneous-agents/src/adapters/codex.ts`
- `src/store/chat/slices/agentRun/actions/transports/gateway/gateway.ts`

## Default Debug Order

1. Prove whether the raw CLI output is correct before touching UI code. Device runs can dump the raw
   pre-adapter stream via `--raw-dump` (see references/debug-workflow\.md §2) — read that rather than
   hand-rolling a `claude -p` repro.
2. If raw output is correct, compare it with adapter output (`lh hetero exec --render jsonl` prints the
   adapted events).
3. If adapted events look correct, inspect server ingest persistence, step transitions, and subagent routing.
4. Turn the repro into a focused test before fixing.
5. Only after the transport/adapter path looks sound should you debug later-stage message processing.

## Critical Invariants

- One raw tool item must map to one stable `ToolCallPayload.id`.
- A new main-agent step must emit a boundary signal before events are forwarded to the new assistant.
- In Claude Code, multiple assistant events with the same `message.id` are one turn, not multiple turns.
- In Claude Code, `tool_result` lives in `type: 'user'` events, not assistant events.
- In Claude Code partial mode, `message_delta.usage` is authoritative; do not trust echoed usage on every assistant block.
- `persistToolBatch` must pre-register assistant `tools[]` before creating tool messages.
- Every tool message must keep `parentId` equal to the owning assistant and `tool_call_id` equal to the tool id.
- `tool_result` must resolve an existing `toolMsgIdByCallId`.
- Subagent chunks must stay in thread scope and must not be forwarded into the main assistant stream.
- Never clear the global `toolMsgIdByCallId` map at main step boundaries.

## Dispatched Run Identity

A connector or desktop process can itself run inside another Agent's conversation. Its inherited environment identifies the launcher, not the dispatched Agent.

- Build child identity from the current dispatch. Clear inherited `LOBEHUB_AGENT_ID`, `LOBEHUB_ASSISTANT_MESSAGE_ID`, `LOBEHUB_TASK_ID`, and `LOBEHUB_WORKSPACE_ID`; replace `LOBEHUB_TOPIC_ID` and `LOBEHUB_OPERATION_ID` with the dispatched values. Inject optional context only when supplied by the current dispatch; absent values must not retain ancestor identity.
- Keep authorship independent of authentication. Clearing `LOBEHUB_JWT` or falling back to user credentials must not change the executing Agent. Never infer the author from the topic owner or task assignee.
- In `apps/cli/src/commands/task/lifecycle.ts`, `lh task comment` must refuse to post when topic or operation context exists but the Agent ID is missing or blank. Ordinary terminal comments without execution identity remain user-authored. Misattributed Agent progress can otherwise become human `<user_feedback>` in later task runs.

Check all four launch surfaces when changing this contract or adding a launcher:

| Surface                 | Entry point                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CLI Agent dispatch      | `apps/cli/src/device/agentRun.ts` — `spawnHeteroAgentRun` (Agent ID forwarded by `apps/cli/src/commands/connect.ts`) |
| CLI OpenClaw/Hermes     | `apps/cli/src/tools/heteroTask.ts` — `runHeteroTask`                                                                 |
| Desktop Agent dispatch  | `electron/main/controllers/HeterogeneousAgentCtr.ts` — `spawnLhHeteroExec`                                           |
| Desktop OpenClaw/Hermes | `electron/main/controllers/GatewayConnectionCtr.ts` — `runHeteroTask`                                                |

Regression coverage must include a clean environment, conflicting ancestor identity, and missing current Agent/optional context. Check both OpenClaw and Hermes on CLI and Desktop, plus task comments after JWT fallback. Mocked spawn assertions verify environment construction, not end-to-end propagation through an external runtime.

## Common Bug Patterns

- Claude Code duplicates text or thinking:
  check whether partial deltas and the later full assistant block are both being emitted.
- Claude Code opens too many assistant messages:
  check whether the adapter is cutting steps on every assistant event instead of only on `message.id` changes.
- Claude Code tool results never land:
  check whether `type: 'user'` `tool_result` blocks are being ignored because the code only inspects assistant events.
- Claude Code TodoWrite cards look stale:
  check whether synthesized `pluginState.todos` is being attached at tool-result time.
- Claude Code subagent transcript leaks into the main bubble:
  check `parent_tool_use_id` handling and whether subagent chunks are being forwarded to the main gateway handler.
- Multiple Codex tools collapse into one assistant message:
  first check whether the adapter emits a usable step boundary such as `newStep` or an equivalent turn-change signal.
- Orphan tool messages:
  first check step-transition ordering and whether `persistToolBatch` Phase 1 ran before tool message creation.
- Tool bubble stays loading:
  look for `tool_result for unknown toolCallId` and missing `result_msg_id` backfill.
- Subagent tools show up in the main bubble:
  check for subagent chunks reaching the main gateway handler.
- Wrong terminal-error guide (e.g. "usage limit reached" shown for a network drop):
  a classifier is branching on a structured field whose mere presence isn't its meaning.
  Grep the field across all event states in a real trace before trusting it — see
  references/debug-workflow\.md §8 (CC `rate_limit_info` rides on `status: "allowed"` too).

## References

- For commands, trace capture, invariants, and focused test commands, read [references/debug-workflow.md](./references/debug-workflow.md).
