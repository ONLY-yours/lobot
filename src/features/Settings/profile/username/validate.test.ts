import { describe, expect, it } from 'vitest';

import { validateUsername } from './validate';

const t = (key: string) => key;

describe('validateUsername', () => {
  it('accepts letters, digits and underscores', () => {
    expect(validateUsername('arvin_xx_01', t)).toBeUndefined();
  });

  it('requires a value', () => {
    expect(validateUsername('', t)).toBe('profile.usernameRequired');
  });

  it('rejects other characters', () => {
    expect(validateUsername('arvin.xx', t)).toBe('profile.usernameRule');
    expect(validateUsername('arvin xx', t)).toBe('profile.usernameRule');
  });

  it('caps the length at 64', () => {
    expect(validateUsername('a'.repeat(64), t)).toBeUndefined();
    expect(validateUsername('a'.repeat(65), t)).toBe('profile.usernameTooLong');
  });
});
