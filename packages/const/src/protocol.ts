/**
 * Custom protocol the desktop main process exposes for serving approved
 * local workspace file previews to the renderer.
 * Backed by `LocalFileProtocolManager` in
 * `apps/desktop`.
 */
export const LOCAL_FILE_PROTOCOL_SCHEME = 'localfile';
export const LOCAL_FILE_PROTOCOL_HOST = 'file';

/**
 * Build a `localfile://file/<abs-path>` URL from an absolute filesystem path.
 *
 * The desktop protocol handler requires a main-process authorization token
 * before serving bytes. Renderer preview code should request that URL through
 * desktop IPC instead of using this helper directly.
 *
 * - POSIX  `/Users/a/img.png`     -> `localfile://file/Users/a/img.png`
 * - Win32  `C:\\Users\\a\\img.png` -> `localfile://file/C:/Users/a/img.png`
 *
 * Each path segment is percent-encoded so spaces / unicode / `?` / `#`
 * survive the URL round-trip. The `/` separator itself is preserved.
 * Returns `null` when the input is empty or not an absolute path.
 */
export const buildLocalFileUrl = (absolutePath: string | null | undefined): string | null => {
  if (!absolutePath) return null;

  // Normalize Windows backslashes so the URL pathname uses forward slashes.
  const forwardSlashed = absolutePath.replaceAll('\\', '/');

  const isWindowsAbsolute = /^[a-z]:\//i.test(forwardSlashed);
  const isPosixAbsolute = forwardSlashed.startsWith('/');
  if (!isWindowsAbsolute && !isPosixAbsolute) return null;

  // Drop the leading slash on POSIX paths so we get exactly one `/` between
  // host and the encoded path (the protocol handler re-adds it).
  const stripped = isPosixAbsolute ? forwardSlashed.slice(1) : forwardSlashed;

  const encoded = stripped.split('/').map(encodeURIComponent).join('/');

  return `${LOCAL_FILE_PROTOCOL_SCHEME}://${LOCAL_FILE_PROTOCOL_HOST}/${encoded}`;
};

/**
 * Desktop protocol that keeps a disk copy of remote images by file id. A file id names immutable
 * content, so the copy stays valid after the short-lived signed URL it was downloaded from
 * expires. Backed by `FileCacheProtocolManager` in `electron`.
 */
export const FILE_CACHE_PROTOCOL_SCHEME = 'lobe-file-cache';
export const FILE_CACHE_PROTOCOL_HOST = 'file';

/**
 * Build `lobe-file-cache://file/<id>/<name>?src=<url>`. The id sits in the path because a
 * standard scheme lowercases its host; the name gives downloads their file name; `src` is only
 * fetched on a cache miss. Non-http(s) sources (blob:, data:) are returned unchanged.
 */
export const buildFileCacheUrl = ({
  id,
  name,
  url,
}: {
  id: string;
  name?: string;
  url: string;
}): string => {
  if (!id || !/^https?:\/\//i.test(url)) return url;

  const path = `${encodeURIComponent(id)}/${encodeURIComponent(name || id)}`;
  return `${FILE_CACHE_PROTOCOL_SCHEME}://${FILE_CACHE_PROTOCOL_HOST}/${path}?src=${encodeURIComponent(url)}`;
};
