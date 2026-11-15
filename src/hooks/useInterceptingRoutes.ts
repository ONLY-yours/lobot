import { useMemo } from 'react';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useAgentStore } from '@/store/agent';

/**
 * Lobot has no per-agent settings page. Chat entry points that used to open it
 * now land on the contact detail instead.
 */
export const useOpenChatSettings = (_tab?: unknown) => {
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const navigate = useWorkspaceAwareNavigate();

  return useMemo(
    () => () => {
      if (activeAgentId) navigate(`/agents/${activeAgentId}`);
    },
    [activeAgentId, navigate],
  );
};
