'use client';

import { Flexbox, Icon, Tooltip } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { PlusIcon } from 'lucide-react';
import { memo, type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useSwitchWorkspace } from '@/business/client/hooks/useSwitchWorkspace';
import { useWorkspaces } from '@/business/client/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/business/client/workspace/store';
import Avatar from '@/components/Avatar';
import WorkspaceAvatar from '@/components/WorkspaceAvatar';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { useOpenCreateWorkspace } from './CreateWorkspace';
import { RAIL_AVATAR_SIZE, RAIL_TILE_RADIUS, styles } from './style';

interface RailItemProps {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  title: string;
}

const RailItem = memo<RailItemProps>(({ active, children, onClick, title }) => (
  <Tooltip placement={'right'} title={title}>
    <div
      aria-current={active ? 'page' : undefined}
      aria-label={title}
      role={'button'}
      {...stylex.props(styles.item, stylex.defaultMarker())}
      onClick={onClick}
    >
      {active !== undefined && <span {...stylex.props(styles.pill, active && styles.pillActive)} />}
      {children}
    </div>
  </Tooltip>
));

RailItem.displayName = 'WorkspaceRailItem';

/**
 * Discord-style scope switcher: the personal space on top, then one avatar per
 * workspace, and a button to create one. Picking a scope sends every request to
 * it and lands on the Messages home. Hidden where the server has no workspaces
 * (self-hosted).
 */
const WorkspaceRail = memo(() => {
  const { t } = useTranslation('common');
  const available = useWorkspaceStore((s) => s.isWorkspaceAvailable);
  const workspaces = useWorkspaces();
  const activeId = useActiveWorkspaceId();
  const { switchToPersonal, switchWorkspace } = useSwitchWorkspace();
  const navigate = useWorkspaceAwareNavigate();
  const userAvatar = useUserStore(userProfileSelectors.userAvatar);
  const userName = useUserStore(userProfileSelectors.displayUserName);

  // Lobot has no workspace routes: switching changes the request scope, then lands on the
  // Messages home, since the open conversation belongs to the scope just left.
  const openHome = useCallback(() => navigate('/', { escape: true }), [navigate]);
  const openCreate = useOpenCreateWorkspace(openHome);

  const openPersonal = useCallback(async () => {
    if (activeId === null) return;
    await switchToPersonal();
    openHome();
  }, [activeId, openHome, switchToPersonal]);

  const openWorkspace = useCallback(
    async (id: string) => {
      if (activeId === id) return;
      await switchWorkspace(id);
      openHome();
    },
    [activeId, openHome, switchWorkspace],
  );

  if (!available) return null;

  return (
    <Flexbox
      aria-label={t('workspaceRail.title')}
      gap={8}
      role={'navigation'}
      {...stylex.props(styles.rail)}
    >
      <RailItem
        active={activeId === null}
        title={t('workspaceRail.personal')}
        onClick={openPersonal}
      >
        <Avatar avatar={userAvatar} name={userName} shape={'circle'} size={RAIL_AVATAR_SIZE} />
      </RailItem>
      <span {...stylex.props(styles.divider)} />
      {workspaces.map((workspace) => (
        <RailItem
          active={activeId === workspace.id}
          key={workspace.id}
          title={workspace.name}
          onClick={() => openWorkspace(workspace.id)}
        >
          <WorkspaceAvatar
            avatar={workspace.avatar}
            name={workspace.name}
            size={RAIL_AVATAR_SIZE}
            style={{ borderRadius: RAIL_TILE_RADIUS }}
          />
        </RailItem>
      ))}
      <RailItem title={t('workspaceRail.create')} onClick={openCreate}>
        <span {...stylex.props(styles.add)}>
          <Icon icon={PlusIcon} size={18} />
        </span>
      </RailItem>
    </Flexbox>
  );
});

WorkspaceRail.displayName = 'WorkspaceRail';

export default WorkspaceRail;
