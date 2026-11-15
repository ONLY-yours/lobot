import { SettingsTabs } from '@/store/global/initialState';

import About from '../about';
import Advanced from '../advanced';
import Appearance from '../appearance';
import Hotkey from '../hotkey';
import Labs from '../labs';
import { DesktopNotificationSettings } from '../notification';
import Profile from '../profile';
import Proxy from '../proxy';

export const componentMap = {
  [SettingsTabs.Profile]: Profile,
  [SettingsTabs.Appearance]: Appearance,
  [SettingsTabs.Notification]: DesktopNotificationSettings,
  [SettingsTabs.Hotkey]: Hotkey,
  [SettingsTabs.Proxy]: Proxy,
  [SettingsTabs.Labs]: Labs,
  [SettingsTabs.Advanced]: Advanced,
  [SettingsTabs.About]: About,
};
