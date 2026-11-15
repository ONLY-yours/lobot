import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';

export const RAIL_AVATAR_SIZE = 40;

// Discord-style server rail: a column of scope avatars left of the wrap, on the
// window background, with a pill on the left edge marking the active scope.
export const styles = stylex.create({
  divider: {
    flex: 'none',
    width: '24px',
    height: '2px',
    marginBlock: '2px',
    borderRadius: '1px',
    backgroundColor: cssVar.colorBorderSecondary,
  },
  item: {
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: `${RAIL_AVATAR_SIZE}px`,
  },
  // Hover grows a short pill, the active scope gets a tall one — Discord's cue.
  pill: {
    pointerEvents: 'none',
    position: 'absolute',
    insetInlineStart: 0,
    width: '4px',
    height: '32px',
    borderStartEndRadius: '4px',
    borderEndEndRadius: '4px',
    backgroundColor: cssVar.colorText,
    transform: { default: 'scaleY(0)', [stylex.when.ancestor(':hover')]: 'scaleY(0.5)' },
    transition: 'transform 0.15s',
  },
  pillActive: {
    transform: { default: 'scaleY(1)', [stylex.when.ancestor(':hover')]: 'scaleY(1)' },
  },
  rail: {
    userSelect: 'none',
    overflowX: 'hidden',
    overflowY: 'auto',
    flex: 'none',
    alignItems: 'center',
    width: '56px',
    // The Electron title bar sits above, so only the bottom matches the wrap's 8px inset.
    paddingBlockEnd: '8px',
    scrollbarWidth: 'none',
  },
});
