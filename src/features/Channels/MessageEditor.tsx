import { Button, Flexbox, Text, TextArea, toast } from '@lobehub/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Edits the text of one's own message in place. Enter saves and Shift+Enter starts a new line,
 * as in the composer; Escape leaves the message as it was.
 */
export const MessageEditor = ({
  content,
  allowEmpty,
  onCancel,
  onSave,
}: {
  /** A message with attachments may keep only them. */
  allowEmpty: boolean;
  content: string;
  onCancel: () => void;
  onSave: (content: string) => Promise<void>;
}) => {
  const { t } = useTranslation('channel');
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const next = value.trim();
  const canSave = !saving && (!!next || allowEmpty);

  const save = async () => {
    if (!canSave) return;
    if (next === content.trim()) return onCancel();
    setSaving(true);
    try {
      await onSave(next);
      onCancel();
    } catch (error) {
      console.error('[channel] Failed to edit a message', error);
      toast.error(t('message.editFailed'));
      setSaving(false);
    }
  };

  return (
    <Flexbox gap={8}>
      <TextArea
        autoFocus
        autoSize={{ maxRows: 12, minRows: 1 }}
        disabled={saving}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={(event) => {
          // Start at the end of the text, where a correction usually goes.
          const { length } = event.target.value;
          event.target.setSelectionRange(length, length);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Escape') {
            event.stopPropagation();
            onCancel();
          } else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void save();
          }
        }}
      />
      <Flexbox horizontal align={'center'} gap={8} justify={'space-between'}>
        <Text fontSize={12} type={'secondary'}>
          {t('message.editHint')}
        </Text>
        <Flexbox horizontal gap={8}>
          <Button disabled={saving} size={'small'} onClick={onCancel}>
            {t('message.editCancel')}
          </Button>
          <Button
            disabled={!canSave}
            loading={saving}
            size={'small'}
            type={'primary'}
            onClick={() => void save()}
          >
            {t('message.editSave')}
          </Button>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
};
