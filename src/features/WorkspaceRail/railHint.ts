// Dependency-free: the boot skeleton (entry chunk) reads this before any store.

/** Rail column width. Keep in sync with `styles.rail` (./style): StyleX only compiles local literals. */
export const RAIL_WIDTH = 48;

/**
 * The rail shows only once the workspace list answers, long after the boot
 * skeleton paints, so whether it showed last time is remembered here. The
 * skeleton and the still-loading rail reserve its column from it, so the wrap
 * does not jump right when the rail appears.
 */
export const WORKSPACE_RAIL_HINT_KEY = 'LOBE_WORKSPACE_RAIL';

export const readWorkspaceRailHint = (): boolean => {
  try {
    return localStorage.getItem(WORKSPACE_RAIL_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeWorkspaceRailHint = (shown: boolean) => {
  try {
    if (shown) localStorage.setItem(WORKSPACE_RAIL_HINT_KEY, '1');
    else localStorage.removeItem(WORKSPACE_RAIL_HINT_KEY);
  } catch {
    // Storage may be unavailable (private mode); the skeleton then leaves the rail out.
  }
};
