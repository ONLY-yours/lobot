import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';

// Telegram-style tab bar at the foot of the list column: larger glyphs than the
// old 48px rail (16px) since the bar has room, each in a 36px hit area.
export const TAB_ICON_SIZE = { size: 20, strokeWidth: 1.5 };

export const styles = stylex.create({
  badge: {
    pointerEvents: 'none',
    position: 'absolute',
    insetBlockStart: '0',
    insetInlineEnd: '-2px',
    minWidth: '16px',
    height: '16px',
    paddingInline: '4px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: cssVar.colorBgContainer,
    borderRadius: '999px',
    fontSize: '9px',
    fontWeight: 600,
    lineHeight: '13px',
    color: '#fff',
    textAlign: 'center',
    // Red like the conversation rows' unread badge, so the count reads as unread, not as a label.
    backgroundColor: cssVar.colorError,
  },
  bar: {
    userSelect: 'none',
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '52px',
    paddingInline: '8px',
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: cssVar.colorBorderSecondary,
  },
  item: {
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: cssVar.borderRadius,
    color: { 'default': cssVar.colorTextTertiary, ':hover': cssVar.colorText },
    backgroundColor: { 'default': null, ':hover': cssVar.colorFillTertiary },
    transition: 'color 0.15s, background-color 0.15s',
  },
  avatar: {
    display: 'flex',
    borderRadius: '50%',
    transition: 'box-shadow 0.15s',
  },
  // Telegram rings the avatar of the active Settings tab instead of tinting a glyph.
  avatarActive: {
    boxShadow: `0 0 0 2px ${cssVar.colorPrimary}`,
  },
  // Like Telegram, the active tab is told apart by the primary color, not a filled chip.
  itemActive: {
    color: { 'default': cssVar.colorPrimary, ':hover': cssVar.colorPrimary },
  },
});
