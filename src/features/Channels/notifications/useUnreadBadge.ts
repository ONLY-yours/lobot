'use client';

import { useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { useEffect } from 'react';

import { syncChannelBadge } from './notify';

/**
 * Keeps the dock / taskbar badge on the Messages unread count. The main process clears the badge
 * whenever the window gains focus (to drop a run-completion badge), so the count is written again
 * after each focus as well as on every change.
 */
export const useUnreadBadge = (unread: number) => {
  useEffect(() => {
    void syncChannelBadge(unread);
  }, [unread]);

  useWatchBroadcast('windowFocused', () => {
    void syncChannelBadge(unread);
  });
};
