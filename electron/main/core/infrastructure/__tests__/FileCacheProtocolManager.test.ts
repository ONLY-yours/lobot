import { mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileCacheProtocolManager } from '../FileCacheProtocolManager';

vi.mock('electron', () => ({
  app: { isReady: () => true, whenReady: () => Promise.resolve() },
  net: { fetch: vi.fn() },
  protocol: { handle: vi.fn() },
}));

// A 1x1 PNG, so the served type is sniffed from real bytes.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const SIGNED_URL = 'https://s3.example.com/files/a.png?X-Amz-Expires=300&X-Amz-Signature=abc';

const imageResponse = (body: Buffer = PNG) =>
  new Response(new Uint8Array(body), { headers: { 'content-type': 'image/png' }, status: 200 });

const request = (fileId: string, src = SIGNED_URL) =>
  new Request(`lobe-file-cache://file/${fileId}/a.png?src=${encodeURIComponent(src)}`);

describe('FileCacheProtocolManager', () => {
  let cacheDir: string;
  let fetchRemote: ReturnType<typeof vi.fn>;
  let manager: FileCacheProtocolManager;

  beforeEach(async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), 'file-cache-'));
    fetchRemote = vi.fn();
    manager = new FileCacheProtocolManager({ cacheDir, fetch: fetchRemote });
  });

  afterEach(async () => {
    await rm(cacheDir, { force: true, recursive: true });
  });

  it('serves a cached image after its signed URL has expired', async () => {
    fetchRemote.mockResolvedValueOnce(imageResponse());
    const first = await manager.handleRequest(request('file_AbC'));
    expect(first.status).toBe(200);

    // The persisted conversation still carries the old URL, which S3 now rejects.
    fetchRemote.mockResolvedValue(new Response('expired', { status: 403 }));
    const reopened = await manager.handleRequest(request('file_AbC'));

    expect(reopened.status).toBe(200);
    expect(reopened.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await reopened.arrayBuffer())).toEqual(PNG);
    expect(fetchRemote).toHaveBeenCalledTimes(1);
  });

  it('passes an expired URL through as an error when the image was never cached', async () => {
    fetchRemote.mockResolvedValue(new Response('expired', { status: 403 }));

    const response = await manager.handleRequest(request('file_1'));

    expect(response.status).toBe(403);
    expect(await readdir(cacheDir)).toEqual([]);
  });

  it('downloads a file once for concurrent requests', async () => {
    fetchRemote.mockResolvedValue(imageResponse());

    const responses = await Promise.all([
      manager.handleRequest(request('file_1')),
      manager.handleRequest(request('file_1')),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(fetchRemote).toHaveBeenCalledTimes(1);
  });

  it('refuses to cache a non-image response', async () => {
    fetchRemote.mockResolvedValue(
      new Response('<script>', { headers: { 'content-type': 'text/html' }, status: 200 }),
    );

    const response = await manager.handleRequest(request('file_1'));

    expect(response.status).toBe(415);
    expect(await readdir(cacheDir)).toEqual([]);
  });

  it('rejects ids that could leave the cache directory and non-http sources', async () => {
    expect((await manager.handleRequest(request('..%2Fescape'))).status).toBe(400);
    expect((await manager.handleRequest(request('file_1', 'file:///etc/passwd'))).status).toBe(404);
    expect(fetchRemote).not.toHaveBeenCalled();
  });

  it('serves an opaque type when cached bytes are not an image', async () => {
    await writeFile(path.join(cacheDir, 'file_1'), '<html><script>alert(1)</script></html>');

    const response = await manager.handleRequest(
      new Request('lobe-file-cache://file/file_1/page.html'),
    );

    expect(response.headers.get('content-type')).toBe('application/octet-stream');
  });

  it('trims least recently used files over the cap and partial downloads', async () => {
    manager = new FileCacheProtocolManager({ cacheDir, fetch: fetchRemote, maxCacheBytes: 10 });
    const old = new Date('2026-01-01');
    await writeFile(path.join(cacheDir, 'old'), Buffer.alloc(6));
    await utimes(path.join(cacheDir, 'old'), old, old);
    await writeFile(path.join(cacheDir, 'recent'), Buffer.alloc(6));
    await writeFile(path.join(cacheDir, 'recent.1.2.tmp'), Buffer.alloc(1));

    await manager.prune();

    expect(await readdir(cacheDir)).toEqual(['recent']);
  });
});
