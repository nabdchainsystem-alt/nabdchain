/**
 * Excel Generator Service
 * Generates professional branded Excel documents using ExcelJS
 */

import ExcelJS from 'exceljs';
import {
  ExcelTemplate,
  ExcelSheetConfig,
  ExcelColumnConfig,
  ExportDocumentType,
  BrandingConfig,
  DEFAULT_BRANDING,
  QuoteComparisonExportData,
  RFQExportData,
  OrderExportData,
  InvoiceExportData,
  PayoutExportData,
  ExportOptions,
} from './types';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatStatus,
  sanitizeForExcel,
} from './formatters';

// ============================================================================
// DEFAULT TEMPLATE
// ============================================================================

const DEFAULT_EXCEL_TEMPLATE: Partial<ExcelTemplate> = {
  version: '1.0.0',
  styles: {
    headerFont: { name: 'Arial', size: 11, bold: true, color: 'FFFFFF' },
    bodyFont: { name: 'Arial', size: 10, bold: false, color: '1F2937' },
    titleFont: { name: 'Arial', size: 14, bold: true, color: '2563EB' },
    headerFill: '2563EB',
    alternateFill: 'F9FAFB',
    borderColor: 'E5E7EB',
  },
};

// ============================================================================
// COLUMN CONFIGURATIONS
// ============================================================================

const QUOTE_COMPARISON_COLUMNS: ExcelColumnConfig[] = [
  { key: 'seller', header: 'Seller', width: 25, type: 'string', alignment: 'left' },
  { key: 'quoteNumber', header: 'Quote #', width: 15, type: 'string', alignment: 'left' },
  { key: 'total', header: 'Total', width: 15, type: 'currency', alignment: 'right' },
  { key: 'estimatedDelivery', header: 'Delivery Date', width: 15, type: 'date', alignment: 'center' },
  { key: 'leadTimeDays', header: 'Lead Time (days)', width: 15, type: 'number', alignment: 'center' },
  { key: 'paymentTerms', header: 'Payment Terms', width: 20, type: 'string', alignment: 'left' },
  { key: 'totalScore', header: 'Score', width: 10, type: 'number', alignment: 'center', format: '0.0' },
  { key: 'priceScore', header: 'Price Score', width: 12, type: 'number', alignment: 'center', format: '0.0' },
  { key: 'deliveryScore', header: 'Delivery Score', width: 12, type: 'number', alignment: 'center', format: '0.0' },
  { key: 'qualityScore', header: 'Quality Score', width: 12, type: 'number', alignment: 'center', format: '0.0' },
  { key: 'reliabilityScore', header: 'Reliability Score', width: 14, type: 'number', alignment: 'center', format: '0.0' },
  { key: 'rank', header: 'Rank', width: 8, type: 'number', alignment: 'center' },
];

const RFQ_ITEMS_COLUMNS: ExcelColumnConfig[] = [
  { key: 'lineNumber', header: '#', width: 6, type: 'number', alignment: 'center' },
  { key: 'sku', header: 'SKU', width: 15, type: 'string', alignment: 'left' },
  { key: 'name', header: 'Item Name', width: 35, type: 'string', alignment: 'left' },
  { key: 'description', header: 'Description', width: 40, type: 'string', alignment: 'left' },
  { key: 'quantity', header: 'Qty', width: 10, type: 'number', alignment: 'right' },
  { key: 'unit', header: 'Unit', width: 10, type: 'string', alignment: 'center' },
  { key: 'targetPrice', header: 'Target Price', width: 15, type: 'currency', alignment: 'right' },
];

const ORDER_ITEMS_COLUMNS: ExcelColumnConfig[] = [
  { key: 'lineNumber', header: '#', width: 6, type: 'number', alignment: 'center' },
  { key: 'sku', header: 'SKU', width: 15, type: 'string', alignment: 'left' },
  { key: 'name', header: 'Item Name', width: 35, type: 'string', alignment: 'left' },
  { key: 'quantity', header: 'Qty', width: 10, type: 'number', alignment: 'right' },
  { key: 'unit', header: 'Unit', width: 10, type: 'string', alignment: 'center' },
  { key: 'unitPrice', header: 'Unit Price', width: 15, type: 'currency', alignment: 'right' },
  { key: 'total', header: 'Total', width: 15, type: 'currency', alignment: 'right' },
];

