/**
 * Lay the list out in the user's own rail order (the `workspace.order` user
 * preference). Ids of workspaces the user has left are skipped; workspaces the
 * order does not know yet (newly joined or created) follow in the order the
 * server returned them.
 */
export const sortByWorkspaceOrder = <T extends { id: string }>(
  workspaces: T[],
  order: string[] | undefined,
): T[] => {
  if (!order?.length) return workspaces;

  const rank = new Map(order.map((id, index) => [id, index]));
  const known = workspaces.filter((w) => rank.has(w.id));
  const unknown = workspaces.filter((w) => !rank.has(w.id));

  known.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  return [...known, ...unknown];
};
