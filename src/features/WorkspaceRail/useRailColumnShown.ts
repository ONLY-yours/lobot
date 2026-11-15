import { useState } from 'react';

import { useWorkspaceStore } from '@/business/client/workspace/store';

import { readWorkspaceRailHint } from './railHint';

/**
 * Whether the rail takes its column left of the wrap: once workspaces are available, and
 * while the list loads if it showed last time. The titlebar reads it to line up with the
 * list column.
 */
export const useRailColumnShown = (): boolean => {
  const [available, loading] = useWorkspaceStore((s) => [
    s.isWorkspaceAvailable,
    s.isWorkspaceLoading,
  ]);
  // Read once: the hint only bridges the first load.
  const [shownLastTime] = useState(readWorkspaceRailHint);

  return available || (loading && shownLastTime);
};
