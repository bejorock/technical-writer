/**
 * Utility functions for the extension
 */

/**
 * Extract Google Drive folder ID from a URL or return the ID directly
 * 
 * Supported formats:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/1/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - Just the folder ID: FOLDER_ID
 * 
 * @param input - URL or folder ID
 * @returns The extracted folder ID
 */
export function extractFolderId(input: string): string {
  if (!input) {
    throw new Error("Folder ID or URL is required");
  }

  // Trim whitespace
  const trimmed = input.trim();

  // If it's just an ID (no slashes, no dots)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && !trimmed.includes('.')) {
    return trimmed;
  }

  // Try to extract from URL patterns
  // Pattern 1: /drive/folders/FOLDER_ID
  const folderMatch = trimmed.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return folderMatch[1];
  }

  // Pattern 2: /drive/folders/FOLDER_ID with query params
  const folderMatchWithQuery = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatchWithQuery) {
    return folderMatchWithQuery[1];
  }

  // Pattern 3: Direct ID (might have already been caught above)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error(`Could not extract folder ID from: ${input}\n\nExpected format:\n- https://drive.google.com/drive/folders/FOLDER_ID\n- or just the folder ID`);
}

/**
 * Extract Google Drive file ID from a URL or return the ID directly
 * 
 * Supported formats:
 * - https://docs.google.com/document/d/FILE_ID/edit
 * - https://docs.google.com/spreadsheets/d/FILE_ID/edit
 * - https://drive.google.com/file/d/FILE_ID/view
 * - Just the file ID: FILE_ID
 * 
 * @param input - URL or file ID
 * @returns The extracted file ID
 */
export function extractFileId(input: string): string {
  if (!input) {
    throw new Error("File ID or URL is required");
  }

  const trimmed = input.trim();

  // If it's just an ID (no slashes, no dots)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && !trimmed.includes('.')) {
    return trimmed;
  }

  // Pattern 1: /document/d/FILE_ID
  const docMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    return docMatch[1];
  }

  // Pattern 2: /spreadsheets/d/FILE_ID
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) {
    return sheetMatch[1];
  }

  // Pattern 3: /file/d/FILE_ID
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }

  // Pattern 4: Direct ID (might have already been caught above)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error(`Could not extract file ID from: ${input}\n\nExpected format:\n- https://docs.google.com/document/d/FILE_ID/edit\n- https://docs.google.com/spreadsheets/d/FILE_ID/edit\n- or just the file ID`);
}

/**
 * Get the Google Drive view URL for a file
 * 
 * @param fileId - The file ID
 * @param mimeType - The file MIME type
 * @returns The view URL
 */
export function getDriveViewUrl(fileId: string, mimeType?: string): string {
  if (mimeType?.includes('document')) {
    return `https://docs.google.com/document/d/${fileId}/edit`;
  }
  if (mimeType?.includes('spreadsheet')) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  }
  if (mimeType?.includes('presentation')) {
    return `https://docs.google.com/presentation/d/${fileId}/edit`;
  }
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Get the Google Drive view URL for a folder
 * 
 * @param folderId - The folder ID
 * @returns The view URL
 */
export function getFolderViewUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
