import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

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
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
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

    // Determine save path
    let csvPath = process.env.CSV_FILE_PATH;
    
    if (!csvPath) {
      // Default to project directory on Windows
      csvPath = join(process.cwd(), 'uploaded-data', 'arckeywords.csv');
    }
    
    // Ensure directory exists
    const dir = join(csvPath, '..');
    await fs.mkdir(dir, { recursive: true });

    // Save file
    await fs.writeFile(csvPath, buffer);

    // Clear cache to force rebuild with new data
    const cachePath = join(process.cwd(), '.data-cache', 'daily-aggregates.json');
    try {
      await fs.unlink(cachePath);
    } catch (error) {
      // Ignore if cache doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size,
      path: csvPath,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}
