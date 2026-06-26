---
name: xlsx-creation
description: |
  Create Excel spreadsheets (.xlsx) using the xlsx library (SheetJS) in TypeScript.
  Supports cells, ranges, multiple sheets, formatting, merged cells, and more.
  Use when the user asks to create or generate an XLSX file.
---

# XLSX Creation Skill

## Overview

This skill teaches you how to create Excel spreadsheets (.xlsx) using the `xlsx` library in TypeScript/JavaScript.

## Prerequisites

The `xlsx` library (SheetJS) is already installed in this project. You can use it directly.

## Basic Usage

### 1. Simple Spreadsheet

```typescript
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet with data
const data = [
  ['Name', 'Age', 'City'],
  ['John', 30, 'New York'],
  ['Jane', 25, 'London'],
];
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

// Save file
XLSX.writeFile(workbook, './output/my-spreadsheet.xlsx');
```

### 2. Spreadsheet with Formatting

```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.utils.book_new();

// Create worksheet
const data = [
  ['Product', 'Quantity', 'Price', 'Total'],
  ['Widget A', 10, 9.99, 99.90],
  ['Widget B', 5, 19.99, 99.95],
  ['Total', '', '', 199.85],
];
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Apply formatting
const range = XLSX.utils.decode_range('A1:D1');
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = worksheet[cellRef];
  if (cell) {
    cell.s = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center' },
    };
  }
}

// Set column widths
worksheet['!cols'] = [
  { wch: 20 }, // Column A
  { wch: 15 }, // Column B
  { wch: 15 }, // Column C
  { wch: 15 }, // Column D
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
XLSX.writeFile(workbook, './output/formatted.xlsx');
```

### 3. Multiple Sheets

```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.utils.book_new();

// Sheet 1
const data1 = [['January', 'February', 'March'], [100, 200, 300]];
const worksheet1 = XLSX.utils.aoa_to_sheet(data1);
XLSX.utils.book_append_sheet(workbook, worksheet1, 'Q1');

// Sheet 2
const data2 = [['April', 'May', 'June'], [400, 500, 600]];
const worksheet2 = XLSX.utils.aoa_to_sheet(data2);
XLSX.utils.book_append_sheet(workbook, worksheet2, 'Q2');

// Sheet 3
const data3 = [['July', 'August', 'September'], [700, 800, 900]];
const worksheet3 = XLSX.utils.aoa_to_sheet(data3);
XLSX.utils.book_append_sheet(workbook, worksheet3, 'Q3');

XLSX.writeFile(workbook, './output/multiple-sheets.xlsx');
```

### 4. Merged Cells

```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.utils.book_new();

const data = [
  ['Sales Report', '', ''],
  ['Product', 'Q1', 'Q2'],
  ['Widget A', 100, 200],
  ['Widget B', 150, 250],
];
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Merge cells A1:C1
worksheet['!merges'] = [
  XLSX.utils.decode_range('A1:C1'),
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
XLSX.writeFile(workbook, './output/merged.xlsx');
```

### 5. Reading Existing Files

```typescript
import * as XLSX from 'xlsx';

// Read from file
const workbook = XLSX.readFile('./input/existing.xlsx');

// Get first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(data);

// Convert to 2D array
const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log(arrayData);
```

## Helper Functions

Here are some helper functions to make spreadsheet creation easier:

