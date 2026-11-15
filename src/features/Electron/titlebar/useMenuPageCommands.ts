'use client';

import { useWatchBroadcast } from '@lobechat/electron-client-ipc';

import { appNavigate } from '@/features/Electron/navigation/appNavigate';
import { electronSystemService } from '@/services/electron/system';

/**
 * The window shows one page, so the main-process menu commands that used to
 * target tabs act on that page: Cmd+W closes the window, and Preferences
 * (`createNewTab` with a path) navigates in place, within the active workspace.
 */
export const useMenuPageCommands = () => {
  useWatchBroadcast('closeCurrentTabOrWindow', () => {
    void electronSystemService.closeWindow();
  });

  useWatchBroadcast('createNewTab', (data) => {
    if (data?.path) appNavigate(data.path);
  });
};
