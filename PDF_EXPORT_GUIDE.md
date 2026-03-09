# PDF Export Feature Guide

## Overview
The PDF export feature allows users to download comprehensive analytics reports in PDF format, making it easy to share insights with stakeholders, archive data, or create presentations.

## Features

### 1. Two Export Options

#### Data Report (Tables & Insights Only)
- Summary statistics table
- Key insights and analytics
- Recent performance data (last 10 days)
- AI-generated insights (if available)
- Lightweight and fast to generate

#### Full Report (With Chart Visualization)
- Everything from Data Report
- High-quality chart screenshot
- Visual representation of trends
- Best for presentations and comprehensive reviews

### 2. Export Button Location
The export button appears in the header, centered below the subtitle, and is only visible when:
- Data has been loaded successfully
- Summary statistics are available
- No errors are present

### 3. PDF Content Structure

#### Page 1: Overview
- **Header**: Report title and date range
- **Summary Statistics Table**:
  - Total Clicks
  - Total Impressions
  - Average CTR
  - Average Position
- **Key Insights Table**:
  - Performance Trend (% change)
  - Best Day (date and clicks)
  - Best CTR (percentage)

#### Page 2: Recent Performance
- **Daily Data Table** (last 10 days):
  - Date
  - Clicks
  - Impressions
  - CTR
  - Position
- Formatted with striped rows for readability

#### Page 3+: AI Insights (if available)
- **Key Insights**: Bullet-pointed list
- **Opportunities**: Actionable recommendations
- **Questions**: Areas to explore
- **Anomalies**: Unusual patterns detected

#### Footer (All Pages)
- Generation date
- Page numbers (e.g., "Page 1 of 3")

### 4. File Naming Convention
Files are automatically named with the date range:
- Data Report: `gsc-insights-YYYY-MM-DD-to-YYYY-MM-DD.pdf`
- Full Report: `gsc-insights-with-chart-YYYY-MM-DD-to-YYYY-MM-DD.pdf`

## Technical Implementation

### Dependencies
```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4",
  "html2canvas": "^1.4.1"
}
```

### Core Files

#### `lib/pdf-export.ts`
Main export logic with two functions:
- `exportToPDF()`: Generates data-only report
- `exportChartToPDF()`: Generates report with chart screenshot

#### `components/ExportButton.tsx`
UI component with dropdown menu:
- Export button with loading state
- Dropdown menu with two options
- Click-outside-to-close functionality
- Disabled state when no data available

### Color Scheme
Consistent with the application's design:
- **Primary Blue**: RGB(37, 99, 235) - Headers, clicks
- **Purple**: RGB(147, 51, 234) - Insights section
- **Gray**: RGB(107, 114, 128) - Subtitles, metadata
- **Dark Gray**: RGB(17, 24, 39) - Body text

