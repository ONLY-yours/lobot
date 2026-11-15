/**
 * Always `null` in Lobot. The slug prefixes routes (`/:workspaceSlug/...`) in
 * LobeHub Cloud, and every link builder reads it for that; Lobot has no
 * workspace routes, so the workspace context travels in the store and the
 * `X-Workspace-Id` header instead of the URL.
 */
export const getActiveWorkspaceSlug = (): string | null => null;

export const useActiveWorkspaceSlug = (): string | null => null;
