'use client';

import { Flexbox } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { type FC } from 'react';
import { Outlet, useParams } from 'react-router';

import { SettingsTabs } from '@/store/global/initialState';

import { INSET_TABS } from '../features/ownFrameTabs';
import { styles } from './style';

/** The list column is shell-owned (`SideBar`), so the route renders the section only. */
const Layout: FC = () => {
  // Bare `/settings` is the profile page.
  const { tab = SettingsTabs.Profile } = useParams<{ tab?: string }>();

  return (
    <Flexbox
      className={stylex.props(styles.mainContainer, !INSET_TABS.has(tab) && styles.card).className}
      flex={1}
      height={'100%'}
    >
      {/* No layout header: every section draws the shared header with its own title. */}
      <Outlet />
    </Flexbox>
  );
};

export default Layout;
