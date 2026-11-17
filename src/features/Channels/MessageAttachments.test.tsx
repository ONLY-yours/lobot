/**
 * @vitest-environment happy-dom
 */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageAttachments } from './MessageAttachments';

vi.mock('@lobechat/const', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isDesktop: true,
}));
vi.mock('@/features/FileViewer', () => ({ default: () => null }));

describe('MessageAttachments', () => {
  it('loads a desktop image through the file-id cache instead of its expiring signed URL', () => {
    const signedUrl = 'https://s3.example.com/a.png?X-Amz-Expires=300';
    const { container } = render(
      <MessageAttachments
        fileIds={['file_A']}
        attachments={[
          { fileType: 'image/png', id: 'file_A', name: 'a.png', size: 1, url: signedUrl },
        ]}
      />,
    );

    const src = container.querySelector('img')?.getAttribute('src');
    expect(src).toBe(`lobe-file-cache://file/file_A/a.png?src=${encodeURIComponent(signedUrl)}`);
  });
});
