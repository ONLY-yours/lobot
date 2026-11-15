/**
 * Heterogeneous-agent (CC / Codex) working-directory segment names, relative to
 * `appStoragePath`. Kept in this side-effect-free module (no electron import)
 * so lightweight importers — the menu impls, the controller — get a single
 * source of truth without dragging in `@/const/dir`'s load-time `app.getPath`
 * calls.
 *
 * - `<HETERO_AGENT_DIR>/tracing` — `lh hetero exec` raw dumps (packaged / opted-in)
 * - `<HETERO_AGENT_DIR>/claude-accounts` — one Claude Code login per account
 */
export const HETERO_AGENT_DIR = 'heteroAgent';
export const HETERO_AGENT_CLAUDE_ACCOUNTS_DIR = `${HETERO_AGENT_DIR}/claude-accounts`;
export const HETERO_AGENT_TRACING_DIR = `${HETERO_AGENT_DIR}/tracing`;
