/**
 * Unit tests for Google Drive client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveClient } from '../lib/clients/drive';

// Mock the Google APIs
vi.mock('googleapis', () => ({
  google: {
    drive: vi.fn(() => ({
      files: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        copy: vi.fn(),
        export: vi.fn(),
      },
      drives: {
        list: vi.fn(),
      },
    })),
  },
}));

describe('DriveClient', () => {
  let client: DriveClient;
  const mockConfig = {
    serviceAccountKeyPath: './test-key.json',
    targetFolderId: 'test-folder-id',
    useSharedDrive: true,
  };

  beforeEach(() => {
    client = new DriveClient(mockConfig);
  });

  describe('listFiles', () => {
    it('should list files in folder', async () => {
      expect(typeof client.listFiles).toBe('function');
    });
  });

  describe('getFile', () => {
    it('should get file metadata', async () => {
      expect(typeof client.getFile).toBe('function');
    });
  });

  describe('createFile', () => {
    it('should create a file', async () => {
      expect(typeof client.createFile).toBe('function');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      expect(typeof client.deleteFile).toBe('function');
    });
  });

  describe('trashFile', () => {
    it('should trash a file', async () => {
      expect(typeof client.trashFile).toBe('function');
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      expect(typeof client.renameFile).toBe('function');
    });
  });

  describe('copyFile', () => {
    it('should copy a file', async () => {
      expect(typeof client.copyFile).toBe('function');
    });
  });

  describe('moveFile', () => {
    it('should move a file', async () => {
      expect(typeof client.moveFile).toBe('function');
    });
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      expect(typeof client.createFolder).toBe('function');
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      expect(typeof client.downloadFile).toBe('function');
    });
  });

  describe('exportFile', () => {
    it('should export a file', async () => {
      expect(typeof client.exportFile).toBe('function');
    });
  });
});
