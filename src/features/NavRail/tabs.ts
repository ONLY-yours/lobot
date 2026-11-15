import { ContactsSolidIcon, MessagesSolidIcon } from './icons';

/** Lobot's IA is two tabs: Messages (Channels) first, then Contacts. */
export const railTabs = (
  t: (key: 'tab.contacts' | 'tab.messages') => string,
  messagesUrl: string,
) => [
  { icon: MessagesSolidIcon, key: 'messages' as const, title: t('tab.messages'), url: messagesUrl },
  { icon: ContactsSolidIcon, key: 'contacts' as const, title: t('tab.contacts'), url: '/agents' },
];
