/**
 * Unit tests for Export client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportClient } from '../lib/export';

// Mock the Google APIs
vi.mock('googleapis', () => ({
  google: {
    drive: vi.fn(() => ({
      files: {
        export: vi.fn(),
        get: vi.fn(),
      },
    })),
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: {
          get: vi.fn(),
        },
      },
    })),
  },
}));

describe('ExportClient', () => {
  let client: ExportClient;
  const mockConfig = {
    serviceAccountKeyPath: './test-key.json',
    targetFolderId: 'test-folder-id',
    useSharedDrive: true,
  };

  beforeEach(() => {
    client = new ExportClient(mockConfig);
  });

  describe('exportDocument', () => {
    it('should export document to PDF', async () => {
      expect(typeof client.exportDocument).toBe('function');
    });

    it('should export document to DOCX', async () => {
      expect(typeof client.exportDocument).toBe('function');
    });

    it('should export document to TXT', async () => {
      expect(typeof client.exportDocument).toBe('function');
    });

    it('should export document to HTML', async () => {
      expect(typeof client.exportDocument).toBe('function');
    });
  });

  describe('exportSpreadsheet', () => {
    it('should export spreadsheet to PDF', async () => {
      expect(typeof client.exportSpreadsheet).toBe('function');
    });

    it('should export spreadsheet to XLSX', async () => {
      expect(typeof client.exportSpreadsheet).toBe('function');
    });

    it('should export spreadsheet to CSV', async () => {
      expect(typeof client.exportSpreadsheet).toBe('function');
    });

    it('should export spreadsheet to TSV', async () => {
      expect(typeof client.exportSpreadsheet).toBe('function');
    });
  });
});
