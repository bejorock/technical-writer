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

    try {
      const response = await client.documents.get({
        documentId,
      });

      return response.data as Document;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Document not found: ${documentId}`);
      }
      if (error.response?.status === 403) {
        throw new Error(`Permission denied: Cannot access document ${documentId}. Make sure the service account has access.`);
      }
      throw error;
    }
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
   * Get the end index of the document (for appending)
   */
  async getEndIndex(documentId: string): Promise<number> {
    const doc = await this.getDocument(documentId);
    return (doc.body?.content?.slice(-1)[0]?.endIndex || 1) - 1;
  }

  /**
   * Insert text at a specific position
   * For empty documents or index 0, use appendText instead
   */
  async insertText(
    documentId: string,
    text: string,
    index: number
  ): Promise<void> {
    const client = await this.getClient();

    // For index 0, always use appendText to avoid empty document issues
    if (index === 0) {
      await this.appendText(documentId, text);
      return;
    }

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
    const client = await this.getClient();
    const doc = await this.getDocument(documentId);

    // Get the end index (last character before footer)
    const endIndex = (doc.body?.content?.slice(-1)[0]?.endIndex || 1) - 1;

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndex,
              },
              text,
            },
          },
        ],
      },
    });
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

    // For index 0, use append if document is empty
    let insertIndex = index;
    if (index === 0) {
      try {
        const endIndex = await this.getEndIndex(documentId);
        if (endIndex <= 1) {
          insertIndex = endIndex;
        }
      } catch (e) {
        // Continue with original index
      }
    }

    const requests: docs_v1.Schema$Request[] = [
      {
        insertText: {
          location: { index: insertIndex },
          text: text + "\n",
        },
      },
    ];

    if (style) {
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: insertIndex,
            endIndex: insertIndex + text.length + 1,
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
   * Set paragraph alignment
   */
  async setParagraphAlignment(
    documentId: string,
    startIndex: number,
    endIndex: number,
    alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateParagraphStyle: {
              range: {
                startIndex,
                endIndex,
              },
              paragraphStyle: {
                alignment: alignment as any,
              },
              fields: "alignment",
            },
          },
        ],
      },
    });
  }

  /**
   * Set named style (Heading 1-9, Normal, Title, Subtitle)
   */
  async setNamedStyle(
    documentId: string,
    startIndex: number,
    endIndex: number,
    style: 'NORMAL_TEXT' | 'HEADING_1' | 'HEADING_2' | 'HEADING_3' | 'HEADING_4' | 'HEADING_5' | 'HEADING_6' | 'HEADING_7' | 'HEADING_8' | 'HEADING_9' | 'TITLE' | 'SUBTITLE'
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateParagraphStyle: {
              range: {
                startIndex,
                endIndex,
              },
              paragraphStyle: {
                namedStyleType: style,
              },
              fields: "namedStyleType",
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

    // For index 0, use append if document is empty
    let insertIndex = index;
    if (index === 0) {
      try {
        const endIndex = await this.getEndIndex(documentId);
        if (endIndex <= 1) {
          insertIndex = endIndex;
        }
      } catch (e) {
        // Continue with original index
      }
    }

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertTable: {
              location: {
                index: insertIndex,
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
