'use client';

import type { IconType } from '@lobehub/icons';
import { memo } from 'react';

// Solid glyphs like Telegram's tab bar: a filled shape reads as a tab at a glance, where a 1.5px
// outline looks thin next to the avatar beside it. `Icon` passes `fill="transparent"`, so the
// fill comes after its props.
const solid = (name: string, d: string): IconType => {
  const SolidIcon: IconType = memo(({ size = '1em', style, ...rest }) => (
    <svg
      height={size}
      style={{ flex: 'none', lineHeight: 1, ...style }}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={d} />
    </svg>
  ));
  SolidIcon.displayName = name;
  return SolidIcon;
};

/** A person cut out of a disc, Telegram's contacts tab. */
export const ContactsSolidIcon = solid(
  'ContactsSolidIcon',
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-7 11c1.6-1.9 4.1-2.5 7-2.5s5.4.6 7 2.5a8.6 8.6 0 0 1-14 0Z',
);

/** A speech bubble with its tail at the lower left. */
export const MessagesSolidIcon = solid(
  'MessagesSolidIcon',
  'M12 2.5c5.25 0 9.5 3.9 9.5 8.75S17.25 20 12 20c-1.2 0-2.35-.2-3.4-.57l-4.4 1.87a.6.6 0 0 1-.8-.7l1-3.6c-1.1-1.6-1.9-3.6-1.9-5.75C2.5 6.4 6.75 2.5 12 2.5Z',
);
