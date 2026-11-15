const USERNAME_PATTERN = /^\w+$/;
const USERNAME_MAX_LENGTH = 64;

type Translate = (
  key: 'profile.usernameRequired' | 'profile.usernameRule' | 'profile.usernameTooLong',
) => string;

/** The first rule a trimmed username breaks, as user-facing copy; `undefined` when it is valid. */
export const validateUsername = (value: string, t: Translate): string | undefined => {
  if (!value) return t('profile.usernameRequired');
  if (value.length > USERNAME_MAX_LENGTH) return t('profile.usernameTooLong');
  if (!USERNAME_PATTERN.test(value)) return t('profile.usernameRule');
};
