import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DocumentGenerator, createDocument, createSimpleDocument } from '../lib/generators/document';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const testDir = join(__dirname, '../output/test');
const testFile = join(testDir, 'test-document.docx');

describe('DocumentGenerator', () => {
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

  it('should create a basic document', async () => {
    const doc = createDocument({ title: 'Test Document' });
    doc.addParagraph({ text: 'Hello World' });
    
    const result = await doc.generate(testFile);
    
    expect(result).toBe(testFile);
    expect(existsSync(testFile)).toBe(true);
  });

  it('should create document with multiple paragraphs', async () => {
    const doc = createDocument({ title: 'Multi Paragraph' });
    doc.addParagraphs([
      { text: 'First paragraph' },
      { text: 'Second paragraph' },
      { text: 'Third paragraph' },
    ]);
    
    const result = await doc.generate(join(testDir, 'multi-paragraph.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document with headings', async () => {
    const doc = createDocument({ title: 'With Headings' });
    doc.addHeading('Main Title', 1);
    doc.addParagraph({ text: 'Some content' });
    doc.addHeading('Subtitle', 2);
    doc.addParagraph({ text: 'More content' });
    
    const result = await doc.generate(join(testDir, 'with-headings.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document with tables', async () => {
    const doc = createDocument({ title: 'With Table' });
    doc.addParagraph({ text: 'Table below:' });
    doc.addTable({
      rows: [
        { cells: [{ text: 'Name' }, { text: 'Age' }] },
        { cells: [{ text: 'John' }, { text: '30' }] },
        { cells: [{ text: 'Jane' }, { text: '25' }] },
      ],
    });
    
    const result = await doc.generate(join(testDir, 'with-table.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document with formatted text', async () => {
    const doc = createDocument({ title: 'Formatted Text' });
    doc.addParagraph({
      children: [
        { text: 'Bold text', bold: true },
        { text: ' and ' },
        { text: 'italic text', italic: true },
        { text: ' and ' },
        { text: 'underlined', underline: true },
      ],
    });
    
    const result = await doc.generate(join(testDir, 'formatted-text.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document with alignment', async () => {
    const doc = createDocument({ title: 'Alignment' });
    doc.addParagraph({ text: 'Left aligned', alignment: 'left' });
    doc.addParagraph({ text: 'Centered', alignment: 'center' });
    doc.addParagraph({ text: 'Right aligned', alignment: 'right' });
    doc.addParagraph({ text: 'Justified text that should be aligned on both sides', alignment: 'justified' });
    
    const result = await doc.generate(join(testDir, 'alignment.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document with empty lines', async () => {
    const doc = createDocument({ title: 'Empty Lines' });
    doc.addParagraph({ text: 'Before empty lines' });
    doc.addEmptyLines(3);
    doc.addParagraph({ text: 'After empty lines' });
    
    const result = await doc.generate(join(testDir, 'empty-lines.docx'));
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create document as buffer', async () => {
    const doc = createDocument({ title: 'Buffer Test' });
    doc.addParagraph({ text: 'Buffer content' });
    
    const buffer = await doc.toBuffer();
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should create simple document with helper', async () => {
    const result = await createSimpleDocument(
      join(testDir, 'simple-doc.docx'),
      ['Line 1', 'Line 2', 'Line 3']
    );
    
    expect(existsSync(result)).toBe(true);
  });

  it('should create BAST-like document', async () => {
    const doc = createDocument({
      title: 'BAST Document',
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
    });
    
    // Title
    doc.addParagraph({
      text: 'BERITA ACARA SERAH TERIMA',
      bold: true,
      underline: true,
      fontSize: 14,
      alignment: 'center',
    });
    
    // Nomor
    doc.addParagraph({
      text: 'Nomor : 20.002.BAST/PLNE/VI/2024',
      alignment: 'center',
    });
    
    // Project title
    doc.addParagraph({
      text: 'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',
      bold: true,
      fontSize: 12,
      alignment: 'center',
    });
    
    // Intro
    doc.addParagraph({
      text: 'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',
      alignment: 'justified',
    });
    
    // Signatories table
    doc.addTable({
      rows: [
        { cells: [{ text: 'PIHAK PERTAMA', bold: true }, { text: 'PIHAK KEDUA', bold: true }] },
        { cells: [{ text: 'PT PRIMA LAYANAN NASIONAL ENJINIRING' }, { text: 'PT RURA MAS' }] },
        { cells: [{ text: '' }, { text: '' }] }, // Empty row for stamps
        { cells: [{ text: 'AMY MAULANY SETYAMAN', bold: true }, { text: 'NALOANDA', bold: true }] },
        { cells: [{ text: 'VP Project Management Office' }, { text: 'Direktur Utama' }] },
      ],
    });
    
    const result = await doc.generate(join(testDir, 'bast-document.docx'));
    
    expect(existsSync(result)).toBe(true);
  });
});
