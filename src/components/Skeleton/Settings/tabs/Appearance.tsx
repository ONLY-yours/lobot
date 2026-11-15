'use client';

import { isDesktop } from '@lobechat/const';
import { Flexbox } from '@lobehub/ui';
import { Form } from '@lobehub/ui/form';

import InsetGroup from '@/features/Settings/features/inset/InsetGroup';

import SkeletonBar from '../../Bar';
import { SettingsProfileRowSkeleton } from '../Profile';
import { SettingsFormSkeleton, SWITCH_CONTROL } from '../Section';
import { useSkeletonText } from '../useSkeletonText';
import type { SettingsTabSkeleton } from './types';

/** The idle auto-save hint ("loaded the latest version") on the right of a group head. */
const SAVE_HINT = <SkeletonBar height={20} width={102} />;

export const FontSectionSkeleton = () => {
  const text = useSkeletonText('setting');
  const fontRow = (key: string) => ({
    control: { height: 32, width: 320 },
    desc: text(`settingAppearance.font.${key}.desc`, 240, 12),
    label: text(`settingAppearance.font.${key}.title`, 96, 14),
    minWidth: undefined,
  });

  return (
    <SettingsFormSkeleton
      groups={[
        {
          extra: SAVE_HINT,
          items: [
            ...(isDesktop
              ? ['fontFamily', 'fallback', 'monospace', 'monospaceFallback'].map(fontRow)
              : []),
            {
              control: SWITCH_CONTROL,
              desc: text('settingAppearance.font.antialiasing.desc', 360, 12),
              label: text('settingAppearance.font.antialiasing.title', 72, 14),
              minWidth: undefined,
            },
          ],
          title: text('settingAppearance.font.title', 32),
        },
      ]}
    />
  );
};

/**
 * Chat appearance: four separate blocks (36px apart in the settings container):
 * transition preview, chat-behaviour switches, code and Mermaid theme previews.
 */
export const ChatAppearanceSectionSkeleton = () => {
  const text = useSkeletonText('setting');

  return (
    <>
      <Form.Group
        collapsible={false}
        extra={<SkeletonBar height={38} radius={8} width={151} />}
        title={text('settingChatAppearance.transitionMode.title', 64)}
        variant={'filled'}
      >
        <SkeletonBar height={182} radius={8} />
      </Form.Group>
      <SettingsFormSkeleton
        groups={[
          {
            items: [
              {
                control: SWITCH_CONTROL,
                label: text('settingChatAppearance.autoScrollOnStreaming.title', 120, 14),
                minWidth: undefined,
              },
              {
                control: SWITCH_CONTROL,
                label: text('settingChatAppearance.workflowStreamingExpand.title', 120, 14),
                minWidth: undefined,
              },
              {
                control: SWITCH_CONTROL,
                // The loaded description is a two-line link preview.
                desc: (
                  <Flexbox gap={6} paddingBlock={4}>
                    <SkeletonBar height={14} width={160} />
                    <SkeletonBar height={14} width={200} />
                  </Flexbox>
                ),
                label: text('settingChatAppearance.linkIcon.title', 120, 14),
                minWidth: undefined,
              },
              {
                control: SWITCH_CONTROL,
                desc: text('settingChatAppearance.pasteAutoConvert.desc', 360, 12),
                label: text('settingChatAppearance.pasteAutoConvert.title', 120, 14),
                minWidth: undefined,
              },
            ],
            title: text('settingChatAppearance.chatBehavior.title', 64),
          },
        ]}
      />
      <Form.Group
        collapsible={false}
        extra={<SkeletonBar height={32} width={240} />}
        title={text('settingChatAppearance.highlighterTheme.title', 96)}
        variant={'filled'}
      >
        <SkeletonBar height={167} radius={8} />
      </Form.Group>
      <Form.Group
        extra={<SkeletonBar height={32} width={240} />}
        title={text('settingChatAppearance.mermaidTheme.title', 96)}
        variant={'filled'}
      >
        <SkeletonBar height={295} radius={8} />
      </Form.Group>
    </>
  );
};

/**
 * The appearance tab's inset groups: color theme (preview, theme cards, accent
 * dots), text size, then the rows that open the font and chat pages.
 */
const Body = () => {
  const text = useSkeletonText('setting');

  return (
    <Flexbox aria-busy gap={24}>
      <InsetGroup title={text('settingAppearance.colorTheme.title', 56, 18)}>
        <SkeletonBar height={176} radius={0} />
        <Flexbox horizontal gap={16} padding={16}>
          {[0, 1, 2].map((key) => (
            <Flexbox align={'center'} gap={8} key={key}>
              <SkeletonBar height={64} radius={12} width={96} />
              <SkeletonBar height={14} width={40} />
            </Flexbox>
          ))}
        </Flexbox>
        <Flexbox horizontal gap={8} padding={16}>
          {Array.from({ length: 13 }, (_, key) => (
            <SkeletonBar height={24} key={key} radius={'50%'} width={24} />
          ))}
        </Flexbox>
      </InsetGroup>
      <InsetGroup
        footer={text('settingChatAppearance.fontSize.desc', 96, 12)}
        title={text('settingChatAppearance.fontSize.title', 56, 18)}
      >
        <Flexbox gap={24} paddingBlock={20} paddingInline={16}>
          <SkeletonBar height={4} />
        </Flexbox>
      </InsetGroup>
      <InsetGroup>
        <SettingsProfileRowSkeleton
          label={text('settingAppearance.font.title', 32, 22)}
          valueWidth={16}
        />
        <SettingsProfileRowSkeleton
          label={text('settingAppearance.chatDisplay.title', 64, 22)}
          valueWidth={16}
        />
        <SettingsProfileRowSkeleton
          label={text('settingAppearance.animationMode.title', 64, 22)}
          valueWidth={200}
        />
        {isDesktop && (
          <SettingsProfileRowSkeleton
            label={text('settingAppearance.appTray.title', 96, 22)}
            valueWidth={44}
          />
        )}
      </InsetGroup>
    </Flexbox>
  );
};

const AppearanceSkeleton: SettingsTabSkeleton = { Body };

export default AppearanceSkeleton;
