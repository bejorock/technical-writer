/**
 * Technical Writer Extension - Main Entry Point
 *
 * A pi agent extension for Google Drive integration.
 * Provides tools for file management and skills for document/spreadsheet creation.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  loadConfig,
  saveConfig,
  validateConfig,
  registerConfigCommands,
} from "./config";
import { DriveClient } from "../lib/clients/drive";
import { extractFolderId, extractFileId } from "../lib/utils";

// Client instances with config tracking
let currentConfigHash: string | null = null;
let driveClient: DriveClient | null = null;

function getClients(cwd: string) {
  const config = loadConfig(cwd);
  if (!config) {
    throw new Error(
      "Google Drive extension not configured. Run /google-config set key-path <path> and /google-config set folder-id <id>"
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
    driveClient = new DriveClient(config);
    currentConfigHash = configHash;
  }

  return { driveClient: driveClient!, config };
}

export default function (pi: ExtensionAPI) {
  // Register configuration commands
  registerConfigCommands(pi);

  // Subscribe to session start
  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig(ctx.cwd);
    if (config) {
      ctx.ui.notify("Technical Writer extension loaded", "info");
    } else {
      ctx.ui.notify(
        "Technical Writer extension loaded (not configured - run /google-config)",
        "info"
      );
    }
  });

  // Add system prompt to guide tool usage
  pi.on("before_agent_start", async (event, ctx) => {
    const config = loadConfig(ctx.cwd);
    if (!config) return;

    // Add instructions to system prompt
    return {
      systemPrompt: event.systemPrompt + `

## Technical Writer Extension

**IMPORTANT: When creating or reading documents, ALWAYS read the relevant skill file first.**

### Skills (read these for instructions)
- **Create DOCX**: Read skills/docx-creation/SKILL.md
- **Create XLSX**: Read skills/xlsx-creation/SKILL.md
- **Convert to PDF**: Read skills/pdf-conversion/SKILL.md
- **PDF to images / Read PDF**: Read skills/pdf-to-images/SKILL.md

### Tools
- **google_drive**: Upload, download, delete, list files on Google Drive

### Workflow
1. Read the relevant skill file for instructions
2. Write TypeScript code using the library (docx, xlsx, etc.)
3. Run the script to generate the file locally
4. Use google_drive tool to upload to Google Drive

### Quick Reference
- Creating documents? → Read skills/docx-creation/SKILL.md
- Creating spreadsheets? → Read skills/xlsx-creation/SKILL.md
- Converting to PDF? → Read skills/pdf-conversion/SKILL.md
- Reading PDF or converting to images? → Read skills/pdf-to-images/SKILL.md
`,
    };
  });

  // Clean up on shutdown
  pi.on("session_shutdown", async (_event, _ctx) => {
    driveClient = null;
    currentConfigHash = null;
  });

  // Register Google Drive tool
  pi.registerTool({
    name: "google_drive",
    label: "Google Drive",
    description:
      "Manage files and folders on Google Drive",
    promptSnippet:
      "Upload, download, delete, list files on Google Drive",
    promptGuidelines: [
      "Use google_drive when the user asks to upload, download, delete, or list files on Google Drive.",
      "After creating a document locally (using docx/xlsx libraries), use google_drive to upload it.",
      "Supports operations: upload, download, list, delete, create_folder, move, copy, rename.",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("upload"),
          Type.Literal("download"),
          Type.Literal("list"),
          Type.Literal("delete"),
          Type.Literal("create_folder"),
          Type.Literal("move"),
          Type.Literal("copy"),
          Type.Literal("rename"),
        ],
        { description: "Operation to perform" }
      ),
      localPath: Type.Optional(
        Type.String({ description: "Local file path (for upload)" })
      ),
      fileId: Type.Optional(
        Type.String({ description: "File ID or URL" })
      ),
      fileName: Type.Optional(
        Type.String({ description: "File name (for upload)" })
      ),
      mimeType: Type.Optional(
        Type.String({ description: "MIME type (for upload)" })
      ),
      targetFolderId: Type.Optional(
        Type.String({ description: "Target folder ID" })
      ),
      newName: Type.Optional(
        Type.String({ description: "New name (for rename)" })
      ),
      pageSize: Type.Optional(
        Type.Number({ description: "Page size for listing (default: 100)" })
      ),
      pageToken: Type.Optional(
        Type.String({ description: "Page token for listing" })
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const { driveClient: dc, config } = getClients(ctx.cwd);

        switch (params.operation) {
          case "upload": {
            if (!params.localPath) {
              return {
                content: [{ type: "text", text: "Error: localPath is required" }],
                isError: true,
              };
            }

            const { readFileSync } = await import("node:fs");
            const { basename, extname } = await import("node:path");

            // Determine MIME type if not provided
            let mimeType = params.mimeType;
            if (!mimeType) {
              const ext = extname(params.localPath).toLowerCase();
              const mimeMap: Record<string, string> = {
                ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".pdf": "application/pdf",
                ".txt": "text/plain",
                ".csv": "text/csv",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
              };
              mimeType = mimeMap[ext] || "application/octet-stream";
            }

            // Read file content
            const fileContent = readFileSync(params.localPath);
            const fileName = params.fileName || basename(params.localPath);
            const targetFolderId = params.targetFolderId
              ? extractFolderId(params.targetFolderId)
              : extractFolderId(config.targetFolderId);

            // Create file and upload content
            const client = await (dc as any).getClient();
            const response = await client.files.create(
              {
                requestBody: {
                  name: fileName,
                  mimeType,
                  parents: targetFolderId ? [targetFolderId] : undefined,
                },
                media: {
                  mimeType,
                  body: new (await import("node:stream")).Readable.from(fileContent),
                },
                supportsAllDrives: true,
                fields: "id, name, mimeType, createdTime",
              }
            );

            const file = response.data;
            return {
              content: [
                {
                  type: "text",
                  text: `Uploaded: ${file.name}\nID: ${file.id}\nMIME Type: ${file.mimeType}\nGoogle Drive: https://drive.google.com/file/d/${file.id}/view`,
                },
              ],
              details: { fileId: file.id, name: file.name },
            };
          }

          case "download": {
            if (!params.fileId) {
              return {
                content: [{ type: "text", text: "Error: fileId is required" }],
                isError: true,
              };
            }

            const fileId = extractFileId(params.fileId);
            const buffer = await dc.downloadFile(fileId);

            const { writeFileSync, mkdirSync, existsSync } = await import("node:fs");
            const { dirname } = await import("node:path");

            const outputPath = params.localPath || `./output/download_${fileId}`;
            const outputDir = dirname(outputPath);

            if (!existsSync(outputDir)) {
              mkdirSync(outputDir, { recursive: true });
            }

            writeFileSync(outputPath, buffer);

            return {
              content: [
                {
                  type: "text",
                  text: `Downloaded to: ${outputPath}\nSize: ${buffer.length} bytes`,
                },
              ],
              details: { path: outputPath, size: buffer.length },
            };
          }

          case "list": {
            const { files, nextPageToken } = await dc.listFiles({
              pageSize: params.pageSize,
              pageToken: params.pageToken,
            });

            const fileList = files
              .map((f) => `- ${f.name} (${f.id}) [${f.mimeType}]`)
              .join("\n");

            let response = `Files:\n${fileList || "No files found"}`;
            if (nextPageToken) {
              response += `\n\nMore files available. Use pageToken: ${nextPageToken}`;
            }

            return {
              content: [{ type: "text", text: response }],
              details: { files, nextPageToken },
            };
          }

          case "delete": {
            if (!params.fileId) {
              return {
                content: [{ type: "text", text: "Error: fileId is required" }],
                isError: true,
              };
            }

            const fileId = extractFileId(params.fileId);
            await dc.deleteFile(fileId);

            return {
              content: [
                { type: "text", text: `Deleted file: ${fileId}` },
              ],
            };
          }

          case "create_folder": {
            if (!params.fileName) {
              return {
                content: [{ type: "text", text: "Error: folder name is required" }],
                isError: true,
              };
            }

            const targetFolderId = params.targetFolderId
              ? extractFolderId(params.targetFolderId)
              : extractFolderId(config.targetFolderId);

            const folder = await dc.createFolder(params.fileName, targetFolderId);

            return {
              content: [
                {
                  type: "text",
                  text: `Created folder: ${folder.name}\nID: ${folder.id}`,
                },
              ],
              details: { folderId: folder.id, name: folder.name },
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

            const fileId = extractFileId(params.fileId);
            const targetFolderId = extractFolderId(params.targetFolderId);
            await dc.moveFile(fileId, targetFolderId);

            return {
              content: [
                { type: "text", text: `Moved file ${fileId} to folder ${targetFolderId}` },
              ],
            };
          }

          case "copy": {
            if (!params.fileId || !params.fileName) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: fileId and fileName are required",
                  },
                ],
                isError: true,
              };
            }

            const fileId = extractFileId(params.fileId);
            const targetFolderId = params.targetFolderId
              ? extractFolderId(params.targetFolderId)
              : undefined;

            const copy = await dc.copyFile(fileId, params.fileName, targetFolderId);

            return {
              content: [
                {
                  type: "text",
                  text: `Copied file: ${copy.name}\nID: ${copy.id}`,
                },
              ],
              details: { fileId: copy.id, name: copy.name },
            };
          }

          case "rename": {
            if (!params.fileId || !params.newName) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: fileId and newName are required",
                  },
                ],
                isError: true,
              };
            }

            const fileId = extractFileId(params.fileId);
            await dc.renameFile(fileId, params.newName);

            return {
              content: [
                { type: "text", text: `Renamed file ${fileId} to: ${params.newName}` },
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
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}
