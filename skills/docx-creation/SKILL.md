---
name: docx-creation
description: |
  Create Word documents (.docx) using the docx library in TypeScript.
  Supports paragraphs, tables, lists, formatting, page breaks, and more.
  Use when the user asks to create or generate a DOCX file.
---

# DOCX Creation Skill

## Overview

This skill teaches you how to create Word documents (.docx) using the `docx` library in TypeScript/JavaScript.

## Prerequisites

The `docx` library is already installed in this project. You can use it directly.

## Basic Usage

### 1. Simple Document

```typescript
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { writeFileSync } from 'node:fs';

// Create document
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "Hello World",
            bold: true,
          }),
        ],
      }),
    ],
  }],
});

// Generate and save
const buffer = await Packer.toBuffer(doc);
writeFileSync('./output/my-doc.docx', buffer);
```

### 2. Document with Formatting

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      // Title (centered, bold, 14pt)
      new Paragraph({
        children: [
          new TextRun({
            text: "Document Title",
            bold: true,
            underline: {},
            size: 28, // 14pt (half-points)
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      
      // Body text (justified, 1.5 line spacing)
      new Paragraph({
        children: [
          new TextRun({
            text: "This is the body text with justification and 1.5 line spacing.",
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 }, // 1.5 line spacing (240 = single)
      }),
    ],
  }],
});
```

### 3. Document with Tables

```typescript
import { Document, Packer, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      new Table({
        rows: [
          // Header row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Name",
                        bold: true,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Age",
                        bold: true,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          // Data row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "John" }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "30" }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    ],
  }],
});
```

### 4. Document with Lists

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      // Bullet list
      new Paragraph({
        children: [
          new TextRun({ text: "• Item 1" }),
        ],
        indent: { left: convertInchesToTwip(0.5) },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "• Item 2" }),
        ],
        indent: { left: convertInchesToTwip(0.5) },
      }),
      
      // Numbered list
      new Paragraph({
        children: [
          new TextRun({ text: "1. First item" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "2. Second item" }),
        ],
      }),
    ],
  }],
});
```

### 5. Document with Page Breaks

```typescript
import { Document, Packer, Paragraph } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [],
        pageBreakBefore: true, // This adds a page break before
      }),
    ],
  }],
});
```

## Helper Functions

Here are some helper functions to make document creation easier:

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, convertInchesToTwip } from 'docx';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

// Helper to create a document
function createDocument(title: string) {
  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [],
    }],
  });
}

// Helper to add a paragraph
function addParagraph(doc: Document, text: string, options: {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  font?: string;
  alignment?: 'left' | 'center' | 'right' | 'justified';
  spacing?: { before?: number; after?: number; line?: number };
} = {}) {
  const children = [
    new TextRun({
      text,
      bold: options.bold,
      italics: options.italic,
      underline: options.underline ? {} : undefined,
      size: options.fontSize ? options.fontSize * 2 : undefined,
      font: options.font || 'Arial',
    }),
  ];

  const alignmentMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justified: AlignmentType.JUSTIFIED,
  };

  const paragraph = new Paragraph({
    children,
    alignment: options.alignment ? alignmentMap[options.alignment] : undefined,
    spacing: options.spacing,
  });

  doc.sections[0].children.push(paragraph);
  return doc;
}

// Helper to add a table
function addTable(doc: Document, data: string[][], options: {
  boldFirstRow?: boolean;
  alignment?: 'left' | 'center' | 'right';
} = {}) {
  const rows = data.map((row, rowIndex) => {
    const cells = row.map((cell) => {
      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cell,
                bold: rowIndex === 0 && options.boldFirstRow,
              }),
            ],
            alignment: options.alignment === 'center' ? AlignmentType.CENTER : undefined,
          }),
        ],
        width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
      });
    });

    return new TableRow({ children: cells });
  });

  const table = new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  doc.sections[0].children.push(table);
  return doc;
}

// Helper to save document
async function saveDocument(doc: Document, outputPath: string) {
  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outputPath, buffer);
  return outputPath;
}
```

## Upload to Google Drive

After creating a document locally, use the `google_drive` tool to upload it:

```typescript
// 1. Create document locally
const doc = createDocument('My Document');
addParagraph(doc, 'Hello World', { bold: true, alignment: 'center' });
await saveDocument(doc, './output/my-doc.docx');

// 2. Upload to Google Drive (use the tool)
// google_drive({ operation: "upload", localPath: "./output/my-doc.docx" })
```

## Complete Example: BAST Document

Here's a complete example of creating a BAST (Berita Acara Serah Terima) document:

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, convertInchesToTwip } from 'docx';
import { writeFileSync } from 'node:fs';

async function createBAST() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "BERITA ACARA SERAH TERIMA",
              bold: true,
              underline: {},
              size: 28,
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        
        // Nomor
        new Paragraph({
          children: [
            new TextRun({
              text: "Nomor : 20.002.BAST/PLNE/VI/2024",
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // ... more paragraphs ...
        
        // Signatories table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "PIHAK PERTAMA", bold: true }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "PIHAK KEDUA", bold: true }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            // ... more rows ...
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync('./output/BAST.docx', buffer);
  console.log("BAST document created!");
}

createBAST();
```

## References

- [docx.js.org](https://docx.js.org) - Official documentation
- [GitHub Repository](https://github.com/dolanmiu/docx) - Source code and examples
