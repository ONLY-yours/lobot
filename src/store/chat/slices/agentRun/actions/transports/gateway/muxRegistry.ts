import { GatewayMuxClient } from '@lobechat/agent-gateway-client';

import { aiAgentService } from '@/services/aiAgent';
import { shareChatService } from '@/services/shareChat';

import { getGatewayClientId } from './clientId';

export interface GatewayMuxIdentity {
  /**
   * Present on the agent-share visitor surface. The visitor's socket is
   * authenticated with a share-scoped user token, so it must not be shared
   * with the owner-scoped socket of the same page.
   */
  agentShareId?: string;
  /** Gateway URL base (e.g. https://agent-gateway.lobehub.com). */
  gatewayUrl: string;
}

const registry = new Map<string, GatewayMuxClient>();

/**
 * Identities whose mux gave up on protocol v2 (`/v2/ws` missing, the token
 * endpoint absent, the hub refusing the token). Not final: a desktop window
 * rarely reloads, so a verdict reached while offline (launch before the network,
 * a wake from sleep) would otherwise keep v2 off for the whole session. Each
 * verdict expires on the next sign of recovery — the network coming back, the
 * window becoming visible, or a timer backing off up to half an hour — so a
 * deployment that really has no v2 pays the dial budget only that often.
 */
const unavailableIdentities = new Set<string>();

const RETRY_INITIAL_DELAY = 60_000;
const RETRY_MAX_DELAY = 30 * 60_000;

/** Verdicts in a row per identity, since its mux last connected; sets the retry backoff. */
const retryAttempts = new Map<string, number>();
const pendingRetries = new Map<string, () => void>();

let availabilityVersion = 0;
const availabilityListeners = new Set<() => void>();

/**
 * Bumps whenever an expired verdict lets an identity dial v2 again, so a socket owner that
 * skipped an unavailable mux can try again (`useSyncExternalStore` snapshot).
 */
export const getGatewayMuxAvailabilityVersion = (): number => availabilityVersion;

export const subscribeGatewayMuxAvailability = (listener: () => void): (() => void) => {
  availabilityListeners.add(listener);
  return () => availabilityListeners.delete(listener);
};

const scheduleRetry = (key: string): void => {
  if (pendingRetries.has(key) || typeof window === 'undefined') return;
  const attempt = retryAttempts.get(key) ?? 0;
  retryAttempts.set(key, attempt + 1);

  const cancel = () => {
    clearTimeout(timer);
    window.removeEventListener('online', retry);
    document.removeEventListener('visibilitychange', onVisible);
    pendingRetries.delete(key);
  };
  function retry() {
    cancel();
    unavailableIdentities.delete(key);
    availabilityVersion++;
    for (const listener of availabilityListeners) listener();
  }
  function onVisible() {
    if (document.visibilityState === 'visible') retry();
  }
  const timer = setTimeout(retry, Math.min(RETRY_MAX_DELAY, RETRY_INITIAL_DELAY * 2 ** attempt));
  window.addEventListener('online', retry);
  document.addEventListener('visibilitychange', onVisible);
  pendingRetries.set(key, cancel);
};

const identityKey = ({ agentShareId, gatewayUrl }: GatewayMuxIdentity): string =>
  `${gatewayUrl}|${agentShareId ?? 'owner'}`;

/**
 * `getToken` is invoked before EVERY dial (initial connect, backoff retry,
 * 4401 refresh), so the mux never needs the v1 `auth_expired` → `updateToken`
 * round trip. Owners mint a user-level token; share visitors mint one scoped
 * to the share.
 */
const buildGetToken =
  ({ agentShareId }: GatewayMuxIdentity): (() => Promise<string>) =>
  async () => {
    const { token } = agentShareId
      ? await shareChatService.issueGatewayUserToken(agentShareId)
      : await aiAgentService.issueGatewayUserToken();
    return token;
  };

/**
 * One `GatewayMuxClient` per `${gatewayUrl}|${agentShareId ?? 'owner'}` for
 * the lifetime of the page. Every operation on the same identity multiplexes
 * over that single socket (protocol v2). The socket is dialed on app entry by
 * `warmupGatewayMux` (or lazily on the first `subscribe` if that never ran)
 * and is kept up across runs — `keepAlive` so a drop is redialed even while
 * nothing is subscribed.
 */
export const getGatewayMux = (identity: GatewayMuxIdentity): GatewayMuxClient => {
  const key = identityKey(identity);
  let mux = registry.get(key);
  if (!mux) {
    mux = new GatewayMuxClient({
      ...(!identity.agentShareId && { clientId: getGatewayClientId() }),
      gatewayUrl: identity.gatewayUrl,
      getToken: buildGetToken(identity),
      keepAlive: true,
    });
    mux.on('connected', () => retryAttempts.delete(key));
    registry.set(key, mux);
  }
  return mux;
};

/**
 * Whether protocol v2 has already failed for this identity on this page, in
 * which case the caller must use the v1 per-operation socket instead.
 */
export const isGatewayMuxUnavailable = (identity: GatewayMuxIdentity): boolean =>
  unavailableIdentities.has(identityKey(identity));

/**
 * Record that protocol v2 does not work for this identity, and forget the dead
 * mux so a later `getGatewayMux` never hands out a client that will not dial
 * again. Called by the transport when the mux reports itself `unavailable`.
 */
export const markGatewayMuxUnavailable = (identity: GatewayMuxIdentity): void => {
  const key = identityKey(identity);
  unavailableIdentities.add(key);
  registry.delete(key);
  scheduleRetry(key);
};

/**
 * Tear down every mux (they hold window listeners and the lifecycle → store
 * feed) and forget them. Called when the user-data context resets
 * (`stores.reset()`, e.g. the desktop app switching or disconnecting its
 * remote server) so a socket authenticated for the previous identity never
 * outlives it or keeps writing into the reset chat store; also a test seam.
 */
export const resetGatewayMuxRegistry = (): void => {
  for (const mux of registry.values()) mux.disconnect();
  registry.clear();
  // A new user-data context is a new deployment as far as this page knows
  // (the desktop app switching remote servers), so the v2 verdict starts over.
  unavailableIdentities.clear();
  for (const cancel of pendingRetries.values()) cancel();
  retryAttempts.clear();
};