const INVOICE_ITEMS_COLUMNS: ExcelColumnConfig[] = [
  { key: 'lineNumber', header: '#', width: 6, type: 'number', alignment: 'center' },
  { key: 'sku', header: 'SKU', width: 15, type: 'string', alignment: 'left' },
  { key: 'name', header: 'Description', width: 40, type: 'string', alignment: 'left' },
  { key: 'quantity', header: 'Qty', width: 10, type: 'number', alignment: 'right' },
  { key: 'unit', header: 'Unit', width: 10, type: 'string', alignment: 'center' },
  { key: 'unitPrice', header: 'Unit Price', width: 15, type: 'currency', alignment: 'right' },
  { key: 'taxAmount', header: 'Tax', width: 12, type: 'currency', alignment: 'right' },
  { key: 'total', header: 'Total', width: 15, type: 'currency', alignment: 'right' },
];

const PAYOUT_ITEMS_COLUMNS: ExcelColumnConfig[] = [
  { key: 'orderNumber', header: 'Order #', width: 15, type: 'string', alignment: 'left' },
  { key: 'invoiceNumber', header: 'Invoice #', width: 15, type: 'string', alignment: 'left' },
  { key: 'grossAmount', header: 'Gross Amount', width: 15, type: 'currency', alignment: 'right' },
  { key: 'platformFee', header: 'Platform Fee', width: 15, type: 'currency', alignment: 'right' },
  { key: 'netAmount', header: 'Net Amount', width: 15, type: 'currency', alignment: 'right' },
  { key: 'paidAt', header: 'Paid Date', width: 15, type: 'date', alignment: 'center' },
];

