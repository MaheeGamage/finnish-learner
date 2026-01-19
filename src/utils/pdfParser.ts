import pdf from 'pdf-parse';
import { PDF_UPLOAD_LIMITS } from '@/config/constants';

export interface PdfParseResult {
  text: string;
  numPages: number;
  info?: {
    Title?: string;
    Author?: string;
  };
}

export interface PdfParseError {
  error: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_PDF' | 'TEXT_TOO_LONG' | 'PARSING_ERROR';
}

/**
 * Parse PDF buffer and extract text content
 * @param buffer PDF file buffer
 * @returns Parsed text or error
 */
export async function parsePdfBuffer(
  buffer: Buffer
): Promise<PdfParseResult | PdfParseError> {
  try {
    // Check file size
    if (buffer.length > PDF_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      return {
        error: `File size exceeds ${PDF_UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB limit`,
        code: 'FILE_TOO_LARGE',
      };
    }

    // Parse PDF
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        error: 'No text content found in PDF',
        code: 'INVALID_PDF',
      };
    }

    // Check extracted text length
    if (data.text.length > PDF_UPLOAD_LIMITS.MAX_TEXT_LENGTH) {
      return {
        error: `Extracted text exceeds ${PDF_UPLOAD_LIMITS.MAX_TEXT_LENGTH} character limit`,
        code: 'TEXT_TOO_LONG',
      };
    }

    // Reformat text for better readability
    const formattedText = reformatPdfText(data.text);

    return {
      text: formattedText,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      error: 'Failed to parse PDF file. Please ensure it is a valid PDF.',
      code: 'PARSING_ERROR',
    };
  }
}

/**
 * Reformat extracted PDF text for better readability
 * - Remove excessive whitespace
 * - Normalize line breaks
 * - Fix common PDF extraction issues
 */
function reformatPdfText(text: string): string {
  // Normalize line endings
  let formatted = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive blank lines (more than 2 consecutive newlines)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Fix hyphenated words at line breaks (common in PDFs)
  // Using \S+ to match non-whitespace including Finnish special characters (ä, ö, å)
  formatted = formatted.replace(/(\S+)-\n(\S+)/g, '$1$2');

  // Normalize spaces (replace multiple spaces with single space)
  formatted = formatted.replace(/ {2,}/g, ' ');

  // Trim each line while preserving paragraph structure
  formatted = formatted
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  // Remove leading/trailing whitespace
  formatted = formatted.trim();

  return formatted;
}
