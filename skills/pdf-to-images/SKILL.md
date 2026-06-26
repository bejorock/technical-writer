# PDF to Images Skill

## Overview

This skill teaches you how to convert PDF pages to images and crop images using the project's utilities.

## Prerequisites

The following packages are already installed:
- `pdf2pic` - PDF to image conversion
- `sharp` - Image processing and cropping
- `graphicsmagick` - Image manipulation (system dependency)
- `ghostscript` - PDF rendering (system dependency)

**System dependencies (macOS):**
```bash
brew install graphicsmagick ghostscript
```

## Basic Usage

### 1. Convert PDF to Images

```typescript
import { convertPdfToImages } from '../lib/preview';

const images = await convertPdfToImages('./output/my-document.pdf', {
  outputDir: './output/images',
  format: 'png',      // 'png' or 'jpeg'
  scale: 2,           // Resolution multiplier (1 = 72dpi, 2 = 144dpi)
  pages: '1-5',       // Convert specific pages (default: all)
});

console.log('Converted images:', images);
// Output: ['./output/images/page-1.png', './output/images/page-2.png', ...]
```

### 2. Crop an Image

```typescript
import { cropImage } from '../lib/preview';

const cropped = await cropImage('./output/images/page-1.png', {
  x: 100,        // Start X position
  y: 50,         // Start Y position
  width: 400,    // Crop width
  height: 300,    // Crop height
  outputPath: './output/images/cropped.png',
});

console.log('Cropped image:', cropped);
// Output: './output/images/cropped.png'
```

### 3. Get Preview URL

```typescript
import { getPreviewUrl } from '../lib/preview';

const previewUrl = await getPreviewUrl('GOOGLE_DRIVE_FILE_ID', {
  format: 'png',
  page: 1,
});

console.log('Preview URL:', previewUrl);
```

## Complete Examples

### Example 1: Convert Entire PDF

```typescript
import { convertPdfToImages } from '../lib/preview';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

async function convertEntirePDF() {
  const inputPdf = './output/report.pdf';
  const outputDir = './output/images';
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Convert all pages
  const images = await convertPdfToImages(inputPdf, {
    outputDir,
    format: 'png',
    scale: 2,
  });
  
  console.log(`Converted ${images.length} pages`);
  images.forEach((img, i) => {
    console.log(`  Page ${i + 1}: ${img}`);
  });
  
  return images;
}

convertEntirePDF();
```

### Example 2: Convert Specific Pages

```typescript
import { convertPdfToImages } from '../lib/preview';

async function convertSpecificPages() {
  const images = await convertPdfToImages('./output/document.pdf', {
    outputDir: './output/images',
    format: 'jpeg',
    scale: 1,
    pages: '1,3,5',  // Only pages 1, 3, and 5
  });
  
  console.log(`Converted ${images.length} pages`);
}

convertSpecificPages();
```

### Example 3: Crop a Region from PDF Page

```typescript
import { convertPdfToImages, cropImage } from '../lib/preview';

async function cropRegionFromPDF() {
  // First, convert PDF to images
  const images = await convertPdfToImages('./output/document.pdf', {
    outputDir: './output/images',
    format: 'png',
    scale: 2,
  });
  
  // Then crop a region from the first page
  const cropped = await cropImage(images[0], {
    x: 100,
    y: 50,
    width: 400,
    height: 300,
    outputPath: './output/images/cropped-region.png',
  });
  
  console.log('Cropped image:', cropped);
}

cropRegionFromPDF();
```

### Example 4: Extract Signature Area

```typescript
import { convertPdfToImages, cropImage } from '../lib/preview';

async function extractSignatureArea() {
  // Convert PDF to images
  const images = await convertPdfToImages('./output/contract.pdf', {
    outputDir: './output/images',
    format: 'png',
    scale: 2,
  });
  
  // Crop signature area from last page
  const lastPage = images[images.length - 1];
  const signature = await cropImage(lastPage, {
    x: 400,      // Adjust based on your PDF layout
    y: 600,
    width: 300,
    height: 150,
    outputPath: './output/images/signature.png',
  });
  
  console.log('Signature extracted:', signature);
}

extractSignatureArea();
```

## Functions Reference

### convertPdfToImages(pdfPath, options)

Converts PDF pages to image files.

**Parameters:**
- `pdfPath: string` - Path to the PDF file
- `options: {
    outputDir?: string;    // Output directory (default: same as PDF)
    format?: 'png' | 'jpeg';  // Image format (default: 'png')
    scale?: number;        // Resolution multiplier (default: 2)
    pages?: string;        // Pages to convert (default: all)
  }`

**Returns:** `Promise<string[]>` - Array of image file paths

### cropImage(imagePath, options)

Crops an image to a specific region.

**Parameters:**
- `imagePath: string` - Path to the input image
- `options: {
    x: number;           // Start X position
    y: number;           // Start Y position
    width: number;       // Crop width
    height: number;      // Crop height
    outputPath?: string; // Output file path
  }`

**Returns:** `Promise<string>` - Path to the cropped image

### getPreviewUrl(fileId, options)

Gets a preview URL for a Google Drive file.

**Parameters:**
- `fileId: string` - Google Drive file ID
- `options: {
    format?: 'png' | 'jpeg';
    page?: number;
  }`

**Returns:** `Promise<string>` - Preview URL

## Common Use Cases

### 1. Preview Document Before Upload

```typescript
import { convertPdfToImages } from '../lib/preview';

async function previewBeforeUpload(pdfPath: string) {
  const images = await convertPdfToImages(pdfPath, {
    format: 'png',
    scale: 1,
    pages: '1',  // Just first page
  });
  
  return images[0];
}
```

### 2. Extract Text Region (OCR Prep)

```typescript
import { convertPdfToImages, cropImage } from '../lib/preview';

async function extractTextRegion(pdfPath: string) {
  const images = await convertPdfToImages(pdfPath, {
    format: 'png',
    scale: 3,  // High resolution for OCR
  });
  
  // Crop header area
  const header = await cropImage(images[0], {
    x: 0,
    y: 0,
    width: 800,
    height: 100,
  });
  
  return header;
}
```

### 3. Create Thumbnails

```typescript
import { convertPdfToImages } from '../lib/preview';

async function createThumbnails(pdfPath: string) {
  const images = await convertPdfToImages(pdfPath, {
    format: 'jpeg',
    scale: 0.5,  // Low resolution for thumbnails
  });
  
  return images;
}
```

## Troubleshooting

### "graphicsmagick not found"

Install graphicsmagick:
```bash
# macOS
brew install graphicsmagick

# Ubuntu/Debian
sudo apt-get install graphicsmagick
```

### "ghostscript not found"

Install ghostscript:
```bash
# macOS
brew install ghostscript

# Ubuntu/Debian
sudo apt-get install ghostscript
```

### "PDF could not be read"

Possible causes:
1. PDF file doesn't exist
2. PDF file is corrupted
3. PDF is password-protected

**Solution:**
```bash
# Check if file exists
ls -la ./output/my-document.pdf

# Try with a different PDF
```

### "Image conversion failed"

Possible causes:
1. Invalid page number
2. Insufficient memory
3. Corrupted PDF

**Solution:**
```bash
# Check available memory
free -h

# Try converting fewer pages at once
```

## References

- [pdf2pic Documentation](https://github.com/nicolo-ribaudo/pdf2pic) - PDF to image conversion
- [sharp Documentation](https://sharp.pixelplumbing.com/) - Image processing
- [GraphicsMagick](http://www.graphicsmagick.org/) - Image manipulation