// ============================================================================
// EXCEL GENERATOR CLASS
// ============================================================================

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private template: Partial<ExcelTemplate>;
  private branding: BrandingConfig;
  private options: ExportOptions;

  constructor(
    template: Partial<ExcelTemplate> = {},
    branding: Partial<BrandingConfig> = {},
    options: ExportOptions = {}
  ) {
    this.template = { ...DEFAULT_EXCEL_TEMPLATE, ...template };
    this.branding = { ...DEFAULT_BRANDING, ...branding };
    this.options = {
      includeScoring: true,
      includeHighlights: true,
      includeMetadata: true,
      includeAuditTrail: false,
      language: 'en',
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      ...options,
    };
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Generate Excel and return as Buffer
   */
  async generate(
    type: ExportDocumentType,
    data: QuoteComparisonExportData | RFQExportData | OrderExportData | InvoiceExportData | PayoutExportData
  ): Promise<Buffer> {
    // Reset workbook
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = this.branding.companyName;
    this.workbook.created = new Date();

    switch (type) {
      case 'quote_comparison':
        this.generateQuoteComparison(data as QuoteComparisonExportData);
        break;
      case 'rfq':
        this.generateRFQ(data as RFQExportData);
        break;
      case 'order':
        this.generateOrder(data as OrderExportData);
        break;
      case 'invoice':
        this.generateInvoice(data as InvoiceExportData);
        break;
      case 'payout':
        this.generatePayout(data as PayoutExportData);
        break;
    }

    return this.workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ============================================================================
  // QUOTE COMPARISON
  // ============================================================================

  private generateQuoteComparison(data: QuoteComparisonExportData): void {
    // Summary sheet
    const summarySheet = this.addSheet('Summary');
    this.addTitle(summarySheet, 'Quote Comparison Report');
    this.addBlankRow(summarySheet);

    // RFQ Info
    this.addSectionHeader(summarySheet, 'RFQ Information');
    this.addKeyValueRow(summarySheet, 'RFQ Number', data.rfq.rfqNumber);
    this.addKeyValueRow(summarySheet, 'Buyer', data.rfq.buyerCompany);
    this.addKeyValueRow(summarySheet, 'Created', formatDate(data.rfq.createdAt, this.options.timezone));
    this.addKeyValueRow(summarySheet, 'Expires', formatDate(data.rfq.expiresAt, this.options.timezone));
    this.addKeyValueRow(summarySheet, 'Quotes Received', data.quotes.length.toString());
    this.addBlankRow(summarySheet);

    // Recommendation
    if (this.options.includeHighlights && data.recommendation) {
      this.addSectionHeader(summarySheet, 'Recommendation');
      this.addKeyValueRow(summarySheet, 'Best Overall', this.getQuoteSellerName(data.recommendation.bestOverall, data.quotes));
      this.addKeyValueRow(summarySheet, 'Best Price', this.getQuoteSellerName(data.recommendation.bestPrice, data.quotes));
      this.addKeyValueRow(summarySheet, 'Best Delivery', this.getQuoteSellerName(data.recommendation.bestDelivery, data.quotes));
      this.addBlankRow(summarySheet);

      // Highlights
      if (data.recommendation.highlights.length > 0) {
        this.addSectionHeader(summarySheet, 'Highlights');
        data.recommendation.highlights.forEach((h) => {
          const seller = this.getQuoteSellerName(h.quoteId, data.quotes);
          this.addBulletRow(summarySheet, `${seller}: ${h.message}`);
        });
        this.addBlankRow(summarySheet);
      }

      // Warnings
      if (data.recommendation.warnings.length > 0) {
        this.addSectionHeader(summarySheet, 'Warnings');
        data.recommendation.warnings.forEach((w) => {
          const seller = this.getQuoteSellerName(w.quoteId, data.quotes);
          this.addBulletRow(summarySheet, `[${w.severity.toUpperCase()}] ${seller}: ${w.message}`);
        });
      }
    }

    // Auto-fit columns
    summarySheet.columns.forEach((col) => {
      col.width = 50;
    });

    // Comparison sheet
    const comparisonSheet = this.addSheet('Comparison');
    this.addTitle(comparisonSheet, 'Quote Comparison');
    this.addBlankRow(comparisonSheet);

    // Build comparison data
    const comparisonData = data.quotes.map((quote, index) => {
      const scoring = data.scoring?.normalizedScores.find((s) => s.quoteId === quote.id);
      return {
        seller: quote.sellerCompany,
        quoteNumber: quote.quoteNumber,
        total: quote.total,
        estimatedDelivery: quote.estimatedDelivery,
        leadTimeDays: quote.leadTimeDays,
        paymentTerms: quote.paymentTerms,
        totalScore: scoring?.totalScore || quote.score?.total || 0,
        priceScore: scoring?.priceScore || quote.score?.breakdown.price || 0,
        deliveryScore: scoring?.deliveryScore || quote.score?.breakdown.delivery || 0,
        qualityScore: scoring?.qualityScore || quote.score?.breakdown.quality || 0,
        reliabilityScore: scoring?.reliabilityScore || quote.score?.breakdown.reliability || 0,
        rank: quote.score?.rank || index + 1,
      };
    });

    // Filter columns based on options
    let columns = [...QUOTE_COMPARISON_COLUMNS];
    if (!this.options.includeScoring) {
      columns = columns.filter((c) => !['totalScore', 'priceScore', 'deliveryScore', 'qualityScore', 'reliabilityScore', 'rank'].includes(c.key));
    }

    this.addDataTable(comparisonSheet, columns, comparisonData);

    // Scoring weights
    if (this.options.includeScoring && data.scoring) {
      this.addBlankRow(comparisonSheet);
      this.addBlankRow(comparisonSheet);
      this.addSectionHeader(comparisonSheet, 'Scoring Weights');
      this.addKeyValueRow(comparisonSheet, 'Price', formatPercentage(data.scoring.weights.price));
      this.addKeyValueRow(comparisonSheet, 'Delivery', formatPercentage(data.scoring.weights.delivery));
      this.addKeyValueRow(comparisonSheet, 'Quality', formatPercentage(data.scoring.weights.quality));
      this.addKeyValueRow(comparisonSheet, 'Reliability', formatPercentage(data.scoring.weights.reliability));
    }

    // Individual quote sheets
    data.quotes.forEach((quote, index) => {
      const sheetName = `Quote ${index + 1}`;
      const sheet = this.addSheet(sheetName);

      this.addTitle(sheet, `Quote: ${quote.sellerCompany}`);
      this.addBlankRow(sheet);

      // Quote info
      this.addSectionHeader(sheet, 'Quote Details');
      this.addKeyValueRow(sheet, 'Quote Number', quote.quoteNumber);
      this.addKeyValueRow(sheet, 'Seller', quote.sellerCompany);
      this.addKeyValueRow(sheet, 'Rating', quote.sellerRating ? `${quote.sellerRating}/5` : 'N/A');
      this.addKeyValueRow(sheet, 'Valid Until', formatDate(quote.validUntil, this.options.timezone));
      this.addKeyValueRow(sheet, 'Lead Time', `${quote.leadTimeDays} days`);
      this.addKeyValueRow(sheet, 'Payment Terms', quote.paymentTerms);
      this.addBlankRow(sheet);

      // Line items
      this.addSectionHeader(sheet, 'Line Items');
      const lineItemData = quote.lineItems.map((item) => ({
        ...item,
        unitPrice: item.unitPrice,
        total: item.total,
      }));

      const lineItemColumns: ExcelColumnConfig[] = [
        { key: 'lineNumber', header: '#', width: 6, type: 'number', alignment: 'center' },
        { key: 'name', header: 'Item', width: 35, type: 'string', alignment: 'left' },
        { key: 'quantity', header: 'Qty', width: 10, type: 'number', alignment: 'right' },
        { key: 'unit', header: 'Unit', width: 10, type: 'string', alignment: 'center' },
        { key: 'unitPrice', header: 'Unit Price', width: 15, type: 'currency', alignment: 'right' },
        { key: 'total', header: 'Total', width: 15, type: 'currency', alignment: 'right' },
      ];

      this.addDataTable(sheet, lineItemColumns, lineItemData);
      this.addBlankRow(sheet);

      // Totals
      this.addSectionHeader(sheet, 'Summary');
      this.addKeyValueRow(sheet, 'Subtotal', formatCurrency(quote.subtotal, this.options.currency));
      this.addKeyValueRow(sheet, 'Taxes', formatCurrency(quote.taxes, this.options.currency));
      this.addKeyValueRow(sheet, 'Shipping', formatCurrency(quote.shipping, this.options.currency));
      if (quote.discount) {
        this.addKeyValueRow(sheet, 'Discount', `-${formatCurrency(quote.discount, this.options.currency)}`);
      }
      const totalRow = sheet.addRow(['', 'TOTAL', formatCurrency(quote.total, this.options.currency)]);
      totalRow.font = { bold: true, size: 12 };
      totalRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };

      // Pros/Cons
      if (this.options.includeScoring && quote.score) {
        this.addBlankRow(sheet);
        if (quote.score.pros.length > 0) {
          this.addSectionHeader(sheet, 'Pros');
          quote.score.pros.forEach((pro) => this.addBulletRow(sheet, pro));
        }
        if (quote.score.cons.length > 0) {
          this.addSectionHeader(sheet, 'Cons');
          quote.score.cons.forEach((con) => this.addBulletRow(sheet, con));
        }
      }

      // Auto-fit
      sheet.columns.forEach((col) => {
        col.width = Math.max(col.width || 10, 12);
      });
    });

    // RFQ Items sheet
    const rfqItemsSheet = this.addSheet('RFQ Items');
    this.addTitle(rfqItemsSheet, 'Requested Items');
    this.addBlankRow(rfqItemsSheet);
    this.addDataTable(rfqItemsSheet, RFQ_ITEMS_COLUMNS, data.rfq.items);
  }

  // ============================================================================
  // RFQ
  // ============================================================================

  private generateRFQ(data: RFQExportData): void {
    const sheet = this.addSheet('RFQ');

    this.addTitle(sheet, 'Request for Quote');
    this.addBlankRow(sheet);

    // RFQ Details
    this.addSectionHeader(sheet, 'RFQ Details');
    this.addKeyValueRow(sheet, 'RFQ Number', data.rfqNumber);
    this.addKeyValueRow(sheet, 'Status', formatStatus(data.status));
    this.addKeyValueRow(sheet, 'Created', formatDate(data.createdAt, this.options.timezone));
    this.addKeyValueRow(sheet, 'Expires', formatDate(data.expiresAt, this.options.timezone));
    this.addKeyValueRow(sheet, 'Priority', data.priority ? formatStatus(data.priority) : 'Normal');
    this.addBlankRow(sheet);

    // Buyer Info
    this.addSectionHeader(sheet, 'Buyer Information');
    this.addKeyValueRow(sheet, 'Company', data.buyerCompany);
    this.addKeyValueRow(sheet, 'Contact', data.buyerContact);
    this.addKeyValueRow(sheet, 'Email', data.buyerEmail);
    this.addBlankRow(sheet);

    // Delivery Requirements
    this.addSectionHeader(sheet, 'Delivery Requirements');
    this.addKeyValueRow(sheet, 'Location', this.formatAddressSingleLine(data.deliveryLocation));
    this.addKeyValueRow(sheet, 'Preferred Date', data.preferredDeliveryDate ? formatDate(data.preferredDeliveryDate, this.options.timezone) : 'Flexible');
    this.addKeyValueRow(sheet, 'Payment Terms', data.paymentTerms || 'To be negotiated');
    this.addBlankRow(sheet);

    // Notes
    if (data.notes) {
      this.addSectionHeader(sheet, 'Notes');
      sheet.addRow([data.notes]);
      this.addBlankRow(sheet);
    }

    // Response Status
    this.addSectionHeader(sheet, 'Response Status');
    this.addKeyValueRow(sheet, 'Quotes Received', data.quotesReceived.toString());
    this.addBlankRow(sheet);

    // Items
    this.addSectionHeader(sheet, 'Requested Items');
    this.addDataTable(sheet, RFQ_ITEMS_COLUMNS, data.items);

    // Auto-fit
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 50;
  }

  // ============================================================================
  // ORDER
  // ============================================================================

  private generateOrder(data: OrderExportData): void {
    const sheet = this.addSheet('Order');

    this.addTitle(sheet, 'Order Confirmation');
    this.addBlankRow(sheet);

    // Order Details
    this.addSectionHeader(sheet, 'Order Details');
    this.addKeyValueRow(sheet, 'Order Number', data.orderNumber);
    this.addKeyValueRow(sheet, 'Source', this.formatOrderSource(data.source));
    this.addKeyValueRow(sheet, 'Status', formatStatus(data.status));
    this.addKeyValueRow(sheet, 'Created', formatDate(data.createdAt, this.options.timezone));
    if (data.confirmedAt) {
      this.addKeyValueRow(sheet, 'Confirmed', formatDate(data.confirmedAt, this.options.timezone));
    }
    this.addBlankRow(sheet);

    // Buyer Info
    this.addSectionHeader(sheet, 'Buyer');
    this.addKeyValueRow(sheet, 'Company', data.buyer.companyName);
    this.addKeyValueRow(sheet, 'Contact', data.buyer.contactName);
    this.addKeyValueRow(sheet, 'Email', data.buyer.email);
    if (data.buyer.phone) {
      this.addKeyValueRow(sheet, 'Phone', data.buyer.phone);
    }
    this.addBlankRow(sheet);

    // Seller Info
    this.addSectionHeader(sheet, 'Seller');
    this.addKeyValueRow(sheet, 'Company', data.seller.companyName);
    this.addKeyValueRow(sheet, 'Contact', data.seller.contactName);
    this.addKeyValueRow(sheet, 'Email', data.seller.email);
    this.addBlankRow(sheet);

    // Shipping Address
    this.addSectionHeader(sheet, 'Shipping Address');
    this.addKeyValueRow(sheet, 'Address', this.formatAddressSingleLine(data.shippingAddress));
    this.addBlankRow(sheet);

    // Items
    this.addSectionHeader(sheet, 'Order Items');
    this.addDataTable(sheet, ORDER_ITEMS_COLUMNS, data.items);
    this.addBlankRow(sheet);

    // Totals
    this.addSectionHeader(sheet, 'Order Summary');
    this.addKeyValueRow(sheet, 'Subtotal', formatCurrency(data.subtotal, this.options.currency));
    this.addKeyValueRow(sheet, `Taxes${data.taxRate ? ` (${formatPercentage(data.taxRate)})` : ''}`, formatCurrency(data.taxes, this.options.currency));
    this.addKeyValueRow(sheet, 'Shipping', formatCurrency(data.shipping, this.options.currency));
    if (data.discount) {
      this.addKeyValueRow(sheet, 'Discount', `-${formatCurrency(data.discount, this.options.currency)}`);
    }
    const totalRow = sheet.addRow(['', 'TOTAL', formatCurrency(data.total, this.options.currency)]);
    totalRow.font = { bold: true, size: 12 };
    this.addBlankRow(sheet);

    // Payment & Fulfillment
    this.addSectionHeader(sheet, 'Payment & Fulfillment');
    this.addKeyValueRow(sheet, 'Payment Status', formatStatus(data.paymentStatus));
    this.addKeyValueRow(sheet, 'Payment Method', data.paymentMethod || 'N/A');
    this.addKeyValueRow(sheet, 'Fulfillment Status', formatStatus(data.fulfillmentStatus));
    this.addKeyValueRow(sheet, 'Tracking Number', data.trackingNumber || 'N/A');
    this.addKeyValueRow(sheet, 'Carrier', data.carrier || 'N/A');

    // Health status
    if (this.options.includeHighlights && data.health) {
      this.addBlankRow(sheet);
      this.addSectionHeader(sheet, 'Order Health');
      this.addKeyValueRow(sheet, 'Status', data.health.status.toUpperCase());
      if (data.health.reason) {
        this.addKeyValueRow(sheet, 'Reason', data.health.reason);
      }
    }

    // Audit trail
    if (this.options.includeAuditTrail && data.auditTrail && data.auditTrail.length > 0) {
      const auditSheet = this.addSheet('Activity Log');
      this.addTitle(auditSheet, 'Activity Timeline');
      this.addBlankRow(auditSheet);

      const auditColumns: ExcelColumnConfig[] = [
        { key: 'timestamp', header: 'Date/Time', width: 20, type: 'date', alignment: 'left' },
        { key: 'action', header: 'Action', width: 25, type: 'string', alignment: 'left' },
        { key: 'actor', header: 'By', width: 20, type: 'string', alignment: 'left' },
        { key: 'details', header: 'Details', width: 40, type: 'string', alignment: 'left' },
      ];

      this.addDataTable(auditSheet, auditColumns, data.auditTrail);
    }

    // Auto-fit
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 50;
  }

  // ============================================================================
  // INVOICE
  // ============================================================================

  private generateInvoice(data: InvoiceExportData): void {
    const sheet = this.addSheet('Invoice');

    this.addTitle(sheet, 'Invoice');
    this.addBlankRow(sheet);

    // Invoice Details
    this.addSectionHeader(sheet, 'Invoice Details');
    this.addKeyValueRow(sheet, 'Invoice Number', data.invoiceNumber);
    this.addKeyValueRow(sheet, 'Order Number', data.orderNumber);
    this.addKeyValueRow(sheet, 'Status', formatStatus(data.status));
    this.addKeyValueRow(sheet, 'Issue Date', formatDate(data.issuedAt, this.options.timezone));
    this.addKeyValueRow(sheet, 'Due Date', formatDate(data.dueAt, this.options.timezone));
    this.addKeyValueRow(sheet, 'Payment Terms', data.paymentTerms);
    if (data.reference) {
      this.addKeyValueRow(sheet, 'Reference', data.reference);
    }
    if (data.poNumber) {
      this.addKeyValueRow(sheet, 'PO Number', data.poNumber);
    }
    this.addBlankRow(sheet);

    // From (Seller)
    this.addSectionHeader(sheet, 'From');
    this.addKeyValueRow(sheet, 'Company', data.seller.companyName);
    this.addKeyValueRow(sheet, 'Contact', data.seller.contactName);
    this.addKeyValueRow(sheet, 'Email', data.seller.email);
    if (data.seller.taxId) {
      this.addKeyValueRow(sheet, 'Tax ID', data.seller.taxId);
    }
    this.addBlankRow(sheet);

    // To (Buyer)
    this.addSectionHeader(sheet, 'Bill To');
    this.addKeyValueRow(sheet, 'Company', data.buyer.companyName);
    this.addKeyValueRow(sheet, 'Contact', data.buyer.contactName);
    this.addKeyValueRow(sheet, 'Email', data.buyer.email);
    this.addKeyValueRow(sheet, 'Address', this.formatAddressSingleLine(data.billingAddress));
    this.addBlankRow(sheet);

    // Line Items
    this.addSectionHeader(sheet, 'Items');
    this.addDataTable(sheet, INVOICE_ITEMS_COLUMNS, data.items);
    this.addBlankRow(sheet);

    // Totals
    this.addSectionHeader(sheet, 'Summary');
    this.addKeyValueRow(sheet, 'Subtotal', formatCurrency(data.subtotal, this.options.currency));
    this.addKeyValueRow(sheet, `VAT (${formatPercentage(data.taxRate)})`, formatCurrency(data.taxAmount, this.options.currency));
    this.addKeyValueRow(sheet, 'Shipping', formatCurrency(data.shipping, this.options.currency));
    if (data.discount) {
      this.addKeyValueRow(sheet, 'Discount', `-${formatCurrency(data.discount, this.options.currency)}`);
    }

    let totalRow = sheet.addRow(['', 'TOTAL', formatCurrency(data.total, this.options.currency)]);
    totalRow.font = { bold: true, size: 12 };

    this.addKeyValueRow(sheet, 'Amount Paid', formatCurrency(data.amountPaid, this.options.currency));

    totalRow = sheet.addRow(['', 'AMOUNT DUE', formatCurrency(data.amountDue, this.options.currency)]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: data.amountDue > 0 ? 'FFFEF2F2' : 'FFF0FDF4' },
    };

    // Bank Details
    if (data.bankDetails) {
      this.addBlankRow(sheet);
      this.addSectionHeader(sheet, 'Payment Information');
      this.addKeyValueRow(sheet, 'Bank Name', data.bankDetails.bankName);
      this.addKeyValueRow(sheet, 'Account Holder', data.bankDetails.accountHolder);
      if (data.bankDetails.iban) {
        this.addKeyValueRow(sheet, 'IBAN', data.bankDetails.iban);
      }
      if (data.bankDetails.swiftBic) {
        this.addKeyValueRow(sheet, 'SWIFT/BIC', data.bankDetails.swiftBic);
      }
    }

    // Notes
    if (data.notes) {
      this.addBlankRow(sheet);
      this.addSectionHeader(sheet, 'Notes');
      sheet.addRow([data.notes]);
    }

    // Auto-fit
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 50;
  }

  // ============================================================================
  // PAYOUT
  // ============================================================================

  private generatePayout(data: PayoutExportData): void {
    const sheet = this.addSheet('Payout');

    this.addTitle(sheet, 'Payout Statement');
    this.addBlankRow(sheet);

    // Payout Details
    this.addSectionHeader(sheet, 'Payout Details');
    this.addKeyValueRow(sheet, 'Payout Number', data.payoutNumber);
    this.addKeyValueRow(sheet, 'Status', formatStatus(data.status));
    this.addKeyValueRow(sheet, 'Period', `${formatDate(data.periodStart, this.options.timezone)} - ${formatDate(data.periodEnd, this.options.timezone)}`);
    this.addKeyValueRow(sheet, 'Scheduled', formatDate(data.scheduledAt, this.options.timezone));
    this.addKeyValueRow(sheet, 'Processed', data.processedAt ? formatDate(data.processedAt, this.options.timezone) : 'Pending');
    this.addBlankRow(sheet);

    // Seller Info
    this.addSectionHeader(sheet, 'Seller Information');
    this.addKeyValueRow(sheet, 'Company', data.seller.companyName);
    this.addKeyValueRow(sheet, 'Contact', data.seller.contactName);
    this.addKeyValueRow(sheet, 'Email', data.seller.email);
    this.addBlankRow(sheet);

    // Payout Breakdown
    this.addSectionHeader(sheet, 'Payout Breakdown');
    this.addKeyValueRow(sheet, 'Gross Amount', formatCurrency(data.grossAmount, this.options.currency));
    this.addKeyValueRow(sheet, `Platform Fee (${formatPercentage(data.platformFeeRate)})`, `-${formatCurrency(data.platformFee, this.options.currency)}`);
    this.addKeyValueRow(sheet, 'Processing Fee', `-${formatCurrency(data.processingFee, this.options.currency)}`);
    if (data.adjustments !== 0) {
      this.addKeyValueRow(sheet, 'Adjustments', formatCurrency(data.adjustments, this.options.currency));
    }

    const totalRow = sheet.addRow(['', 'NET PAYOUT', formatCurrency(data.netAmount, this.options.currency)]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0FDF4' },
    };
    this.addBlankRow(sheet);

    // Bank Details
    this.addSectionHeader(sheet, 'Payment Destination');
    this.addKeyValueRow(sheet, 'Bank', data.bankDetails.bankName);
    this.addKeyValueRow(sheet, 'Account Holder', data.bankDetails.accountHolder);
    if (data.bankDetails.iban) {
      this.addKeyValueRow(sheet, 'IBAN', data.bankDetails.iban);
    }
    this.addKeyValueRow(sheet, 'Transaction Ref', data.transactionRef || 'Pending');
    this.addBlankRow(sheet);

    // Included Transactions
    this.addSectionHeader(sheet, `Included Transactions (${data.orderCount} orders, ${data.invoiceCount} invoices)`);
    if (data.lineItems.length > 0) {
      this.addDataTable(sheet, PAYOUT_ITEMS_COLUMNS, data.lineItems);
    }

    // Auto-fit
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 50;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addSheet(name: string): ExcelJS.Worksheet {
    const sheet = this.workbook.addWorksheet(name);
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    return sheet;
  }

  private addTitle(sheet: ExcelJS.Worksheet, title: string): void {
    const row = sheet.addRow([title]);
    row.font = {
      name: this.template.styles?.titleFont?.name || 'Arial',
      size: this.template.styles?.titleFont?.size || 14,
      bold: true,
      color: { argb: 'FF2563EB' },
    };
    row.height = 25;
  }

  private addSectionHeader(sheet: ExcelJS.Worksheet, header: string): void {
    const row = sheet.addRow([header]);
    row.font = {
      name: this.template.styles?.headerFont?.name || 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FF1F2937' },
    };
    row.getCell(1).border = {
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };
    row.height = 20;
  }

  private addKeyValueRow(sheet: ExcelJS.Worksheet, key: string, value: string): void {
    const row = sheet.addRow([key, value]);
    row.getCell(1).font = { color: { argb: 'FF6B7280' } };
    row.getCell(2).font = { color: { argb: 'FF1F2937' } };
  }

  private addBulletRow(sheet: ExcelJS.Worksheet, text: string): void {
    sheet.addRow([`• ${text}`]);
  }

  private addBlankRow(sheet: ExcelJS.Worksheet): void {
    sheet.addRow([]);
  }

  private addDataTable(
    sheet: ExcelJS.Worksheet,
    columns: ExcelColumnConfig[],
    data: Record<string, unknown>[]
  ): void {
    // Headers
    const headerRow = sheet.addRow(columns.map((c) => c.header));
    headerRow.font = {
      name: this.template.styles?.headerFont?.name || 'Arial',
      size: this.template.styles?.headerFont?.size || 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${this.template.styles?.headerFill || '2563EB'}` },
      };
      cell.alignment = {
        horizontal: columns[colNumber - 1]?.alignment || 'left',
        vertical: 'middle',
      };
    });
    headerRow.height = 22;

    // Data rows
    data.forEach((item, rowIndex) => {
      const rowData = columns.map((col) => {
        const value = item[col.key];
        return this.formatCellValue(value, col);
      });

      const row = sheet.addRow(rowData);

      // Alternate row coloring
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `FF${this.template.styles?.alternateFill || 'F9FAFB'}` },
          };
        });
      }

      // Alignment
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          horizontal: columns[colNumber - 1]?.alignment || 'left',
          vertical: 'middle',
        };
      });
    });

    // Set column widths
    columns.forEach((col, index) => {
      sheet.getColumn(index + 1).width = col.width;
    });
  }

  private formatCellValue(value: unknown, column: ExcelColumnConfig): string | number | Date {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        return formatCurrency(value as number, this.options.currency, { showSymbol: true });
      case 'date':
        return formatDate(value as Date, this.options.timezone);
      case 'percentage':
        return formatPercentage(value as number);
      case 'number':
        return typeof value === 'number' ? value : Number(value) || 0;
      case 'status':
        return formatStatus(value as string);
      default:
        return sanitizeForExcel(String(value));
    }
  }

  private formatAddressSingleLine(address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  }): string {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  private formatOrderSource(source: string): string {
    const sources: Record<string, string> = {
      rfq: 'From RFQ',
      direct_buy: 'Direct Purchase',
      cart: 'Shopping Cart',
    };
    return sources[source] || source;
  }

  private getQuoteSellerName(quoteId: string, quotes: { id: string; sellerCompany: string }[]): string {
    const quote = quotes.find((q) => q.id === quoteId);
    return quote?.sellerCompany || 'Unknown Seller';
  }
}

export default ExcelGenerator;
