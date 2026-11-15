'use client';

import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import { SETTINGS_ANCHOR_ROW_ATTR, SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';

const styles = stylex.create({
  card: {
    overflow: 'hidden',
    borderRadius: cssVar.borderRadiusLG,
    backgroundColor: cssVar.colorBgContainer,
    backgroundImage: 'none',
  },
  caption: {
    paddingInline: '16px',
    fontSize: '12px',
    lineHeight: '18px',
    color: cssVar.colorTextDescription,
  },
  divider: {
    height: '1px',
    marginInlineStart: '16px',
    backgroundColor: cssVar.colorBorderSecondary,
    backgroundImage: 'none',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    paddingInline: '16px',
    fontSize: '12px',
    lineHeight: '18px',
    color: cssVar.colorTextSecondary,
  },
});

interface InsetGroupProps {
  /** Settings-search anchor on the title; the whole group flashes when located */
  anchor?: string;
  children: ReactNode;
  /** Hint under the card, the way Telegram explains a group below it */
  footer?: ReactNode;
  title?: ReactNode;
}

/**
 * Telegram's inset group: an optional caption, one rounded card whose rows are
 * split by inset hairlines, and an optional hint below.
 */
const InsetGroup = ({ anchor, children, footer, title }: InsetGroupProps) => {
  // Count rendered rows so a conditional row (`cond && <Row />`) left out never
  // leaves a stray hairline behind.
  let rendered = 0;

  return (
    <section
      {...stylex.props(styles.group)}
      {...(anchor ? { [SETTINGS_ANCHOR_ROW_ATTR]: '' } : undefined)}
    >
      {title && (
        <div {...stylex.props(styles.title)}>
          {anchor ? <SettingsSearchAnchor id={anchor}>{title}</SettingsSearchAnchor> : title}
        </div>
      )}
      <div {...stylex.props(styles.card)}>
        {Children.map(children, (row) => {
          if (!isValidElement(row)) return null;
          const index = rendered++;
          return (
            <Fragment>
              {index > 0 && <div {...stylex.props(styles.divider)} />}
              {row}
            </Fragment>
          );
        })}
      </div>
      {footer && <div {...stylex.props(styles.caption)}>{footer}</div>}
    </section>
  );
};

export default InsetGroup;
