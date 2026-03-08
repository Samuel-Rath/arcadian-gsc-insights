import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { DailyAggregate, InsightsResponse } from '@/types';

interface ExportData {
  dateRange: { startDate: string; endDate: string };
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  chartData: DailyAggregate[];
  insights?: InsightsResponse | null;
}

/**
 * Export analytics data to PDF
 */
export async function exportToPDF(data: ExportData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(37, 99, 235); // Blue
  pdf.text('Arcadian GSC Insights Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128); // Gray
  pdf.text(
    `${data.dateRange.startDate} to ${data.dateRange.endDate}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  
  yPosition += 15;

  // Summary Statistics
  pdf.setFontSize(16);
  pdf.setTextColor(17, 24, 39); // Dark gray
  pdf.text('Summary Statistics', 15, yPosition);
  yPosition += 10;

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Clicks', data.summary.totalClicks.toLocaleString()],
    ['Total Impressions', data.summary.totalImpressions.toLocaleString()],
    ['Average CTR', `${(data.summary.avgCtr * 100).toFixed(2)}%`],
    ['Average Position', data.summary.avgPosition.toFixed(1)],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 15, right: 15 },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Analytics Insights
  if (data.chartData.length > 0) {
    const midpoint = Math.floor(data.chartData.length / 2);
    const firstHalf = data.chartData.slice(0, midpoint);
    const secondHalf = data.chartData.slice(midpoint);

    const firstHalfClicks = firstHalf.reduce((sum, d) => sum + d.clicks, 0);
    const secondHalfClicks = secondHalf.reduce((sum, d) => sum + d.clicks, 0);
    const clicksTrend = ((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100;

    const sortedByClicks = [...data.chartData].sort((a, b) => b.clicks - a.clicks);
    const bestDay = sortedByClicks[0];

    pdf.setFontSize(16);
    pdf.text('Key Insights', 15, yPosition);
    yPosition += 10;

    const insightsData = [
      ['Insight', 'Value'],
      ['Performance Trend', `${clicksTrend > 0 ? '+' : ''}${clicksTrend.toFixed(1)}%`],
      ['Best Day', `${bestDay.date} (${bestDay.clicks.toLocaleString()} clicks)`],
      ['Best CTR', `${(Math.max(...data.chartData.map(d => d.ctr)) * 100).toFixed(2)}%`],
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [insightsData[0]],
      body: insightsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234], textColor: 255 },
      margin: { left: 15, right: 15 },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }

  // Daily Data Table (last 10 days)
  pdf.setFontSize(16);
  pdf.text('Recent Performance (Last 10 Days)', 15, yPosition);
  yPosition += 10;

  const recentData = data.chartData.slice(-10);
  const tableData = recentData.map(d => [
    d.date,
    d.clicks.toLocaleString(),
    d.impressions.toLocaleString(),
    `${(d.ctr * 100).toFixed(2)}%`,
    d.position.toFixed(1),
  ]);

  autoTable(pdf, {
    startY: yPosition,
    head: [['Date', 'Clicks', 'Impressions', 'CTR', 'Position']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // AI Insights (if available)
  if (data.insights) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.text('AI-Generated Insights', 15, yPosition);
    yPosition += 10;

    // Key Insights
    if (data.insights.insights && data.insights.insights.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Insights:', 15, yPosition);
      yPosition += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      data.insights.insights.forEach((insight, index) => {
        const lines = pdf.splitTextToSize(`• ${insight}`, pageWidth - 30);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      });
      yPosition += 5;
    }

    // Opportunities
    if (data.insights.opportunities && data.insights.opportunities.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Opportunities:', 15, yPosition);
      yPosition += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      data.insights.opportunities.forEach((opportunity) => {
        const lines = pdf.splitTextToSize(`• ${opportunity}`, pageWidth - 30);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      });
    }
  }

  // Footer on all pages
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `gsc-insights-${data.dateRange.startDate}-to-${data.dateRange.endDate}.pdf`;
  pdf.save(fileName);
}

/**
 * Export chart as image and add to PDF
 */
export async function exportChartToPDF(
  chartElement: HTMLElement,
  data: ExportData
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(37, 99, 235);
  pdf.text('Arcadian GSC Insights Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128);
  pdf.text(
    `${data.dateRange.startDate} to ${data.dateRange.endDate}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  
  yPosition += 15;

  // Capture chart as image
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 30;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 15;
  } catch (error) {
    console.error('Error capturing chart:', error);
  }

  // Add summary data
  pdf.addPage();
  yPosition = 20;

  pdf.setFontSize(16);
  pdf.setTextColor(17, 24, 39);
  pdf.text('Summary Statistics', 15, yPosition);
  yPosition += 10;

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Clicks', data.summary.totalClicks.toLocaleString()],
    ['Total Impressions', data.summary.totalImpressions.toLocaleString()],
    ['Average CTR', `${(data.summary.avgCtr * 100).toFixed(2)}%`],
    ['Average Position', data.summary.avgPosition.toFixed(1)],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 15, right: 15 },
  });

  // Save
  const fileName = `gsc-insights-with-chart-${data.dateRange.startDate}-to-${data.dateRange.endDate}.pdf`;
  pdf.save(fileName);
}
