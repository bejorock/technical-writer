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
   * Create a bulleted (unordered) list
   * Inserts a bullet list item at the given index with optional nesting level
   */
  async createBulletList(
    documentId: string,
    text: string,
    index: number,
    nestingLevel?: number
  ): Promise<void> {
    const client = await this.getClient();
    const endIndex = (await this.getDocument(documentId)).body?.content?.slice(-1)[0]?.endIndex || 1;
    const insertIndex = index === 0 ? endIndex - 1 : index;

    // Insert the text with a newline
    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: insertIndex,
              },
              text: text + '\n',
            },
          },
          {
            createParagraphBullets: {
              range: {
                startIndex: insertIndex,
                endIndex: insertIndex + text.length + 1,
              },
              bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
            },
          },
        ],
      },
    });

    // Apply nesting level if specified
    if (nestingLevel && nestingLevel > 0) {
      await client.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              updateParagraphStyle: {
                range: {
                  startIndex: insertIndex,
                  endIndex: insertIndex + text.length + 1,
                },
                paragraphStyle: {
                  indentStart: {
                    magnitude: nestingLevel * 36,
                    unit: 'PT',
                  },
                },
                fields: 'indentStart',
              },
            },
          ],
        },
      });
    }
  }

  /**
   * Create a numbered (ordered) list
   * Inserts a numbered list item at the given index with optional nesting level
   */
  async createNumberedList(
    documentId: string,
    text: string,
    index: number,
    nestingLevel?: number
  ): Promise<void> {
    const client = await this.getClient();
    const endIndex = (await this.getDocument(documentId)).body?.content?.slice(-1)[0]?.endIndex || 1;
    const insertIndex = index === 0 ? endIndex - 1 : index;

    // Insert the text with a newline
    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: insertIndex,
              },
              text: text + '\n',
            },
          },
          {
            createParagraphBullets: {
              range: {
                startIndex: insertIndex,
                endIndex: insertIndex + text.length + 1,
              },
              bulletPreset: 'NUMBERED_DECIMAL_ALPHA_ROMAN',
            },
          },
        ],
      },
    });

    // Apply nesting level if specified
    if (nestingLevel && nestingLevel > 0) {
      await client.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              updateParagraphStyle: {
                range: {
                  startIndex: insertIndex,
                  endIndex: insertIndex + text.length + 1,
                },
                paragraphStyle: {
                  indentStart: {
                    magnitude: nestingLevel * 36,
                    unit: 'PT',
                  },
                },
                fields: 'indentStart',
              },
            },
          ],
        },
      });
    }
  }

  /**
   * Remove list formatting from a paragraph
   * Converts a list item back to normal text
   */
  async removeListFormatting(
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
            deleteParagraphBullets: {
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
   * Set the nesting level of a list item
   * Adjusts the indentation to create nested lists
   */
  async setListNestingLevel(
    documentId: string,
    startIndex: number,
    endIndex: number,
    nestingLevel: number
  ): Promise<void> {
    const client = await this.getClient();
    const indentMagnitude = nestingLevel * 36; // 36pt per level

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
                indentStart: {
                  magnitude: indentMagnitude,
                  unit: 'PT',
                },
              },
              fields: 'indentStart',
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

  // ============================================
  // Header and Footer Methods
  // ============================================

  /**
   * Create a header in a document
   * @param documentId - The document ID
   * @param type - Header type: 'DEFAULT', 'HEADER_EVEN', 'HEADER_ODD', 'FIRST_PAGE_HEADER'
   * @returns The created header ID
   */
  async createHeader(
    documentId: string,
    type: 'DEFAULT' | 'HEADER_EVEN' | 'HEADER_ODD' | 'FIRST_PAGE_HEADER' = 'DEFAULT'
  ): Promise<{ headerId: string }> {
    const client = await this.getClient();

    const response = await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            createHeader: {
              sectionBreakLocation: {
                index: 0,
              },
              type: type as any,
            },
          },
        ],
      },
    });

    const headerId = response.data.replies?.[0]?.createHeader?.headerId;
    if (!headerId) {
      throw new Error('Failed to create header: No headerId returned');
    }

    return { headerId };
  }

  /**
   * Create a footer in a document
   * @param documentId - The document ID
   * @param type - Footer type: 'DEFAULT', 'FOOTER_EVEN', 'FOOTER_ODD', 'FIRST_PAGE_FOOTER'
   * @returns The created footer ID
   */
  async createFooter(
    documentId: string,
    type: 'DEFAULT' | 'FOOTER_EVEN' | 'FOOTER_ODD' | 'FIRST_PAGE_FOOTER' = 'DEFAULT'
  ): Promise<{ footerId: string }> {
    const client = await this.getClient();

    const response = await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            createFooter: {
              type: type as any,
            },
          },
        ],
      },
    });

    const footerId = response.data.replies?.[0]?.createFooter?.footerId;
    if (!footerId) {
      throw new Error('Failed to create footer: No footerId returned');
    }

    return { footerId };
  }

  /**
   * Get all headers from a document
   * @param documentId - The document ID
   * @returns Map of header IDs to Header objects
   */
  async getHeaders(documentId: string): Promise<Record<string, any>> {
    const client = await this.getClient();

    const response = await client.documents.get({
      documentId,
      fields: 'headers',
    });

    return response.data.headers || {};
  }

  /**
   * Get all footers from a document
   * @param documentId - The document ID
   * @returns Map of footer IDs to Footer objects
   */
  async getFooters(documentId: string): Promise<Record<string, any>> {
    const client = await this.getClient();

    const response = await client.documents.get({
      documentId,
      fields: 'footers',
    });

    return response.data.footers || {};
  }

  /**
   * Delete a header from a document
   * @param documentId - The document ID
   * @param headerId - The header ID to delete
   */
  async deleteHeader(
    documentId: string,
    headerId: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteHeader: {
              headerId,
            },
          },
        ],
      },
    });
  }

  /**
   * Delete a footer from a document
   * @param documentId - The document ID
   * @param footerId - The footer ID to delete
   */
  async deleteFooter(
    documentId: string,
    footerId: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteFooter: {
              footerId,
            },
          },
        ],
      },
    });
  }

  /**
   * Insert text into a header
   * @param documentId - The document ID
   * @param headerId - The header ID
   * @param text - The text to insert
   * @param index - Position in the header (default 0)
   */
  async insertTextToHeader(
    documentId: string,
    headerId: string,
    text: string,
    index: number = 0
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                segmentId: headerId,
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
   * Insert text into a footer
   * @param documentId - The document ID
   * @param footerId - The footer ID
   * @param text - The text to insert
   * @param index - Position in the footer (default 0)
   */
  async insertTextToFooter(
    documentId: string,
    footerId: string,
    text: string,
    index: number = 0
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                segmentId: footerId,
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
   * Clear all content from a header
   * @param documentId - The document ID
   * @param headerId - The header ID
   */
  async clearHeader(
    documentId: string,
    headerId: string
  ): Promise<void> {
    const client = await this.getClient();

    // First, get the header content to find the range to delete
    const headers = await this.getHeaders(documentId);
    const header = headers[headerId];

    if (header?.content) {
      const endIndex = header.content.slice(-1)[0]?.endIndex || 1;
      if (endIndex > 1) {
        await client.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex: 1,
                    endIndex: endIndex - 1,
                    segmentId: headerId,
                  },
                },
              },
            ],
          },
        });
      }
    }
  }

  /**
   * Clear all content from a footer
   * @param documentId - The document ID
   * @param footerId - The footer ID
   */
  async clearFooter(
    documentId: string,
    footerId: string
  ): Promise<void> {
    const client = await this.getClient();

    // First, get the footer content to find the range to delete
    const footers = await this.getFooters(documentId);
    const footer = footers[footerId];

    if (footer?.content) {
      const endIndex = footer.content.slice(-1)[0]?.endIndex || 1;
      if (endIndex > 1) {
        await client.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex: 1,
                    endIndex: endIndex - 1,
                    segmentId: footerId,
                  },
                },
              },
            ],
          },
        });
      }
    }
  }

  /**
   * Replace all text in a header
   * @param documentId - The document ID
   * @param headerId - The header ID
   * @param newText - The new text content
   */
  async replaceHeaderText(
    documentId: string,
    headerId: string,
    newText: string
  ): Promise<void> {
    // Clear the header first, then insert new text
    await this.clearHeader(documentId, headerId);
    await this.insertTextToHeader(documentId, headerId, newText);
  }

  /**
   * Replace all text in a footer
   * @param documentId - The document ID
   * @param footerId - The footer ID
   * @param newText - The new text content
   */
  async replaceFooterText(
    documentId: string,
    footerId: string,
    newText: string
  ): Promise<void> {
    // Clear the footer first, then insert new text
    await this.clearFooter(documentId, footerId);
    await this.insertTextToFooter(documentId, footerId, newText);
  }

  /**
   * Format text in a header
   * @param documentId - The document ID
   * @param headerId - The header ID
   * @param startIndex - Start of text range in header
   * @param endIndex - End of text range in header
   * @param format - Text formatting options
   */
  async formatHeaderText(
    documentId: string,
    headerId: string,
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
    if (format.strikethrough !== undefined) textStyle.strikethrough = format.strikethrough;

    if (format.fontFamily) {
      textStyle.weightedFontFamily = {
        fontFamily: format.fontFamily,
      };
    }

    if (format.fontSize) {
      textStyle.fontSize = {
        magnitude: format.fontSize,
        unit: 'PT',
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
      .join(',');

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateTextStyle: {
              range: {
                startIndex,
                endIndex,
                segmentId: headerId,
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
   * Format text in a footer
   * @param documentId - The document ID
   * @param footerId - The footer ID
   * @param startIndex - Start of text range in footer
   * @param endIndex - End of text range in footer
   * @param format - Text formatting options
   */
  async formatFooterText(
    documentId: string,
    footerId: string,
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
    if (format.strikethrough !== undefined) textStyle.strikethrough = format.strikethrough;

    if (format.fontFamily) {
      textStyle.weightedFontFamily = {
        fontFamily: format.fontFamily,
      };
    }

    if (format.fontSize) {
      textStyle.fontSize = {
        magnitude: format.fontSize,
        unit: 'PT',
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
      .join(',');

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateTextStyle: {
              range: {
                startIndex,
                endIndex,
                segmentId: footerId,
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
   * Set paragraph alignment in a header
   * @param documentId - The document ID
   * @param headerId - The header ID
   * @param startIndex - Start of paragraph range in header
   * @param endIndex - End of paragraph range in header
   * @param alignment - Text alignment
   */
  async setHeaderAlignment(
    documentId: string,
    headerId: string,
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
                segmentId: headerId,
              },
              paragraphStyle: {
                alignment: alignment as any,
              },
              fields: 'alignment',
            },
          },
        ],
      },
    });
  }

  /**
   * Set paragraph alignment in a footer
   * @param documentId - The document ID
   * @param footerId - The footer ID
   * @param startIndex - Start of paragraph range in footer
   * @param endIndex - End of paragraph range in footer
   * @param alignment - Text alignment
   */
  async setFooterAlignment(
    documentId: string,
    footerId: string,
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
                segmentId: footerId,
              },
              paragraphStyle: {
                alignment: alignment as any,
              },
              fields: 'alignment',
            },
          },
        ],
      },
    });
  }

  /**
   * Set the starting page number for a section
   * Note: Page number fields (AutoText) cannot be inserted via the API.
   * Use this method to set the starting number, then add page numbers via UI.
   * @param documentId - The document ID
   * @param pageNumberStart - The starting page number (1-based)
   */
  async setPageNumberStart(
    documentId: string,
    pageNumberStart: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateDocumentStyle: {
              documentStyle: {
                pageNumberStart: pageNumberStart,
              },
              fields: "pageNumberStart",
            },
          },
        ],
      },
    });
  }

  /**
   * Enable or disable first page header/footer
   * @param documentId - The document ID
   * @param useFirstPageHeaderFooter - Whether to use different first page header/footer
   */
  async setUseFirstPageHeaderFooter(
    documentId: string,
    useFirstPageHeaderFooter: boolean
  ): Promise<void> {
    const client = await this.getClient();

    await client.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            updateDocumentStyle: {
              documentStyle: {
                useFirstPageHeaderFooter: useFirstPageHeaderFooter,
              },
              fields: "useFirstPageHeaderFooter",
            },
          },
        ],
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
