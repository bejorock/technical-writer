/**
 * Google Drive Client
 *
 * Wrapper around Google Drive API for file and folder operations.
 */

import { drive_v3 } from "googleapis";
import type { GoogleDocsConfig } from "../../extensions/config";
import { getGoogleClients } from "./auth";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  size?: string;
}

export interface DriveListOptions {
  folderId?: string;
  mimeType?: string;
  query?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

export class DriveClient {
  private config: GoogleDocsConfig;
  private drive: drive_v3.Drive | null = null;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  private async getClient(): Promise<drive_v3.Drive> {
    if (!this.drive) {
      const { drive } = await getGoogleClients(this.config);
      this.drive = drive;
    }
    return this.drive;
  }

  /**
   * List files in a folder
   */
  async listFiles(options: DriveListOptions = {}): Promise<{
    files: DriveFile[];
    nextPageToken?: string;
  }> {
    const client = await this.getClient();

    const folderId = options.folderId || this.config.targetFolderId;
    let query = options.query || "";

    if (options.mimeType) {
      query = query
        ? `${query} and mimeType='${options.mimeType}'`
        : `mimeType='${options.mimeType}'`;
    }

    if (folderId) {
      query = query
        ? `${query} and '${folderId}' in parents`
        : `'${folderId}' in parents`;
    }

    // Add trashed filter if not already in query
    if (!query.includes('trashed')) {
      query = query ? `${query} and trashed = false` : 'trashed = false';
    }

    const response = await client.files.list({
      q: query,
      pageSize: options.pageSize || 100,
      pageToken: options.pageToken,
      orderBy: options.orderBy || "name",
      fields: "nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, parents, size)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const client = await this.getClient();

    const response = await client.files.get({
      fileId,
      fields: "id, name, mimeType, createdTime, modifiedTime, parents, size",
      supportsAllDrives: true,
    });

    return response.data as DriveFile;
  }

  /**
   * Create a new file
   */
  async createFile(
    name: string,
    mimeType: string,
    folderId?: string
  ): Promise<DriveFile> {
    const client = await this.getClient();

    const targetFolderId = folderId || this.config.targetFolderId;

    const response = await client.files.create({
      requestBody: {
        name,
        mimeType,
        parents: targetFolderId ? [targetFolderId] : undefined,
      },
      supportsAllDrives: true,
      fields: "id, name, mimeType, createdTime",
    });

    return response.data as DriveFile;
  }

  /**
   * Delete a file permanently
   */
  async deleteFile(fileId: string): Promise<void> {
    const client = await this.getClient();

    await client.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  }

  /**
   * Trash a file (move to bin)
   */
  async trashFile(fileId: string): Promise<void> {
    const client = await this.getClient();

    await client.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
      supportsAllDrives: true,
    });
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<void> {
    const client = await this.getClient();

    await client.files.update({
      fileId,
      requestBody: {
        name: newName,
      },
      supportsAllDrives: true,
    });
  }

  /**
   * Copy a file
   */
  async copyFile(
    fileId: string,
    name?: string,
    folderId?: string
  ): Promise<DriveFile> {
    const client = await this.getClient();

    const response = await client.files.copy({
      fileId,
      requestBody: {
        name,
        parents: folderId ? [folderId] : undefined,
      },
      supportsAllDrives: true,
    });

    return response.data as DriveFile;
  }

  /**
   * Move a file to another folder
   */
  async moveFile(fileId: string, targetFolderId: string): Promise<void> {
    const client = await this.getClient();

    // Get current parents
    const file = await this.getFile(fileId);
    const currentParents = file.parents?.join(",") || "";

    await client.files.update({
      fileId,
      addParents: targetFolderId,
      removeParents: currentParents,
      supportsAllDrives: true,
    });
  }

  /**
   * Create a folder
   */
  async createFolder(
    name: string,
    parentFolderId?: string
  ): Promise<DriveFile> {
    const client = await this.getClient();

    const targetParentId = parentFolderId || this.config.targetFolderId;

    const response = await client.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: targetParentId ? [targetParentId] : undefined,
      },
      supportsAllDrives: true,
      fields: "id, name, mimeType, createdTime",
    });

    return response.data as DriveFile;
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const client = await this.getClient();

    const response = await client.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Export Google Workspace file
   */
  async exportFile(
    fileId: string,
    mimeType: string
  ): Promise<Buffer> {
    const client = await this.getClient();

    const response = await client.files.export(
      {
        fileId,
        mimeType,
        supportsAllDrives: true,
      },
      {
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }
}
