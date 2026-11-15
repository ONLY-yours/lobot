import { Icon } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FALLBACK_DELAY } from '@/components/Skeleton/Delayed';
import type { ChannelViewParams } from '@/services/channel';
import { channelSelectors, useChannelStore } from '@/store/channel';

const styles = stylex.create({
  syncing: {
    display: 'inline-flex',
    flex: 'none',
    gap: 4,
    alignItems: 'center',
    fontSize: 12,
    color: cssVar.colorTextDescription,
  },
});

/**
 * Beside the title while the conversation on screen is a stored copy the server has not confirmed
 * yet, so older messages do not read as the latest. A failed read shows its own error instead, and
 * a fast read paints nothing.
 */
export function ChannelSyncing({ failed, params }: { failed: boolean; params: ChannelViewParams }) {
  const { t } = useTranslation('channel');
  const unconfirmed = useChannelStore(channelSelectors.isUnconfirmed(params)) && !failed;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (!unconfirmed) return;
    const timer = setTimeout(() => setVisible(true), FALLBACK_DELAY);
    return () => clearTimeout(timer);
  }, [unconfirmed]);
  if (!unconfirmed || !visible) return null;

  return (
    <span role="status" {...stylex.props(styles.syncing)}>
      <Icon spin icon={Loader2Icon} size={12} />
      {t('syncing')}
    </span>
  );
}
