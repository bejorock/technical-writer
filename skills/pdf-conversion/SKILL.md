# PDF Conversion Skill

## Overview

This skill teaches you how to convert documents to PDF using LibreOffice command-line.

## Prerequisites

- LibreOffice must be installed
- On macOS: `brew install libreoffice`
- On Ubuntu/Debian: `sudo apt-get install libreoffice`

## Basic Usage

### 1. Convert DOCX to PDF

```bash
libreoffice --headless --convert-to pdf ./output/my-document.docx
```

### 2. Convert XLSX to PDF

```bash
libreoffice --headless --convert-to pdf ./output/my-spreadsheet.xlsx
```

### 3. Convert with Output Directory

```bash
libreoffice --headless --convert-to pdf --outdir ./output ./input/my-document.docx
```

### 4. Convert with Custom Output Name

```bash
libreoffice --headless --convert-to pdf --outdir ./output ./input/my-document.docx
# Output will be: ./output/my-document.pdf
```

## Using in TypeScript/JavaScript

### Method 1: Using exec (Simple)

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function convertToPDF(inputPath: string, outputPath?: string): Promise<string> {
  const outputDir = outputPath ? require('node:path').dirname(outputPath) : require('node:path').dirname(inputPath);
  
  const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('Conversion output:', stdout);
    
    // Return the output PDF path
    const inputName = require('node:path').basename(inputPath, require('node:path').extname(inputPath));
    return require('node:path').join(outputDir, `${inputName}.pdf`);
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
}

// Usage
const pdfPath = await convertToPDF('./output/my-document.docx');
console.log('PDF created:', pdfPath);
```

### Method 2: Using the PDFConverter Class

The project includes a `PDFConverter` class in `lib/converters/pdf.ts`:

```typescript
import { PDFConverter, convertToPDF, isLibreOfficeAvailable } from '../lib/converters/pdf';

// Check if LibreOffice is available
const isInstalled = await isLibreOfficeAvailable();
if (!isInstalled) {
  console.error('LibreOffice is not installed');
  process.exit(1);
}

// Convert to PDF
const result = await convertToPDF('./output/my-document.docx', {
  outputPath: './output/my-document.pdf',
  quality: 'high', // 'low', 'medium', or 'high'
});

if (result.success) {
  console.log('PDF created:', result.outputPath);
} else {
  console.error('Conversion failed:', result.error);
}
```

## Conversion Options

### Quality Settings

```typescript
// Low quality (smaller file size)
await convertToPDF(inputPath, { quality: 'low' });

// Medium quality (default)
await convertToPDF(inputPath, { quality: 'medium' });

// High quality (larger file size)
await convertToPDF(inputPath, { quality: 'high' });
```

### Password Protection

```typescript
await convertToPDF(inputPath, { password: 'my-secret-password' });
```

### Page Selection

```typescript
// Convert only pages 1-5
await convertToPDF(inputPath, { pages: '1-5' });

// Convert pages 1, 3, 5
await convertToPDF(inputPath, { pages: '1,3,5' });
```

## Batch Conversion

### Convert Multiple Files

```typescript
import { PDFConverter } from '../lib/converters/pdf';

const converter = new PDFConverter();

const files = [
  './output/doc1.docx',
  './output/doc2.docx',
  './output/spreadsheet1.xlsx',
];

for (const file of files) {
  const result = await converter.convertToPDF(file);
  if (result.success) {
    console.log(`Converted: ${file} -> ${result.outputPath}`);
  } else {
    console.error(`Failed: ${file} - ${result.error}`);
  }
}
```

### Convert All Files in Directory

```typescript
import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { PDFConverter } from '../lib/converters/pdf';

async function convertAllInDirectory(dirPath: string) {
  const converter = new PDFConverter();
  const files = readdirSync(dirPath);
  
  const supportedExtensions = ['.docx', '.doc', '.odt', '.xlsx', '.xls'];
  
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (supportedExtensions.includes(ext)) {
      const filePath = join(dirPath, file);
      const result = await converter.convertToPDF(filePath);
      
      if (result.success) {
        console.log(`✓ Converted: ${file}`);
      } else {
        console.error(`✗ Failed: ${file} - ${result.error}`);
      }
    }
  }
}

convertAllInDirectory('./output');
```

## Complete Workflow

Here's a complete workflow for creating and converting a document:

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { writeFileSync } from 'node:fs';
import { PDFConverter } from '../lib/converters/pdf';

async function createAndConvertToPDF() {
  // 1. Create DOCX document
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "My Document",
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This document will be converted to PDF.",
            }),
          ],
        }),
      ],
    }],
  });

  // 2. Save DOCX locally
  const buffer = await Packer.toBuffer(doc);
  writeFileSync('./output/my-document.docx', buffer);
  console.log("DOCX created!");

  // 3. Convert to PDF
  const converter = new PDFConverter();
  const result = await converter.convertToPDF('./output/my-document.docx');

  if (result.success) {
    console.log("PDF created:", result.outputPath);
    
    // 4. Upload to Google Drive (use the tool)
    // google_drive({ operation: "upload", localPath: result.outputPath })
  } else {
    console.error("PDF conversion failed:", result.error);
  }
}

createAndConvertToPDF();
```

## Troubleshooting

### "libreoffice: command not found"

LibreOffice is not installed or not in PATH.

**Solution:**
```bash
# macOS
brew install libreoffice

# Ubuntu/Debian
sudo apt-get install libreoffice

# Add to PATH if needed
export PATH="/Applications/LibreOffice.app/Contents/MacOS:$PATH"
```

### "Conversion failed"

Possible causes:
1. Input file doesn't exist
2. Input file is corrupted
3. LibreOffice is not installed
4. Permission issues

**Solution:**
```bash
# Check if file exists
ls -la ./output/my-document.docx

# Test LibreOffice
libreoffice --version

# Check permissions
chmod +x /path/to/libreoffice
```

### "Output file not found"

The conversion succeeded but the output file is not where expected.

**Solution:**
```bash
# Check the output directory
ls -la ./output/

# Use absolute path
libreoffice --headless --convert-to pdf --outdir "$(pwd)/output" "$(pwd)/input/my-document.docx"
```

## References

- [LibreOffice Command-Line](https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html)
- [LibreOffice Filters](https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/CSV_Specification)
