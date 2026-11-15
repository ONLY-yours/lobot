import { describe, expect, it } from 'vitest';

import { canAutoRetryAfter } from '../gatewayConnectionErrors';

describe('canAutoRetryAfter', () => {
  it('retries a drop or a server config that failed to load', () => {
    expect(canAutoRetryAfter(null)).toBe(true);
    expect(canAutoRetryAfter({ code: 'config_unavailable' })).toBe(true);
    expect(canAutoRetryAfter({ code: 'not_signed_in' })).toBe(true);
  });

  it('waits for a new sign-in or a settings change instead of retrying', () => {
    expect(canAutoRetryAfter({ code: 'auth_failed' })).toBe(false);
    expect(canAutoRetryAfter({ code: 'invalid_gateway_url' })).toBe(false);
  });
});
