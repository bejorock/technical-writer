/**
 * Google Sheets Client
 *
 * Wrapper around Google Sheets API for spreadsheet operations.
 */

import { sheets_v4 } from "googleapis";
import type { GoogleDocsConfig } from "../../extensions/config";
import { getGoogleClients } from "./auth";

export interface Spreadsheet {
  spreadsheetId: string;
  properties?: {
    title?: string;
  };
  sheets?: Sheet[];
}

export interface Sheet {
  properties?: {
    sheetId?: number;
    title?: string;
    index?: number;
    sheetType?: string;
    gridProperties?: {
      rowCount?: number;
      columnCount?: number;
    };
  };
}

export interface CellData {
  formattedValue?: string;
  effectiveValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
}

export class SheetsClient {
  private config: GoogleDocsConfig;
  private sheets: sheets_v4.Sheets | null = null;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  private async getClient(): Promise<sheets_v4.Sheets> {
    if (!this.sheets) {
      const { sheets } = await getGoogleClients(this.config);
      this.sheets = sheets;
    }
    return this.sheets;
  }

  /**
   * Create a new spreadsheet
   * Note: Uses Drive API for service account compatibility with Shared Drives
   */
  async createSpreadsheet(title: string, folderId?: string): Promise<Spreadsheet> {
    const { drive } = await getGoogleClients(this.config);

    // Use Drive API to create Google Sheet (works with service accounts in Shared Drives)
    const response = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: folderId ? [folderId] : undefined,
      },
      supportsAllDrives: true,
      fields: 'id, name',
    });

    return {
      spreadsheetId: response.data.id!,
      properties: {
        title: response.data.name!,
      },
    } as Spreadsheet;
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheet(spreadsheetId: string): Promise<Spreadsheet> {
    const client = await this.getClient();

    try {
      const response = await client.spreadsheets.get({
        spreadsheetId,
      });

      return response.data as Spreadsheet;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Spreadsheet not found: ${spreadsheetId}`);
      }
      if (error.response?.status === 403) {
        throw new Error(`Permission denied: Cannot access spreadsheet ${spreadsheetId}. Make sure the service account has access.`);
      }
      throw error;
    }
  }

  /**
   * Get spreadsheet values (raw)
   */
  async getValues(
    spreadsheetId: string,
    range: string
  ): Promise<(any[])[]> {
    const client = await this.getClient();

    try {
      const response = await client.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid range: ${range}. Use A1 notation (e.g., A1:B10).`);
      }
      throw error;
    }
  }

  /**
   * Get spreadsheet values (formatted)
   */
  async getFormattedValues(
    spreadsheetId: string,
    range: string
  ): Promise<(string[])[]> {
    const client = await this.getClient();

    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "FORMATTED_VALUE",
    });

    return (response.data.values || []) as string[][];
  }

  /**
   * Write values to a range
   */
  async updateValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    valueInputOption: string = "USER_ENTERED"
  ): Promise<{ updatedCells: number }> {
    const client = await this.getClient();

    try {
      const response = await client.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption,
        requestBody: {
          values,
        },
      });

      return {
        updatedCells: response.data.updatedCells || 0,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid range or values: ${error.response?.data?.error?.message}`);
      }
      throw error;
    }
  }

  /**
   * Append rows after last data row
   */
  async appendValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    valueInputOption: string = "USER_ENTERED"
  ): Promise<{ updatedCells: number }> {
    const client = await this.getClient();

    const response = await client.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });

    return {
      updatedCells: response.data.updates?.updatedCells || 0,
    };
  }

  /**
   * Clear values in a range
   */
  async clearValues(
    spreadsheetId: string,
    range: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
  }

  /**
   * Batch update spreadsheet
   */
  async batchUpdate(
    spreadsheetId: string,
    requests: sheets_v4.Schema$Request[]
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests,
      },
    });
  }

  /**
   * Add a new sheet tab
   */
  async addSheet(
    spreadsheetId: string,
    title: string
  ): Promise<number> {
    const client = await this.getClient();

    const response = await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title,
              },
            },
          },
        ],
      },
    });

    const sheetId = response.data.replies?.[0].addSheet?.properties?.sheetId;
    return sheetId || 0;
  }

  /**
   * Delete a sheet tab
   */
  async deleteSheet(
    spreadsheetId: string,
    sheetId: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId,
            },
          },
        ],
      },
    });
  }

  /**
   * Rename a sheet tab
   */
  async renameSheet(
    spreadsheetId: string,
    sheetId: number,
    newTitle: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
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
   * Set cell formatting
   */
  async formatCells(
    spreadsheetId: string,
    range: string,
    format: {
      backgroundColor?: string;
      textFormat?: {
        bold?: boolean;
        italic?: boolean;
        fontFamily?: string;
        fontSize?: number;
        foregroundColor?: string;
      };
      horizontalAlignment?: string;
      textFormatOption?: string;
    }
  ): Promise<void> {
    const client = await this.getClient();

    const cellFormat: sheets_v4.Schema$CellData = {};

    if (format.backgroundColor) {
      cellFormat.userEnteredFormat = {
        backgroundColor: this.parseColor(format.backgroundColor),
      };
    }

    if (format.textFormat) {
      if (!cellFormat.userEnteredFormat) {
        cellFormat.userEnteredFormat = {};
      }
      cellFormat.userEnteredFormat.textFormat = {};
      if (format.textFormat.bold)
        cellFormat.userEnteredFormat.textFormat.bold = format.textFormat.bold;
      if (format.textFormat.italic)
        cellFormat.userEnteredFormat.textFormat.italic = format.textFormat.italic;
      if (format.textFormat.fontFamily)
        cellFormat.userEnteredFormat.textFormat.fontFamily =
          format.textFormat.fontFamily;
      if (format.textFormat.fontSize)
        cellFormat.userEnteredFormat.textFormat.fontSize =
          format.textFormat.fontSize;
      if (format.textFormat.foregroundColor) {
        cellFormat.userEnteredFormat.textFormat.foregroundColor = this.parseColor(
          format.textFormat.foregroundColor
        );
      }
    }

    if (format.horizontalAlignment) {
      if (!cellFormat.userEnteredFormat) {
        cellFormat.userEnteredFormat = {};
      }
      cellFormat.userEnteredFormat.horizontalAlignment =
        format.horizontalAlignment as any;
    }

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: this.parseA1Range(range),
              cell: cellFormat,
              fields: "userEnteredFormat",
            },
          },
        ],
      },
    });
  }

  /**
   * Merge cells
   */
  async mergeCells(
    spreadsheetId: string,
    range: string,
    mergeType: string = "MERGE_ALL"
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            mergeCells: {
              range: this.parseA1Range(range),
              mergeType: mergeType as any,
            },
          },
        ],
      },
    });
  }

  /**
   * Unmerge cells
   */
  async unmergeCells(
    spreadsheetId: string,
    range: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            unmergeCells: {
              range: this.parseA1Range(range),
            },
          },
        ],
      },
    });
  }

  /**
   * Insert rows
   */
  async insertRows(
    spreadsheetId: string,
    sheetId: number,
    startIndex: number,
    count: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex,
                endIndex: startIndex + count,
              },
              inheritFromBefore: false,
            },
          },
        ],
      },
    });
  }

  /**
   * Insert columns
   */
  async insertColumns(
    spreadsheetId: string,
    sheetId: number,
    startIndex: number,
    count: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex,
                endIndex: startIndex + count,
              },
              inheritFromBefore: false,
            },
          },
        ],
      },
    });
  }

  /**
   * Delete rows
   */
  async deleteRows(
    spreadsheetId: string,
    sheetId: number,
    startIndex: number,
    count: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex,
                endIndex: startIndex + count,
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Delete columns
   */
  async deleteColumns(
    spreadsheetId: string,
    sheetId: number,
    startIndex: number,
    count: number
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex,
                endIndex: startIndex + count,
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Add note to cell
   */
  async addNote(
    spreadsheetId: string,
    sheetId: number,
    row: number,
    column: number,
    note: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateCells: {
              start: {
                sheetId,
                rowIndex: row,
                columnIndex: column,
              },
              rows: [
                {
                  values: [
                    {
                      note,
                    },
                  ],
                },
              ],
              fields: "note",
            },
          },
        ],
      },
    });
  }

  /**
   * Protect a range
   */
  async protectRange(
    spreadsheetId: string,
    range: string,
    description?: string
  ): Promise<void> {
    const client = await this.getClient();

    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addProtectedRange: {
              protectedRange: {
                range: this.parseA1Range(range),
                description: description || "Protected range",
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Helper: Parse A1 notation to GridRange
   */
  private parseA1Range(range: string): sheets_v4.Schema$GridRange {
    // Simple A1 notation parser
    // Format: "Sheet1!A1:B10" or "A1:B10"
    let sheetName = "";
    let cellRange = range;

    if (range.includes("!")) {
      [sheetName, cellRange] = range.split("!");
    }

    const [start, end] = cellRange.split(":");
    const startCol = this.columnLetterToIndex(start.replace(/[0-9]/g, ""));
    const startRow = parseInt(start.replace(/[A-Z]/gi, "")) - 1;
    const endCol = this.columnLetterToIndex(end?.replace(/[0-9]/g, "") || start.replace(/[0-9]/g, ""));
    const endRow = parseInt(end?.replace(/[A-Z]/gi, "") || start.replace(/[A-Z]/gi, "")) - 1;

    return {
      sheetId: 0, // Default to first sheet
      startRowIndex: startRow,
      endRowIndex: endRow + 1,
      startColumnIndex: startCol,
      endColumnIndex: endCol + 1,
    };
  }

  /**
   * Helper: Convert column letter to index (A=0, B=1, etc.)
   */
  private columnLetterToIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Helper: Parse color string to Color object
   */
  private parseColor(
    color: string
  ): { red?: number; green?: number; blue?: number } {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return { red: r, green: g, blue: b };
    }

    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        red: parseInt(rgbMatch[1]) / 255,
        green: parseInt(rgbMatch[2]) / 255,
        blue: parseInt(rgbMatch[3]) / 255,
      };
    }

    return { red: 0, green: 0, blue: 0 };
  }
}
