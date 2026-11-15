'use client';

import { Flexbox, Icon, Select, Text } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { CheckIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import InsetGroup from '@/features/Settings/features/inset/InsetGroup';
import InsetRow from '@/features/Settings/features/inset/InsetRow';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { localeOptions } from '@/locales/resources';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import { type LocaleMode } from '@/types/locale';
import { preloadLang } from '@/utils/client/preloadLang';

const styles = stylex.create({
  option: {
    cursor: 'pointer',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    width: '100%',
    minHeight: '56px',
    paddingBlock: '8px',
    paddingInline: '16px',
    borderWidth: 0,
    color: 'inherit',
    textAlign: 'start',
    backgroundColor: { 'default': 'transparent', ':hover': cssVar.colorFillTertiary },
    backgroundImage: 'none',
    transition: `background-color ${cssVar.motionDurationMid} ease`,
  },
  text: { display: 'flex', flex: '1', flexDirection: 'column', minWidth: '0' },
});

const SCRIPT_TAGS: Record<string, string> = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' };

interface LanguageOptionProps {
  active: boolean;
  /** The language's own name, e.g. 日本語 */
  nativeName: string;
  onPreload?: () => void;
  onSelect: () => void;
  /** The language's name in the current interface language */
  title: string;
}

const LanguageOption = ({
  active,
  nativeName,
  onPreload,
  onSelect,
  title,
}: LanguageOptionProps) => (
  <button
    aria-pressed={active}
    type={'button'}
    {...stylex.props(styles.option)}
    onClick={onSelect}
    onFocus={onPreload}
    onMouseEnter={onPreload}
  >
    <span {...stylex.props(styles.text)}>
      <Text>{title}</Text>
      {nativeName !== title && (
        <Text fontSize={12} type={'secondary'}>
          {nativeName}
        </Text>
      )}
    </span>
    {active && <Icon color={cssVar.colorPrimary} icon={CheckIcon} size={18} />}
  </button>
);

interface PageProps {
  showSettingHeader?: boolean;
}

/**
 * Language, Telegram style: the reply language the Agents use, then the
 * interface languages as a checked list, each named in the current language
 * with its own name underneath.
 */
const Page = ({ showSettingHeader = true }: PageProps) => {
  const { t, i18n } = useTranslation('setting');
  const language = useGlobalStore(systemStatusSelectors.language);
  const switchLocale = useGlobalStore((s) => s.switchLocale);
  const responseLanguage = useUserStore(userGeneralSettingsSelectors.responseLanguage);
  const setSettings = useUserStore((s) => s.setSettings);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: 'language' });
    } catch {
      return undefined;
    }
  }, [i18n.language]);
  // Name the language, not the region ("English", not "American English"); Chinese
  // is the one language offered twice, told apart by script.
  const nameOf = (code: string, fallback: string) =>
    displayNames?.of(SCRIPT_TAGS[code] ?? code.split('-')[0]) ?? fallback;

  return (
    <>
      {showSettingHeader && <SettingHeader title={t('tab.language')} />}
      <Flexbox gap={24}>
        <InsetGroup footer={t('settingCommon.responseLanguage.desc')}>
          <InsetRow
            anchor={'language-response-language'}
            label={t('settingCommon.responseLanguage.title')}
          >
            <Select
              allowClear
              aria-label={t('settingCommon.responseLanguage.title')}
              options={localeOptions}
              placeholder={t('settingCommon.responseLanguage.placeholder')}
              style={{ width: 200 }}
              value={responseLanguage || undefined}
              onChange={(value) => setSettings({ general: { responseLanguage: value ?? '' } })}
            />
          </InsetRow>
        </InsetGroup>

        <InsetGroup anchor={'language-interface'} title={t('settingCommon.lang.interfaceTitle')}>
          <LanguageOption
            active={language === 'auto'}
            nativeName={t('settingCommon.lang.autoMode')}
            title={t('settingCommon.lang.autoMode')}
            onSelect={() => switchLocale('auto')}
          />
          {localeOptions.map(({ label, value }) => (
            <LanguageOption
              active={language === value}
              key={value}
              nativeName={label}
              title={nameOf(value, label)}
              onPreload={() => preloadLang(value as LocaleMode)}
              onSelect={() => switchLocale(value as LocaleMode)}
            />
          ))}
        </InsetGroup>
      </Flexbox>
    </>
  );
};

export default Page;
