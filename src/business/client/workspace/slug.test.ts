import { WORKSPACE_SLUG_MAX, WORKSPACE_SLUG_MIN, WORKSPACE_SLUG_PATTERN } from '@lobechat/const';
import { describe, expect, it } from 'vitest';

import { workspaceSlugFromName } from './slug';

const valid = (slug: string) =>
  slug.length >= WORKSPACE_SLUG_MIN &&
  slug.length <= WORKSPACE_SLUG_MAX &&
  !slug.includes('--') &&
  WORKSPACE_SLUG_PATTERN.test(slug);

describe('workspaceSlugFromName', () => {
  it('keeps the ASCII words of the name and adds a random suffix', () => {
    const slug = workspaceSlugFromName('LobeHub Team!');
    expect(slug).toMatch(/^lobehub-team-[a-z0-9]{6}$/);
    expect(valid(slug)).toBe(true);
  });

  it('falls back to ws-<suffix> for a name without ASCII', () => {
    const slug = workspaceSlugFromName('狗弟的团队');
    expect(slug).toMatch(/^ws-[a-z0-9]{6}$/);
    expect(valid(slug)).toBe(true);
  });

  it('stays within the length limit for a long name', () => {
    const slug = workspaceSlugFromName('a very long workspace name that keeps going and going');
    expect(valid(slug)).toBe(true);
  });

  it('gives two workspaces with the same name different slugs', () => {
    expect(workspaceSlugFromName('Team')).not.toBe(workspaceSlugFromName('Team'));
  });
});
