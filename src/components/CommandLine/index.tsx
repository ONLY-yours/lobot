'use client';

import { CopyButton } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { memo } from 'react';

const styles = stylex.create({
  codeBlock: {
    display: 'flex',
    flex: 'none',
    gap: '12px',
    alignItems: 'center',
    minWidth: '0',
    paddingBlock: '12px',
    paddingInline: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: cssVar.colorBorderSecondary,
    borderRadius: cssVar.borderRadius,
    backgroundColor: cssVar.colorFillQuaternary,
    backgroundImage: 'none',
  },
  // An inline hint beside other content, not a block of its own.
  codeBlockSmall: {
    gap: '6px',
    paddingBlock: '2px',
    paddingInlineStart: '8px',
    paddingInlineEnd: '2px',
    borderRadius: cssVar.borderRadiusSM,
  },
  command: {
    overflow: 'hidden',
    flex: '1',
    minWidth: '0',
    fontFamily: cssVar.fontFamilyCode,
    fontSize: cssVar.fontSizeSM,
    color: cssVar.colorText,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

interface CommandLineProps {
  command: string;
  /** `small` sits inline in a hint line; the default is a standalone block. */
  size?: 'default' | 'small';
}

const CommandLine = memo<CommandLineProps>(({ command, size = 'default' }) => (
  <div {...stylex.props(styles.codeBlock, size === 'small' && styles.codeBlockSmall)}>
    <code {...stylex.props(styles.command)}>{command}</code>
    <CopyButton content={command} size={'small'} />
  </div>
));

CommandLine.displayName = 'CommandLine';

export default CommandLine;
