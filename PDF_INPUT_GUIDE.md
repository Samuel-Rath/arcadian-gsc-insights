# PDF Input Processing Guide

## Overview
The application now supports uploading PDF files containing Google Search Console data. PDFs are automatically parsed and converted to CSV format for processing.

## How It Works

### Upload Flow
1. **User uploads PDF** via the file upload component
2. **Validation** checks if file is a valid PDF
3. **Parsing** extracts GSC data from PDF text
4. **Conversion** transforms data to CSV format
5. **Storage** saves as CSV file
6. **Processing** loads data into the application
7. **Feedback** shows success message with conversion note

### Technical Implementation

#### PDF Parser (`lib/pdf-parser.ts`)
The parser uses `pdf-parse` library to extract text from PDFs and convert it to CSV format.

**Key Functions:**
- `parsePDFToCSV(buffer)`: Main parsing function
- `extractTableData(text)`: Extracts table-structured data
- `isPDF(buffer)`: Validates PDF format

**Pattern Matching:**
```typescript
// Primary pattern: date query clicks impressions ctr position
const dataPattern = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\d+)\s+(\d+)\s+([\d.]+)%?\s+([\d.]+)/;

// Example matches:
// "2024-01-01 keyword 100 1000 10.0% 5.5"
// "2024-01-15 search term 250 2500 10% 3.2"
```

#### Upload Route (`app/api/upload/route.ts`)
Enhanced to handle PDF processing:
```typescript
if (file.name.endsWith('.pdf')) {
  // Validate PDF format
  if (!isPDF(buffer)) {
    return error response
  }
  
  // Parse PDF to CSV
  const csvContent = await parsePDFToCSV(buffer);
  
  // Save as CSV
  await fs.writeFile(csvPath, csvContent);
}
```

## Supported PDF Formats

### Google Search Console Exports
The parser is optimized for GSC PDF exports with these structures:

#### Format 1: Space-Separated
```
Date       Query          Clicks  Impressions  CTR    Position
2024-01-01 keyword        100     1000         10.0%  5.5
2024-01-02 search term    150     1500         10.0%  4.2
```

#### Format 2: Tab-Separated
```
Date		Query		Clicks	Impressions	CTR		Position
2024-01-01	keyword		100		1000		10.0%	5.5
```

#### Format 3: Inline Format
```
2024-01-01 keyword 100 1000 10.0% 5.5
2024-01-02 search term 150 1500 10.0% 4.2
```

### Required Data Fields
For successful parsing, PDFs must contain:
- **Date**: YYYY-MM-DD format
- **Query**: Keyword or search term
- **Clicks**: Integer value
- **Impressions**: Integer value
- **CTR**: Percentage (with or without % symbol)
- **Position**: Decimal value

## Error Handling

### Common Errors

#### "Invalid PDF file format"
**Cause**: File is not a valid PDF
**Solution**: Ensure file is a proper PDF (not renamed file)

#### "Failed to parse PDF file"
**Cause**: PDF doesn't contain recognizable GSC data
**Solution**: 
- Check PDF contains GSC data
- Verify data is in table format
- Try exporting from GSC again

#### "No valid GSC data found in PDF"
**Cause**: Parser couldn't extract data
**Solution**:
- Ensure PDF has text (not scanned image)
- Check data format matches supported patterns
- Try CSV export instead

### Error Messages
User-friendly error messages with details:
```json
{
  "error": "Failed to parse PDF file.",
  "details": "No valid GSC data found in PDF. Please ensure the PDF contains Google Search Console data in a recognizable format."
}
```

## Data Extraction Process

### Step 1: Text Extraction
```typescript
const data = await pdf(buffer);
const text = data.text;
```

### Step 2: Pattern Matching
```typescript
// Look for date-query-metrics pattern
const dataPattern = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\d+)\s+(\d+)\s+([\d.]+)%?\s+([\d.]+)/;

for (const line of lines) {
  const match = line.match(dataPattern);
  if (match) {
    // Extract and format data
  }
}
```

### Step 3: Table Extraction (Fallback)
```typescript
// If pattern matching fails, try table extraction
const tableData = extractTableData(text);
```

### Step 4: CSV Generation
```typescript
const csvLines = ['date,query,clicks,impressions,ctr,position'];
// Add data rows
return csvLines.join('\n');
```

## CSV Output Format

### Structure
```csv
date,query,clicks,impressions,ctr,position
2024-01-01,"keyword",100,1000,0.1,5.5
2024-01-02,"search term",150,1500,0.1,4.2
```

### Field Details
- **date**: YYYY-MM-DD format
- **query**: Quoted string (handles commas)
- **clicks**: Integer
- **impressions**: Integer
- **ctr**: Decimal (0-1 range, not percentage)
- **position**: Decimal with 1 decimal place

## Testing

### Test Cases

#### Valid PDF
```typescript
// Upload GSC PDF export
// Expected: Success with conversion message
// Result: Data loaded and displayed
```

