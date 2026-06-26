/**
 * Local Spreadsheet Generator
 *
 * Generates XLSX files locally using the xlsx library.
 * No Google Sheets API needed - full control over formatting.
 */

import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

// Types
export interface SpreadsheetOptions {
  title?: string;
  sheetName?: string;
}

export interface CellOptions {
  value: any;
  type?: 'string' | 'number' | 'boolean' | 'date';
  format?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
  border?: {
    top?: { style: string; color?: string };
    bottom?: { style: string; color?: string };
    left?: { style: string; color?: string };
    right?: { style: string; color?: string };
  };
}

export interface ColumnOptions {
  width: number;
  hidden?: boolean;
}

export interface RowOptions {
  height?: number;
  hidden?: boolean;
}

export class SpreadsheetGenerator {
  private workbook: XLSX.WorkBook;
  private sheetName: string;

  constructor(options: SpreadsheetOptions = {}) {
    this.workbook = XLSX.utils.book_new();
    this.sheetName = options.sheetName || 'Sheet1';
    
    // Create default sheet
    const sheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(this.workbook, sheet, this.sheetName);
  }

  /**
   * Set cell value with formatting
   */
  setCell(
    sheetName: string,
    cellRef: string,
    value: any,
    options?: CellOptions
  ): SpreadsheetGenerator {
    let sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      sheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
    }

