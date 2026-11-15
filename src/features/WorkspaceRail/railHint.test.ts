import { afterEach, describe, expect, it } from 'vitest';

import { readWorkspaceRailHint, WORKSPACE_RAIL_HINT_KEY, writeWorkspaceRailHint } from './railHint';

afterEach(() => localStorage.removeItem(WORKSPACE_RAIL_HINT_KEY));

describe('workspace rail boot hint', () => {
  it('is off until the rail has shown once', () => {
    expect(readWorkspaceRailHint()).toBe(false);
  });

  it('follows whether the rail showed last', () => {
    writeWorkspaceRailHint(true);
    expect(readWorkspaceRailHint()).toBe(true);

    writeWorkspaceRailHint(false);
    expect(readWorkspaceRailHint()).toBe(false);
  });
});
