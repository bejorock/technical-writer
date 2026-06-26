/**
 * Export Module
 *
 * Handles downloading and exporting Google Docs and Sheets in various formats.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { GoogleDocsConfig } from "../../extensions/config";
import { getGoogleClients } from "../clients/auth";

export class ExportClient {
  private config: GoogleDocsConfig;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  /**
   * Export Google Doc to various formats
   */
  async exportDocument(
    documentId: string,
    format: "pdf" | "docx" | "txt" | "html",
    outputPath?: string
  ): Promise<string> {
    const { drive } = await getGoogleClients(this.config);

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      html: "text/html",
    };

    const mimeType = mimeTypes[format];
    if (!mimeType) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const response = await drive.files.export(
      {
        fileId: documentId,
        mimeType,
      },
      {
        responseType: "arraybuffer",
      }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // Determine output path
    const finalPath = outputPath || `./export-${documentId}.${format}`;
    const dir = finalPath.substring(0, finalPath.lastIndexOf("/"));

    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(finalPath, buffer);
    return finalPath;
  }

  /**
   * Export Google Sheet to various formats
   */
  async exportSpreadsheet(
    spreadsheetId: string,
    format: "pdf" | "xlsx" | "csv" | "tsv",
    sheetId?: number,
    outputPath?: string
  ): Promise<string> {
    const { drive } = await getGoogleClients(this.config);

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      tsv: "text/tab-separated-values",
    };

    const mimeType = mimeTypes[format];
    if (!mimeType) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const exportOptions: any = {
      fileId: spreadsheetId,
      mimeType,
    };

    // For specific sheet export, use Sheets API
    if (sheetId !== undefined && (format === "csv" || format === "tsv")) {
      const { sheets } = await getGoogleClients(this.config);
      // Get sheet name first
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties"
      });
      const sheet = spreadsheet.data.sheets?.find(s => s.properties?.sheetId === sheetId);
      const sheetName = sheet?.properties?.title || "Sheet1";
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const values = response.data.values || [];
      const delimiter = format === "csv" ? "," : "\t";
      const content = values.map((row) => row.join(delimiter)).join("\n");

      const finalPath = outputPath || `./export-${spreadsheetId}-${sheetId}.${format}`;
      const dir = finalPath.substring(0, finalPath.lastIndexOf("/"));

      if (dir && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(finalPath, content, "utf-8");
      return finalPath;
    }

    const response = await drive.files.export(
      exportOptions,
      {
        responseType: "arraybuffer",
      }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    const finalPath = outputPath || `./export-${spreadsheetId}.${format}`;
    const dir = finalPath.substring(0, finalPath.lastIndexOf("/"));

    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(finalPath, buffer);
    return finalPath;
  }
}
