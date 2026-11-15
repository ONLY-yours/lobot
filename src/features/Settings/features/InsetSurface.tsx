'use client';

import { Flexbox } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { type ReactNode } from 'react';

import { useIsDark } from '@/hooks/useIsDark';

const styles = stylex.create({
  // Dark mode's canvas already sits below the card surface, so it stays as is.
  dark: {
    backgroundColor: cssVar.colorBgLayout,
    backgroundImage: 'none',
  },
  // Telegram's grouped background: a step darker than the light canvas so the
  // white cards read as cards.
  light: {
    backgroundColor: cssVar.colorBgLayout,
    backgroundImage: `linear-gradient(${cssVar.colorFillTertiary}, ${cssVar.colorFillTertiary})`,
  },
  surface: { minHeight: 0 },
});

/**
 * The gray surface behind an inset-group page. It spans the navigation header
 * too, so the header does not sit on a white strip above the gray body.
 */
const InsetSurface = ({ children }: { children: ReactNode }) => {
  const isDark = useIsDark();

  return (
    <Flexbox
      className={stylex.props(styles.surface, isDark ? styles.dark : styles.light).className}
      flex={1}
      height={'100%'}
    >
      {children}
    </Flexbox>
  );
};

export default InsetSurface;
