'use client';

import { Icon, Tooltip } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { type LucideIcon } from 'lucide-react';
import { memo } from 'react';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import WorkspaceLink from '@/features/Workspace/WorkspaceLink';
import { isModifierClick } from '@/utils/navigation';

import { styles, TAB_ICON_SIZE } from './style';

interface TabItemProps {
  active?: boolean;
  badge?: number;
  icon: LucideIcon;
  title: string;
  url: string;
}

const TabItem = memo<TabItemProps>(({ active, badge, icon, title, url }) => {
  const navigate = useWorkspaceAwareNavigate();

  return (
    <Tooltip placement={'top'} title={title}>
      <WorkspaceLink
        aria-current={active ? 'page' : undefined}
        aria-label={title}
        {...stylex.props(styles.item, active && styles.itemActive)}
        to={url}
        onClick={(e) => {
          if (isModifierClick(e)) return;
          e.preventDefault();
          navigate(url);
        }}
      >
        <Icon icon={icon} size={TAB_ICON_SIZE} />
        {!!badge && badge > 0 && (
          <span {...stylex.props(styles.badge)}>{badge > 99 ? '99+' : badge}</span>
        )}
      </WorkspaceLink>
    </Tooltip>
  );
});

TabItem.displayName = 'TabItem';

export default TabItem;
