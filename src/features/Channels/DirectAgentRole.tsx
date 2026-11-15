import { agentSecondaryDisplayName } from '@lobechat/types';
import { Text } from '@lobehub/ui';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

/**
 * The role a direct conversation's Agent plays, after its name in the header, as in Contacts. An
 * Agent titled by its role alone shows nothing more.
 */
export function DirectAgentRole({ agentId }: { agentId: string }) {
  const useHydrateAgentConfig = useAgentStore((s) => s.useHydrateAgentConfig);
  // A Channel has no active Agent, so nothing else loads this one's config.
  useHydrateAgentConfig(true, agentId);
  const role = agentSecondaryDisplayName(useAgentStore(agentSelectors.getAgentMetaById(agentId)));
  if (!role) return null;

  return (
    <Text ellipsis title={role} type="secondary">
      {role}
    </Text>
  );
}
