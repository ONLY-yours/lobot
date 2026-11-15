import type { ChannelPublicMember } from '@lobechat/types';
import { Button, Flexbox, Text, usePopoverContext } from '@lobehub/ui';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { getDeviceIcon } from '@/features/DeviceManager/getDeviceIcon';
import { channelActions } from '@/store/channel';
import { useDeviceList } from '@/store/device/useDeviceList';

import { openChannelAgentEnvironment } from './AgentEnvironment';
import { blockedDeviceState } from './blockedDeviceState';
import { deviceLabel } from './CreateChannel/EnvironmentFields';

/** Lines up under the reply's name: avatar (24) plus the row gap (8). */
const INDENT = 32;

function Hint() {
  const { t } = useTranslation('channel');
  return (
    <Text fontSize={12} style={{ paddingInlineStart: INDENT }} type="secondary">
      {t('blockedDevice.hint')}
    </Text>
  );
}

/**
 * The device a reply waits for and what the device gateway sees of it now, with a way to move
 * the Agent to another device. Reading the Agent's environment is for Channel admins.
 */
function ManagedBlockedDevice({
  channelId,
  member,
}: {
  channelId: string;
  member: ChannelPublicMember;
}) {
  const { t } = useTranslation('channel');
  const { close } = usePopoverContext();
  const environment = channelActions.useFetchAgentEnvironment(channelId, member.id);
  const devices = useDeviceList({ refreshInterval: 15_000 });
  const deviceId = environment.data?.deviceId;
  if (!deviceId) return <Hint />;

  const state = blockedDeviceState(deviceId, devices.data, devices.isConfirmed);
  const name = 'device' in state ? deviceLabel(state.device) : t('environment.unavailableDevice');
  const presence =
    state.kind === 'online'
      ? t('blockedDevice.online')
      : state.kind === 'offline'
        ? t('blockedDevice.offline', { time: dayjs(state.device.lastSeen).fromNow() })
        : state.kind === 'missing'
          ? t('blockedDevice.missing')
          : t('environment.checkingDevice');

  return (
    <Flexbox horizontal align="center" gap={8} style={{ paddingInlineStart: INDENT }}>
      <Flexbox flex={1} gap={2} style={{ minWidth: 0 }}>
        <Flexbox horizontal align="center" gap={6} style={{ minWidth: 0 }}>
          <span aria-hidden style={{ display: 'inline-flex', flexShrink: 0 }}>
            {getDeviceIcon('device' in state ? state.device.platform : null, 12)}
          </span>
          <Text ellipsis fontSize={12} title={name}>
            {name}
          </Text>
        </Flexbox>
        <Text fontSize={12} role="status" type={state.kind === 'online' ? 'success' : 'secondary'}>
          {presence}
        </Text>
      </Flexbox>
      <Button
        size="small"
        style={{ flexShrink: 0 }}
        onClick={() => {
          close();
          openChannelAgentEnvironment(channelId, member);
        }}
      >
        {t('blockedDevice.change')}
      </Button>
    </Flexbox>
  );
}

/** Why a reply waits for a device, under the reply's row. */
export function BlockedDevice({
  channelId,
  manageable,
  member,
}: {
  channelId: string;
  manageable?: boolean;
  member?: ChannelPublicMember;
}) {
  return manageable && member ? (
    <ManagedBlockedDevice channelId={channelId} member={member} />
  ) : (
    <Hint />
  );
}
