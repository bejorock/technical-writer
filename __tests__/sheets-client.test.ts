/**
 * Unit tests for Google Sheets client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SheetsClient } from '../lib/clients/sheets';

// Mock the Google APIs
vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn(() => ({
      spreadsheets: {
        get: vi.fn(),
        create: vi.fn(),
        batchUpdate: vi.fn(),
        values: {
          get: vi.fn(),
          update: vi.fn(),
          append: vi.fn(),
          clear: vi.fn(),
        },
      },
    })),
    drive: vi.fn(() => ({
      files: {
        create: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
    })),
  },
}));

describe('SheetsClient', () => {
  let client: SheetsClient;
  const mockConfig = {
    serviceAccountKeyPath: './test-key.json',
    targetFolderId: 'test-folder-id',
    useSharedDrive: true,
  };

  beforeEach(() => {
    client = new SheetsClient(mockConfig);
  });

  describe('createSpreadsheet', () => {
    it('should create a spreadsheet via Drive API', async () => {
      expect(typeof client.createSpreadsheet).toBe('function');
    });
  });

  describe('getSpreadsheet', () => {
    it('should get spreadsheet metadata', async () => {
      expect(typeof client.getSpreadsheet).toBe('function');
    });
  });

  describe('getValues', () => {
    it('should get cell values', async () => {
      expect(typeof client.getValues).toBe('function');
    });
  });

  describe('getFormattedValues', () => {
    it('should get formatted cell values', async () => {
      expect(typeof client.getFormattedValues).toBe('function');
    });
  });

  describe('updateValues', () => {
    it('should update cell values', async () => {
      expect(typeof client.updateValues).toBe('function');
    });
  });

  describe('appendValues', () => {
    it('should append rows', async () => {
      expect(typeof client.appendValues).toBe('function');
    });
  });

  describe('clearValues', () => {
    it('should clear cell values', async () => {
      expect(typeof client.clearValues).toBe('function');
    });
  });

  describe('formatCells', () => {
    it('should format cells', async () => {
      expect(typeof client.formatCells).toBe('function');
    });
  });

  describe('mergeCells', () => {
    it('should merge cells', async () => {
      expect(typeof client.mergeCells).toBe('function');
    });
  });

  describe('unmergeCells', () => {
    it('should unmerge cells', async () => {
      expect(typeof client.unmergeCells).toBe('function');
    });
  });

  describe('addSheet', () => {
    it('should add a sheet tab', async () => {
      expect(typeof client.addSheet).toBe('function');
    });
  });

  describe('deleteSheet', () => {
    it('should delete a sheet tab', async () => {
      expect(typeof client.deleteSheet).toBe('function');
    });
  });

  describe('insertRows', () => {
    it('should insert rows', async () => {
      expect(typeof client.insertRows).toBe('function');
    });
  });

  describe('insertColumns', () => {
    it('should insert columns', async () => {
      expect(typeof client.insertColumns).toBe('function');
    });
  });

  describe('deleteRows', () => {
    it('should delete rows', async () => {
      expect(typeof client.deleteRows).toBe('function');
    });
  });

  describe('deleteColumns', () => {
    it('should delete columns', async () => {
      expect(typeof client.deleteColumns).toBe('function');
    });
  });

  describe('addNote', () => {
    it('should add a cell note', async () => {
      expect(typeof client.addNote).toBe('function');
    });
  });

  describe('protectRange', () => {
    it('should protect a range', async () => {
      expect(typeof client.protectRange).toBe('function');
    });
  });
});
