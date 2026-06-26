/**
 * PDF Converter
 *
 * Converts documents to PDF using LibreOffice command-line.
 * Supports DOCX, DOC, ODT, and other formats.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, statSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';

const execAsync = promisify(exec);

// Types
export interface ConversionOptions {
  outputPath?: string;
  format?: 'pdf' | 'docx' | 'doc' | 'odt' | 'html' | 'rtf';
  quality?: 'low' | 'medium' | 'high';
  password?: string;
  pages?: string;
  noLogo?: boolean;
  verbose?: boolean;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  format: string;
  duration: number;
  error?: string;
}

export class PDFConverter {
  private libreOfficePath: string;

  constructor(libreOfficePath: string = 'libreoffice') {
    this.libreOfficePath = libreOfficePath;
  }

  /**
   * Convert a document to PDF
   */
  async convertToPDF(
    inputPath: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    return this.convert(inputPath, { ...options, format: 'pdf' });
  }

  /**
   * Convert a document to another format
   */
  async convert(
    inputPath: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    // Validate input
    if (!existsSync(inputPath)) {
      return {
        success: false,
        inputPath,
        outputPath: '',
        format: options?.format || 'pdf',
        duration: 0,
        error: `Input file not found: ${inputPath}`,
      };
    }

    // Build output path
    const outputDir = options?.outputPath
      ? dirname(options.outputPath)
      : dirname(inputPath);
    const outputName = options?.outputPath
      ? basename(options.outputPath)
      : basename(inputPath, extname(inputPath));
    const outputFormat = options?.format || 'pdf';
    const outputPath = join(outputDir, `${outputName}.${outputFormat}`);

    // Build command
    const args = this.buildCommand(inputPath, outputPath, options);

    try {
      if (options?.verbose) {
        console.log(`Running: ${this.libreOfficePath} ${args.join(' ')}`);
      }

      const { stdout, stderr } = await execAsync(
        `${this.libreOfficePath} ${args.join(' ')}`,
        {
          timeout: 300000, // 5 minutes timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      const duration = Date.now() - startTime;

      if (options?.verbose) {
        console.log('stdout:', stdout);
        if (stderr) console.log('stderr:', stderr);
      }

      return {
        success: true,
        inputPath,
        outputPath,
        format: outputFormat,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        inputPath,
        outputPath,
        format: outputFormat,
        duration,
        error: error.message || 'Conversion failed',
      };
    }
  }

  /**
   * Convert multiple files in batch
   */
  async convertBatch(
    inputPaths: string[],
    options?: ConversionOptions
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const inputPath of inputPaths) {
      const result = await this.convert(inputPath, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if LibreOffice is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      await execAsync(`${this.libreOfficePath} --version`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get LibreOffice version
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`${this.libreOfficePath} --version`);
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Build command arguments
   */
  private buildCommand(
    inputPath: string,
    outputPath: string,
    options?: ConversionOptions
  ): string[] {
    const args: string[] = [];

    // Headless mode (no GUI)
    args.push('--headless');

    // Convert to format
    args.push('--convert-to', options?.format || 'pdf');

    // Output directory
    args.push('--outdir', dirname(outputPath));

    // Quality options
    if (options?.quality === 'low') {
      args.push('--infilter=writer_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"false"},"CompressionQuality":{"type":"int","value":"50"}}');
    } else if (options?.quality === 'high') {
      args.push('--infilter=writer_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"true"}}');
    }

    // Password protection
    if (options?.password) {
      args.push(`--password=${options.password}`);
    }

    // Page selection
    if (options?.pages) {
      args.push(`--pages=${options.pages}`);
    }

    // No logo
    if (options?.noLogo) {
      args.push('--nologo');
    }

    // Input file
    args.push(inputPath);

    return args;
  }
}

/**
 * Helper function to convert to PDF
 */
export async function convertToPDF(
  inputPath: string,
  options?: ConversionOptions
): Promise<ConversionResult> {
  const converter = new PDFConverter();
  return converter.convertToPDF(inputPath, options);
}

/**
 * Helper function to convert to DOCX
 */
export async function convertToDOCX(
  inputPath: string,
  options?: ConversionOptions
): Promise<ConversionResult> {
  const converter = new PDFConverter();
  return converter.convert(inputPath, { ...options, format: 'docx' });
}

/**
 * Check if LibreOffice is available
 */
export async function isLibreOfficeAvailable(): Promise<boolean> {
  const converter = new PDFConverter();
  return converter.isInstalled();
}
