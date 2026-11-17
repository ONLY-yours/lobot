import { mkdir, readdir, readFile, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { FILE_CACHE_PROTOCOL_HOST, FILE_CACHE_PROTOCOL_SCHEME } from '@lobechat/const/protocol';
import { resolveMimeType } from '@lobechat/utils/mimeType';
import { app, net, protocol } from 'electron';

import { createLogger } from '@/utils/logger';

const logger = createLogger('core:FileCacheProtocolManager');

const FILE_CACHE_PROTOCOL_PRIVILEGES = {
  allowServiceWorkers: false,
  bypassCSP: false,
  corsEnabled: true,
  secure: true,
  standard: true,
  stream: true,
  supportFetchAPI: true,
} as const;

const FILE_ID_PATTERN = /^[\w-]{1,128}$/;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const DEFAULT_MAX_CACHE_BYTES = 1024 * 1024 * 1024;
const TEMP_SUFFIX = '.tmp';

interface FileCacheProtocolManagerOptions {
  cacheDir: string;
  fetch?: (url: string) => Promise<Response>;
  maxCacheBytes?: number;
}

/**
 * Custom `lobe-file-cache://` protocol that keeps a disk copy of remote images by file id.
 *
 * URL shape: `lobe-file-cache://file/<file-id>/<name>?src=<signed-url>`
 *
 * The server signs attachment URLs for a few minutes, and the renderer persists them with the
 * rest of a conversation. A file id names immutable content, so once an image is on disk it is
 * served from there and the expired URL is never requested again; `src` is only fetched on a
 * miss. Only images are stored, the first download of an id wins, and the directory is trimmed
 * to `maxCacheBytes` by least recent use at startup.
 */
export class FileCacheProtocolManager {
  private readonly cacheDir: string;

  private readonly fetchRemote: (url: string) => Promise<Response>;

  private handlerRegistered = false;

  private readonly inFlight = new Map<string, Promise<Buffer | Response>>();

  private readonly maxCacheBytes: number;

  constructor({ cacheDir, fetch, maxCacheBytes }: FileCacheProtocolManagerOptions) {
    this.cacheDir = cacheDir;
    this.fetchRemote = fetch ?? ((url) => net.fetch(url));
    this.maxCacheBytes = maxCacheBytes ?? DEFAULT_MAX_CACHE_BYTES;
  }

  get protocolScheme() {
    return {
      privileges: FILE_CACHE_PROTOCOL_PRIVILEGES,
      scheme: FILE_CACHE_PROTOCOL_SCHEME,
    };
  }

  registerHandler() {
    if (this.handlerRegistered) return;

    const register = () => {
      if (this.handlerRegistered) return;
      protocol.handle(FILE_CACHE_PROTOCOL_SCHEME, (request) => this.handleRequest(request));
      this.handlerRegistered = true;
      void this.prune().catch((error) => logger.warn('Failed to prune file cache:', error));
    };

    if (app.isReady()) register();
    else app.whenReady().then(register);
  }

  async handleRequest(request: Request): Promise<Response> {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }
    if (url.hostname !== FILE_CACHE_PROTOCOL_HOST)
      return new Response('Not Found', { status: 404 });

    const [fileId, fileName] = this.parsePath(url.pathname);
    if (!fileId) return new Response('Invalid file id', { status: 400 });

    const filePath = path.join(this.cacheDir, fileId);
    try {
      const cached = await readFile(filePath);
      const now = new Date();
      void utimes(filePath, now, now).catch(() => {});
      return this.respond(cached, fileName, request);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn(`Failed to read cached file ${fileId}:`, error);
      }
    }

    const src = url.searchParams.get('src');
    if (!src || !/^https?:\/\//i.test(src)) return new Response('Not Found', { status: 404 });

    let pending = this.inFlight.get(fileId);
    if (!pending) {
      pending = this.download(fileId, filePath, src).finally(() => this.inFlight.delete(fileId));
      this.inFlight.set(fileId, pending);
    }

    const result = await pending;
    if (result instanceof Response) return result.clone();
    return this.respond(result, fileName, request);
  }

  /** Delete leftover partial downloads, then the least recently used files over the size cap. */
  async prune() {
    let names: string[];
    try {
      names = await readdir(this.cacheDir);
    } catch {
      return;
    }

    const entries: { mtimeMs: number; path: string; size: number }[] = [];
    for (const name of names) {
      const entryPath = path.join(this.cacheDir, name);
      if (name.endsWith(TEMP_SUFFIX)) {
        await rm(entryPath, { force: true });
        continue;
      }
      const entryStat = await stat(entryPath).catch(() => null);
      if (entryStat?.isFile()) {
        entries.push({ mtimeMs: entryStat.mtimeMs, path: entryPath, size: entryStat.size });
      }
    }

    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    let total = 0;
    for (const entry of entries) {
      total += entry.size;
      if (total > this.maxCacheBytes) await rm(entry.path, { force: true });
    }
  }

  private async download(fileId: string, filePath: string, src: string) {
    let response: Response;
    try {
      response = await this.fetchRemote(src);
    } catch (error) {
      logger.warn(`Failed to download file ${fileId}:`, error);
      return new Response('Bad Gateway', { status: 502 });
    }

    // An expired signed URL answers 403; pass the failure through so the image shows its error state.
    if (!response.ok) return new Response(null, { status: response.status });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return new Response('Unsupported Media Type', { status: 415 });
    }
    if (Number(response.headers.get('content-length')) > MAX_FILE_BYTES) {
      return new Response('Payload Too Large', { status: 413 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_FILE_BYTES) {
      return new Response('Payload Too Large', { status: 413 });
    }

    try {
      await mkdir(this.cacheDir, { recursive: true });
      // Write then rename, so a crash never leaves a truncated file that later reads as a hit.
      const tempPath = `${filePath}.${process.pid}.${Date.now()}${TEMP_SUFFIX}`;
      await writeFile(tempPath, buffer);
      await rename(tempPath, filePath);
    } catch (error) {
      logger.warn(`Failed to cache file ${fileId}:`, error);
    }

    return buffer;
  }

  /** Returns `[fileId, fileName]`, with a null id when the path does not name a valid one. */
  private parsePath(pathname: string): [string | null, string] {
    const [idSegment = '', nameSegment = ''] = pathname.replace(/^\/+/, '').split('/');
    try {
      const fileId = decodeURIComponent(idSegment);
      const fileName = decodeURIComponent(nameSegment) || fileId;
      return [FILE_ID_PATTERN.test(fileId) ? fileId : null, fileName];
    } catch {
      return [null, ''];
    }
  }

  private async respond(buffer: Buffer, fileName: string, request: Request) {
    // Bytes decide the type; the name only separates SVG (text) from other text. Anything that
    // does not resolve to an image is served opaque, so a cached file never renders as a page.
    const contentType = await resolveMimeType(fileName, buffer);
    const headers = new Headers();
    headers.set(
      'Content-Type',
      contentType.startsWith('image/') ? contentType : 'application/octet-stream',
    );
    headers.set('Content-Security-Policy', 'sandbox');
    headers.set('Content-Length', String(buffer.byteLength));
    headers.set('Cache-Control', 'private, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    // The renderer's download action fetches the image; a sandboxed preview (Origin: null) may not.
    const origin = request.headers.get('origin');
    if (origin && origin !== 'null') headers.set('Access-Control-Allow-Origin', origin);
    return new Response(new Uint8Array(buffer), { headers, status: 200 });
  }
}