```typescript
import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

interface CellOptions {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
  numberFormat?: string;
}

// Helper to create a spreadsheet
function createSpreadsheet() {
  return XLSX.utils.book_new();
}

// Helper to add a worksheet
function addWorksheet(workbook: XLSX.WorkBook, name: string, data: any[][], options: {
  boldFirstRow?: boolean;
  columnWidths?: number[];
} = {}) {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Apply formatting to first row if requested
  if (options.boldFirstRow && data.length > 0) {
    const range = XLSX.utils.decode_range(`A1:${XLSX.utils.encode_col(data[0].length - 1)}1`);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true },
        };
      }
    }
  }
  
  // Set column widths
  if (options.columnWidths) {
    worksheet['!cols'] = options.columnWidths.map(w => ({ wch: w }));
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
  return worksheet;
}

// Helper to set cell value with formatting
function setCell(worksheet: XLSX.WorkSheet, cellRef: string, value: any, options: CellOptions = {}) {
  // Set value
  XLSX.utils.sheet_add_aoa(worksheet, [[value]], { origin: cellRef });
  
  // Apply formatting
  const cell = worksheet[cellRef];
  if (cell && (options.bold || options.italic || options.fontSize || options.backgroundColor || options.align)) {
    cell.s = {
      font: {
        bold: options.bold,
        italic: options.italic,
        sz: options.fontSize,
        color: options.fontColor ? { rgb: options.fontColor } : undefined,
      },
      fill: options.backgroundColor ? { fgColor: { rgb: options.backgroundColor } } : undefined,
      alignment: options.align ? { horizontal: options.align } : undefined,
    };
  }
  
  // Apply number format
  if (options.numberFormat) {
    cell.z = options.numberFormat;
  }
  
  return cell;
}

// Helper to merge cells
function mergeCells(worksheet: XLSX.WorkSheet, range: string) {
  if (!worksheet['!merges']) {
    worksheet['!merges'] = [];
  }
  worksheet['!merges'].push(XLSX.utils.decode_range(range));
}

// Helper to save spreadsheet
function saveSpreadsheet(workbook: XLSX.WorkBook, outputPath: string) {
  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  XLSX.writeFile(workbook, outputPath);
  return outputPath;
}
```

## Upload to Google Drive

After creating a spreadsheet locally, use the `google_drive` tool to upload it:

```typescript
// 1. Create spreadsheet locally
const workbook = createSpreadsheet();
addWorksheet(workbook, 'Data', [['A', 'B'], [1, 2]], { boldFirstRow: true });
saveSpreadsheet(workbook, './output/my-spreadsheet.xlsx');

// 2. Upload to Google Drive (use the tool)
// google_drive({ operation: "upload", localPath: "./output/my-spreadsheet.xlsx" })
```

## Complete Example: Expense Tracker

Here's a complete example of creating an expense tracker:

```typescript
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

function createExpenseTracker() {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Expense Tracker Summary'],
    [''],
    ['Category', 'Total'],
    ['Food', 500],
    ['Transport', 200],
    ['Utilities', 150],
    ['Entertainment', 100],
    [''],
    ['Total', 950],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Format title
  summarySheet['A1'].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center' },
  };
  
  // Format headers
  ['A3', 'B3'].forEach(ref => {
    summarySheet[ref].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: '4472C4' } },
      font: { color: { rgb: 'FFFFFF' } },
    };
  });
  
  // Format total
  summarySheet['A9'].s = {
    font: { bold: true },
  };
  summarySheet['B9'].s = {
    font: { bold: true },
    numFmt: '$#,##0.00',
  };
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Detail sheet
  const detailData = [
    ['Date', 'Description', 'Category', 'Amount'],
    ['2024-01-01', 'Groceries', 'Food', 50.00],
    ['2024-01-02', 'Gas', 'Transport', 40.00],
    ['2024-01-03', 'Electric Bill', 'Utilities', 75.00],
    ['2024-01-04', 'Movie Tickets', 'Entertainment', 25.00],
    ['2024-01-05', 'Restaurant', 'Food', 80.00],
  ];
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  
  // Format headers
  ['A1', 'B1', 'C1', 'D1'].forEach(ref => {
    detailSheet[ref].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: '4472C4' } },
      font: { color: { rgb: 'FFFFFF' } },
    };
  });
  
  // Format amounts
  for (let row = 1; row < detailData.length; row++) {
    const cell = detailSheet[`D${row + 1}`];
    if (cell) {
      cell.z = '$#,##0.00';
    }
  }
  
  // Set column widths
  detailSheet['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Details');
  
  // Save file
  XLSX.writeFile(workbook, './output/expense-tracker.xlsx');
  console.log("Expense tracker created!");
}

createExpenseTracker();
```

## References

- [SheetJS Documentation](https://docs.sheetjs.com) - Official documentation
- [GitHub Repository](https://github.com/SheetJS/sheetjs) - Source code and examples
- [API Reference](https://docs.sheetjs.com/docs/api/) - Detailed API documentation
