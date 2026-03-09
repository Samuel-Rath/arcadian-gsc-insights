import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { parsePDFToCSV, isPDF } from '@/lib/pdf-parser';

/**
 * POST /api/upload
 * 
 * Handles CSV file uploads from the browser.
 * Saves the uploaded file to the configured CSV path.
 * 
 * **Security:**
 * - Validates file type (must be CSV)
 * - Validates file size (max 500 MB)
 * - Clears cache after upload to force rebuild
 * 
 * **Note:** In production, consider:
 * - Authentication/authorization
 * - Virus scanning
 * - Rate limiting
 * - Storing per-user files instead of single global file
 */
export async function POST(request: NextRequest) {
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
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or PDF file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 500 MB)
    const maxSize = 500 * 1024 * 1024; // 500 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500 MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine save path and handle PDF conversion
    let savePath: string;
    let finalBuffer: Buffer = buffer;
    let fileType: string;
    
    if (file.name.endsWith('.pdf')) {
      // Validate PDF
      if (!isPDF(buffer)) {
        return NextResponse.json(
          { error: 'Invalid PDF file format.' },
          { status: 400 }
        );
      }

      try {
        // Parse PDF to CSV
        const csvContent = await parsePDFToCSV(buffer);
        finalBuffer = Buffer.from(csvContent, 'utf-8');
        fileType = 'pdf-converted';
        
        // Save as CSV
        let csvPath = process.env.CSV_FILE_PATH;
        if (!csvPath) {
          csvPath = join(process.cwd(), 'uploaded-data', 'arckeywords.csv');
        }
        savePath = csvPath;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to parse PDF file.',
            details: error instanceof Error ? error.message : 'The PDF format is not supported or does not contain valid GSC data.'
          },
          { status: 400 }
        );
      }
    } else {
      // CSV file
      fileType = 'csv';
      let csvPath = process.env.CSV_FILE_PATH;
      
      if (!csvPath) {
        csvPath = join(process.cwd(), 'uploaded-data', 'arckeywords.csv');
      }
      
      savePath = csvPath;
    }
    
    // Ensure directory exists
    const dir = join(savePath, '..');
    await fs.mkdir(dir, { recursive: true });

    // Save file
    await fs.writeFile(savePath, finalBuffer);

    // Clear cache to force rebuild with new data
    const cachePath = join(process.cwd(), '.data-cache', 'daily-aggregates.json');
    try {
      await fs.unlink(cachePath);
    } catch (error) {
      // Ignore if cache doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: fileType === 'pdf-converted' 
        ? 'PDF file uploaded and converted to CSV successfully' 
        : 'File uploaded successfully',
      filename: file.name,
      size: file.size,
      path: savePath,
      type: fileType,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}
