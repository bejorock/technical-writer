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

## Technical Writer Extension - Google Drive Integration

This project has Google Drive integration via the Technical Writer extension.

**Available Tools:**
- google_drive - Upload, download, delete, list files on Google Drive

**Document & Spreadsheet Creation:**
When the user asks to create documents (.docx) or spreadsheets (.xlsx), you have TWO options:

**Option 1: Use the skills (RECOMMENDED)**
Read the skill files for detailed instructions:
- skills/docx-creation/SKILL.md - How to create DOCX files using the docx library
- skills/xlsx-creation/SKILL.md - How to create XLSX files using the xlsx library
- skills/pdf-conversion/SKILL.md - How to convert documents to PDF using LibreOffice
- skills/pdf-to-images/SKILL.md - How to convert PDF pages to images and crop images

**Option 2: Write code directly**
You can also write TypeScript/JavaScript code using:
- \`docx\` library for DOCX files (already installed)
- \`xlsx\` library for XLSX files (already installed)
- LibreOffice CLI for PDF conversion

**Workflow:**
1. Create the document locally using docx/xlsx library (write a script)
2. Run the script to generate the file
3. Use google_drive tool to upload to Google Drive
4. Return the Google Drive link to the user

**Example:**
\`\`\`typescript
// 1. Create local file using docx library
import { Document, Packer, Paragraph, TextRun } from 'docx';
// ... create document ...

// 2. Save locally
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('./output/my-doc.docx', buffer);

// 3. Upload to Google Drive (use google_drive tool)
// google_drive({ operation: "upload", localPath: "./output/my-doc.docx" })
\`\`\`

**IMPORTANT:**
- NEVER use the built-in write tool for documents
- ALWAYS create files locally first, then upload to Google Drive
- The docx and xlsx libraries are installed and ready to use
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
