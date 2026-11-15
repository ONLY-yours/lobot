'use client';

import { Button, Input, Text } from '@lobehub/ui';
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { SettingsTabs } from '@/store/global/initialState';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import InsetGroup from '../../features/inset/InsetGroup';
import SubPageFrame, { settingsTabUrl } from '../../features/inset/SubPageFrame';
import { validateUsername } from './validate';

/**
 * Telegram's username page: one field, the rules underneath, and Done in the
 * header. Saving returns to the profile; Back or Escape leaves it unchanged.
 */
const UsernamePage = () => {
  const { t } = useTranslation('auth');
  const navigate = useWorkspaceAwareNavigate();
  const username = useUserStore(userProfileSelectors.username) || '';
  const updateUsername = useUserStore((s) => s.updateUsername);
  const [value, setValue] = useState(username);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const dirty = trimmed !== username;

  const goBack = () => navigate(settingsTabUrl(SettingsTabs.Profile), { escape: true });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Only flag what the user can already see is wrong; emptiness waits for Done.
    const next = e.target.value.trim();
    setError(next ? (validateUsername(next, t) ?? '') : '');
  };

  const handleDone = async () => {
    if (saving) return;
    if (!dirty) return goBack();

    const validationError = validateUsername(trimmed, t);
    if (validationError) return setError(validationError);

    try {
      setSaving(true);
      setError('');
      await updateUsername(trimmed);
      goBack();
    } catch (err: any) {
      console.error('Failed to update username:', err);
      setError(
        err?.data?.code === 'CONFLICT' || err?.message === 'USERNAME_TAKEN'
          ? t('profile.usernameDuplicate')
          : t('profile.usernameUpdateFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageFrame
      tab={SettingsTabs.Profile}
      title={t('profile.username')}
      right={
        <Button disabled={!!error} loading={saving} size={'small'} onClick={handleDone}>
          {t('profile.save')}
        </Button>
      }
    >
      <InsetGroup
        footer={
          error ? (
            <Text fontSize={12} type={'danger'}>
              {error}
            </Text>
          ) : (
            t('profile.usernameHint')
          )
        }
      >
        <Input
          autoFocus
          aria-invalid={!!error}
          aria-label={t('profile.username')}
          disabled={saving}
          placeholder={t('profile.usernamePlaceholder')}
          prefix={<Text type={'secondary'}>@</Text>}
          style={{ minHeight: 48, paddingInline: 16 }}
          value={value}
          variant={'borderless'}
          onChange={handleChange}
          onPressEnter={handleDone}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              goBack();
            }
          }}
        />
      </InsetGroup>
    </SubPageFrame>
  );
};

export default UsernamePage;
