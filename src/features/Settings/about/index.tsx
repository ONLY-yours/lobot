import { isDesktop } from '@lobechat/const';
import { useTranslation } from 'react-i18next';

import SettingHeader from '@/features/Settings/features/SettingHeader';

import About from './features/About';
import Analytics from './features/Analytics';
import DebugLogs from './features/DebugLogs';
import UpdateChannel from './features/UpdateChannel';

interface PageProps {
  mobile?: boolean;
  showSettingHeader?: boolean;
}

const Page = ({ mobile, showSettingHeader = true }: PageProps) => {
  const { t } = useTranslation('setting');
  return (
    <>
      {showSettingHeader && <SettingHeader title={t('tab.about')} />}
      <About mobile={mobile} />
      {isDesktop && <UpdateChannel />}
      <Analytics />
      <DebugLogs />
    </>
  );
};

export default Page;
