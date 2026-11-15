'use client';

import { Flexbox, Tooltip } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { memo, type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useSwitchWorkspace } from '@/business/client/hooks/useSwitchWorkspace';
import { useWorkspaces } from '@/business/client/hooks/useWorkspaces';
import Avatar from '@/components/Avatar';
import WorkspaceAvatar from '@/components/WorkspaceAvatar';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { RAIL_AVATAR_SIZE, styles } from './style';

interface RailItemProps {
  active: boolean;
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
      <span {...stylex.props(styles.pill, active && styles.pillActive)} />
      {children}
    </div>
  </Tooltip>
));

RailItem.displayName = 'WorkspaceRailItem';

/**
 * Discord-style scope switcher: the personal space on top, then one avatar per
 * workspace. Picking one lands on that scope's home. Renders nothing when the
 * user belongs to no workspace, since there is nothing to switch between.
 */
const WorkspaceRail = memo(() => {
  const { t } = useTranslation('common');
  const workspaces = useWorkspaces();
  const activeId = useActiveWorkspaceId();
  const { switchToPersonal, switchWorkspace } = useSwitchWorkspace();
  const navigate = useWorkspaceAwareNavigate();
  const userAvatar = useUserStore(userProfileSelectors.userAvatar);
  const userName = useUserStore(userProfileSelectors.displayUserName);

  // The URL is the source of truth; the explicit switch only adds user-intent side effects.
  const openPersonal = useCallback(async () => {
    if (activeId === null) return;
    await switchToPersonal();
    navigate('/', { escape: true });
  }, [activeId, navigate, switchToPersonal]);

  const openWorkspace = useCallback(
    async (id: string, slug: string) => {
      if (activeId === id) return;
      await switchWorkspace(id);
      navigate(`/${slug}`, { escape: true });
    },
    [activeId, navigate, switchWorkspace],
  );

  if (workspaces.length === 0) return null;

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
          onClick={() => openWorkspace(workspace.id, workspace.slug)}
        >
          <WorkspaceAvatar
            avatar={workspace.avatar}
            name={workspace.name}
            size={RAIL_AVATAR_SIZE}
          />
        </RailItem>
      ))}
    </Flexbox>
  );
});

WorkspaceRail.displayName = 'WorkspaceRail';

export default WorkspaceRail;
