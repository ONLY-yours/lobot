import { confirmModal, toast } from '@lobehub/ui';
import { t } from 'i18next';

import { agentService } from '@/services/agent';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

/** The private Agent was kept out of a group shared with other people. */
export class PrivateAgentDeclinedError extends Error {
  constructor(readonly names: string[]) {
    super('A private Agent was not added');
  }
}

/**
 * The caller's own private Agents among `agentIds`. Someone else's private Agent never reaches
 * the pickers, so the user's private bucket is the whole set.
 */
export const ownPrivateAgentIds = (agentIds: string[]) => {
  const own = new Set(
    homeAgentListSelectors.privateAgents(useHomeStore.getState()).map((agent) => agent.id),
  );
  return agentIds.filter((id) => own.has(id));
};

/**
 * A private Agent replies only to its owner, so in a group with other people it would stay
 * silent for everyone else. Before it joins one, the owner publishes it to the workspace or
 * leaves it out: resolves once published, rejects with {@link PrivateAgentDeclinedError} when
 * the owner declines, and with the cause when publishing fails.
 */
export const confirmPublishPrivateAgents = (agents: { id: string; name: string }[]) =>
  new Promise<void>((resolve, reject) => {
    if (!agents.length) return resolve();
    const names = agents.map((agent) => agent.name);
    const joined = names.join(t('autoTitle.separator', { ns: 'channel' }));
    let settled = false;
    confirmModal({
      cancelText: t('cancel', { ns: 'common' }),
      content: t('privateAgentJoin.desc', { ns: 'channel' }),
      okText: t('privateAgentJoin.ok', { ns: 'channel' }),
      onCancel: () => {
        if (settled) return;
        settled = true;
        reject(new PrivateAgentDeclinedError(names));
      },
      onOk: async () => {
        settled = true;
        try {
          for (const agent of agents) await agentService.publishAgentToWorkspace(agent.id);
        } catch (cause) {
          console.error('Failed to publish a private Agent', cause);
          toast.error(t('privateAgentJoin.failed', { names: joined, ns: 'channel' }));
          reject(cause);
          return;
        } finally {
          // A partly published batch must still move the published ones out of Private.
          void useHomeStore.getState().refreshAgentList();
        }
        resolve();
      },
      title: t('privateAgentJoin.title', { names: joined, ns: 'channel' }),
    });
  });
