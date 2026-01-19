import { NextResponse } from 'next/server';
import { parsePdfBuffer } from '@/utils/pdfParser';
import { PDF_UPLOAD_LIMITS } from '@/config/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = PDF_UPLOAD_LIMITS.ALLOWED_MIME_TYPES;
    if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > PDF_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds ${PDF_UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB limit`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const result = await parsePdfBuffer(buffer);

    // Check for parsing errors
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      );
    }

    // Return successful result
    return NextResponse.json({
      text: result.text,
      numPages: result.numPages,
      info: result.info,
      fileName: file.name,
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
}
