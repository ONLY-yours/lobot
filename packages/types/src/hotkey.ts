export type HotkeyId =
  | 'addUserMessage'
  | 'commandPalette'
  | 'deleteAndRegenerateMessage'
  | 'deleteLastMessage'
  | 'editMessage'
  | 'findInTopic'
  | 'navigateToChat'
  | 'openChatSettings'
  | 'openHotkeyHelper'
  | 'openTaskFilter'
  | 'regenerateMessage'
  | 'saveDocument'
  | 'saveTopic'
  | 'search'
  | 'showApp'
  | 'switchAgent'
  | 'toggleFavorite'
  | 'toggleLeftPanel'
  | 'toggleRightPanel'
  | 'toggleTerminalPanel';

export type HotkeyGroupId = 'conversation' | 'essential';

export type HotkeyScopeId = 'chat' | 'files' | 'global' | 'image';

export interface HotkeyItem {
  group: HotkeyGroupId;
  id: HotkeyId;
  keys: string;
  nonEditable?: boolean;
  scopes?: HotkeyScopeId[];
}

export type HotkeyRegistration = HotkeyItem[];

export type DesktopHotkeyId = 'openSettings' | 'quickComposer' | 'showApp';

export interface DesktopHotkeyItem {
  id: DesktopHotkeyId;
  keys: string;
  nonEditable?: boolean;
}

export type DesktopHotkeyConfig = Record<DesktopHotkeyId, string>;

export type HotkeyI18nTranslations = Record<
  HotkeyId,
  {
    desc?: string;
    title: string;
  }
>;
