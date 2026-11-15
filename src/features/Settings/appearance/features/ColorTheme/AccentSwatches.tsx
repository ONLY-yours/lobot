'use client';

import { type LobePrimaryColor, type PrimaryColors } from '@lobehub/ui';
import {
  ColorSwatches,
  findCustomThemeName,
  isCustomPrimaryColor,
  primaryColors,
} from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

import { SETTINGS_ANCHOR_ROW_ATTR, SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

const styles = stylex.create({
  row: { paddingBlock: '16px', paddingInline: '16px' },
});

const toSwatchColor = (value?: LobePrimaryColor) => {
  if (!value) return undefined;
  return isCustomPrimaryColor(value) ? value : primaryColors[value];
};

/** The accent color row under the theme cards, saved as soon as a dot is picked. */
const AccentSwatches = () => {
  const { t } = useTranslation('color');
  const { t: tSetting } = useTranslation('setting');
  const value = useUserStore(userGeneralSettingsSelectors.primaryColor);
  const setSettings = useUserStore((s) => s.setSettings);
  // '' is the "default" dot: an empty value clears a saved color (undefined would be merged away).
  const onChange = (primaryColor: LobePrimaryColor | '') =>
    setSettings({ general: { primaryColor: primaryColor as LobePrimaryColor } });

  const handleSelect = (color?: string) => {
    const name = color && (findCustomThemeName('primary', color) as PrimaryColors | undefined);
    if (name) return onChange(name);
    onChange(isCustomPrimaryColor(color) ? color : '');
  };

  return (
    <div
      aria-label={tSetting('settingAppearance.primaryColor.title')}
      {...stylex.props(styles.row)}
      {...{ [SETTINGS_ANCHOR_ROW_ATTR]: '' }}
    >
      <SettingsSearchAnchor id={'appearance-primary-color'}>{null}</SettingsSearchAnchor>
      <ColorSwatches
        enableColorPicker
        texts={{ custom: t('custom') }}
        value={toSwatchColor(value)}
        colors={[
          {
            color: 'transparent',
            title: t('default'),
          },
          {
            color: primaryColors.red,
            title: t('red'),
          },
          {
            color: primaryColors.orange,
            title: t('orange'),
          },
          {
            color: primaryColors.gold,
            title: t('gold'),
          },
          {
            color: primaryColors.yellow,
            title: t('yellow'),
          },
          {
            color: primaryColors.lime,
            title: t('lime'),
          },
          {
            color: primaryColors.green,
            title: t('green'),
          },
          {
            color: primaryColors.cyan,
            title: t('cyan'),
          },
          {
            color: primaryColors.blue,
            title: t('blue'),
          },
          {
            color: primaryColors.geekblue,
            title: t('geekblue'),
          },
          {
            color: primaryColors.purple,
            title: t('purple'),
          },
          {
            color: primaryColors.magenta,
            title: t('magenta'),
          },
          {
            color: primaryColors.volcano,
            title: t('volcano'),
          },
        ]}
        onChange={handleSelect}
      />
    </div>
  );
};

export default AccentSwatches;
