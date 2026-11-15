import type { DeviceGatewayResolutionWithDefault } from '@lobechat/device-gateway-client/endpoint';
import type { GatewayConnectionError } from '@lobechat/electron-client-ipc';

/**
 * Coerce a runtime error (which may be an Error, string, or `{ message }`
 * object) into the string shape the wire protocol expects. Returns undefined
 * when there's no error to transmit.
 */
export const serializeWireError = (err: unknown): string | undefined => {
  if (err === undefined || err === null) return undefined;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

export const describeResolutionFailure = (
  resolution: Extract<DeviceGatewayResolutionWithDefault, { ok: false }>,
): GatewayConnectionError => {
  switch (resolution.reason) {
    case 'discovery_failed': {
      return { code: 'config_unavailable', detail: resolution.detail };
    }
    case 'invalid_advertised_url':
    case 'invalid_manual':
    case 'invalid_override': {
      return { code: 'invalid_gateway_url', detail: resolution.detail };
    }
  }
};

/**
 * Whether retrying on its own can bring a connection back after `error`. A
 * rejected credential waits for a new sign-in (retrying would only churn token
 * refreshes) and an unusable gateway address for a settings change.
 */
export const canAutoRetryAfter = (error: GatewayConnectionError | null): boolean =>
  error?.code !== 'auth_failed' && error?.code !== 'invalid_gateway_url';
