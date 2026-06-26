import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PDFConverter, convertToPDF, isLibreOfficeAvailable } from '../lib/converters/pdf';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const testDir = join(__dirname, '../output/test');

describe('PDFConverter', () => {
  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    const files = [
      join(testDir, 'test-conversion.pdf'),
      join(testDir, 'test-conversion.docx'),
    ];
    for (const file of files) {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    }
  });

  it('should check if LibreOffice is installed', async () => {
    const converter = new PDFConverter();
    const isInstalled = await converter.isInstalled();
    
    // This test may fail if LibreOffice is not installed
    // For CI/CD, we might want to skip this test
    expect(typeof isInstalled).toBe('boolean');
  });

  it('should get LibreOffice version', async () => {
    const converter = new PDFConverter();
    const version = await converter.getVersion();
    
    // This test may fail if LibreOffice is not installed
    if (version) {
      expect(version).toContain('LibreOffice');
    }
  });

  it('should convert DOCX to PDF', async () => {
    // First create a test DOCX file
    const { DocumentGenerator } = await import('../lib/generators/document');
    const doc = new DocumentGenerator({ title: 'Test Conversion' });
    doc.addParagraph({ text: 'This is a test document for PDF conversion.' });
    
    const docxPath = join(testDir, 'test-conversion.docx');
    await doc.generate(docxPath);
    
    // Check if we have a DOCX file
    expect(existsSync(docxPath)).toBe(true);
    
    // Try to convert to PDF (may fail if LibreOffice is not installed)
    const converter = new PDFConverter();
    const isInstalled = await converter.isInstalled();
    
    if (isInstalled) {
      const result = await converter.convertToPDF(docxPath, {
        outputPath: join(testDir, 'test-conversion.pdf'),
      });
      
      expect(result.success).toBe(true);
      expect(existsSync(result.outputPath)).toBe(true);
    } else {
      console.log('Skipping PDF conversion test - LibreOffice not installed');
    }
  });

  it('should handle non-existent file', async () => {
    const converter = new PDFConverter();
    const result = await converter.convertToPDF('/nonexistent/file.docx');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should convert with helper function', async () => {
    // First create a test DOCX file
    const { DocumentGenerator } = await import('../lib/generators/document');
    const doc = new DocumentGenerator({ title: 'Helper Test' });
    doc.addParagraph({ text: 'This is a test document for the helper function.' });
    
    const docxPath = join(testDir, 'helper-test.docx');
    await doc.generate(docxPath);
    
    // Check if we have a DOCX file
    expect(existsSync(docxPath)).toBe(true);
    
    // Try to convert using helper function
    const isInstalled = await isLibreOfficeAvailable();
    
    if (isInstalled) {
      const result = await convertToPDF(docxPath, {
        outputPath: join(testDir, 'helper-test.pdf'),
      });
      
      expect(result.success).toBe(true);
      expect(existsSync(result.outputPath)).toBe(true);
    } else {
      console.log('Skipping helper conversion test - LibreOffice not installed');
    }
  });

  it('should convert with different quality settings', async () => {
    // First create a test DOCX file
    const { DocumentGenerator } = await import('../lib/generators/document');
    const doc = new DocumentGenerator({ title: 'Quality Test' });
    doc.addParagraph({ text: 'This is a test document for quality settings.' });
    
    const docxPath = join(testDir, 'quality-test.docx');
    await doc.generate(docxPath);
    
    // Check if we have a DOCX file
    expect(existsSync(docxPath)).toBe(true);
    
    // Try to convert with different quality settings
    const converter = new PDFConverter();
    const isInstalled = await converter.isInstalled();
    
    if (isInstalled) {
      // Low quality
      const lowResult = await converter.convertToPDF(docxPath, {
        outputPath: join(testDir, 'quality-low.pdf'),
        quality: 'low',
      });
      expect(lowResult.success).toBe(true);
      
      // High quality
      const highResult = await converter.convertToPDF(docxPath, {
        outputPath: join(testDir, 'quality-high.pdf'),
        quality: 'high',
      });
      expect(highResult.success).toBe(true);
    } else {
      console.log('Skipping quality settings test - LibreOffice not installed');
    }
  });
});
