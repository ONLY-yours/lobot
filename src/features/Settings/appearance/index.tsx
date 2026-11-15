'use client';

import { isDesktop } from '@lobechat/const';
import { Flexbox, Segmented } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

import AppearanceSkeleton from '@/components/Skeleton/Settings/tabs/Appearance';
import InsetGroup from '@/features/Settings/features/inset/InsetGroup';
import InsetRow from '@/features/Settings/features/inset/InsetRow';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { getSettingsSubPageUrl } from '@/features/Settings/features/subPageUrl';
import { SettingsTabs } from '@/store/global/initialState';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import AccentSwatches from './features/ColorTheme/AccentSwatches';
import ChatThemePreview from './features/ColorTheme/ChatThemePreview';
import ThemeModeCards from './features/ColorTheme/ThemeModeCards';
import AppTrayRow from './features/Desktop';
import { FontSizeControl } from './features/Font/FontSize';

const styles = stylex.create({
  textSize: { paddingBlock: '12px', paddingInline: '16px' },
});

interface PageProps {
  showSettingHeader?: boolean;
}

/**
 * Appearance, laid out like Telegram's: the color theme first (a live chat
 * preview, theme cards and accent dots), then text size, then rows that open
 * the font and chat-display pages.
 */
const Page = ({ showSettingHeader = true }: PageProps) => {
  const { t } = useTranslation('setting');
  const isUserStateInit = useUserStore((s) => s.isUserStateInit);
  const fontSize = useUserStore(userGeneralSettingsSelectors.fontSize);
  const animationMode = useUserStore(userGeneralSettingsSelectors.animationMode);
  const setSettings = useUserStore((s) => s.setSettings);

  const header = showSettingHeader && <SettingHeader title={t('tab.appearance')} />;

  if (!isUserStateInit)
    return (
      <>
        {header}
        <AppearanceSkeleton.Body />
      </>
    );

  return (
    <>
      {header}
      <Flexbox gap={24}>
        <InsetGroup title={t('settingAppearance.colorTheme.title')}>
          <ChatThemePreview />
          <ThemeModeCards />
          <AccentSwatches />
        </InsetGroup>

        <InsetGroup
          anchor={'appearance-font-size'}
          footer={t('settingChatAppearance.fontSize.desc')}
          title={t('settingChatAppearance.fontSize.title')}
        >
          <div {...stylex.props(styles.textSize)}>
            <FontSizeControl
              value={fontSize}
              onChange={(value) => setSettings({ general: { fontSize: value } })}
            />
          </div>
        </InsetGroup>

        <InsetGroup>
          <InsetRow
            label={t('settingAppearance.font.title')}
            to={getSettingsSubPageUrl(SettingsTabs.Appearance, 'font')}
          />
          <InsetRow
            label={t('settingAppearance.chatDisplay.title')}
            to={getSettingsSubPageUrl(SettingsTabs.Appearance, 'chat')}
          />
          <InsetRow
            anchor={'appearance-animation'}
            label={t('settingAppearance.animationMode.title')}
          >
            <Segmented
              value={animationMode}
              options={[
                { label: t('settingAppearance.animationMode.disabled'), value: 'disabled' },
                { label: t('settingAppearance.animationMode.agile'), value: 'agile' },
                { label: t('settingAppearance.animationMode.elegant'), value: 'elegant' },
              ]}
              onChange={(value) => setSettings({ general: { animationMode: value } })}
            />
          </InsetRow>
          {isDesktop && <AppTrayRow />}
        </InsetGroup>
      </Flexbox>
    </>
  );
};

export default Page;
