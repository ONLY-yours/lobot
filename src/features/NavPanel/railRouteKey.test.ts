import { describe, expect, it } from 'vitest';

import { isDetachedNavKey, isRailContactsRoute, resolveRailNavPanelKey } from './railRouteKey';

describe('resolveRailNavPanelKey', () => {
  it.each([
    ['/', null, 'home'],
    ['/lobe-team', 'lobe-team', 'home'],
    // Agent / group routes keep their own workbench sidebar.
    ['/agent/agent-1', null, 'agent'],
    ['/agent/agent-1/tpc_1', null, 'agent'],
    ['/lobe-team/agent/agent-1', 'lobe-team', 'agent'],
    ['/agent/agent-1/profile', null, 'agent'],
    ['/agent/agent-1/tasks', null, 'agent'],
    ['/agent/agent-1/goal/goal-1', null, 'agent'],
    ['/agent/agent-1/docs/doc-1', null, 'agent-docs'],
    ['/group/group-1', null, 'group'],
    ['/group/group-1/tpc_1', null, 'group'],
    // The all-agents page shows the Contacts list.
    ['/agents', null, 'contacts'],
    ['/lobe-team/agents', 'lobe-team', 'contacts'],
    // Tasks and goals share the task scope list; the project index is full-page.
    ['/tasks', null, 'tasks'],
    ['/goals', null, 'tasks'],
    ['/lobe-team/task/task-1', 'lobe-team', 'tasks'],
    ['/goal/goal-1', null, 'tasks'],
    ['/projects', null, 'none'],
    // Everything else keeps its route-owned sidebar.
    ['/project/project-1', null, 'project'],
    ['/resource', null, 'resource'],
    ['/resource/library/kb-1', null, 'resourceLibrary'],
    ['/community', null, 'discover'],
    ['/settings/profile', null, 'settings'],
  ])('maps %s to %s', (pathname, activeWorkspaceSlug, expected) => {
    expect(resolveRailNavPanelKey(pathname, activeWorkspaceSlug)).toBe(expected);
  });
});

describe('isRailContactsRoute', () => {
  it.each([
    ['/agents', null, true],
    ['/agent/agent-1/profile', null, true],
    ['/lobe-team/agent/agent-1/channel/discord', 'lobe-team', true],
    ['/agent/agent-1/self-evolving/domain-1', null, true],
    ['/group/group-1/profile', null, true],
    // An agent's or group's chats are its inner pages too.
    ['/agent/agent-1', null, true],
    ['/agent/agent-1/tpc_1', null, true],
    ['/agent/agent-1/tasks', null, true],
    ['/group/group-1', null, true],
    ['/lobe-team/group/group-1/tpc_1', 'lobe-team', true],
    ['/', null, false],
    ['/agent', null, false],
    ['/tasks', null, false],
  ])('%s → %s', (pathname, activeWorkspaceSlug, expected) => {
    expect(isRailContactsRoute(pathname, activeWorkspaceSlug)).toBe(expected);
  });
});

describe('isDetachedNavKey', () => {
  it('detaches the Settings section from the shared surface', () => {
    expect(isDetachedNavKey(resolveRailNavPanelKey('/settings/profile', null))).toBe(true);
    expect(isDetachedNavKey(resolveRailNavPanelKey('/settings/profile/username', null))).toBe(true);
  });

  it('keeps the other sections on the shared surface', () => {
    for (const pathname of ['/', '/agents', '/tasks', '/channels/chn_1']) {
      expect(isDetachedNavKey(resolveRailNavPanelKey(pathname, null))).toBe(false);
    }
  });
});
