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

  // Add system prompt to guide tool usage
  pi.on("before_agent_start", async (event, ctx) => {
    const config = loadConfig(ctx.cwd);
    if (!config) return;

    // Add instructions to system prompt
    return {
      systemPrompt: event.systemPrompt + `

## Google Workspace Integration

This project has Google Docs/Sheets integration via the Technical Writer extension.

**IMPORTANT RULES:**
- When the user asks to create a document, ALWAYS use the google_docs tool with operation "create"
- When the user asks to create a spreadsheet, ALWAYS use the google_sheets tool with operation "create"
- When the user asks to edit a document, use google_docs tool
- When the user asks to edit a spreadsheet, use google_sheets tool
- NEVER use the built-in write tool to create .docx, .xlsx, or similar files
- The extension creates files directly in Google Drive (cloud), not locally

Available tools: google_docs, google_sheets, google_drive, google_export, image_tool
`,
    };
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
      "ALWAYS use google_docs when the user asks to create, edit, or manage ANY document (Google Doc, docx, or similar).",
      "NEVER use the built-in write tool for documents - always use google_docs instead.",
      "Supports operations: create, get, list, delete, rename, insert_text, append_text, find_replace, format_text, insert_table, insert_paragraph, insert_bullet_list, insert_numbered_list, remove_list, set_nesting_level.",
    ],
    parameters: Type.Object({
      operation: Type.Union(
        [
          Type.Literal("create_document"),
          Type.Literal("create"),
          Type.Literal("get"),
          Type.Literal("list"),
          Type.Literal("delete"),
          Type.Literal("rename"),
          Type.Literal("insert_text"),
          Type.Literal("append_text"),
          Type.Literal("delete_range"),
          Type.Literal("find_replace"),
          Type.Literal("replace_section"),
          Type.Literal("update_table_cell"),
          Type.Literal("format_text"),
          Type.Literal("insert_table"),
          Type.Literal("insert_paragraph"),
          Type.Literal("insert_bullet_list"),
          Type.Literal("insert_numbered_list"),
          Type.Literal("remove_list"),
          Type.Literal("set_nesting_level"),
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
      sectionHeading: Type.Optional(
        Type.String({ description: "Section heading text (for replace_section)" })
      ),
      newContent: Type.Optional(
        Type.String({ description: "New content for section (for replace_section)" })
      ),
      tableIndex: Type.Optional(
        Type.Number({ description: "Table index (for update_table_cell, 0-based)" })
      ),
      row: Type.Optional(
        Type.Number({ description: "Row index (for update_table_cell, 0-based)" })
      ),
      column: Type.Optional(
        Type.Number({ description: "Column index (for update_table_cell, 0-based)" })
      ),
      cellText: Type.Optional(
        Type.String({ description: "New cell text (for update_table_cell)" })
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
      alignment: Type.Optional(
        Type.Union(
          [Type.Literal("LEFT"), Type.Literal("CENTER"), Type.Literal("RIGHT"), Type.Literal("JUSTIFY")],
          { description: "Paragraph alignment" }
        )
      ),
      namedStyle: Type.Optional(
        Type.Union(
          [Type.Literal("NORMAL_TEXT"), Type.Literal("HEADING_1"), Type.Literal("HEADING_2"), Type.Literal("HEADING_3"), Type.Literal("TITLE"), Type.Literal("SUBTITLE")],
          { description: "Named style (heading, title, etc.)" }
        )
      ),
      content: Type.Optional(
        Type.Array(
          Type.Object({
            type: Type.Union([
              Type.Literal("heading"),
              Type.Literal("paragraph"),
              Type.Literal("list_item"),
              Type.Literal("table"),
              Type.Literal("page_break"),
            ]),
            text: Type.Optional(Type.String({ description: "Text content" })),
            style: Type.Optional(Type.String({ description: "Style: TITLE, SUBTITLE, HEADING_1-9, NORMAL_TEXT" })),
            alignment: Type.Optional(Type.String({ description: "Alignment: LEFT, CENTER, RIGHT, JUSTIFY" })),
            bold: Type.Optional(Type.Boolean({ description: "Bold formatting" })),
            italic: Type.Optional(Type.Boolean({ description: "Italic formatting" })),
            rows: Type.Optional(Type.Number({ description: "Table rows (for table type)" })),
            columns: Type.Optional(Type.Number({ description: "Table columns (for table type)" })),
            tableData: Type.Optional(Type.Array(Type.Array(Type.String()), { description: "Table data (for table type)" })),
          }),
          { description: "Document content structure (for create_document operation)" }
        )
      ),
      listItems: Type.Optional(
        Type.Array(
          Type.Object({
            text: Type.String({ description: "List item text" }),
            nestingLevel: Type.Optional(Type.Number({ description: "Nesting level (0 = root, 1 = first indent, etc.)" })),
          }),
          { description: "List items (for insert_bullet_list and insert_numbered_list)" }
        )
      ),
      nestingLevel: Type.Optional(
        Type.Number({ description: "Nesting level for set_nesting_level operation (0-8)" }
        )
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
          case "create_document": {
            if (!params.title || !params.content) {
              return {
                content: [{ type: "text", text: "Error: title and content array are required" }],
                isError: true,
              };
            }
            const folderId = extractFolderId(config.targetFolderId);
            const doc = await docsClient.createDocument(params.title, folderId);
            
            // Process all content elements
            for (const item of params.content) {
              const endIndex = await docsClient.getEndIndex(doc.documentId);
              
              switch (item.type) {
                case "heading":
                case "paragraph": {
                  // Get end index before inserting
                  const preInsertIndex = await docsClient.getEndIndex(doc.documentId);
                  await docsClient.appendText(doc.documentId, (item.text || '') + '\n');
                  // Get the paragraph we just inserted
                  const docData = await docsClient.getDocument(doc.documentId);
                  const content = docData.body?.content || [];
                  // Find the paragraph that starts at preInsertIndex
                  const newParagraph = content.find(
                    el => el.paragraph && el.startIndex === preInsertIndex
                  );
                  if (newParagraph) {
                    if (item.style) {
                      await docsClient.setNamedStyle(
                        doc.documentId,
                        newParagraph.startIndex!,
                        newParagraph.endIndex!,
                        item.style as any
                      );
                    }
                    if (item.alignment) {
                      await docsClient.setParagraphAlignment(
                        doc.documentId,
                        newParagraph.startIndex!,
                        newParagraph.endIndex!,
                        item.alignment as any
                      );
                    }
                  }
                  break;
                }
                
                case "list_item":
                  await docsClient.appendText(doc.documentId, '- ' + (item.text || '') + '\n');
                  break;
                
                case "table":
                  if (item.rows && item.columns && item.tableData) {
                    await docsClient.insertTable(doc.documentId, item.rows, item.columns, endIndex);
                    // Fill table data
                    const docData = await docsClient.getDocument(doc.documentId);
                    const tables = docData.body?.content?.filter(el => el.table) || [];
                    const lastTable = tables[tables.length - 1];
                    if (lastTable?.table?.tableRows) {
                      // Fill in reverse order to avoid index shifting
                      for (let r = lastTable.table.tableRows.length - 1; r >= 0; r--) {
                        const row = lastTable.table.tableRows[r];
                        if (row.tableCells) {
                          for (let c = row.tableCells.length - 1; c >= 0; c--) {
                            const cell = row.tableCells[c];
                            const insertIndex = cell.content?.[0]?.startIndex || cell.startIndex + 1;
                            const cellText = item.tableData[r]?.[c] || '';
                            if (cellText) {
                              await docsClient.insertText(doc.documentId, cellText, insertIndex);
                            }
                          }
                        }
                      }
                    }
                  }
                  break;
                
                case "page_break":
                  await docsClient.insertPageBreak(doc.documentId, endIndex);
                  break;
              }
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: `Created document: ${doc.documentId}\nTitle: ${doc.title}\nContent: ${params.content.length} elements added`,
                },
              ],
              details: { documentId: doc.documentId, title: doc.title },
            };
          }

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

          case "delete_range": {
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
            const deleteId = extractFileId(params.documentId);
            await docsClient.deleteRange(deleteId, params.startIndex, params.endIndex);
            return {
              content: [
                {
                  type: "text",
                  text: `Deleted content from index ${params.startIndex} to ${params.endIndex}`,
                },
              ],
            };
          }

          case "replace_section": {
            if (!params.documentId || !params.sectionHeading || params.newContent === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, sectionHeading, and newContent are required",
                  },
                ],
                isError: true,
              };
            }
            const replaceId = extractFileId(params.documentId);
            // Find the section heading
            const docData = await docsClient.getDocument(replaceId);
            const content = docData.body?.content || [];
            
            // Find the heading paragraph
            let headingStart = -1;
            let headingEnd = -1;
            let nextSectionStart = -1;
            
            for (let i = 0; i < content.length; i++) {
              const element = content[i];
              if (element.paragraph) {
                const text = element.paragraph.elements?.map(el => el.textRun?.content || '').join('') || '';
                const style = element.paragraph.paragraphStyle?.namedStyleType || '';
                
                // Check if this is the heading we're looking for
                if (text.trim().includes(params.sectionHeading!) && style.startsWith('HEADING')) {
                  headingStart = element.startIndex!;
                  headingEnd = element.endIndex!;
                }
                // Check if we found the next section (heading after our target)
                else if (headingStart > 0 && style.startsWith('HEADING') && element.startIndex! > headingEnd) {
                  nextSectionStart = element.startIndex!;
                  break;
                }
              }
            }
            
            if (headingStart === -1) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Section heading "${params.sectionHeading}" not found`,
                  },
                ],
                isError: true,
              };
            }
            
            // Delete from end of heading to start of next section (or end of doc)
            const deleteStart = headingEnd;
            const deleteEnd = nextSectionStart > 0 ? nextSectionStart : (content[content.length - 1]?.endIndex || 1);
            
            if (deleteEnd > deleteStart) {
              await docsClient.deleteRange(replaceId, deleteStart, deleteEnd);
            }
            
            // Insert new content at the same position
            await docsClient.insertText(replaceId, params.newContent + '\n', deleteStart);
            
            return {
              content: [
                {
                  type: "text",
                  text: `Replaced section "${params.sectionHeading}" with new content`,
                },
              ],
            };
          }

          case "update_table_cell": {
            if (!params.documentId || params.tableIndex === undefined || params.row === undefined || params.column === undefined || params.cellText === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, tableIndex, row, column, and cellText are required",
                  },
                ],
                isError: true,
              };
            }
            const tableId = extractFileId(params.documentId);
            const tableDocData = await docsClient.getDocument(tableId);
            const tables = tableDocData.body?.content?.filter(el => el.table) || [];
            
            if (params.tableIndex >= tables.length) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Table index ${params.tableIndex} not found. Document has ${tables.length} table(s).`,
                  },
                ],
                isError: true,
              };
            }
            
            const targetTable = tables[params.tableIndex].table;
            if (!targetTable?.tableRows?.[params.row]?.tableCells?.[params.column]) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Cell [${params.row}][${params.column}] not found in table`,
                  },
                ],
                isError: true,
              };
            }
            
            const cell = targetTable.tableRows[params.row].tableCells[params.column];
            const cellStartIndex = cell.content?.[0]?.startIndex || cell.startIndex + 1;
            const cellEndIndex = cell.content?.[0]?.endIndex || cell.endIndex;
            
            // Delete existing content and insert new
            if (cellEndIndex > cellStartIndex) {
              await docsClient.deleteRange(tableId, cellStartIndex, cellEndIndex);
            }
            await docsClient.insertText(tableId, params.cellText, cellStartIndex);
            
            return {
              content: [
                {
                  type: "text",
                  text: `Updated cell [${params.row}][${params.column}] in table ${params.tableIndex}`,
                },
              ],
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
            const formatId = extractFileId(params.documentId);
            
            // Apply text formatting if provided
            if (params.formatOptions) {
              await docsClient.formatText(
                formatId,
                params.startIndex,
                params.endIndex,
                params.formatOptions
              );
            }
            
            // Apply alignment if provided
            if (params.alignment) {
              await docsClient.setParagraphAlignment(
                formatId,
                params.startIndex,
                params.endIndex,
                params.alignment
              );
            }
            
            // Apply named style if provided
            if (params.namedStyle) {
              await docsClient.setNamedStyle(
                formatId,
                params.startIndex,
                params.endIndex,
                params.namedStyle
              );
            }
            
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

          case "insert_bullet_list": {
            if (!params.documentId || !params.listItems || params.index === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, listItems, and index are required",
                  },
                ],
                isError: true,
              };
            }
            const bulletListId = extractFileId(params.documentId);
            let bulletIndex = params.index;
            
            for (const item of params.listItems) {
              await docsClient.createBulletList(
                bulletListId,
                item.text,
                bulletIndex,
                item.nestingLevel
              );
              // Update index for next item (text + newline + potential newline)
              bulletIndex += item.text.length + 2;
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: `Inserted bullet list with ${params.listItems.length} items`,
                },
              ],
            };
          }

          case "insert_numbered_list": {
            if (!params.documentId || !params.listItems || params.index === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, listItems, and index are required",
                  },
                ],
                isError: true,
              };
            }
            const numberedListId = extractFileId(params.documentId);
            let numberedIndex = params.index;
            
            for (const item of params.listItems) {
              await docsClient.createNumberedList(
                numberedListId,
                item.text,
                numberedIndex,
                item.nestingLevel
              );
              // Update index for next item (text + newline + potential newline)
              numberedIndex += item.text.length + 2;
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: `Inserted numbered list with ${params.listItems.length} items`,
                },
              ],
            };
          }

          case "remove_list": {
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
            const removeListId = extractFileId(params.documentId);
            await docsClient.removeListFormatting(
              removeListId,
              params.startIndex,
              params.endIndex
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Removed list formatting from range ${params.startIndex} to ${params.endIndex}`,
                },
              ],
            };
          }

          case "set_nesting_level": {
            if (!params.documentId || params.startIndex === undefined || params.endIndex === undefined || params.nestingLevel === undefined) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: documentId, startIndex, endIndex, and nestingLevel are required",
                  },
                ],
                isError: true,
              };
            }
            const nestingId = extractFileId(params.documentId);
            await docsClient.setListNestingLevel(
              nestingId,
              params.startIndex,
              params.endIndex,
              params.nestingLevel
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Set nesting level to ${params.nestingLevel} for range ${params.startIndex} to ${params.endIndex}`,
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
      "ALWAYS use google_sheets when the user asks to create, edit, or manage ANY spreadsheet (Google Sheet, xlsx, csv, or similar).",
      "NEVER use the built-in write tool for spreadsheets - always use google_sheets instead.",
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
      "ALWAYS use google_drive when the user asks to work with Google Drive files, folders, or cloud storage.",
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
