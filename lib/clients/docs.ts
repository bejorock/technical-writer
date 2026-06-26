/**
 * Google Docs Client
 *
 * Wrapper around Google Docs API for document operations.
 */

import { docs_v1 } from "googleapis";
import type { GoogleDocsConfig } from "../../extensions/config";
import { getGoogleClients } from "./auth";

export interface Document {
  documentId: string;
  title: string;
  body?: docs_v1.Schema$Body;
  revisionId?: string;
  suggestionsViewMode?: string;
}

export interface TextPosition {
  index: number;
}

export interface TextRange {
  startIndex: number;
  endIndex: number;
}

export class DocsClient {
  private config: GoogleDocsConfig;
  private docs: docs_v1.Docs | null = null;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  private async getClient(): Promise<docs_v1.Docs> {
    if (!this.docs) {
      const { docs } = await getGoogleClients(this.config);
      this.docs = docs;
    }
    return this.docs;
  }

  /**
   * Create a new blank document
   * Note: Uses Drive API instead of Docs API for service account compatibility
   */
  async createDocument(title: string, folderId?: string): Promise<Document> {
    const { drive } = await getGoogleClients(this.config);

    // Use Drive API to create Google Doc (works with service accounts in Shared Drives)
    const response = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: folderId ? [folderId] : undefined,
      },
      supportsAllDrives: true,
      fields: 'id, name',
    });

    return {
      documentId: response.data.id!,
      title: response.data.name!,
    } as Document;
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<Document> {
    const client = await this.getClient();

    const response = await client.documents.get({
      documentId,
    });

    return response.data as Document;
  }

  /**
   * Get document content as plain text
   */
  async getDocumentText(documentId: string): Promise<string> {
    const doc = await this.getDocument(documentId);

    if (!doc.body?.content) {
      return "";
    }

    let text = "";
    for (const element of doc.body.content) {
      if (element.paragraph) {
        for (const paraElement of element.paragraph.elements || []) {
          if (paraElement.textRun?.content) {
            text += paraElement.textRun.content;
          }
        }
      }
    }

    return text;
  }

  /**
   * Rename a document
   */
  async renameDocument(documentId: string, newTitle: string): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateDocumentStyle: {
              documentStyle: {
                title: newTitle,
              },
              fields: "title",
            },
          },
        ],
      },
    });
  }

  /**
   * Insert text at a specific position
   */
  async insertText(
    documentId: string,
    text: string,
    index: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index,
              },
              text,
            },
          },
        ],
      },
    });
  }

  /**
   * Append text at the end of the document
   */
  async appendText(documentId: string, text: string): Promise<void> {
    const doc = await this.getDocument(documentId);

    // Get the end index (last character before footer)
    const endIndex = (doc.body?.content?.slice(-1)[0]?.endIndex || 1) - 1;

    await this.insertText(documentId, text, endIndex);
  }

  /**
   * Find and replace text
   */
  async findAndReplace(
    documentId: string,
    findText: string,
    replaceText: string,
    matchCase: boolean = false
  ): Promise<{ replacements: number }> {
    const client = await this.getClient();

    const response = await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: {
                text: findText,
                matchCase,
              },
              replaceText,
            },
          },
        ],
      },
    });

    const reply = response.data.replies?.[0];
    const count = (reply as any)?.replaceAllText?.instancesChangedCount || 0;

    return { replacements: count };
  }

  /**
   * Delete a text range
   */
  async deleteRange(
    documentId: string,
    startIndex: number,
    endIndex: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex,
                endIndex,
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Insert a paragraph with style
   */
  async insertParagraph(
    documentId: string,
    text: string,
    index: number,
    style?: string
  ): Promise<void> {
    const client = await this.getClient();

    const requests: docs_v1.Schema$Request[] = [
      {
        insertText: {
          location: { index },
          text: text + "\n",
        },
      },
    ];

    if (style) {
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: index,
            endIndex: index + text.length + 1,
          },
          paragraphStyle: {
            namedStyleType: style as any,
          },
          fields: "namedStyleType",
        },
      });
    }

    await client.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  /**
   * Apply text formatting
   */
  async formatText(
    documentId: string,
    startIndex: number,
    endIndex: number,
    format: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      fontFamily?: string;
      fontSize?: number;
      foregroundColor?: string;
      backgroundColor?: string;
    }
  ): Promise<void> {
    const client = await this.getClient();

    const textStyle: docs_v1.Schema$TextStyle = {};

    if (format.bold !== undefined) textStyle.bold = format.bold;
    if (format.italic !== undefined) textStyle.italic = format.italic;
    if (format.underline !== undefined) textStyle.underline = format.underline;
    if (format.strikethrough !== undefined)
      textStyle.strikethrough = format.strikethrough;

    if (format.fontFamily) {
      textStyle.weightedFontFamily = {
        fontFamily: format.fontFamily,
      };
    }

    if (format.fontSize) {
      textStyle.fontSize = {
        magnitude: format.fontSize,
        unit: "PT",
      };
    }

    if (format.foregroundColor) {
      textStyle.foregroundColor = {
        color: {
          rgbColor: this.parseColor(format.foregroundColor),
        },
      };
    }

    if (format.backgroundColor) {
      textStyle.backgroundColor = {
        color: {
          rgbColor: this.parseColor(format.backgroundColor),
        },
      };
    }

    const fields = Object.keys(format)
      .filter((k) => format[k as keyof typeof format] !== undefined)
      .join(",");

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateTextStyle: {
              range: {
                startIndex,
                endIndex,
              },
              textStyle,
              fields,
            },
          },
        ],
      },
    });
  }

  /**
   * Insert a table
   */
  async insertTable(
    documentId: string,
    rows: number,
    columns: number,
    index: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertTable: {
              location: {
                index,
              },
              rows,
              columns,
            },
          },
        ],
      },
    });
  }

  /**
   * Insert a page break
   */
  async insertPageBreak(documentId: string, index: number): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertSectionBreak: {
              location: {
                index,
              },
              sectionType: "CONTINUOUS",
            },
          },
        ],
      },
    });
  }

  /**
   * Insert a horizontal rule
   */
  async insertHorizontalRule(documentId: string, index: number): Promise<void> {
    const client = await this.getClient();

    // Base64 encoded SVG horizontal rule
    const horizontalRuleSvg = 'PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjIiIHZpZXdCb3g9IjAgMCA3MjAgMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzIwIiBoZWlnaHQ9IjIiIGZpbGw9IiNFM0UzRTMiLz48L3N2Zz4=';

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertInlineImage: {
              location: {
                index,
              },
              uri: `data:image/svg+xml;base64,${horizontalRuleSvg}`,
            },
          },
        ],
      },
    });
  }

  /**
   * Create an image from URL
   */
  async insertImage(
    documentId: string,
    imageUrl: string,
    index: number,
    width?: number,
    height?: number
  ): Promise<void> {
    const client = await this.getClient();

    const imageRequest: docs_v1.Schema$Request = {
      insertInlineImage: {
        location: {
          index,
        },
        uri: imageUrl,
      },
    };

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [imageRequest],
      },
    });
  }

  /**
   * Helper: Parse color string to RGB
   */
  private parseColor(
    color: string
  ): { red?: number; green?: number; blue?: number } {
    // Handle hex colors
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return { red: r, green: g, blue: b };
    }

    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        red: parseInt(rgbMatch[1]) / 255,
        green: parseInt(rgbMatch[2]) / 255,
        blue: parseInt(rgbMatch[3]) / 255,
      };
    }

    // Default to black
    return { red: 0, green: 0, blue: 0 };
  }
}
