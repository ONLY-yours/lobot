'use client';

import { Flexbox } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { type FC } from 'react';
import { Outlet } from 'react-router';

import { styles } from './style';

/** The list column is shell-owned (`SideBar`), so the route renders the section only. */
const Layout: FC = () => (
  <Flexbox className={stylex.props(styles.mainContainer).className} flex={1} height={'100%'}>
    {/* No layout header: every section draws the shared header with its own title. */}
    <Outlet />
  </Flexbox>
);

export default Layout;
