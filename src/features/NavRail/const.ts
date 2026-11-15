import { cssVar } from '@lobehub/ui';

// Kept dependency-free: the boot skeleton (entry chunk) mirrors these.

/**
 * Inline-start inset of the rounded wrap (list column + content). Keep in sync
 * with `wrapStyles.wrap` (./wrapStyle): StyleX only compiles local literals.
 */
export const WRAP_INSET = 8;

/**
 * The list column sits inside the wrap: a half step between the window
 * background and the content surface, like Codex's middle column.
 */
export const LIST_COLUMN_BACKGROUND = `color-mix(in srgb, ${cssVar.colorBgContainer} 55%, ${cssVar.colorBgLayout})`;
