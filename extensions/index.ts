/**
 * Technical Writer Extension - Main Entry Point
 *
 * A pi agent extension for Google Docs and Sheets integration.
 * Provides tools and commands for document and spreadsheet management.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  loadConfig,
  saveConfig,
  validateConfig,
  registerConfigCommands,
} from "./config";
import { DocsClient } from "../lib/clients/docs";
import { SheetsClient } from "../lib/clients/sheets";
import { DriveClient } from "../lib/clients/drive";
import { ExportClient } from "../lib/export";
import { PreviewClient } from "../lib/preview";
import { extractFolderId, extractFileId } from "../lib/utils";

// Client instances with config tracking
let currentConfigHash: string | null = null;
let docsClient: DocsClient | null = null;
let sheetsClient: SheetsClient | null = null;
let driveClient: DriveClient | null = null;
let exportClient: ExportClient | null = null;
let previewClient: PreviewClient | null = null;

function getClients(cwd: string) {
  const config = loadConfig(cwd);
  if (!config) {
    throw new Error(
      "Google Docs extension not configured. Run /google-config set key-path <path> and /google-config set folder-id <id>"
    );
  }

  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(", ")}`);
  }

  // Create a config hash to detect changes
  const configHash = `${config.serviceAccountKeyPath}:${config.targetFolderId}`;

  // Recreate clients if config changed
  if (configHash !== currentConfigHash) {
    docsClient = new DocsClient(config);
    sheetsClient = new SheetsClient(config);
    driveClient = new DriveClient(config);
    exportClient = new ExportClient(config);
    previewClient = new PreviewClient(config);
    currentConfigHash = configHash;
  }

  return { docsClient: docsClient!, sheetsClient: sheetsClient!, driveClient: driveClient!, exportClient: exportClient!, previewClient: previewClient!, config };
}

export default function (pi: ExtensionAPI) {
  // Register configuration commands
  registerConfigCommands(pi);

  // Subscribe to session start
  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig(ctx.cwd);
    if (config) {
      ctx.ui.notify("Google Docs extension loaded", "info");
    } else {
      ctx.ui.notify(
        "Google Docs extension loaded (not configured - run /google-config)",
        "info"
      );
    }
  });

  // Clean up on shutdown
  pi.on("session_shutdown", async (_event, _ctx) => {
    docsClient = null;
    sheetsClient = null;
    driveClient = null;
    exportClient = null;
    previewClient = null;
    currentConfigHash = null;
  });

  // Register Google Docs tool
  pi.registerTool({
    name: "google_docs",
    label: "Google Docs",
    description:
      "Create, read, update, and manage Google Docs documents",
    promptSnippet:
      "Create, read, update, and manage Google Docs documents",
    promptGuidelines: [
      "Use google_docs when the user asks to work with Google Docs documents.",
      "Supports operations: create, get, list, delete, rename, insert_text, append_text, find_replace, format_text, insert_table, insert_paragraph.",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("create"),
          Type.Literal("get"),
          Type.Literal("list"),
          Type.Literal("delete"),
          Type.Literal("rename"),
          Type.Literal("insert_text"),
          Type.Literal("append_text"),
          Type.Literal("find_replace"),
          Type.Literal("format_text"),
          Type.Literal("insert_table"),
          Type.Literal("insert_paragraph"),
        ],
        { description: "Operation to perform" }
      ),
      documentId: Type.Optional(
        Type.String({ description: "Document ID (required for most operations)" })
      ),
      title: Type.Optional(
        Type.String({ description: "Document title (for create/rename)" })
      ),
      text: Type.Optional(
        Type.String({ description: "Text content" })
      ),
      index: Type.Optional(
        Type.Number({ description: "Position index" })
      ),
      findText: Type.Optional(
        Type.String({ description: "Text to find (for find_replace)" })
      ),
      replaceText: Type.Optional(
        Type.String({ description: "Replacement text (for find_replace)" })
      ),
      startIndex: Type.Optional(
        Type.Number({ description: "Start index for range operations" })
      ),
      endIndex: Type.Optional(
        Type.Number({ description: "End index for range operations" })
      ),
      rows: Type.Optional(
        Type.Number({ description: "Number of rows (for insert_table)" })
      ),
      columns: Type.Optional(
        Type.Number({ description: "Number of columns (for insert_table)" })
      ),
      style: Type.Optional(
        Type.String({ description: "Paragraph style (for insert_paragraph)" })
      ),
      formatOptions: Type.Optional(
        Type.Object({
          bold: Type.Optional(Type.Boolean({ description: "Apply bold formatting" })),
          italic: Type.Optional(Type.Boolean({ description: "Apply italic formatting" })),
          underline: Type.Optional(Type.Boolean({ description: "Apply underline formatting" })),
          strikethrough: Type.Optional(Type.Boolean({ description: "Apply strikethrough formatting" })),
          fontFamily: Type.Optional(Type.String({ description: "Font family" })),
          fontSize: Type.Optional(Type.Number({ description: "Font size in points" })),
          foregroundColor: Type.Optional(Type.String({ description: "Text color (hex or rgb)" })),
          backgroundColor: Type.Optional(Type.String({ description: "Background highlight color" })),
        }, { description: "Formatting options" })
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { docsClient, driveClient, config } = getClients(ctx.cwd);

        switch (params.operation) {
          case "create": {
            if (!params.title) {
              return {
                content: [{ type: "text", text: "Error: title is required" }],
                isError: true,
              };
            }
            const folderId = extractFolderId(config.targetFolderId);
            const doc = await docsClient.createDocument(params.title, folderId);
            return {
              content: [
                {
                  type: "text",
                  text: `Created document: ${doc.documentId}\nTitle: ${doc.title}`,
                },
              ],
              details: { documentId: doc.documentId, title: doc.title },
            };
          }

          case "get": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const doc = await docsClient.getDocument(params.documentId);
            const text = await docsClient.getDocumentText(params.documentId);
            return {
              content: [
                {
                  type: "text",
                  text: `Document: ${doc.title}\nID: ${doc.documentId}\n\nContent:\n${text}`,
                },
              ],
              details: { document: doc, text },
            };
          }

          case "list": {
            const { driveClient: dc1 } = getClients(ctx.cwd);
            const { files } = await dc1.listFiles({
              mimeType:
                "application/vnd.google-apps.document",
            });
            const docList = files
              .map((f) => `- ${f.name} (${f.id})`)
              .join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Documents:\n${docList || "No documents found"}`,
                },
              ],
              details: { documents: files },
            };
          }

          case "delete": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const fileId = extractFileId(params.documentId);
            const { driveClient: dc2 } = getClients(ctx.cwd);
            await dc2.deleteFile(fileId);
            return {
              content: [
                { type: "text", text: `Deleted document: ${params.documentId}` },
              ],
            };
          }

          case "rename": {
            if (!params.documentId || !params.title) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId and title are required",
                  },
                ],
                isError: true,
              };
            }
            const renameId = extractFileId(params.documentId);
            await docsClient.renameDocument(renameId, params.title);
            return {
              content: [
                {
                  type: "text",
                  text: `Renamed document ${params.documentId} to: ${params.title}`,
                },
              ],
            };
          }

          case "insert_text": {
            if (!params.documentId || params.text === undefined || params.index === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, text, and index are required",
                  },
                ],
                isError: true,
              };
            }
            const insertId = extractFileId(params.documentId);
            await docsClient.insertText(
              insertId,
              params.text,
              params.index
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Inserted text at position ${params.index}`,
                },
              ],
            };
          }

          case "append_text": {
            if (!params.documentId || params.text === undefined) {
              return {
                content: [
                  { type: "text", text: "Error: documentId and text are required" },
                ],
                isError: true,
              };
            }
            const appendId = extractFileId(params.documentId);
            await docsClient.appendText(appendId, params.text);
            return {
              content: [
                { type: "text", text: "Appended text to document" },
              ],
            };
          }

          case "find_replace": {
            if (!params.documentId || !params.findText || params.replaceText === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, findText, and replaceText are required",
                  },
                ],
                isError: true,
              };
            }
            const findId = extractFileId(params.documentId);
            const result = await docsClient.findAndReplace(
              findId,
              params.findText,
              params.replaceText
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Replaced ${result.replacements} occurrences`,
                },
              ],
              details: result,
            };
          }

          case "format_text": {
            if (!params.documentId || params.startIndex === undefined || params.endIndex === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, startIndex, and endIndex are required",
                  },
                ],
                isError: true,
              };
            }
            const formatOptions = params.formatOptions || { bold: true };
            const formatId = extractFileId(params.documentId);
            await docsClient.formatText(
              formatId,
              params.startIndex,
              params.endIndex,
              formatOptions
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Formatted text from ${params.startIndex} to ${params.endIndex}`,
                },
              ],
            };
          }

          case "insert_table": {
            if (!params.documentId || !params.rows || !params.columns || params.index === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, rows, columns, and index are required",
                  },
                ],
                isError: true,
              };
            }
            const tableId = extractFileId(params.documentId);
            await docsClient.insertTable(
              tableId,
              params.rows,
              params.columns,
              params.index
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Inserted ${params.rows}x${params.columns} table`,
                },
              ],
            };
          }

          case "insert_paragraph": {
            if (!params.documentId || params.text === undefined || params.index === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, text, and index are required",
                  },
                ],
                isError: true,
              };
            }
            const paraId = extractFileId(params.documentId);
            await docsClient.insertParagraph(
              paraId,
              params.text,
              params.index,
              params.style
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Inserted paragraph with style: ${params.style || "normal"}`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                { type: "text", text: `Unknown operation: ${params.operation}` },
              ],
              isError: true,
            };
        }
      } catch (error: any) {
        // Provide helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('permission')) {
          errorMessage += '\n\nTip: Make sure the service account has access to the Shared Drive and the folder.';
        }
        if (error.message.includes('quota')) {
          errorMessage += '\n\nTip: Service accounts require Shared Drives. Personal drives are not supported.';
        }
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  });

  // Register Google Sheets tool
  pi.registerTool({
    name: "google_sheets",
    label: "Google Sheets",
    description:
      "Create, read, update, and manage Google Sheets spreadsheets",
    promptSnippet:
      "Create, read, update, and manage Google Sheets spreadsheets",
    promptGuidelines: [
      "Use google_sheets when the user asks to work with Google Sheets spreadsheets.",
      "Supports operations: create, get, list, delete, read_range, write_range, append_rows, format_cells, add_sheet, delete_sheet.",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("create"),
          Type.Literal("get"),
          Type.Literal("list"),
          Type.Literal("delete"),
          Type.Literal("read_range"),
          Type.Literal("write_range"),
          Type.Literal("append_rows"),
          Type.Literal("format_cells"),
          Type.Literal("add_sheet"),
          Type.Literal("delete_sheet"),
        ],
        { description: "Operation to perform" }
      ),
      spreadsheetId: Type.Optional(
        Type.String({ description: "Spreadsheet ID" })
      ),
      title: Type.Optional(
        Type.String({ description: "Spreadsheet title (for create)" })
      ),
      range: Type.Optional(
        Type.String({ description: "Cell range in A1 notation (e.g., A1:B10)" })
      ),
      values: Type.Optional(
        Type.Array(Type.Array(Type.Any()), {
          description: "2D array of values (for write_range)",
        })
      ),
      sheetName: Type.Optional(
        Type.String({ description: "Sheet tab name (for add_sheet)" })
      ),
      sheetId: Type.Optional(
        Type.Number({ description: "Sheet ID (for delete_sheet)" })
      ),
      formatOptions: Type.Optional(
        Type.Object({
          backgroundColor: Type.Optional(Type.String({ description: "Cell background color (hex or rgb)" })),
          bold: Type.Optional(Type.Boolean({ description: "Apply bold formatting" })),
          italic: Type.Optional(Type.Boolean({ description: "Apply italic formatting" })),
          fontFamily: Type.Optional(Type.String({ description: "Font family" })),
          fontSize: Type.Optional(Type.Number({ description: "Font size in points" })),
          foregroundColor: Type.Optional(Type.String({ description: "Text color (hex or rgb)" })),
          horizontalAlignment: Type.Optional(
            Type.Union(
              [Type.Literal("LEFT"), Type.Literal("CENTER"), Type.Literal("RIGHT")],
              { description: "Horizontal alignment" }
            )
          ),
        }, { description: "Formatting options" })
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { sheetsClient, driveClient, config } = getClients(ctx.cwd);

        switch (params.operation) {
          case "create": {
            if (!params.title) {
              return {
                content: [{ type: "text", text: "Error: title is required" }],
                isError: true,
              };
            }
            const folderId = extractFolderId(config.targetFolderId);
            const sheet = await sheetsClient.createSpreadsheet(params.title, folderId);
            return {
              content: [
                {
                  type: "text",
                  text: `Created spreadsheet: ${sheet.spreadsheetId}\nTitle: ${sheet.properties?.title}`,
                },
              ],
              details: { spreadsheetId: sheet.spreadsheetId },
            };
          }

          case "get": {
            if (!params.spreadsheetId) {
              return {
                content: [
                  { type: "text", text: "Error: spreadsheetId is required" },
                ],
                isError: true,
              };
            }
            const sheet = await sheetsClient.getSpreadsheet(
              params.spreadsheetId
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Spreadsheet: ${sheet.properties?.title}\nSheets: ${sheet.sheets?.map((s) => s.properties?.title).join(", ")}`,
                },
              ],
              details: { spreadsheet: sheet },
            };
          }

          case "list": {
            const { files } = await driveClient.listFiles({
              mimeType:
                "application/vnd.google-apps.spreadsheet",
            });
            const sheetList = files
              .map((f) => `- ${f.name} (${f.id})`)
              .join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Spreadsheets:\n${sheetList || "No spreadsheets found"}`,
                },
              ],
              details: { spreadsheets: files },
            };
          }

          case "delete": {
            if (!params.spreadsheetId) {
              return {
                content: [
                  { type: "text", text: "Error: spreadsheetId is required" },
                ],
                isError: true,
              };
            }
            await driveClient.deleteFile(params.spreadsheetId);
            return {
              content: [
                {
                  type: "text",
                  text: `Deleted spreadsheet: ${params.spreadsheetId}`,
                },
              ],
            };
          }

          case "read_range": {
            if (!params.spreadsheetId || !params.range) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId and range are required",
                  },
                ],
                isError: true,
              };
            }
            const values = await sheetsClient.getValues(
              params.spreadsheetId,
              params.range
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Values:\n${JSON.stringify(values, null, 2)}`,
                },
              ],
              details: { values },
            };
          }

          case "write_range": {
            if (!params.spreadsheetId || !params.range || !params.values) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId, range, and values are required",
                  },
                ],
                isError: true,
              };
            }
            const result = await sheetsClient.updateValues(
              params.spreadsheetId,
              params.range,
              params.values
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Updated ${result.updatedCells} cells`,
                },
              ],
              details: result,
            };
          }

          case "append_rows": {
            if (!params.spreadsheetId || !params.range || !params.values) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId, range, and values are required",
                  },
                ],
                isError: true,
              };
            }
            const result = await sheetsClient.appendValues(
              params.spreadsheetId,
              params.range,
              params.values
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Appended ${result.updatedCells} cells`,
                },
              ],
              details: result,
            };
          }

          case "format_cells": {
            if (!params.spreadsheetId || !params.range) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId and range are required",
                  },
                ],
                isError: true,
              };
            }
            const sheetFormatOptions = params.formatOptions || { bold: true };
            await sheetsClient.formatCells(params.spreadsheetId, params.range, {
              backgroundColor: sheetFormatOptions.backgroundColor,
              textFormat: {
                bold: sheetFormatOptions.bold,
                italic: sheetFormatOptions.italic,
                fontFamily: sheetFormatOptions.fontFamily,
                fontSize: sheetFormatOptions.fontSize,
                foregroundColor: sheetFormatOptions.foregroundColor,
              },
              horizontalAlignment: sheetFormatOptions.horizontalAlignment,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `Formatted cells in range ${params.range}`,
                },
              ],
            };
          }

          case "add_sheet": {
            if (!params.spreadsheetId || !params.sheetName) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId and sheetName are required",
                  },
                ],
                isError: true,
              };
            }
            const sheetId = await sheetsClient.addSheet(
              params.spreadsheetId,
              params.sheetName
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Added sheet: ${params.sheetName} (ID: ${sheetId})`,
                },
              ],
              details: { sheetId },
            };
          }

          case "delete_sheet": {
            if (!params.spreadsheetId || params.sheetId === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: spreadsheetId and sheetId are required",
                  },
                ],
                isError: true,
              };
            }
            await sheetsClient.deleteSheet(params.spreadsheetId, params.sheetId);
            return {
              content: [
                {
                  type: "text",
                  text: `Deleted sheet ID: ${params.sheetId}`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                { type: "text", text: `Unknown operation: ${params.operation}` },
              ],
              isError: true,
            };
        }
      } catch (error: any) {
        // Provide helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('permission')) {
          errorMessage += '\n\nTip: Make sure the service account has access to the Shared Drive.';
        }
        if (error.message.includes('quota')) {
          errorMessage += '\n\nTip: Service accounts require Shared Drives. Personal drives are not supported.';
        }
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  });

  // Register Google Drive tool
  pi.registerTool({
    name: "google_drive",
    label: "Google Drive",
    description: "Manage Google Drive files and folders",
    promptSnippet: "Manage Google Drive files and folders",
    promptGuidelines: [
      "Use google_drive when the user asks to work with Google Drive files and folders.",
      "Supports operations: list, create_folder, delete, move, copy, rename.",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("list"),
          Type.Literal("create_folder"),
          Type.Literal("delete"),
          Type.Literal("move"),
          Type.Literal("copy"),
          Type.Literal("rename"),
        ],
        { description: "Operation to perform" }
      ),
      fileId: Type.Optional(
        Type.String({ description: "File/folder ID" })
      ),
      name: Type.Optional(
        Type.String({ description: "File/folder name" })
      ),
      targetFolderId: Type.Optional(
        Type.String({ description: "Target folder ID" })
      ),
      pageToken: Type.Optional(
        Type.String({ description: "Page token for pagination" })
      ),
      pageSize: Type.Optional(
        Type.Number({ description: "Number of results per page (default 100)" })
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { driveClient } = getClients(ctx.cwd);

        switch (params.operation) {
          case "list": {
            const { files, nextPageToken } = await driveClient.listFiles({
              pageToken: params.pageToken,
              pageSize: params.pageSize,
            });
            const fileList = files
              .map((f) => `- ${f.name} (${f.id}) [${f.mimeType}]`)
              .join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Files:\n${fileList || "No files found"}${nextPageToken ? `\n\nMore results available. Use pageToken: ${nextPageToken}` : ""}`,
                },
              ],
              details: { files, nextPageToken },
            };
          }

          case "create_folder": {
            if (!params.name) {
              return {
                content: [{ type: "text", text: "Error: name is required" }],
                isError: true,
              };
            }
            const folder = await driveClient.createFolder(
              params.name,
              params.targetFolderId
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Created folder: ${folder.name}\nID: ${folder.id}`,
                },
              ],
              details: { folderId: folder.id },
            };
          }

          case "delete": {
            if (!params.fileId) {
              return {
                content: [{ type: "text", text: "Error: fileId is required" }],
                isError: true,
              };
            }
            await driveClient.deleteFile(params.fileId);
            return {
              content: [
                {
                  type: "text",
                  text: `Deleted file: ${params.fileId}`,
                },
              ],
            };
          }

          case "move": {
            if (!params.fileId || !params.targetFolderId) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: fileId and targetFolderId are required",
                  },
                ],
                isError: true,
              };
            }
            await driveClient.moveFile(params.fileId, params.targetFolderId);
            return {
              content: [
                {
                  type: "text",
                  text: `Moved file ${params.fileId} to folder ${params.targetFolderId}`,
                },
              ],
            };
          }

          case "copy": {
            if (!params.fileId) {
              return {
                content: [{ type: "text", text: "Error: fileId is required" }],
                isError: true,
              };
            }
            const copy = await driveClient.copyFile(
              params.fileId,
              params.name,
              params.targetFolderId
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Copied file: ${copy.name}\nID: ${copy.id}`,
                },
              ],
              details: { newFileId: copy.id },
            };
          }

          case "rename": {
            if (!params.fileId || !params.name) {
              return {
                content: [
                  { type: "text", text: "Error: fileId and name are required" },
                ],
                isError: true,
              };
            }
            await driveClient.renameFile(params.fileId, params.name);
            return {
              content: [
                {
                  type: "text",
                  text: `Renamed file ${params.fileId} to: ${params.name}`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                { type: "text", text: `Unknown operation: ${params.operation}` },
              ],
              isError: true,
            };
        }
      } catch (error: any) {
        // Provide helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('permission')) {
          errorMessage += '\n\nTip: Make sure the service account has access to the Shared Drive.';
        }
        if (error.message.includes('not found')) {
          errorMessage += '\n\nTip: Check if the file/folder ID is correct and exists in the Shared Drive.';
        }
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  });

  // Register Export tool
  pi.registerTool({
    name: "google_export",
    label: "Google Export",
    description: "Export Google Docs and Sheets to various formats",
    promptSnippet: "Export Google Docs and Sheets to PDF, DOCX, XLSX, etc.",
    promptGuidelines: [
      "Use google_export when the user asks to download or export Google documents.",
      "Supports formats: pdf, docx, txt, html (for docs), xlsx, csv, tsv (for sheets).",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("export_document"),
          Type.Literal("export_spreadsheet"),
        ],
        { description: "Export operation" }
      ),
      fileId: Type.String({ description: "Document or spreadsheet ID" }),
      format: Type.Union(
        [
          Type.Literal("pdf"),
          Type.Literal("docx"),
          Type.Literal("txt"),
          Type.Literal("html"),
          Type.Literal("xlsx"),
          Type.Literal("csv"),
          Type.Literal("tsv"),
        ],
        { description: "Export format" }
      ),
      outputPath: Type.Optional(
        Type.String({ description: "Output file path" })
      ),
      sheetId: Type.Optional(
        Type.Number({ description: "Sheet ID for spreadsheet export" })
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { exportClient } = getClients(ctx.cwd);

        switch (params.operation) {
          case "export_document": {
            const path = await exportClient.exportDocument(
              params.fileId,
              params.format as "pdf" | "docx" | "txt" | "html",
              params.outputPath
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Exported document to: ${path}`,
                },
              ],
              details: { path },
            };
          }

          case "export_spreadsheet": {
            const path = await exportClient.exportSpreadsheet(
              params.fileId,
              params.format as "pdf" | "xlsx" | "csv" | "tsv",
              params.sheetId,
              params.outputPath
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Exported spreadsheet to: ${path}`,
                },
              ],
              details: { path },
            };
          }

          default:
            return {
              content: [
                { type: "text", text: `Unknown operation: ${params.operation}` },
              ],
              isError: true,
            };
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  });

  // Register Image tool
  pi.registerTool({
    name: "image_tool",
    label: "Image Tool",
    description: "Convert PDF to images and crop images",
    promptSnippet: "Convert PDF to images, crop images",
    promptGuidelines: [
      "Use image_tool when the user wants to convert a PDF to images or crop an image.",
      "For PDF conversion: first export Google Doc/Sheet to PDF using google_export.",
      "For cropping: provide image path and crop coordinates (x, y, width, height).",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("pdf_to_images"),
          Type.Literal("crop"),
        ],
        { description: "Operation to perform" }
      ),
      // PDF to images params
      pdfPath: Type.Optional(Type.String({ description: "Path to the PDF file (for pdf_to_images)" })),
      outputPath: Type.Optional(
        Type.String({ description: "Output path/directory" })
      ),
      width: Type.Optional(
        Type.Number({ description: "Image width in pixels (default 1200)" })
      ),
      height: Type.Optional(
        Type.Number({ description: "Image height in pixels (default 1600)" })
      ),
      pages: Type.Optional(
        Type.String({ description: "Pages to convert: \"1\", \"1,3,5\", \"1-3\"" })
      ),
      format: Type.Optional(
        Type.Union(
          [Type.Literal("png"), Type.Literal("jpeg")],
          { description: "Image format (default: png)" }
        )
      ),
      // Crop params
      imagePath: Type.Optional(Type.String({ description: "Path to the image file (for crop)" })),
      cropX: Type.Optional(Type.Number({ description: "Crop X position (left)" })),
      cropY: Type.Optional(Type.Number({ description: "Crop Y position (top)" })),
      cropWidth: Type.Optional(Type.Number({ description: "Crop width" })),
      cropHeight: Type.Optional(Type.Number({ description: "Crop height" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { previewClient } = getClients(ctx.cwd);
        
        switch (params.operation) {
          case "pdf_to_images": {
            if (!params.pdfPath) {
              return {
                content: [{ type: "text", text: "Error: pdfPath is required" }],
                isError: true,
              };
            }
            
            const result = await previewClient.convertPdfToImages(
              params.pdfPath,
              params.outputPath,
              {
                width: params.width,
                height: params.height,
                pages: params.pages,
                format: params.format as 'png' | 'jpeg' | undefined,
              }
            );
            
            if (result.images.length > 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Converted PDF to ${result.images.length} image(s):\n\n${result.images.map((img, i) => `Page ${i + 1}: ${img}`).join('\n')}`,
                  },
                ],
                details: { images: result.images },
              };
            } else {
              return {
                content: [
                  {
                    type: "text",
                    text: `Failed to convert PDF to images.\n\nPDF file: ${params.pdfPath}`,
                  },
                ],
                isError: true,
              };
            }
          }
          
          case "crop": {
            if (!params.imagePath || params.cropX === undefined || params.cropY === undefined || !params.cropWidth || !params.cropHeight) {
              return {
                content: [{ type: "text", text: "Error: imagePath, cropX, cropY, cropWidth, and cropHeight are required" }],
                isError: true,
              };
            }
            
            const result = await previewClient.cropImage(
              params.imagePath,
              params.cropX,
              params.cropY,
              params.cropWidth,
              params.cropHeight,
              params.outputPath
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `Cropped image saved to: ${result.outputPath}`,
                },
              ],
              details: { outputPath: result.outputPath },
            };
          }
          
          default:
            return {
              content: [{ type: "text", text: `Unknown operation: ${params.operation}` }],
              isError: true,
            };
        }
      } catch (error: any) {
        let errorMessage = error.message;
        if (error.message.includes('permission')) {
          errorMessage += '\n\nTip: Make sure the service account has access to the file.';
        }
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  });

  // Extension initialized
}
