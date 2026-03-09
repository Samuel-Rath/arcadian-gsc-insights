import pdf from 'pdf-parse';

/**
 * Parse PDF file and extract GSC data
 * Supports Google Search Console PDF exports
 */
export async function parsePDFToCSV(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = data.text;

    // Extract data from PDF text
    // Look for patterns like: date, clicks, impressions, ctr, position
    const lines = text.split('\n').filter(line => line.trim());
    
    // Build CSV content
    const csvLines: string[] = ['date,query,clicks,impressions,ctr,position'];
    
    // Pattern matching for GSC data
    // Example: "2024-01-01 keyword 100 1000 10.0% 5.5"
    const dataPattern = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\d+)\s+(\d+)\s+([\d.]+)%?\s+([\d.]+)/;
    
    for (const line of lines) {
      const match = line.match(dataPattern);
      if (match) {
        const [, date, query, clicks, impressions, ctr, position] = match;
        // Convert CTR to decimal if it's a percentage
        const ctrDecimal = parseFloat(ctr) / (ctr.includes('%') ? 1 : 100);
        csvLines.push(`${date},"${query}",${clicks},${impressions},${ctrDecimal},${position}`);
      }
    }

    // If no data found with pattern, try alternative parsing
    if (csvLines.length === 1) {
      // Look for table-like structures
      const tableData = extractTableData(text);
      if (tableData.length > 0) {
        csvLines.push(...tableData);
      }
    }

    // If still no data, return error
    if (csvLines.length === 1) {
      throw new Error('No valid GSC data found in PDF. Please ensure the PDF contains Google Search Console data in a recognizable format.');
    }

    return csvLines.join('\n');
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract table data from PDF text
 */
function extractTableData(text: string): string[] {
  const lines: string[] = [];
  const rows = text.split('\n');
  
  // Look for rows with numeric data
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    
    // Skip empty lines and headers
    if (!row || row.toLowerCase().includes('date') || row.toLowerCase().includes('query')) {
      continue;
    }

    // Try to extract date, numbers, and percentages
    const parts = row.split(/\s+/);
    
    // Look for date pattern
    const dateMatch = row.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) continue;

    const date = dateMatch[0];
    
    // Extract numbers
    const numbers = parts.filter(p => /^\d+$/.test(p));
    const percentages = parts.filter(p => /^\d+\.?\d*%?$/.test(p));
    
    if (numbers.length >= 2 && percentages.length >= 1) {
      // Assume format: date, query, clicks, impressions, ctr, position
      const query = parts.filter(p => 
        !p.match(/\d{4}-\d{2}-\d{2}/) && 
        !/^\d+\.?\d*%?$/.test(p)
      ).join(' ');
      
      const clicks = numbers[0] || '0';
      const impressions = numbers[1] || '0';
      const ctr = percentages[0]?.replace('%', '') || '0';
      const position = percentages[1]?.replace('%', '') || numbers[2] || '0';
      
      lines.push(`${date},"${query}",${clicks},${impressions},${parseFloat(ctr) / 100},${position}`);
    }
  }
  
  return lines;
}

/**
 * Validate if buffer is a valid PDF
 */
export function isPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  return buffer.toString('utf8', 0, 5) === '%PDF-';
}
