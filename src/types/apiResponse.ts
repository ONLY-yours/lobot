/**
 * Response shapes of the hosted LobeHub endpoints the desktop client calls.
 *
 * These used to be imported from the Next.js route handlers under
 * `src/app/(backend)`, which this app no longer ships. Keeping them here lets
 * the client describe the remote API without depending on server-only code.
 */

export interface CheckUserResponseData {
  exists: boolean;
  hasPassword?: boolean;
}

export interface ResolveUsernameResponseData {
  email?: string | null;
  exists: boolean;
}

export interface VersionResponseData {
  version: string;
}