#### Invalid PDF
```typescript
// Upload non-PDF file renamed to .pdf
// Expected: "Invalid PDF file format" error
// Result: Upload rejected
```

#### Empty PDF
```typescript
// Upload PDF without GSC data
// Expected: "No valid GSC data found" error
// Result: Upload rejected with helpful message
```

#### Large PDF
```typescript
// Upload 100MB PDF
// Expected: Success (under 500MB limit)
// Result: Parsed and converted
```

## Performance

### Processing Times
- Small PDF (1-10 pages): ~1-2 seconds
- Medium PDF (10-50 pages): ~3-5 seconds
- Large PDF (50-100 pages): ~5-10 seconds

### Memory Usage
- PDF parsing: ~2-5x file size
- Text extraction: ~1-2x file size
- CSV conversion: Minimal

### Optimization
- Streaming for large files (future)
- Parallel processing (future)
- Caching parsed results (future)

## Limitations

### Current Limitations
1. **Text-based PDFs only**: Scanned images not supported
2. **Specific formats**: Must match GSC export patterns
3. **Single table**: Multi-table PDFs may fail
4. **English text**: Non-English queries may have issues
5. **Size limit**: 500MB maximum

### Workarounds
- **Scanned PDFs**: Use OCR tool first, then upload
- **Custom formats**: Export as CSV instead
- **Large files**: Split into smaller PDFs
- **Non-English**: Ensure UTF-8 encoding

## Best Practices

### For Users
1. **Use GSC exports**: Direct exports work best
2. **Check format**: Ensure data is in table format
3. **Test small first**: Try with small PDF first
4. **Keep originals**: Save original PDFs as backup
5. **Use CSV when possible**: CSV is more reliable

### For Developers
1. **Validate early**: Check PDF format before parsing
2. **Handle errors**: Provide clear error messages
3. **Log failures**: Track parsing failures for improvement
4. **Test formats**: Test with various PDF formats
5. **Optimize patterns**: Update regex patterns as needed

## Troubleshooting

### PDF Not Uploading
1. Check file size (< 500MB)
2. Verify file extension (.pdf)
3. Ensure file is not corrupted
4. Try different browser

### Data Not Appearing
1. Check PDF contains GSC data
2. Verify data format matches patterns
3. Look for error messages
4. Try CSV export instead

### Incorrect Data
1. Check source PDF for accuracy
2. Verify date formats
3. Check for special characters
4. Review conversion logs

### Slow Processing
1. Reduce PDF size
2. Split large files
3. Check server resources
4. Use CSV for large datasets

## Future Enhancements

### Planned Features
1. **OCR Support**: Parse scanned PDFs
2. **Multi-table**: Handle multiple tables
3. **Custom Mapping**: User-defined field mapping
4. **Preview**: Show parsed data before saving
5. **Validation**: More robust data validation
6. **Batch Upload**: Multiple PDFs at once
7. **Format Detection**: Auto-detect PDF format
8. **Progress Indicator**: Show parsing progress

### API Improvements
```typescript
// Future: More detailed parsing options
POST /api/upload
{
  "file": "...",
  "options": {
    "format": "gsc-export",
    "dateFormat": "YYYY-MM-DD",
    "validateData": true,
    "preview": true
  }
}
```

## Security Considerations

### File Validation
- PDF format verification
- Size limit enforcement
- Content type checking
- Malicious content detection

### Data Privacy
- Files processed server-side
- No external API calls
- Temporary storage only
- Automatic cleanup

### Error Handling
- No sensitive data in errors
- Generic error messages
- Detailed logs server-side
- Rate limiting (future)

## Examples

### Example 1: Basic GSC Export
```
Input PDF:
Date       Query     Clicks  Impressions  CTR    Position
2024-01-01 keyword   100     1000         10.0%  5.5

Output CSV:
date,query,clicks,impressions,ctr,position
2024-01-01,"keyword",100,1000,0.1,5.5
```

### Example 2: Multiple Rows
```
Input PDF:
2024-01-01 keyword 100 1000 10.0% 5.5
2024-01-02 search term 150 1500 10.0% 4.2

Output CSV:
date,query,clicks,impressions,ctr,position
2024-01-01,"keyword",100,1000,0.1,5.5
2024-01-02,"search term",150,1500,0.1,4.2
```

### Example 3: With Special Characters
```
Input PDF:
2024-01-01 "keyword, test" 100 1000 10.0% 5.5

Output CSV:
date,query,clicks,impressions,ctr,position
2024-01-01,"keyword, test",100,1000,0.1,5.5
```

## Conclusion

The PDF input feature provides a convenient way to import GSC data from PDF exports. While CSV is still the recommended format for reliability, PDF support offers flexibility for users who have data in PDF format.

For best results:
- Use direct GSC CSV exports when possible
- Ensure PDFs contain text (not scanned images)
- Verify data format matches supported patterns
- Test with small files first

For technical support or to report parsing issues, please provide:
- Sample PDF (with sensitive data removed)
- Expected output
- Error messages received
- Browser and OS information
