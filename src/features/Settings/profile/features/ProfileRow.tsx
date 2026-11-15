'use client';

import { Text } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { type ReactNode } from 'react';

import { SETTINGS_ANCHOR_ROW_ATTR, SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';

interface ProfileRowProps {
  action?: ReactNode;
  /** Settings-search anchor id; when set, the row becomes a scroll/highlight target */
  anchor?: string;
  children?: ReactNode;
  label?: string;
}

const styles = stylex.create({
  action: { flexShrink: 0 },
  body: {
    display: 'flex',
    flex: '1',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '0',
  },
  label: { flexShrink: 0 },
  row: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    minHeight: '48px',
    paddingBlock: '8px',
    paddingInline: '16px',
  },
});

/** One row of an inset group: label on the left, value and action on the right. */
const ProfileRow = ({ anchor, label, children, action }: ProfileRowProps) => {
  const labelNode = label && <Text>{label}</Text>;

  return (
    <div
      {...stylex.props(styles.row)}
      {...(anchor ? { [SETTINGS_ANCHOR_ROW_ATTR]: '' } : undefined)}
    >
      <div {...stylex.props(styles.label)}>
        {anchor ? <SettingsSearchAnchor id={anchor}>{labelNode}</SettingsSearchAnchor> : labelNode}
      </div>
      <div {...stylex.props(styles.body)}>
        {children}
        {action && <div {...stylex.props(styles.action)}>{action}</div>}
      </div>
    </div>
  );
};

export default ProfileRow;
