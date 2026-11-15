import { describe, expect, it } from 'vitest';

import { ContactsSolidIcon, MessagesSolidIcon } from './icons';
import { railTabs } from './tabs';

describe('railTabs', () => {
  it('lists Messages then Contacts, once each, with their solid icons', () => {
    const tabs = railTabs((key) => key, '/messages');
    expect(tabs.map((tab) => tab.key)).toEqual(['messages', 'contacts']);
    expect(tabs.map((tab) => tab.icon)).toEqual([MessagesSolidIcon, ContactsSolidIcon]);
    expect(tabs[0].url).toBe('/messages');
  });
});
