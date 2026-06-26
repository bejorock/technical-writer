/**
 * Preview Module
 * 
 * Handles taking screenshots/previews of Google Docs and Sheets
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { GoogleDocsConfig } from "../extensions/config";
import { getGoogleClients } from "./clients/auth";
import { extractFileId, getDriveViewUrl } from "./utils";

export interface PreviewOptions {
  fileId: string;
  outputPath?: string;
  width?: number;
  height?: number;
  pages?: string; // e.g., "1" or "1,3,5" or "1-3"
}

export class PreviewClient {
  private config: GoogleDocsConfig;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  /**
   * Get a preview/thumbnail URL for a file
   * 
   * Google provides built-in thumbnails for Docs/Sheets:
   * - https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
   * - https://lh3.googleusercontent.com/d/FILE_ID=w400
   */
  async getPreviewUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }

  /**
   * Get the edit URL for a file (opens in browser)
   */
  async getEditUrl(fileId: string): Promise<string> {
    const { drive } = await getGoogleClients(this.config);
    
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType, webViewLink',
      supportsAllDrives: true,
    });

    return file.data.webViewLink || getDriveViewUrl(fileId, file.data.mimeType || undefined);
  }

  /**
   * Export document as PDF for preview
   */
  async exportForPreview(
    fileId: string,
    outputPath?: string
  ): Promise<string> {
    const { drive } = await getGoogleClients(this.config);

    // Get file info first
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'mimeType, name',
      supportsAllDrives: true,
    });

    const mimeType = fileInfo.data.mimeType || '';

    // Determine export MIME type
    let exportMimeType: string;
    if (mimeType.includes('document')) {
      exportMimeType = 'application/pdf';
    } else if (mimeType.includes('spreadsheet')) {
      exportMimeType = 'application/pdf';
    } else {
      throw new Error(`Cannot preview file type: ${mimeType}`);
    }

    // Export the file
    const response = await drive.files.export(
      {
        fileId,
        mimeType: exportMimeType,
        supportsAllDrives: true,
      },
      {
        responseType: 'arraybuffer',
      }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    
    // Save to output path
    const finalPath = outputPath || `./preview-${fileId}.pdf`;
    const dir = finalPath.substring(0, finalPath.lastIndexOf('/'));
    
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(finalPath, buffer);
    return finalPath;
  }

  /**
   * Convert a local PDF file to images
   */
  async convertPdfToImages(
    pdfPath: string,
    outputPath?: string,
    options?: {
      width?: number;
      height?: number;
      pages?: string;
      format?: 'png' | 'jpeg';
    }
  ): Promise<{ images: string[] }> {
    const { existsSync, readFileSync } = await import('node:fs');
    
    // Check if PDF exists
    if (!existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    // Create output directory
    const outputDir = outputPath || './pdf-images';
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Get filename without extension
    const fileName = pdfPath.split('/').pop()?.replace('.pdf', '') || 'document';
    
    // Convert PDF to images using pdf2pic
    const format = options?.format || 'png';
    const width = options?.width || 1200;
    const height = options?.height || 1600;
    
    try {
      const { fromPath } = await import('pdf2pic');
      
      const converter = fromPath(pdfPath, {
        density: 300,
        saveFilename: fileName,
        savePath: outputDir,
        format: format,
        width: width,
        height: height,
      });
      
      // Parse pages option
      let pageNums: number[] = [];
      if (options?.pages) {
        // Parse "1,3,5" or "1-3"
        const parts = options.pages.split(',');
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              pageNums.push(i);
            }
          } else {
            pageNums.push(parseInt(part));
          }
        }
      } else {
        // Default to page 1
        pageNums = [1];
      }
      
      // Convert specified pages
      const imagePaths: string[] = [];
      for (const pageNum of pageNums) {
        try {
          const result = await converter(pageNum, {
            responseType: 'base64',
          });
          
          if (result && result.base64) {
            // Save base64 as image file
            const imageBuffer = Buffer.from(result.base64, 'base64');
            const imagePath = join(outputDir, `${fileName}-page-${pageNum}.${format}`);
            writeFileSync(imagePath, imageBuffer);
            imagePaths.push(imagePath);
          }
        } catch (pageError) {
          console.error(`Failed to convert page ${pageNum}:`, pageError);
        }
      }
      
      return {
        images: imagePaths,
      };
      
    } catch (error: any) {
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Crop an image
   */
  async cropImage(
    imagePath: string,
    x: number,
    y: number,
    width: number,
    height: number,
    outputPath?: string
  ): Promise<{ outputPath: string }> {
    const sharp = (await import('sharp')).default;
    
    // Check if image exists
    if (!existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    // Determine output path
    const ext = imagePath.split('.').pop() || 'png';
    const fileName = imagePath.split('/').pop()?.replace(`.${ext}`, '') || 'image';
    const finalOutputPath = outputPath || `${fileName}-cropped.${ext}`;
    
    // Crop the image
    await sharp(imagePath)
      .extract({
        left: x,
        top: y,
        width: width,
        height: height,
      })
      .toFile(finalOutputPath);
    
    return { outputPath: finalOutputPath };
  }

  /**
   * Get a direct link to view the file in Google Drive
   */
  async getDirectLink(fileId: string): Promise<string> {
    const { drive } = await getGoogleClients(this.config);
    
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType',
      supportsAllDrives: true,
    });

    return getDriveViewUrl(fileId, file.data.mimeType || undefined);
  }
}
