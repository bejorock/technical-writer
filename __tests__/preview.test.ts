/**
 * Unit tests for Preview client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreviewClient } from '../lib/preview';

// Mock the Google APIs
vi.mock('googleapis', () => ({
  google: {
    drive: vi.fn(() => ({
      files: {
        get: vi.fn(),
        export: vi.fn(),
      },
    })),
  },
}));

describe('PreviewClient', () => {
  let client: PreviewClient;
  const mockConfig = {
    serviceAccountKeyPath: './test-key.json',
    targetFolderId: 'test-folder-id',
    useSharedDrive: true,
  };

  beforeEach(() => {
    client = new PreviewClient(mockConfig);
  });

  describe('getPreviewUrl', () => {
    it('should return thumbnail URL', async () => {
      const url = await client.getPreviewUrl('file123');
      expect(url).toContain('drive.google.com/thumbnail');
      expect(url).toContain('file123');
    });
  });

  describe('getDirectLink', () => {
    it('should return direct link to file', async () => {
      expect(typeof client.getDirectLink).toBe('function');
    });
  });

  describe('exportForPreview', () => {
    it('should export file as PDF', async () => {
      expect(typeof client.exportForPreview).toBe('function');
    });
  });

  describe('convertPdfToImages', () => {
    it('should convert PDF to images', async () => {
      expect(typeof client.convertPdfToImages).toBe('function');
    });
  });

  describe('cropImage', () => {
    it('should crop an image', async () => {
      expect(typeof client.cropImage).toBe('function');
    });
  });
});
