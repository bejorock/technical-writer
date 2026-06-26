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
import { DocumentGenerator, createDocument } from "../lib/generators/document";
import { SpreadsheetGenerator, createSpreadsheet } from "../lib/generators/spreadsheet";
import { PDFConverter, convertToPDF } from "../lib/converters/pdf";

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
- The extension creates files locally first, then uploads to Google Drive
- Local generation provides full control over formatting

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
      "Header/Footer operations: create_header, create_footer, get_headers, get_footers, delete_header, delete_footer, insert_header_text, insert_footer_text, clear_header, clear_footer, replace_header_text, replace_footer_text, format_header_text, format_footer_text, set_header_alignment, set_footer_alignment, set_page_number_start, set_first_page_header_footer.",
      "Note: Page number fields (AutoText) cannot be inserted via the Google Docs API. Use set_page_number_start to set the starting number, then add page numbers via the Google Docs UI.",
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
          Type.Literal("create_header"),
          Type.Literal("create_footer"),
          Type.Literal("get_headers"),
          Type.Literal("get_footers"),
          Type.Literal("delete_header"),
          Type.Literal("delete_footer"),
          Type.Literal("insert_header_text"),
          Type.Literal("insert_footer_text"),
          Type.Literal("clear_header"),
          Type.Literal("clear_footer"),
          Type.Literal("replace_header_text"),
          Type.Literal("replace_footer_text"),
          Type.Literal("format_header_text"),
          Type.Literal("format_footer_text"),
          Type.Literal("set_header_alignment"),
          Type.Literal("set_footer_alignment"),
          Type.Literal("set_page_number_start"),
          Type.Literal("set_first_page_header_footer"),
          Type.Literal("set_line_spacing"),
          Type.Literal("set_paragraph_spacing"),
          Type.Literal("set_paragraph_indentation"),
          Type.Literal("insert_table_row"),
          Type.Literal("insert_table_column"),
          Type.Literal("delete_table_row"),
          Type.Literal("delete_table_column"),
          Type.Literal("merge_cells"),
          Type.Literal("unmerge_cells"),
          Type.Literal("set_cell_background"),
          Type.Literal("set_column_width"),
          Type.Literal("insert_footnote"),
          Type.Literal("create_named_range"),
          Type.Literal("insert_rich_link"),
          Type.Literal("insert_person"),
          Type.Literal("insert_date"),
          Type.Literal("insert_checklist"),
          Type.Literal("insert_checklist_items"),
          Type.Literal("create_bookmark"),
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
      checked: Type.Optional(
        Type.Boolean({ description: "Checkbox state (for insert_checklist)" })
      ),
      items: Type.Optional(
        Type.Array(
          Type.Object({
            text: Type.String({ description: "Item text" }),
            checked: Type.Optional(Type.Boolean({ description: "Checked state" })),
          }),
          { description: "Checklist items (for insert_checklist_items)" }
        )
      ),
      name: Type.Optional(
        Type.String({ description: "Bookmark name (for create_bookmark)" })
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
      headerId: Type.Optional(
        Type.String({ description: "Header ID (for header operations)" })
      ),
      footerId: Type.Optional(
        Type.String({ description: "Footer ID (for footer operations)" })
      ),
      pageNumberStart: Type.Optional(
        Type.Number({ description: "Starting page number (for set_page_number_start)" })
      ),
      useFirstPageHeaderFooter: Type.Optional(
        Type.Boolean({ description: "Use different first page header/footer (for set_first_page_header_footer)" })
      ),
      headerType: Type.Optional(
        Type.Union(
          [Type.Literal("DEFAULT"), Type.Literal("HEADER_EVEN"), Type.Literal("HEADER_ODD"), Type.Literal("FIRST_PAGE_HEADER")],
          { description: "Header type" }
        )
      ),
      footerType: Type.Optional(
        Type.Union(
          [Type.Literal("DEFAULT"), Type.Literal("FOOTER_EVEN"), Type.Literal("FOOTER_ODD"), Type.Literal("FIRST_PAGE_FOOTER")],
          { description: "Footer type" }
        )
      ),
      tableIndex: Type.Optional(
        Type.Number({ description: "Table index (for table operations)" })
      ),
      rowIndex: Type.Optional(
        Type.Number({ description: "Row index (for table row operations)" })
      ),
      columnIndex: Type.Optional(
        Type.Number({ description: "Column index (for table column operations)" })
      ),
      insertBelow: Type.Optional(
        Type.Boolean({ description: "Insert below (true) or above (false) for insert_table_row" })
      ),
      insertRight: Type.Optional(
        Type.Boolean({ description: "Insert right (true) or left (false) for insert_table_column" })
      ),
      startRow: Type.Optional(
        Type.Number({ description: "Start row for merge_cells" })
      ),
      startCol: Type.Optional(
        Type.Number({ description: "Start column for merge_cells" })
      ),
      endRow: Type.Optional(
        Type.Number({ description: "End row for merge_cells" })
      ),
      endCol: Type.Optional(
        Type.Number({ description: "End column for merge_cells" })
      ),
      color: Type.Optional(
        Type.Object({
          red: Type.Number({ description: "Red component (0-1)" }),
          green: Type.Number({ description: "Green component (0-1)" }),
          blue: Type.Number({ description: "Blue component (0-1)" }),
        }, { description: "RGB color for set_cell_background" })
      ),
      width: Type.Optional(
        Type.Number({ description: "Width in points for set_column_width" })
      ),
      namedRangeName: Type.Optional(
        Type.String({ description: "Name for named range (for create_named_range)" })
      ),
      uri: Type.Optional(
        Type.String({ description: "URL for rich link (for insert_rich_link)" })
      ),
      personId: Type.Optional(
        Type.String({ description: "Google account email (for insert_person)" })
      ),
      locale: Type.Optional(
        Type.String({ description: "Date locale (for insert_date, e.g., en-US)" })
      ),
      timeZone: Type.Optional(
        Type.String({ description: "Timezone (for insert_date, e.g., America/New_York)" })
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
      spacing: Type.Optional(
        Type.Number({ description: "Line spacing percentage (100=single, 150=1.5, 200=double) for set_line_spacing" })
      ),
      spaceBefore: Type.Optional(
        Type.Number({ description: "Space before paragraph in points (for set_paragraph_spacing)" })
      ),
      spaceAfter: Type.Optional(
        Type.Number({ description: "Space after paragraph in points (for set_paragraph_spacing)" })
      ),
      indentLeft: Type.Optional(
        Type.Number({ description: "Left indent in points (for set_paragraph_indentation)" })
      ),
      indentRight: Type.Optional(
        Type.Number({ description: "Right indent in points (for set_paragraph_indentation)" })
      ),
      firstLine: Type.Optional(
        Type.Number({ description: "First line indent in points (for set_paragraph_indentation)" })
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
            
            // Create document locally using docx library
            const docGen = createDocument({ title: params.title });
            
            // Process all content elements
            for (const item of params.content) {
              switch (item.type) {
                case "heading":
                  docGen.addHeading(item.text || '', 1);
                  break;
                
                case "paragraph":
                  docGen.addParagraph({
                    text: item.text || '',
                    alignment: item.alignment?.toLowerCase() as any || 'justified',
                    bold: item.bold,
                    italic: item.italic,
                  });
                  break;
                
                case "list_item":
                  docGen.addParagraph({
                    text: `• ${item.text || ''}`,
                    indent: { left: 0.5 },
                  });
                  break;
                
                case "table":
                  if (item.rows && item.columns && item.tableData) {
                    docGen.addTable({
                      rows: item.tableData.map((row: string[]) => ({
                        cells: row.map((cell: string) => ({ text: cell })),
                      })),
                    });
                  }
                  break;
                
                case "page_break":
                  docGen.addPageBreak();
                  break;
              }
            }
            
            // Generate local file
            const localPath = `./output/${params.title}.docx`;
            await docGen.generate(localPath);
            
            // Upload to Google Drive
            const folderId = extractFolderId(config.targetFolderId);
            const { driveClient: dc } = getClients(ctx.cwd);
            const file = await dc.uploadFile(
              localPath,
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              folderId
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `Created document: ${file.id}\nTitle: ${params.title}\nContent: ${params.content.length} elements added\nLocal file: ${localPath}\nGoogle Drive: https://docs.google.com/document/d/${file.id}/edit`,
                },
              ],
              details: { documentId: file.id, title: params.title, localPath },
            };
          }

          case "create": {
            if (!params.title) {
              return {
                content: [{ type: "text", text: "Error: title is required" }],
                isError: true,
              };
            }
            
            // Create document locally using docx library
            const doc = createDocument({ title: params.title });
            
            // Add title if provided
            if (params.text) {
              doc.addParagraph({
                text: params.text,
                bold: true,
                fontSize: 14,
                alignment: 'center',
              });
            }
            
            // Generate local file
            const localPath = `./output/${params.title}.docx`;
            await doc.generate(localPath);
            
            // Upload to Google Drive
            const folderId = extractFolderId(config.targetFolderId);
            const { driveClient: dc } = getClients(ctx.cwd);
            const file = await dc.uploadFile(
              localPath,
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              folderId
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `Created document: ${file.id}\nTitle: ${params.title}\nLocal file: ${localPath}\nGoogle Drive: https://docs.google.com/document/d/${file.id}/edit`,
                },
              ],
              details: { documentId: file.id, title: params.title, localPath },
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

          // ============================================
          // Header and Footer Operations
          // ============================================

          case "create_header": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const createHeaderId = extractFileId(params.documentId);
            const headerResult = await docsClient.createHeader(
              createHeaderId,
              params.headerType as any || 'DEFAULT'
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Created header with ID: ${headerResult.headerId}`,
                },
              ],
              details: headerResult,
            };
          }

          case "create_footer": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const createFooterId = extractFileId(params.documentId);
            const footerResult = await docsClient.createFooter(
              createFooterId,
              params.footerType as any || 'DEFAULT'
            );
            return {
              content: [
                {
                  type: "text",
                  text: `Created footer with ID: ${footerResult.footerId}`,
                },
              ],
              details: footerResult,
            };
          }

          case "get_headers": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const getHeadersId = extractFileId(params.documentId);
            const headers = await docsClient.getHeaders(getHeadersId);
            const headerIds = Object.keys(headers);
            return {
              content: [
                {
                  type: "text",
                  text: headerIds.length > 0
                    ? `Found ${headerIds.length} header(s):\n${headerIds.map(id => `- ${id}`).join('\n')}`
                    : 'No headers found in document',
                },
              ],
              details: headers,
            };
          }

          case "get_footers": {
            if (!params.documentId) {
              return {
                content: [{ type: "text", text: "Error: documentId is required" }],
                isError: true,
              };
            }
            const getFootersId = extractFileId(params.documentId);
            const footers = await docsClient.getFooters(getFootersId);
            const footerIds = Object.keys(footers);
            return {
              content: [
                {
                  type: "text",
                  text: footerIds.length > 0
                    ? `Found ${footerIds.length} footer(s):\n${footerIds.map(id => `- ${id}`).join('\n')}`
                    : 'No footers found in document',
                },
              ],
              details: footers,
            };
          }

          case "delete_header": {
            if (!params.documentId || !params.headerId) {
              return {
                content: [{ type: "text", text: "Error: documentId and headerId are required" }],
                isError: true,
              };
            }
            const deleteHeaderId = extractFileId(params.documentId);
            await docsClient.deleteHeader(deleteHeaderId, params.headerId);
            return {
              content: [{ type: "text", text: `Deleted header: ${params.headerId}` }],
            };
          }

          case "delete_footer": {
            if (!params.documentId || !params.footerId) {
              return {
                content: [{ type: "text", text: "Error: documentId and footerId are required" }],
                isError: true,
              };
            }
            const deleteFooterId = extractFileId(params.documentId);
            await docsClient.deleteFooter(deleteFooterId, params.footerId);
            return {
              content: [{ type: "text", text: `Deleted footer: ${params.footerId}` }],
            };
          }

          case "insert_header_text": {
            if (!params.documentId || !params.headerId || params.text === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, headerId, and text are required" }],
                isError: true,
              };
            }
            const insertHeaderId = extractFileId(params.documentId);
            await docsClient.insertTextToHeader(
              insertHeaderId,
              params.headerId,
              params.text,
              params.index || 0
            );
            return {
              content: [{ type: "text", text: `Inserted text into header at position ${params.index || 0}` }],
            };
          }

          case "insert_footer_text": {
            if (!params.documentId || !params.footerId || params.text === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, footerId, and text are required" }],
                isError: true,
              };
            }
            const insertFooterId = extractFileId(params.documentId);
            await docsClient.insertTextToFooter(
              insertFooterId,
              params.footerId,
              params.text,
              params.index || 0
            );
            return {
              content: [{ type: "text", text: `Inserted text into footer at position ${params.index || 0}` }],
            };
          }

          case "clear_header": {
            if (!params.documentId || !params.headerId) {
              return {
                content: [{ type: "text", text: "Error: documentId and headerId are required" }],
                isError: true,
              };
            }
            const clearHeaderId = extractFileId(params.documentId);
            await docsClient.clearHeader(clearHeaderId, params.headerId);
            return {
              content: [{ type: "text", text: `Cleared header content: ${params.headerId}` }],
            };
          }

          case "clear_footer": {
            if (!params.documentId || !params.footerId) {
              return {
                content: [{ type: "text", text: "Error: documentId and footerId are required" }],
                isError: true,
              };
            }
            const clearFooterId = extractFileId(params.documentId);
            await docsClient.clearFooter(clearFooterId, params.footerId);
            return {
              content: [{ type: "text", text: `Cleared footer content: ${params.footerId}` }],
            };
          }

          case "replace_header_text": {
            if (!params.documentId || !params.headerId || params.text === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, headerId, and text are required" }],
                isError: true,
              };
            }
            const replaceHeaderId = extractFileId(params.documentId);
            await docsClient.replaceHeaderText(
              replaceHeaderId,
              params.headerId,
              params.text
            );
            return {
              content: [{ type: "text", text: `Replaced header text with: ${params.text}` }],
            };
          }

          case "replace_footer_text": {
            if (!params.documentId || !params.footerId || params.text === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, footerId, and text are required" }],
                isError: true,
              };
            }
            const replaceFooterId = extractFileId(params.documentId);
            await docsClient.replaceFooterText(
              replaceFooterId,
              params.footerId,
              params.text
            );
            return {
              content: [{ type: "text", text: `Replaced footer text with: ${params.text}` }],
            };
          }

          case "format_header_text": {
            if (!params.documentId || !params.headerId || params.startIndex === undefined || params.endIndex === undefined || !params.formatOptions) {
              return {
                content: [{ type: "text", text: "Error: documentId, headerId, startIndex, endIndex, and formatOptions are required" }],
                isError: true,
              };
            }
            const formatHeaderId = extractFileId(params.documentId);
            await docsClient.formatHeaderText(
              formatHeaderId,
              params.headerId,
              params.startIndex,
              params.endIndex,
              params.formatOptions
            );
            return {
              content: [{ type: "text", text: `Formatted header text from ${params.startIndex} to ${params.endIndex}` }],
            };
          }

          case "format_footer_text": {
            if (!params.documentId || !params.footerId || params.startIndex === undefined || params.endIndex === undefined || !params.formatOptions) {
              return {
                content: [{ type: "text", text: "Error: documentId, footerId, startIndex, endIndex, and formatOptions are required" }],
                isError: true,
              };
            }
            const formatFooterId = extractFileId(params.documentId);
            await docsClient.formatFooterText(
              formatFooterId,
              params.footerId,
              params.startIndex,
              params.endIndex,
              params.formatOptions
            );
            return {
              content: [{ type: "text", text: `Formatted footer text from ${params.startIndex} to ${params.endIndex}` }],
            };
          }

          case "set_header_alignment": {
            if (!params.documentId || !params.headerId || params.startIndex === undefined || params.endIndex === undefined || !params.alignment) {
              return {
                content: [{ type: "text", text: "Error: documentId, headerId, startIndex, endIndex, and alignment are required" }],
                isError: true,
              };
            }
            const alignHeaderId = extractFileId(params.documentId);
            await docsClient.setHeaderAlignment(
              alignHeaderId,
              params.headerId,
              params.startIndex,
              params.endIndex,
              params.alignment as any
            );
            return {
              content: [{ type: "text", text: `Set header alignment to ${params.alignment}` }],
            };
          }

          case "set_footer_alignment": {
            if (!params.documentId || !params.footerId || params.startIndex === undefined || params.endIndex === undefined || !params.alignment) {
              return {
                content: [{ type: "text", text: "Error: documentId, footerId, startIndex, endIndex, and alignment are required" }],
                isError: true,
              };
            }
            const alignFooterId = extractFileId(params.documentId);
            await docsClient.setFooterAlignment(
              alignFooterId,
              params.footerId,
              params.startIndex,
              params.endIndex,
              params.alignment as any
            );
            return {
              content: [{ type: "text", text: `Set footer alignment to ${params.alignment}` }],
            };
          }

          case "set_page_number_start": {
            if (!params.documentId || params.pageNumberStart === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId and pageNumberStart are required" }],
                isError: true,
              };
            }
            const pageNumberId = extractFileId(params.documentId);
            await docsClient.setPageNumberStart(
              pageNumberId,
              params.pageNumberStart
            );
            return {
              content: [{ type: "text", text: `Set page number start to ${params.pageNumberStart}` }],
            };
          }

          case "set_first_page_header_footer": {
            if (!params.documentId || params.useFirstPageHeaderFooter === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId and useFirstPageHeaderFooter are required" }],
                isError: true,
              };
            }
            const firstPageId = extractFileId(params.documentId);
            await docsClient.setUseFirstPageHeaderFooter(
              firstPageId,
              params.useFirstPageHeaderFooter
            );
            return {
              content: [{ type: "text", text: `Set first page header/footer to ${params.useFirstPageHeaderFooter}` }],
            };
          }

          case "set_line_spacing": {
            if (!params.documentId || params.startIndex === undefined || params.endIndex === undefined || params.spacing === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, startIndex, endIndex, and spacing are required" }],
                isError: true,
              };
            }
            const lineSpacingId = extractFileId(params.documentId);
            await docsClient.setLineSpacing(
              lineSpacingId,
              params.startIndex,
              params.endIndex,
              params.spacing
            );
            return {
              content: [{ type: "text", text: `Set line spacing to ${params.spacing}%` }],
            };
          }

          case "set_paragraph_spacing": {
            if (!params.documentId || params.startIndex === undefined || params.endIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, startIndex, and endIndex are required" }],
                isError: true,
              };
            }
            const paraSpacingId = extractFileId(params.documentId);
            await docsClient.setParagraphSpacing(
              paraSpacingId,
              params.startIndex,
              params.endIndex,
              params.spaceBefore,
              params.spaceAfter
            );
            return {
              content: [{ type: "text", text: `Set paragraph spacing (before: ${params.spaceBefore || 0}, after: ${params.spaceAfter || 0})` }],
            };
          }

          case "set_paragraph_indentation": {
            if (!params.documentId || params.startIndex === undefined || params.endIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, startIndex, and endIndex are required" }],
                isError: true,
              };
            }
            const indentId = extractFileId(params.documentId);
            await docsClient.setParagraphIndentation(
              indentId,
              params.startIndex,
              params.endIndex,
              params.indentLeft,
              params.indentRight,
              params.firstLine
            );
            return {
              content: [{ type: "text", text: `Set paragraph indentation (left: ${params.indentLeft || 0}, right: ${params.indentRight || 0}, first: ${params.firstLine || 0})` }],
            };
          }

          case "insert_table_row": {
            if (!params.documentId || params.tableIndex === undefined || params.rowIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, and rowIndex are required" }],
                isError: true,
              };
            }
            const insertRowId = extractFileId(params.documentId);
            await docsClient.insertTableRow(
              insertRowId,
              params.tableIndex,
              params.rowIndex,
              params.insertBelow !== false
            );
            return {
              content: [{ type: "text", text: `Inserted row at index ${params.rowIndex} in table ${params.tableIndex}` }],
            };
          }

          case "insert_table_column": {
            if (!params.documentId || params.tableIndex === undefined || params.columnIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, and columnIndex are required" }],
                isError: true,
              };
            }
            const insertColId = extractFileId(params.documentId);
            await docsClient.insertTableColumn(
              insertColId,
              params.tableIndex,
              params.columnIndex,
              params.insertRight !== false
            );
            return {
              content: [{ type: "text", text: `Inserted column at index ${params.columnIndex} in table ${params.tableIndex}` }],
            };
          }

          case "delete_table_row": {
            if (!params.documentId || params.tableIndex === undefined || params.rowIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, and rowIndex are required" }],
                isError: true,
              };
            }
            const deleteRowId = extractFileId(params.documentId);
            await docsClient.deleteTableRow(
              deleteRowId,
              params.tableIndex,
              params.rowIndex
            );
            return {
              content: [{ type: "text", text: `Deleted row at index ${params.rowIndex} from table ${params.tableIndex}` }],
            };
          }

          case "delete_table_column": {
            if (!params.documentId || params.tableIndex === undefined || params.columnIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, and columnIndex are required" }],
                isError: true,
              };
            }
            const deleteColId = extractFileId(params.documentId);
            await docsClient.deleteTableColumn(
              deleteColId,
              params.tableIndex,
              params.columnIndex
            );
            return {
              content: [{ type: "text", text: `Deleted column at index ${params.columnIndex} from table ${params.tableIndex}` }],
            };
          }

          case "merge_cells": {
            if (!params.documentId || params.tableIndex === undefined || 
                params.startRow === undefined || params.startCol === undefined ||
                params.endRow === undefined || params.endCol === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, startRow, startCol, endRow, and endCol are required" }],
                isError: true,
              };
            }
            const mergeId = extractFileId(params.documentId);
            await docsClient.mergeTableCells(
              mergeId,
              params.tableIndex,
              params.startRow,
              params.startCol,
              params.endRow,
              params.endCol
            );
            return {
              content: [{ type: "text", text: `Merged cells from [${params.startRow},${params.startCol}] to [${params.endRow},${params.endCol}] in table ${params.tableIndex}` }],
            };
          }

          case "unmerge_cells": {
            if (!params.documentId || params.tableIndex === undefined || params.rowIndex === undefined || params.columnIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, rowIndex, and columnIndex are required" }],
                isError: true,
              };
            }
            const unmergeId = extractFileId(params.documentId);
            await docsClient.unmergeTableCells(
              unmergeId,
              params.tableIndex,
              params.rowIndex,
              params.columnIndex
            );
            return {
              content: [{ type: "text", text: `Unmerged cell at [${params.rowIndex},${params.columnIndex}] in table ${params.tableIndex}` }],
            };
          }

          case "set_cell_background": {
            if (!params.documentId || params.tableIndex === undefined || 
                params.rowIndex === undefined || params.columnIndex === undefined || !params.color) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, rowIndex, columnIndex, and color are required" }],
                isError: true,
              };
            }
            const bgColorId = extractFileId(params.documentId);
            await docsClient.setTableCellBackground(
              bgColorId,
              params.tableIndex,
              params.rowIndex,
              params.columnIndex,
              params.color
            );
            return {
              content: [{ type: "text", text: `Set background color for cell [${params.rowIndex},${params.columnIndex}] in table ${params.tableIndex}` }],
            };
          }

          case "set_column_width": {
            if (!params.documentId || params.tableIndex === undefined || params.columnIndex === undefined || params.width === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, tableIndex, columnIndex, and width are required" }],
                isError: true,
              };
            }
            const colWidthId = extractFileId(params.documentId);
            await docsClient.setTableColumnWidth(
              colWidthId,
              params.tableIndex,
              params.columnIndex,
              params.width
            );
            return {
              content: [{ type: "text", text: `Set width to ${params.width}pt for column ${params.columnIndex} in table ${params.tableIndex}` }],
            };
          }

          case "insert_footnote": {
            if (!params.documentId || params.index === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId and index are required" }],
                isError: true,
              };
            }
            const footnoteId = extractFileId(params.documentId);
            await docsClient.createFootnote(footnoteId, params.index);
            return {
              content: [{ type: "text", text: `Inserted footnote at index ${params.index}` }],
            };
          }

          case "create_named_range": {
            if (!params.documentId || !params.namedRangeName || params.startIndex === undefined || params.endIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, namedRangeName, startIndex, and endIndex are required" }],
                isError: true,
              };
            }
            const namedRangeId = extractFileId(params.documentId);
            await docsClient.createNamedRange(
              namedRangeId,
              params.namedRangeName,
              params.startIndex,
              params.endIndex
            );
            return {
              content: [{ type: "text", text: `Created named range "${params.namedRangeName}" from ${params.startIndex} to ${params.endIndex}` }],
            };
          }

          case "insert_rich_link": {
            if (!params.documentId || !params.uri || params.index === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, uri, and index are required" }],
                isError: true,
              };
            }
            const richLinkId = extractFileId(params.documentId);
            await docsClient.insertRichLink(richLinkId, params.uri, params.index);
            return {
              content: [{ type: "text", text: `Inserted rich link to ${params.uri}` }],
            };
          }

          case "insert_person": {
            if (!params.documentId || !params.personId || params.index === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, personId, and index are required" }],
                isError: true,
              };
            }
            const personIdVal = extractFileId(params.documentId);
            await docsClient.insertPerson(personIdVal, params.personId, params.index);
            return {
              content: [{ type: "text", text: `Inserted person mention for ${params.personId}` }],
            };
          }

          case "insert_date": {
            if (!params.documentId || params.index === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId and index are required" }],
                isError: true,
              };
            }
            const dateId = extractFileId(params.documentId);
            await docsClient.insertDate(dateId, params.index, params.locale, params.timeZone);
            return {
              content: [{ type: "text", text: `Inserted date at index ${params.index}` }],
            };
          }

          case "insert_checklist": {
            if (!params.documentId || !params.text) {
              return {
                content: [{ type: "text", text: "Error: documentId and text are required" }],
                isError: true,
              };
            }
            const checkId = extractFileId(params.documentId);
            await docsClient.insertChecklist(checkId, params.text, params.checked || false, params.index);
            return {
              content: [{ type: "text", text: `Inserted checklist item: ${params.text}` }],
            };
          }

          case "insert_checklist_items": {
            if (!params.documentId || !params.items) {
              return {
                content: [{ type: "text", text: "Error: documentId and items array are required" }],
                isError: true,
              };
            }
            const checkListId = extractFileId(params.documentId);
            await docsClient.insertChecklistItems(checkListId, params.items, params.index);
            return {
              content: [{ type: "text", text: `Inserted ${params.items.length} checklist items` }],
            };
          }

          case "create_bookmark": {
            if (!params.documentId || !params.name || params.startIndex === undefined || params.endIndex === undefined) {
              return {
                content: [{ type: "text", text: "Error: documentId, name, startIndex, and endIndex are required" }],
                isError: true,
              };
            }
            const bookmarkId = extractFileId(params.documentId);
            const bookmarkIdResult = await docsClient.createBookmark(bookmarkId, params.name, params.startIndex, params.endIndex);
            return {
              content: [{ type: "text", text: `Created bookmark '${params.name}' with ID: ${bookmarkIdResult}` }],
              details: { bookmarkId: bookmarkIdResult },
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
            
            // Create spreadsheet locally using xlsx library
            const sheetGen = createSpreadsheet({ title: params.title });
            
            // Add initial data if provided
            if (params.data) {
              sheetGen.setRange('Sheet1', 'A1', params.data);
            }
            
            // Generate local file
            const localPath = `./output/${params.title}.xlsx`;
            sheetGen.generate(localPath);
            
            // Upload to Google Drive
            const folderId = extractFolderId(config.targetFolderId);
            const file = await driveClient.uploadFile(
              localPath,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              folderId
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `Created spreadsheet: ${file.id}\nTitle: ${params.title}\nLocal file: ${localPath}\nGoogle Drive: https://docs.google.com/spreadsheets/d/${file.id}/edit`,
                },
              ],
              details: { spreadsheetId: file.id, title: params.title, localPath },
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
        const { driveClient: dc, config } = getClients(ctx.cwd);
        const folderId = extractFolderId(config.targetFolderId);
        
        // Download the file from Google Drive first
        const localPath = `./output/export_${params.fileId}_${Date.now()}`;
        const downloadedPath = await dc.downloadFile(params.fileId, localPath);
        
        // Use LibreOffice for conversion
        const converter = new PDFConverter();
        
        // Check if LibreOffice is installed
        const isInstalled = await converter.isInstalled();
        if (!isInstalled) {
          return {
            content: [{ type: "text", text: "Error: LibreOffice is not installed. Please install it to use export functionality." }],
            isError: true,
          };
        }
        
        // Convert the file
        const result = await converter.convert(downloadedPath, {
          format: params.format as any,
          outputPath: params.outputPath,
        });
        
        if (!result.success) {
          return {
            content: [{ type: "text", text: `Export failed: ${result.error}` }],
            isError: true,
          };
        }
        
        // Upload the converted file back to Google Drive
        const convertedFile = await dc.uploadFile(
          result.outputPath,
          this.getMimeType(params.format),
          folderId
        );
        
        return {
          content: [
            {
              type: "text",
              text: `Exported file: ${result.outputPath}\nGoogle Drive: https://drive.google.com/file/d/${convertedFile.id}/view`,
            },
          ],
          details: { localPath: result.outputPath, fileId: convertedFile.id },
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
    
    // Helper method to get MIME type
    private getMimeType(format: string): string {
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        tsv: 'text/tab-separated-values',
        txt: 'text/plain',
        html: 'text/html',
      };
      return mimeTypes[format] || 'application/octet-stream';
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
