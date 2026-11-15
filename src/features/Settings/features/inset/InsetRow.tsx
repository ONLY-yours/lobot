'use client';

import { Icon, Text } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { ChevronRightIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';

import { SETTINGS_ANCHOR_ROW_ATTR, SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { isModifierClick } from '@/utils/navigation';

interface InsetRowProps {
  action?: ReactNode;
  /** Settings-search anchor id; when set, the row becomes a scroll/highlight target */
  anchor?: string;
  children?: ReactNode;
  label?: string;
  /** Opens a second-level page: the whole row becomes a link with a trailing chevron */
  to?: string;
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
  link: {
    color: 'inherit',
    backgroundColor: { 'default': 'transparent', ':hover': cssVar.colorFillTertiary },
    backgroundImage: 'none',
    transition: `background-color ${cssVar.motionDurationMid} ease`,
  },
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
const InsetRow = ({ anchor, label, children, action, to }: InsetRowProps) => {
  const navigate = useWorkspaceAwareNavigate();
  const labelNode = label && <Text>{label}</Text>;
  const anchorAttr = anchor ? { [SETTINGS_ANCHOR_ROW_ATTR]: '' } : undefined;

  const content = (
    <>
      <div {...stylex.props(styles.label)}>
        {anchor ? <SettingsSearchAnchor id={anchor}>{labelNode}</SettingsSearchAnchor> : labelNode}
      </div>
      <div {...stylex.props(styles.body)}>
        {children}
        {action && <div {...stylex.props(styles.action)}>{action}</div>}
        {to && <Icon color={cssVar.colorTextQuaternary} icon={ChevronRightIcon} size={16} />}
      </div>
    </>
  );

  if (to)
    return (
      <Link
        to={to}
        {...stylex.props(styles.row, styles.link)}
        {...anchorAttr}
        onClick={(e) => {
          if (isModifierClick(e)) return;
          e.preventDefault();
          navigate(to, { escape: true });
        }}
      >
        {content}
      </Link>
    );

  return (
    <div {...stylex.props(styles.row)} {...anchorAttr}>
      {content}
    </div>
  );
};

export default InsetRow;
