import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SpreadsheetGenerator, createSpreadsheet, createSimpleSpreadsheet } from '../lib/generators/spreadsheet';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const testDir = join(__dirname, '../output/test');
const testFile = join(testDir, 'test-spreadsheet.xlsx');

describe('SpreadsheetGenerator', () => {
  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  it('should create a basic spreadsheet', () => {
    const sheet = createSpreadsheet({ title: 'Test Spreadsheet' });
    sheet.setCell('Sheet1', 'A1', 'Hello');
    
    const result = sheet.generate(testFile);
    
    expect(result).toBe(testFile);
    expect(existsSync(testFile)).toBe(true);
  });

  it('should create spreadsheet with range of data', () => {
    const sheet = createSpreadsheet({ title: 'Range Test' });
    sheet.setRange('Sheet1', 'A1', [
      ['Name', 'Age', 'City'],
      ['John', 30, 'New York'],
      ['Jane', 25, 'London'],
    ]);
    
    const result = sheet.generate(join(testDir, 'range-data.xlsx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create spreadsheet with column widths', () => {
    const sheet = createSpreadsheet({ title: 'Column Widths' });
    sheet.setRange('Sheet1', 'A1', [
      ['Column A', 'Column B', 'Column C'],
      ['Data 1', 'Data 2', 'Data 3'],
    ]);
    sheet.setColumnWidths('Sheet1', [
      { width: 20 },
      { width: 30 },
      { width: 15 },
    ]);
    
    const result = sheet.generate(join(testDir, 'column-widths.xlsx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create spreadsheet with multiple sheets', () => {
    const sheet = createSpreadsheet({ title: 'Multiple Sheets' });
    sheet.setCell('Sheet1', 'A1', 'Sheet 1 Data');
    sheet.addSheet('Sheet2');
    sheet.setCell('Sheet2', 'A1', 'Sheet 2 Data');
    sheet.addSheet('Sheet3');
    sheet.setCell('Sheet3', 'A1', 'Sheet 3 Data');
    
    const result = sheet.generate(join(testDir, 'multiple-sheets.xlsx'));
    
    expect(existsSync(result)).toBe(true);
    expect(sheet.getSheetNames()).toEqual(['Sheet1', 'Sheet2', 'Sheet3']);
  });

  it('should create spreadsheet with merged cells', () => {
    const sheet = createSpreadsheet({ title: 'Merged Cells' });
    sheet.setRange('Sheet1', 'A1', [
      ['Title', '', ''],
      ['Col 1', 'Col 2', 'Col 3'],
      ['Data 1', 'Data 2', 'Data 3'],
    ]);
    sheet.mergeCells('Sheet1', 'A1:C1');
    
    const result = sheet.generate(join(testDir, 'merged-cells.xlsx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should get cell values', () => {
    const sheet = createSpreadsheet({ title: 'Get Values' });
    sheet.setCell('Sheet1', 'A1', 'Hello');
    sheet.setCell('Sheet1', 'B1', 42);
    
    expect(sheet.getCellValue('Sheet1', 'A1')).toBe('Hello');
    expect(sheet.getCellValue('Sheet1', 'B1')).toBe(42);
  });

  it('should get range values', () => {
    const sheet = createSpreadsheet({ title: 'Get Range' });
    sheet.setRange('Sheet1', 'A1', [
      ['A', 'B'],
      ['C', 'D'],
    ]);
    
    const values = sheet.getRangeValues('Sheet1', 'A1:B2');
    
    expect(values).toEqual([['A', 'B'], ['C', 'D']]);
  });

  it('should create spreadsheet as buffer', () => {
    const sheet = createSpreadsheet({ title: 'Buffer Test' });
    sheet.setCell('Sheet1', 'A1', 'Buffer content');
    
    const buffer = sheet.toBuffer();
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should create simple spreadsheet with helper', () => {
    const result = createSimpleSpreadsheet(
      join(testDir, 'simple-sheet.xlsx'),
      [
        ['Name', 'Age'],
        ['John', 30],
        ['Jane', 25],
      ]
    );
    
    expect(existsSync(result)).toBe(true);
  });

  it('should rename sheets', () => {
    const sheet = createSpreadsheet({ title: 'Rename Test' });
    sheet.renameSheet('Sheet1', 'MySheet');
    
    expect(sheet.getSheetNames()).toEqual(['MySheet']);
  });

  it('should delete sheets', () => {
    const sheet = createSpreadsheet({ title: 'Delete Test' });
    sheet.addSheet('ToDelete');
    sheet.deleteSheet('ToDelete');
    
    expect(sheet.getSheetNames()).toEqual(['Sheet1']);
  });

  it('should create BAST-like spreadsheet', () => {
    const sheet = createSpreadsheet({ title: 'BAST Spreadsheet' });
    
    // Title
    sheet.setRange('Sheet1', 'A1', [
      ['BERITA ACARA SERAH TERIMA'],
      ['Nomor : 20.002.BAST/PLNE/VI/2024'],
      [''],
      ['PIHAK PERTAMA', '', 'PIHAK KEDUA'],
      ['PT PRIMA LAYANAN NASIONAL ENJINIRING', '', 'PT RURA MAS'],
      [''],
      ['AMY MAULANY SETYAMAN', '', 'NALOANDA'],
      ['VP Project Management Office', '', 'Direktur Utama'],
    ]);
    
    // Merge title
    sheet.mergeCells('Sheet1', 'A1:A1');
    
    // Format headers
    sheet.setCell('Sheet1', 'A4', 'PIHAK PERTAMA', { bold: true });
    sheet.setCell('Sheet1', 'C4', 'PIHAK KEDUA', { bold: true });
    sheet.setCell('Sheet1', 'A7', 'AMY MAULANY SETYAMAN', { bold: true });
    sheet.setCell('Sheet1', 'C7', 'NALOANDA', { bold: true });
    
    // Set column widths
    sheet.setColumnWidths('Sheet1', [
      { width: 35 },
      { width: 5 },
      { width: 25 },
    ]);
    
    const result = sheet.generate(join(testDir, 'bast-spreadsheet.xlsx'));
    
    expect(existsSync(result)).toBe(true);
  });
});
