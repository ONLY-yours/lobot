import type { RouteObject } from 'react-router';

import { settingsRouteMeta } from '@/features/Settings/features/routeMeta';
import { dynamicElement, dynamicLayout, ErrorBoundary } from '@/utils/router';

const settingsElement = dynamicElement(
  () => import('@/routes/(main)/settings'),
  'Desktop > Settings',
  {
    preloadId: 'settings',
  },
);

/**
 * Settings, opened from the avatar tab. The list column is the shell-owned
 * settings list; this route fills the content beside it with one section.
 */
export const settingsRoute: RouteObject = {
  children: [
    { element: settingsElement, handle: { meta: settingsRouteMeta }, index: true },
    { element: settingsElement, handle: { meta: settingsRouteMeta }, path: ':tab' },
  ],
  element: dynamicLayout(
    () => import('@/routes/(main)/settings/_layout'),
    'Desktop > Settings > Layout',
  ),
  errorElement: <ErrorBoundary resetPath="/settings" />,
  path: 'settings',
};
