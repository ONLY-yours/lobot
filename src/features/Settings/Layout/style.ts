import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  // Settings is a detached section: the content sits on the window background.
  // Inset tabs (profile) put their cards straight on it; every other tab keeps
  // a white page, drawn as a card that matches the list column's.
  card: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: cssVar.colorBorderSecondary,
    borderRadius: '12px',
    backgroundColor: cssVar.colorBgContainer,
    backgroundImage: 'none',
    boxShadow: '0 1px 2px rgb(0 0 0 / 3%)',
  },
  mainContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
});
