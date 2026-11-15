import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';

export const wrapStyles = stylex.create({
  // List column + content share one rounded, bordered surface (Codex-style)
  // inset from the window background. Keep the inset in sync with WRAP_INSET.
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    flex: '1',
    minWidth: 0,
    marginBlockStart: '8px',
    marginBlockEnd: '8px',
    marginInlineStart: '8px',
    marginInlineEnd: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: cssVar.colorBorderSecondary,
    borderRadius: '12px',
    backgroundColor: cssVar.colorBgContainer,
    boxShadow: '0 1px 2px rgb(0 0 0 / 3%)',
  },
  // Electron: the title bar already sits above the wrap.
  wrapDesktop: {
    marginBlockStart: 0,
  },
});
