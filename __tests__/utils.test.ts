/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { extractFolderId, extractFileId, getDriveViewUrl, getFolderViewUrl } from '../lib/utils';

describe('extractFolderId', () => {
  it('should extract folder ID from direct ID', () => {
    expect(extractFolderId('0AHAPdW0qB70bUk9PVA')).toBe('0AHAPdW0qB70bUk9PVA');
  });

  it('should extract folder ID from Google Drive URL', () => {
    expect(extractFolderId('https://drive.google.com/drive/folders/0AHAPdW0qB70bUk9PVA'))
      .toBe('0AHAPdW0qB70bUk9PVA');
  });

  it('should extract folder ID from URL with user index', () => {
    expect(extractFolderId('https://drive.google.com/drive/u/1/folders/0AHAPdW0qB70bUk9PVA'))
      .toBe('0AHAPdW0qB70bUk9PVA');
  });

  it('should extract folder ID from URL with query params', () => {
    expect(extractFolderId('https://drive.google.com/drive/folders/0AHAPdW0qB70bUk9PVA?usp=sharing'))
      .toBe('0AHAPdW0qB70bUk9PVA');
  });

  it('should throw error for empty input', () => {
    expect(() => extractFolderId('')).toThrow('Folder ID or URL is required');
  });

  it('should throw error for invalid format', () => {
    expect(() => extractFolderId('https://example.com/not-a-folder'))
      .toThrow('Could not extract folder ID');
  });
});

describe('extractFileId', () => {
  it('should extract file ID from direct ID', () => {
    expect(extractFileId('1abc123def456')).toBe('1abc123def456');
  });

  it('should extract file ID from Google Docs URL', () => {
    expect(extractFileId('https://docs.google.com/document/d/1abc123/edit'))
      .toBe('1abc123');
  });

  it('should extract file ID from Google Sheets URL', () => {
    expect(extractFileId('https://docs.google.com/spreadsheets/d/1xyz789/edit'))
      .toBe('1xyz789');
  });

  it('should extract file ID from Drive file URL', () => {
    expect(extractFileId('https://drive.google.com/file/d/1file123/view'))
      .toBe('1file123');
  });

  it('should throw error for empty input', () => {
    expect(() => extractFileId('')).toThrow('File ID or URL is required');
  });
});

describe('getDriveViewUrl', () => {
  it('should return Docs URL for document', () => {
    expect(getDriveViewUrl('abc123', 'application/vnd.google-apps.document'))
      .toBe('https://docs.google.com/document/d/abc123/edit');
  });

  it('should return Sheets URL for spreadsheet', () => {
    expect(getDriveViewUrl('xyz789', 'application/vnd.google-apps.spreadsheet'))
      .toBe('https://docs.google.com/spreadsheets/d/xyz789/edit');
  });

  it('return Drive URL for other files', () => {
    expect(getDriveViewUrl('file123', 'application/pdf'))
      .toBe('https://drive.google.com/file/d/file123/view');
  });
});

describe('getFolderViewUrl', () => {
  it('should return folder URL', () => {
    expect(getFolderViewUrl('folder123'))
      .toBe('https://drive.google.com/drive/folders/folder123');
  });
});
