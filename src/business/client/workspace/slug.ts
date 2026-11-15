import { WORKSPACE_SLUG_MAX, WORKSPACE_SLUG_PATTERN } from '@lobechat/const';

const SUFFIX_LENGTH = 6;

const randomSuffix = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(SUFFIX_LENGTH)), (byte) =>
    (byte % 36).toString(36),
  ).join('');

/**
 * A slug for a workspace created from its name alone. Lobot never shows the slug
 * (it has no workspace routes), so it only has to be valid and unique: the
 * name's ASCII letters and digits, then a random suffix that keeps two
 * "Team"s apart and steers clear of reserved words. A name with no ASCII
 * (e.g. Chinese) falls back to `ws-<suffix>`.
 */
export const workspaceSlugFromName = (name: string): string => {
  const base = name
    .normalize('NFKD')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, WORKSPACE_SLUG_MAX - SUFFIX_LENGTH - 1)
    .replace(/-+$/, '');
  const slug = `${base || 'ws'}-${randomSuffix()}`;
  return WORKSPACE_SLUG_PATTERN.test(slug) ? slug : `ws-${randomSuffix()}`;
};