### Chart Capture
Uses `html2canvas` to capture the chart:
- Scale: 2x for high resolution
- Background: White (#ffffff)
- Format: PNG
- Maintains aspect ratio

## Usage Instructions

### For End Users

1. **Load Your Data**
   - Upload CSV file or use existing data
   - Select desired date range
   - Wait for data to load

2. **Generate Insights (Optional)**
   - Click "Generate Insights" for AI analysis
   - Wait for insights to complete
   - Insights will be included in PDF

3. **Export PDF**
   - Click "Export PDF" button in header
   - Choose export type:
     - **Data Report**: Quick, tables only
     - **Full Report**: Includes chart visualization
   - PDF downloads automatically

### For Developers

#### Basic Export
```typescript
import { exportToPDF } from '@/lib/pdf-export';

await exportToPDF({
  dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
  summary: {
    totalClicks: 1000,
    totalImpressions: 10000,
    avgCtr: 0.1,
    avgPosition: 5.5,
  },
  chartData: dailyAggregates,
  insights: aiInsights, // optional
});
```

#### Export with Chart
```typescript
import { exportChartToPDF } from '@/lib/pdf-export';

const chartElement = document.getElementById('performance-chart');

await exportChartToPDF(chartElement, {
  dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
  summary: { /* ... */ },
  chartData: dailyAggregates,
  insights: aiInsights,
});
```

## PDF Upload Support

### Accepted File Types
The file upload component now accepts both CSV and PDF files:
- `.csv` - Google Search Console data (direct upload)
- `.pdf` - Google Search Console PDF exports (automatically converted to CSV)

### PDF Processing
When a PDF is uploaded:
1. **Validation**: Checks if file is a valid PDF format
2. **Parsing**: Extracts GSC data using pattern matching
3. **Conversion**: Converts extracted data to CSV format
4. **Storage**: Saves as CSV for processing
5. **Feedback**: Shows "PDF converted to CSV" message

### Supported PDF Formats
The parser supports PDFs containing:
- Date columns (YYYY-MM-DD format)
- Query/keyword data
- Clicks, impressions, CTR, and position metrics
- Table-structured data
- Google Search Console export formats

### PDF Data Patterns
The parser recognizes these patterns:
```
2024-01-01 keyword 100 1000 10.0% 5.5
Date       Query   Clicks Impressions CTR Position
```

### File Validation
- Maximum size: 500 MB
- Accepted extensions: `.csv`, `.pdf`
- PDF format validation (checks for %PDF- header)
- Data extraction validation

### Storage
- CSV files: `uploaded-data/arckeywords.csv`
- PDF files: Converted to CSV and stored as `uploaded-data/arckeywords.csv`
- Automatic directory creation
- Overwrites existing files
- Cache cleared after upload

## Error Handling

### Common Errors

#### "Chart element not found"
- **Cause**: Chart hasn't rendered yet
- **Solution**: Wait for data to load before exporting

#### "Failed to export PDF"
- **Cause**: Browser compatibility or memory issues
- **Solution**: Try data-only export or refresh page

#### "Failed to capture chart"
- **Cause**: html2canvas error
- **Solution**: Falls back to data-only export

### Error Messages
User-friendly alerts displayed for:
- Export failures
- Chart capture errors
- Missing data
- Network issues

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Limitations
- Chart capture may be slower on older devices
- Large date ranges (>365 days) may take longer
- Mobile browsers may have memory constraints

## Performance Considerations

### Optimization Techniques
1. **Lazy Loading**: Export libraries loaded on-demand
2. **Async Operations**: Non-blocking PDF generation
3. **Image Compression**: Chart screenshots optimized
4. **Pagination**: Automatic page breaks for long content

### Generation Times
- Data Report: ~1-2 seconds
- Full Report: ~3-5 seconds (includes chart capture)
- With AI Insights: +1-2 seconds

### File Sizes
- Data Report: ~50-100 KB
- Full Report: ~200-500 KB (depends on chart complexity)
- With AI Insights: +50-100 KB

## Customization Options

### Modify PDF Layout
Edit `lib/pdf-export.ts`:
```typescript
// Change page size
const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait A4
// or
const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4

// Adjust margins
autoTable(pdf, {
  margin: { left: 20, right: 20, top: 15, bottom: 15 },
});
```

### Customize Colors
```typescript
// Header color
pdf.setTextColor(37, 99, 235); // Blue

// Table header
headStyles: { fillColor: [37, 99, 235], textColor: 255 }
```

### Add Custom Sections
```typescript
// Add new section
pdf.setFontSize(16);
pdf.text('Custom Section', 15, yPosition);
yPosition += 10;

// Add custom table
autoTable(pdf, {
  startY: yPosition,
  head: [['Column 1', 'Column 2']],
  body: [['Data 1', 'Data 2']],
});
```

## Accessibility

### PDF Accessibility Features
- Proper heading hierarchy
- Descriptive table headers
- Alt text for images (chart)
- Logical reading order
- High contrast colors

### Screen Reader Support
- Semantic structure
- Tagged PDF elements
- Accessible table markup

## Security Considerations

### Data Privacy
- PDFs generated client-side (no server upload)
- No data sent to external services
- Files saved locally only

### File Validation
- Type checking on upload
- Size limits enforced
- Extension validation
- MIME type verification

## Troubleshooting

### PDF Not Downloading
1. Check browser download settings
2. Disable popup blockers
3. Try different export option
4. Clear browser cache

### Chart Not Appearing in PDF
1. Ensure chart is visible on screen
2. Wait for chart to fully render
3. Try data-only export
4. Check browser console for errors

### Large File Size
1. Reduce date range
2. Use data-only export
3. Compress chart quality
4. Remove unnecessary insights

## Future Enhancements

### Planned Features
1. **Custom Branding**: Add logo and company name
2. **Template Selection**: Multiple PDF layouts
3. **Scheduled Exports**: Automatic weekly/monthly reports
4. **Email Integration**: Send PDFs directly
5. **Batch Export**: Multiple date ranges at once
6. **Chart Customization**: Choose which metrics to include
7. **Comparison Reports**: Side-by-side period comparison
8. **Executive Summary**: One-page overview option

### API Endpoints (Future)
```typescript
// Server-side PDF generation
POST /api/export/pdf
{
  "dateRange": { "startDate": "...", "endDate": "..." },
  "options": {
    "includeChart": true,
    "includeInsights": true,
    "format": "a4",
    "orientation": "portrait"
  }
}
```

## Best Practices

### For Users
1. Generate insights before exporting for complete reports
2. Use descriptive date ranges
3. Export regularly for archival purposes
4. Share PDFs instead of screenshots

### For Developers
1. Test exports with various data sizes
2. Handle errors gracefully
3. Provide loading indicators
4. Optimize chart rendering
5. Cache export settings

## Support

### Common Questions

**Q: Can I export multiple date ranges at once?**
A: Not currently, but planned for future release.

**Q: Can I customize the PDF layout?**
A: Yes, by modifying `lib/pdf-export.ts`.

**Q: Are PDFs accessible?**
A: Yes, they include proper structure and alt text.

**Q: Can I schedule automatic exports?**
A: Not yet, but planned for future release.

**Q: What's the maximum date range?**
A: No hard limit, but large ranges may be slow.

## Conclusion

The PDF export feature provides a professional way to share and archive analytics data. With two export options, comprehensive content, and easy-to-use interface, users can quickly generate reports for any purpose.

For technical support or feature requests, please refer to the project documentation or contact the development team.
