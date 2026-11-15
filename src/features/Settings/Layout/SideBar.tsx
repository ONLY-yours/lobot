'use client';

import { NavPanelPortal } from '@/features/NavPanel/NavPanelPortal';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';

import Body from './Body';
import Header from './Header';

/**
 * Settings list column. Owned by the shell (like Contacts) so it is registered
 * whichever tab is active; `/settings/*` resolves the panel to this key.
 */
const SettingsListPortal = () => (
  <NavPanelPortal navKey="settings">
    <SideBarLayout body={<Body />} header={<Header />} />
  </NavPanelPortal>
);

export default SettingsListPortal;