    // Set value
    XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cellRef });

    // Apply formatting
    if (options) {
      const cell = sheet[cellRef];
      if (cell) {
        cell.t = this.getType(value, options.type);

        // Apply style
        if (!cell.s) {
          cell.s = {};
        }

        // Font styles
        if (options.bold || options.italic || options.underline || options.strikethrough) {
          cell.s.font = {
            bold: options.bold,
            italic: options.italic,
            underline: options.underline ? {} : undefined,
            strike: options.strikethrough,
          };
        }

        // Font size and color
        if (options.fontSize || options.fontColor || options.fontFamily) {
          if (!cell.s.font) cell.s.font = {};
          cell.s.font.sz = options.fontSize;
          cell.s.font.color = options.fontColor ? { rgb: options.fontColor } : undefined;
          cell.s.font.name = options.fontFamily;
        }

        // Background color
        if (options.backgroundColor) {
          cell.s.fill = {
            fgColor: { rgb: options.backgroundColor },
          };
        }

        // Alignment
        if (options.align || options.valign || options.wrap) {
          cell.s.alignment = {
            horizontal: options.align,
            vertical: options.valign,
            wrapText: options.wrap,
          };
        }

        // Border
        if (options.border) {
          cell.s.border = {};
          if (options.border.top) {
            cell.s.border.top = {
              style: options.border.top.style as any,
              color: options.border.top.color ? { rgb: options.border.top.color } : undefined,
            };
          }
          if (options.border.bottom) {
            cell.s.border.bottom = {
              style: options.border.bottom.style as any,
              color: options.border.bottom.color
                ? { rgb: options.border.bottom.color }
                : undefined,
            };
          }
          if (options.border.left) {
            cell.s.border.left = {
              style: options.border.left.style as any,
              color: options.border.left.color
                ? { rgb: options.border.left.color }
                : undefined,
            };
          }
          if (options.border.right) {
            cell.s.border.right = {
              style: options.border.right.style as any,
              color: options.border.right.color
                ? { rgb: options.border.right.color }
                : undefined,
            };
          }
        }

        // Number format
        if (options.format) {
          cell.z = options.format;
        }
      }
    }

    return this;
  }

  /**
   * Set a range of cells
   */
  setRange(
    sheetName: string,
    startCell: string,
    data: any[][],
    options?: CellOptions
  ): SpreadsheetGenerator {
    let sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      sheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
    }

    XLSX.utils.sheet_add_aoa(sheet, data, { origin: startCell });

    // Apply formatting to all cells if provided
    if (options) {
      const range = XLSX.utils.decode_range(startCell);
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
          const cellRef = XLSX.utils.encode_cell({
            r: range.s.r + r,
            c: range.s.c + c,
          });
          this.setCell(sheetName, cellRef, data[r][c], options);
        }
      }
    }

    return this;
  }

  /**
   * Set column widths
   */
  setColumnWidths(sheetName: string, columns: ColumnOptions[]): SpreadsheetGenerator {
    let sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      sheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
    }

    if (!sheet['!cols']) {
      sheet['!cols'] = [];
    }

    columns.forEach((col, i) => {
      sheet['!cols'][i] = {
        wch: col.width,
        hidden: col.hidden,
      };
    });

    return this;
  }

  /**
   * Set row heights
   */
  setRowHeights(sheetName: string, rows: RowOptions[]): SpreadsheetGenerator {
    let sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      sheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
    }

    if (!sheet['!rows']) {
      sheet['!rows'] = [];
    }

    rows.forEach((row, i) => {
      sheet['!rows'][i] = {
        hpt: row.height,
        hidden: row.hidden,
      };
    });

    return this;
  }

  /**
   * Merge cells
   */
  mergeCells(sheetName: string, range: string): SpreadsheetGenerator {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    if (!sheet['!merges']) {
      sheet['!merges'] = [];
    }

    sheet['!merges'].push(XLSX.utils.decode_range(range));

    return this;
  }

  /**
   * Add a new sheet
   */
  addSheet(sheetName: string): SpreadsheetGenerator {
    const sheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(this.workbook, sheet, sheetName);
    return this;
  }

  /**
   * Delete a sheet
   */
  deleteSheet(sheetName: string): SpreadsheetGenerator {
    const sheetIndex = this.workbook.SheetNames.indexOf(sheetName);
    if (sheetIndex !== -1) {
      this.workbook.SheetNames.splice(sheetIndex, 1);
      delete this.workbook.Sheets[sheetName];
    }
    return this;
  }

  /**
   * Rename a sheet
   */
  renameSheet(oldName: string, newName: string): SpreadsheetGenerator {
    const sheetIndex = this.workbook.SheetNames.indexOf(oldName);
    if (sheetIndex !== -1) {
      // Create new sheet with new name
      this.workbook.Sheets[newName] = this.workbook.Sheets[oldName];
      // Update sheet names array
      this.workbook.SheetNames[sheetIndex] = newName;
      // Delete old sheet
      delete this.workbook.Sheets[oldName];
    }
    return this;
  }

  /**
   * Generate the spreadsheet and save to file
   */
  generate(outputPath: string): string {
    // Ensure output directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write file
    XLSX.writeFile(this.workbook, outputPath);

    return outputPath;
  }

  /**
   * Generate the spreadsheet as a buffer
   */
  toBuffer(): Buffer {
    return XLSX.write(this.workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Get the workbook (for advanced operations)
   */
  getWorkbook(): XLSX.WorkBook {
    return this.workbook;
  }

  /**
   * Get a sheet
   */
  getSheet(sheetName: string): XLSX.WorkSheet | undefined {
    return this.workbook.Sheets[sheetName];
  }

  /**
   * Get all sheet names
   */
  getSheetNames(): string[] {
    return this.workbook.SheetNames;
  }

  /**
   * Get cell value
   */
  getCellValue(sheetName: string, cellRef: string): any {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      return undefined;
    }

    const cell = sheet[cellRef];
    return cell?.v;
  }

  /**
   * Get range values
   */
  getRangeValues(sheetName: string, range: string): any[][] {
    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      return [];
    }

    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      range,
      defval: null,
    }) as any[][];
  }

  /**
   * Determine cell type
   */
  private getType(
    value: any,
    explicitType?: 'string' | 'number' | 'boolean' | 'date'
  ): string {
    if (explicitType) {
      switch (explicitType) {
        case 'string':
          return 's';
        case 'number':
          return 'n';
        case 'boolean':
          return 'b';
        case 'date':
          return 'd';
      }
    }

    if (value === null || value === undefined) {
      return 's';
    }

    if (typeof value === 'number') {
      return 'n';
    }

    if (typeof value === 'boolean') {
      return 'b';
    }

    if (value instanceof Date) {
      return 'd';
    }

    return 's';
  }
}

/**
 * Helper function to create a spreadsheet quickly
 */
export function createSpreadsheet(options?: SpreadsheetOptions): SpreadsheetGenerator {
  return new SpreadsheetGenerator(options);
}

/**
 * Quick helper to create a simple spreadsheet from 2D array
 */
export function createSimpleSpreadsheet(
  outputPath: string,
  data: any[][],
  options?: SpreadsheetOptions
): string {
  const spreadsheet = createSpreadsheet(options);
  spreadsheet.setRange(options?.sheetName || 'Sheet1', 'A1', data);
  return spreadsheet.generate(outputPath);
}
