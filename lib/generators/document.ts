/**
 * Local Document Generator
 *
 * Generates DOCX files locally using the docx library.
 * No Google Docs API needed - full control over formatting.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  IParagraphOptions,
  IRunOptions,
  ITableOptions,
} from 'docx';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Types
export interface DocumentOptions {
  title?: string;
  fontSize?: number;
  font?: string;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface ParagraphOptions {
  text?: string;
  children?: TextRunOptions[];
  alignment?: 'left' | 'center' | 'right' | 'justified';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  font?: string;
  spacing?: {
    before?: number;
    after?: number;
    line?: number;
  };
  indent?: {
    firstLine?: number;
    left?: number;
    right?: number;
  };
  tabStops?: Array<{
    type: 'left' | 'center' | 'right';
    position: number;
  }>;
}

export interface TextRunOptions {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  font?: string;
  superScript?: boolean;
  subScript?: boolean;
}

export interface TableOptions {
  rows: TableRowOptions[];
  columnWidths?: number[];
  columnWidthType?: 'percentage' | 'dxa' | 'inches';
}

export interface TableRowOptions {
  cells: TableCellOptions[];
}

export interface TableCellOptions {
  text?: string;
  children?: ParagraphOptions[];
  width?: number;
  widthType?: 'percentage' | 'dxa' | 'inches';
  verticalAlign?: 'top' | 'center' | 'bottom';
  shading?: string;
  bold?: boolean;
  font?: string;
}

export class DocumentGenerator {
  private paragraphs: Paragraph[] = [];
  private options: DocumentOptions;

  constructor(options: DocumentOptions = {}) {
    this.options = {
      title: 'Document',
      fontSize: 11,
      font: 'Arial',
      margins: {
        top: 1,
        right: 1,
        bottom: 1,
        left: 1,
      },
      ...options,
    };
  }

  /**
   * Add a paragraph to the document
   */
  addParagraph(options: ParagraphOptions): DocumentGenerator {
    const paragraph = this.createParagraph(options);
    this.paragraphs.push(paragraph);
    return this;
  }

  /**
   * Add multiple paragraphs
   */
  addParagraphs(options: ParagraphOptions[]): DocumentGenerator {
    for (const option of options) {
      this.addParagraph(option);
    }
    return this;
  }

  /**
   * Add a heading
   */
  addHeading(text: string, level: 1 | 2 | 3 | 4 = 1): DocumentGenerator {
    this.paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: (5 - level) * 4, // 36, 32, 28, 24 half-points
            font: this.options.font,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
      })
    );
    return this;
  }

  /**
   * Add a table
   */
  addTable(options: TableOptions): DocumentGenerator {
    const table = this.createTable(options);
    this.paragraphs.push(table);
    return this;
  }

  /**
   * Add empty lines
   */
  addEmptyLines(count: number = 1): DocumentGenerator {
    for (let i = 0; i < count; i++) {
      this.paragraphs.push(new Paragraph({ children: [] }));
    }
    return this;
  }

  /**
   * Add a page break
   */
  addPageBreak(): DocumentGenerator {
    this.paragraphs.push(
      new Paragraph({
        children: [],
        pageBreakBefore: true,
      })
    );
    return this;
  }

  /**
   * Generate the document and save to file
   */
  async generate(outputPath: string): Promise<string> {
    // Ensure output directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(this.options.margins?.top ?? 1),
                right: convertInchesToTwip(this.options.margins?.right ?? 1),
                bottom: convertInchesToTwip(this.options.margins?.bottom ?? 1),
                left: convertInchesToTwip(this.options.margins?.left ?? 1),
              },
            },
          },
          children: this.paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    writeFileSync(outputPath, buffer);

    return outputPath;
  }

  /**
   * Generate the document as a buffer (without saving)
   */
  async toBuffer(): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(this.options.margins?.top ?? 1),
                right: convertInchesToTwip(this.options.margins?.right ?? 1),
                bottom: convertInchesToTwip(this.options.margins?.bottom ?? 1),
                left: convertInchesToTwip(this.options.margins?.left ?? 1),
              },
            },
          },
          children: this.paragraphs,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Create a Paragraph from options
   */
  private createParagraph(options: ParagraphOptions): Paragraph {
    const children: TextRun[] = [];

    if (options.children) {
      for (const child of options.children) {
        children.push(this.createTextRun(child));
      }
    } else if (options.text) {
      children.push(
        this.createTextRun({
          text: options.text,
          bold: options.bold,
          italic: options.italic,
          underline: options.underline,
          fontSize: options.fontSize,
          font: options.font,
        })
      );
    }

    // Convert alignment
    let alignment: AlignmentType | undefined;
    switch (options.alignment) {
      case 'left':
        alignment = AlignmentType.LEFT;
        break;
      case 'center':
        alignment = AlignmentType.CENTER;
        break;
      case 'right':
        alignment = AlignmentType.RIGHT;
        break;
      case 'justified':
        alignment = AlignmentType.JUSTIFIED;
        break;
    }

    // Convert spacing
    const spacing: any = {};
    if (options.spacing?.before !== undefined) {
      spacing.before = options.spacing.before * 20; // Convert to twips
    }
    if (options.spacing?.after !== undefined) {
      spacing.after = options.spacing.after * 20;
    }
    if (options.spacing?.line !== undefined) {
      spacing.line = options.spacing.line * 240; // Convert to twips (240 = single line)
    }

    // Convert indent
    const indent: any = {};
    if (options.indent?.firstLine !== undefined) {
      indent.firstLine = convertInchesToTwip(options.indent.firstLine);
    }
    if (options.indent?.left !== undefined) {
      indent.left = convertInchesToTwip(options.indent.left);
    }
    if (options.indent?.right !== undefined) {
      indent.right = convertInchesToTwip(options.indent.right);
    }

    // Convert tab stops
    const tabStops = options.tabStops?.map((ts) => ({
      type:
        ts.type === 'center'
          ? TabStopType.CENTER
          : ts.type === 'right'
          ? TabStopType.RIGHT
          : TabStopType.LEFT,
      position: convertInchesToTwip(ts.position),
    }));

    return new Paragraph({
      children,
      alignment,
      spacing: Object.keys(spacing).length > 0 ? spacing : undefined,
      indent: Object.keys(indent).length > 0 ? indent : undefined,
      tabStops,
    });
  }

  /**
   * Create a TextRun from options
   */
  private createTextRun(options: TextRunOptions): TextRun {
    return new TextRun({
      text: options.text,
      bold: options.bold,
      italics: options.italic,
      underline: options.underline ? {} : undefined,
      strike: options.strikethrough,
      size: options.fontSize ? options.fontSize * 2 : undefined, // Convert to half-points
      font: options.font || this.options.font,
      superScript: options.superScript,
      subScript: options.subScript,
    });
  }

  /**
   * Create a Table from options
   */
  private createTable(options: TableOptions): Table {
    const rows = options.rows.map(
      (rowOptions) =>
        new TableRow({
          children: rowOptions.cells.map((cellOptions) =>
            this.createTableCell(cellOptions)
          ),
        })
    );

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });
  }

  /**
   * Create a TableCell from options
   */
  private createTableCell(options: TableCellOptions): TableCell {
    const children: Paragraph[] = [];

    if (options.children) {
      for (const child of options.children) {
        children.push(this.createParagraph(child));
      }
    } else if (options.text) {
      children.push(
        this.createParagraph({
          text: options.text,
          bold: options.bold,
          font: options.font,
          alignment: 'center',
        })
      );
    } else {
      children.push(new Paragraph({ children: [] }));
    }

    // Convert vertical align
    let verticalAlign: VerticalAlign | undefined;
    switch (options.verticalAlign) {
      case 'top':
        verticalAlign = VerticalAlign.TOP;
        break;
      case 'center':
        verticalAlign = VerticalAlign.CENTER;
        break;
      case 'bottom':
        verticalAlign = VerticalAlign.BOTTOM;
        break;
    }

    // Calculate width
    let width: number | undefined;
    let widthType: WidthType | undefined;

    if (options.width !== undefined) {
      width = options.width;
      switch (options.widthType) {
        case 'percentage':
          widthType = WidthType.PERCENTAGE;
          break;
        case 'dxa':
          widthType = WidthType.DXA;
          break;
        case 'inches':
          widthType = WidthType.INCH;
          break;
        default:
          widthType = WidthType.PERCENTAGE;
      }
    }

    return new TableCell({
      children,
      width: width !== undefined ? { size: width, type: widthType! } : undefined,
      verticalAlign,
    });
  }
}

/**
 * Helper function to create a document quickly
 */
export function createDocument(options?: DocumentOptions): DocumentGenerator {
  return new DocumentGenerator(options);
}

/**
 * Quick helper to create a simple document with text
 */
export async function createSimpleDocument(
  outputPath: string,
  content: string[],
  options?: DocumentOptions
): Promise<string> {
  const doc = createDocument(options);

  for (const line of content) {
    doc.addParagraph({ text: line, alignment: 'justified' });
  }

  return doc.generate(outputPath);
}
