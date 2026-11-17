import { describe, expect, it } from 'vitest';

import { buildFileCacheUrl, buildLocalFileUrl } from './protocol';

describe('buildLocalFileUrl', () => {
  it('returns null for empty / nullish input', () => {
    expect(buildLocalFileUrl(null)).toBeNull();
    expect(buildLocalFileUrl(undefined)).toBeNull();
    expect(buildLocalFileUrl('')).toBeNull();
  });

  it('rejects relative paths', () => {
    expect(buildLocalFileUrl('relative/path.png')).toBeNull();
    expect(buildLocalFileUrl('./img.png')).toBeNull();
  });

  it('builds a URL from a POSIX absolute path', () => {
    expect(buildLocalFileUrl('/Users/alice/Pictures/cat.png')).toBe(
      'localfile://file/Users/alice/Pictures/cat.png',
    );
  });

  it('builds a URL from a Windows absolute path', () => {
    expect(buildLocalFileUrl('C:\\Users\\alice\\img.png')).toBe(
      'localfile://file/C%3A/Users/alice/img.png',
    );
  });

  it('percent-encodes special characters per segment', () => {
    expect(buildLocalFileUrl('/Users/alice/My Pictures/图 #.png')).toBe(
      'localfile://file/Users/alice/My%20Pictures/%E5%9B%BE%20%23.png',
    );
  });

  it('survives a URL round-trip back to the original POSIX path', () => {
    const original = '/Users/alice/My Pictures/cat #1.png';
    const url = new URL(buildLocalFileUrl(original)!);
    const decoded = decodeURIComponent(url.pathname);
    expect(decoded).toBe(original);
  });
});

describe('buildFileCacheUrl', () => {
  it('keeps the case-sensitive file id in the path and the source in `src`', () => {
    const url = buildFileCacheUrl({
      id: 'file_AbC12',
      name: '截图 1.png',
      url: 'https://s3.example.com/a.png?X-Amz-Signature=x&b=1',
    });

    const parsed = new URL(url);
    expect(parsed.protocol).toBe('lobe-file-cache:');
    expect(parsed.pathname.split('/').map(decodeURIComponent)).toEqual([
      '',
      'file_AbC12',
      '截图 1.png',
    ]);
    expect(parsed.searchParams.get('src')).toBe(
      'https://s3.example.com/a.png?X-Amz-Signature=x&b=1',
    );
  });

  it('falls back to the id as the name', () => {
    expect(buildFileCacheUrl({ id: 'f1', url: 'https://a.test/x' })).toBe(
      'lobe-file-cache://file/f1/f1?src=https%3A%2F%2Fa.test%2Fx',
    );
  });

  it('leaves non-http sources and id-less files untouched', () => {
    expect(buildFileCacheUrl({ id: 'f1', url: 'blob:app://x/1' })).toBe('blob:app://x/1');
    expect(buildFileCacheUrl({ id: '', url: 'https://a.test/x' })).toBe('https://a.test/x');
  });
});
