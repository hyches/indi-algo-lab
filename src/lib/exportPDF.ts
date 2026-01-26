// PDF Export Utility for Trading Reports
// Uses browser's print functionality for clean PDF generation

interface ExportColumn {
  header: string;
  key: string;
  format?: (value: unknown) => string;
}

interface ExportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  summary?: { label: string; value: string }[];
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const generatePDFContent = (data: ExportData): string => {
  const summaryHTML = data.summary
    ? `<div class="summary-grid">
        ${data.summary.map(item => `
          <div class="summary-item">
            <span class="summary-label">${item.label}</span>
            <span class="summary-value">${item.value}</span>
          </div>
        `).join('')}
      </div>`
    : '';

  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${data.columns.map(col => `<th>${col.header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.rows.map(row => `
          <tr>
            ${data.columns.map(col => {
              const value = row[col.key];
              const formatted = col.format ? col.format(value) : String(value ?? '');
              return `<td>${formatted}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        
        .header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }
        
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #6366f1;
          margin-bottom: 4px;
        }
        
        h1 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .meta {
          margin-top: 10px;
          font-size: 12px;
          color: #888;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .summary-value {
          font-size: 16px;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        
        th {
          background: #f9fafb;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }
        
        tr:hover td {
          background: #f9fafb;
        }
        
        .positive {
          color: #10b981;
        }
        
        .negative {
          color: #ef4444;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 11px;
          color: #888;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">📈 TradingApp</div>
        <h1>${data.title}</h1>
        ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
        <p class="meta">Generated on ${formatDate(data.generatedAt)} at ${data.generatedAt.toLocaleTimeString()}</p>
      </div>
      
      ${summaryHTML}
      ${tableHTML}
      
      <div class="footer">
        <p>This report is for informational purposes only. Not financial advice.</p>
        <p>© ${new Date().getFullYear()} TradingApp - Paper Trading Platform</p>
      </div>
    </body>
    </html>
  `;
};

export const exportToPDF = (data: ExportData): void => {
  const content = generatePDFContent(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Pre-built export configurations
export const exportHoldingsStatement = (
  holdings: Array<{
    symbol: string;
    qty: number;
    avgPrice: number;
    ltp: number;
    pnl: number;
    pnlPercent: number;
  }>,
  totalValue: number,
  totalPnL: number
): void => {
  exportToPDF({
    title: 'Holdings Statement',
    subtitle: 'Current Portfolio Holdings',
    generatedAt: new Date(),
    summary: [
      { label: 'Total Holdings', value: String(holdings.length) },
      { label: 'Portfolio Value', value: formatCurrency(totalValue) },
      { label: 'Total P&L', value: formatCurrency(totalPnL) },
      { label: 'P&L %', value: formatPercent((totalPnL / (totalValue - totalPnL)) * 100) },
    ],
    columns: [
      { header: 'Symbol', key: 'symbol' },
      { header: 'Quantity', key: 'qty' },
      { header: 'Avg Price', key: 'avgPrice', format: (v) => formatCurrency(v as number) },
      { header: 'LTP', key: 'ltp', format: (v) => formatCurrency(v as number) },
      { header: 'Value', key: 'value', format: (v) => formatCurrency(v as number) },
      { header: 'P&L', key: 'pnl', format: (v) => formatCurrency(v as number) },
      { header: 'P&L %', key: 'pnlPercent', format: (v) => formatPercent(v as number) },
    ],
    rows: holdings.map(h => ({
      ...h,
      value: h.qty * h.ltp,
    })),
  });
};

export const exportCapitalGainsReport = (
  trades: Array<{
    symbol: string;
    buyDate: Date;
    sellDate: Date;
    buyPrice: number;
    sellPrice: number;
    qty: number;
    pnl: number;
    holdingPeriod: number;
    taxType: 'STCG' | 'LTCG';
  }>,
  stcgTotal: number,
  ltcgTotal: number
): void => {
  exportToPDF({
    title: 'Capital Gains Report',
    subtitle: `FY ${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    generatedAt: new Date(),
    summary: [
      { label: 'Total Trades', value: String(trades.length) },
      { label: 'Short-Term Gains', value: formatCurrency(stcgTotal) },
      { label: 'Long-Term Gains', value: formatCurrency(ltcgTotal) },
      { label: 'Total Gains', value: formatCurrency(stcgTotal + ltcgTotal) },
    ],
    columns: [
      { header: 'Symbol', key: 'symbol' },
      { header: 'Buy Date', key: 'buyDate', format: (v) => formatDate(v as Date) },
      { header: 'Sell Date', key: 'sellDate', format: (v) => formatDate(v as Date) },
      { header: 'Qty', key: 'qty' },
      { header: 'Buy Price', key: 'buyPrice', format: (v) => formatCurrency(v as number) },
      { header: 'Sell Price', key: 'sellPrice', format: (v) => formatCurrency(v as number) },
      { header: 'P&L', key: 'pnl', format: (v) => formatCurrency(v as number) },
      { header: 'Type', key: 'taxType' },
    ],
    rows: trades,
  });
};

export const exportTradeJournal = (
  entries: Array<{
    date: Date;
    symbol: string;
    action: string;
    strategy: string;
    outcome: string;
    pnl: number;
    notes: string;
  }>
): void => {
  const totalPnL = entries.reduce((sum, e) => sum + e.pnl, 0);
  const winCount = entries.filter(e => e.pnl > 0).length;
  const winRate = entries.length > 0 ? (winCount / entries.length) * 100 : 0;

  exportToPDF({
    title: 'Trade Journal',
    subtitle: 'Trading Activity and Notes',
    generatedAt: new Date(),
    summary: [
      { label: 'Total Entries', value: String(entries.length) },
      { label: 'Win Rate', value: formatPercent(winRate) },
      { label: 'Total P&L', value: formatCurrency(totalPnL) },
      { label: 'Avg P&L', value: formatCurrency(entries.length > 0 ? totalPnL / entries.length : 0) },
    ],
    columns: [
      { header: 'Date', key: 'date', format: (v) => formatDate(v as Date) },
      { header: 'Symbol', key: 'symbol' },
      { header: 'Action', key: 'action' },
      { header: 'Strategy', key: 'strategy' },
      { header: 'Outcome', key: 'outcome' },
      { header: 'P&L', key: 'pnl', format: (v) => formatCurrency(v as number) },
      { header: 'Notes', key: 'notes' },
    ],
    rows: entries,
  });
};
