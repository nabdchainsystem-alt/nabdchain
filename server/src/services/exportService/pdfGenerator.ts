/**
 * PDF Generator Service
 * Generates professional branded PDF documents using PDFKit
 */

// @ts-ignore no type declarations on some environments
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import {
  PDFTemplate,
  ExportDocumentType,
  BrandingConfig,
  DEFAULT_BRANDING,
  QuoteComparisonExportData,
  QuoteExportData,
  RFQExportData,
  OrderExportData,
  InvoiceExportData,
  PayoutExportData,
  ExportOptions,
} from './types';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from './formatters';

// ============================================================================
// DEFAULT TEMPLATE
// ============================================================================

const DEFAULT_PDF_TEMPLATE: PDFTemplate = {
  type: 'order',
  version: '1.0.0',
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 50, right: 50, bottom: 50, left: 50 },
  header: {
    height: 80,
    showLogo: true,
    showTitle: true,
    showDocumentNumber: true,
    showDate: true,
  },
  footer: {
    height: 40,
    showPageNumbers: true,
    showGeneratedBy: true,
    showTimestamp: true,
  },
  fonts: {
    primary: 'Helvetica',
    secondary: 'Helvetica-Bold',
    sizes: { title: 24, subtitle: 16, heading: 14, body: 10, small: 8 },
  },
  colors: {
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  table: {
    headerBackground: '#2563eb',
    headerTextColor: '#ffffff',
    alternateRowBackground: '#f9fafb',
    borderColor: '#e5e7eb',
    cellPadding: 8,
  },
};

// ============================================================================
// PDF GENERATOR CLASS
// ============================================================================

export class PDFGenerator {
  private doc: typeof PDFDocument.prototype;
  private template: PDFTemplate;
  private branding: BrandingConfig;
  private options: ExportOptions;
  private pageNumber: number = 0;
  private yPosition: number = 0;

  constructor(
    template: Partial<PDFTemplate> = {},
    branding: Partial<BrandingConfig> = {},
    options: ExportOptions = {}
  ) {
    this.template = { ...DEFAULT_PDF_TEMPLATE, ...template };
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
  }

  /**
   * Generate PDF and return as Buffer
   */
  async generate(
    type: ExportDocumentType,
    data: QuoteComparisonExportData | RFQExportData | OrderExportData | InvoiceExportData | PayoutExportData
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc = new PDFDocument({
        size: this.template.pageSize,
        layout: this.template.orientation,
        margins: this.template.margins,
        bufferPages: true,
      });

      // Collect chunks
      this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      try {
        // Generate content based on type
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

        // Add page numbers to all pages
        this.addPageNumbers();

        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================================================
  // QUOTE COMPARISON
  // ============================================================================

  private generateQuoteComparison(data: QuoteComparisonExportData): void {
    this.startPage();
    this.addHeader('Quote Comparison Report', data.rfq.rfqNumber);

    // RFQ Summary
    this.addSection('Request for Quote Summary');
    this.addKeyValuePairs([
      { label: 'RFQ Number', value: data.rfq.rfqNumber },
      { label: 'Buyer', value: data.rfq.buyerCompany },
      { label: 'Created', value: formatDate(data.rfq.createdAt, this.options.timezone) },
      { label: 'Expires', value: formatDate(data.rfq.expiresAt, this.options.timezone) },
      { label: 'Quotes Received', value: data.quotes.length.toString() },
    ]);

    // Items requested
    this.addSection('Items Requested');
    this.addTable(
      ['#', 'Item', 'Qty', 'Unit', 'Target Price'],
      data.rfq.items.map((item, i) => [
        (i + 1).toString(),
        item.name,
        formatNumber(item.quantity),
        item.unit,
        item.targetPrice ? formatCurrency(item.targetPrice, this.options.currency) : '-',
      ]),
      [30, 200, 60, 60, 80]
    );

    // Recommendation highlights
    if (this.options.includeHighlights && data.recommendation) {
      this.addSection('Recommendation');

      this.doc
        .font(this.template.fonts.secondary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.success)
        .text(`Best Overall: Quote from ${this.getQuoteSellerName(data.recommendation.bestOverall, data.quotes)}`, this.template.margins.left, this.yPosition);

      this.yPosition += 20;

      this.doc.fillColor(this.template.colors.text);

      // Highlights
      if (data.recommendation.highlights.length > 0) {
        this.addSubSection('Highlights');
        data.recommendation.highlights.forEach((highlight) => {
          const seller = this.getQuoteSellerName(highlight.quoteId, data.quotes);
          this.addBulletPoint(`${seller}: ${highlight.message}`);
        });
      }

      // Warnings
      if (data.recommendation.warnings.length > 0) {
        this.addSubSection('Warnings');
        data.recommendation.warnings.forEach((warning) => {
          const seller = this.getQuoteSellerName(warning.quoteId, data.quotes);
          const color = warning.severity === 'high' ? this.template.colors.error :
                       warning.severity === 'medium' ? this.template.colors.warning :
                       this.template.colors.textLight;
          this.addBulletPoint(`${seller}: ${warning.message}`, color);
        });
      }
    }

    // Quote comparison table
    this.checkPageBreak(200);
    this.addSection('Quote Comparison');

    const comparisonHeaders = ['Seller', 'Total', 'Delivery', 'Payment Terms'];
    if (this.options.includeScoring) {
      comparisonHeaders.push('Score');
    }

    const comparisonRows = data.quotes.map((quote) => {
      const row = [
        quote.sellerCompany,
        formatCurrency(quote.total, this.options.currency),
        formatDate(quote.estimatedDelivery, this.options.timezone),
        quote.paymentTerms,
      ];
      if (this.options.includeScoring && quote.score) {
        row.push(`${quote.score.total.toFixed(1)}/100`);
      }
      return row;
    });

    const colWidths = this.options.includeScoring
      ? [120, 80, 100, 100, 60]
      : [150, 100, 120, 120];

    this.addTable(comparisonHeaders, comparisonRows, colWidths);

    // Detailed scoring breakdown
    if (this.options.includeScoring && data.scoring) {
      this.checkPageBreak(150);
      this.addSection('Scoring Breakdown');

      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.small)
        .fillColor(this.template.colors.textLight)
        .text(
          `Weights: Price ${formatPercentage(data.scoring.weights.price)}, ` +
          `Delivery ${formatPercentage(data.scoring.weights.delivery)}, ` +
          `Quality ${formatPercentage(data.scoring.weights.quality)}, ` +
          `Reliability ${formatPercentage(data.scoring.weights.reliability)}`,
          this.template.margins.left,
          this.yPosition
        );

      this.yPosition += 20;

      const scoreHeaders = ['Seller', 'Price', 'Delivery', 'Quality', 'Reliability', 'Total'];
      const scoreRows = data.scoring.normalizedScores.map((score) => {
        const quote = data.quotes.find((q) => q.id === score.quoteId);
        return [
          quote?.sellerCompany || 'Unknown',
          score.priceScore.toFixed(1),
          score.deliveryScore.toFixed(1),
          score.qualityScore.toFixed(1),
          score.reliabilityScore.toFixed(1),
          score.totalScore.toFixed(1),
        ];
      });

      this.addTable(scoreHeaders, scoreRows, [120, 60, 60, 60, 70, 60]);
    }

    // Individual quote details
    data.quotes.forEach((quote, index) => {
      this.checkPageBreak(250);
      this.addSection(`Quote ${index + 1}: ${quote.sellerCompany}`);

      this.addKeyValuePairs([
        { label: 'Quote Number', value: quote.quoteNumber },
        { label: 'Seller Rating', value: quote.sellerRating ? `${quote.sellerRating}/5` : 'N/A' },
        { label: 'Valid Until', value: formatDate(quote.validUntil, this.options.timezone) },
        { label: 'Lead Time', value: `${quote.leadTimeDays} days` },
      ]);

      // Line items
      this.addSubSection('Line Items');
      this.addTable(
        ['#', 'Item', 'Qty', 'Unit Price', 'Total'],
        quote.lineItems.map((item, i) => [
          (i + 1).toString(),
          item.name,
          formatNumber(item.quantity),
          formatCurrency(item.unitPrice, this.options.currency),
          formatCurrency(item.total, this.options.currency),
        ]),
        [30, 180, 60, 80, 80]
      );

      // Totals
      this.addTotalsBox([
        { label: 'Subtotal', value: formatCurrency(quote.subtotal, this.options.currency) },
        { label: 'Taxes', value: formatCurrency(quote.taxes, this.options.currency) },
        { label: 'Shipping', value: formatCurrency(quote.shipping, this.options.currency) },
        { label: 'Total', value: formatCurrency(quote.total, this.options.currency), bold: true },
      ]);

      // Pros/Cons
      if (this.options.includeScoring && quote.score) {
        if (quote.score.pros.length > 0) {
          this.addSubSection('Pros');
          quote.score.pros.forEach((pro) => this.addBulletPoint(pro, this.template.colors.success));
        }
        if (quote.score.cons.length > 0) {
          this.addSubSection('Cons');
          quote.score.cons.forEach((con) => this.addBulletPoint(con, this.template.colors.error));
        }
      }
    });

    // Metadata
    if (this.options.includeMetadata) {
      this.checkPageBreak(80);
      this.addMetadataFooter(data.generatedAt, data.generatedBy);
    }
  }

  // ============================================================================
  // RFQ
  // ============================================================================

  private generateRFQ(data: RFQExportData): void {
    this.startPage();
    this.addHeader('Request for Quote', data.rfqNumber);

    // Status badge
    this.addStatusBadge(data.status);

    // Basic info
    this.addSection('RFQ Details');
    this.addKeyValuePairs([
      { label: 'RFQ Number', value: data.rfqNumber },
      { label: 'Status', value: this.formatStatus(data.status) },
      { label: 'Created', value: formatDate(data.createdAt, this.options.timezone) },
      { label: 'Expires', value: formatDate(data.expiresAt, this.options.timezone) },
      { label: 'Priority', value: data.priority ? this.formatPriority(data.priority) : 'Normal' },
    ]);

    // Buyer info
    this.addSection('Buyer Information');
    this.addKeyValuePairs([
      { label: 'Company', value: data.buyerCompany },
      { label: 'Contact', value: data.buyerContact },
      { label: 'Email', value: data.buyerEmail },
    ]);

    // Delivery requirements
    this.addSection('Delivery Requirements');
    this.addKeyValuePairs([
      { label: 'Location', value: this.formatAddress(data.deliveryLocation) },
      { label: 'Preferred Date', value: data.preferredDeliveryDate ? formatDate(data.preferredDeliveryDate, this.options.timezone) : 'Flexible' },
      { label: 'Payment Terms', value: data.paymentTerms || 'To be negotiated' },
    ]);

    // Items
    this.addSection('Requested Items');
    this.addTable(
      ['#', 'SKU', 'Item Name', 'Qty', 'Unit', 'Target Price'],
      data.items.map((item) => [
        item.lineNumber.toString(),
        item.sku || '-',
        item.name,
        formatNumber(item.quantity),
        item.unit,
        item.targetPrice ? formatCurrency(item.targetPrice, this.options.currency) : '-',
      ]),
      [30, 60, 180, 50, 50, 80]
    );

    // Item specifications
    const itemsWithSpecs = data.items.filter((item) => item.specifications && Object.keys(item.specifications).length > 0);
    if (itemsWithSpecs.length > 0) {
      this.addSection('Item Specifications');
      itemsWithSpecs.forEach((item) => {
        this.addSubSection(item.name);
        const specs = Object.entries(item.specifications || {}).map(([key, value]) => ({
          label: key,
          value: value,
        }));
        this.addKeyValuePairs(specs);
      });
    }

    // Notes
    if (data.notes) {
      this.addSection('Additional Notes');
      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.text)
        .text(data.notes, this.template.margins.left, this.yPosition, {
          width: this.getContentWidth(),
        });
      this.yPosition = this.doc.y + 15;
    }

    // Quote status
    this.addSection('Response Status');
    this.addKeyValuePairs([
      { label: 'Quotes Received', value: data.quotesReceived.toString() },
    ]);
  }

  // ============================================================================
  // ORDER
  // ============================================================================

  private generateOrder(data: OrderExportData): void {
    this.startPage();
    this.addHeader('Order Confirmation', data.orderNumber);

    // Status badges
    this.addStatusBadge(data.status);

    // Order info
    this.addSection('Order Details');
    this.addKeyValuePairs([
      { label: 'Order Number', value: data.orderNumber },
      { label: 'Source', value: this.formatOrderSource(data.source) },
      { label: 'Status', value: this.formatStatus(data.status) },
      { label: 'Created', value: formatDate(data.createdAt, this.options.timezone) },
    ]);

    // Parties
    this.doc.moveDown(0.5);

    const colWidth = (this.getContentWidth() - 20) / 2;
    const leftX = this.template.margins.left;
    const rightX = leftX + colWidth + 20;

    // Buyer box
    this.addInfoBox('Buyer', [
      data.buyer.companyName,
      data.buyer.contactName,
      data.buyer.email,
      data.buyer.phone || '',
    ], leftX, this.yPosition, colWidth);

    // Seller box
    this.addInfoBox('Seller', [
      data.seller.companyName,
      data.seller.contactName,
      data.seller.email,
      data.seller.phone || '',
    ], rightX, this.yPosition, colWidth);

    this.yPosition += 100;

    // Shipping address
    this.addSection('Shipping Address');
    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.body)
      .fillColor(this.template.colors.text)
      .text(this.formatAddress(data.shippingAddress), this.template.margins.left, this.yPosition);
    this.yPosition = this.doc.y + 15;

    // Items
    this.addSection('Order Items');
    this.addTable(
      ['#', 'SKU', 'Item', 'Qty', 'Unit Price', 'Total'],
      data.items.map((item) => [
        item.lineNumber.toString(),
        item.sku || '-',
        item.name,
        formatNumber(item.quantity),
        formatCurrency(item.unitPrice, this.options.currency),
        formatCurrency(item.total, this.options.currency),
      ]),
      [30, 60, 170, 50, 80, 80]
    );

    // Totals
    this.addTotalsBox([
      { label: 'Subtotal', value: formatCurrency(data.subtotal, this.options.currency) },
      { label: `Taxes${data.taxRate ? ` (${formatPercentage(data.taxRate)})` : ''}`, value: formatCurrency(data.taxes, this.options.currency) },
      { label: 'Shipping', value: formatCurrency(data.shipping, this.options.currency) },
      ...(data.discount ? [{ label: 'Discount', value: `-${formatCurrency(data.discount, this.options.currency)}` }] : []),
      { label: 'Total', value: formatCurrency(data.total, this.options.currency), bold: true },
    ]);

    // Payment & Fulfillment
    this.checkPageBreak(100);
    this.addSection('Payment & Fulfillment');
    this.addKeyValuePairs([
      { label: 'Payment Status', value: this.formatStatus(data.paymentStatus) },
      { label: 'Payment Method', value: data.paymentMethod || 'N/A' },
      { label: 'Fulfillment Status', value: this.formatStatus(data.fulfillmentStatus) },
      { label: 'Tracking Number', value: data.trackingNumber || 'N/A' },
      { label: 'Carrier', value: data.carrier || 'N/A' },
    ]);

    // Health status
    if (this.options.includeHighlights && data.health) {
      this.addSection('Order Health');
      const healthColor = this.getHealthColor(data.health.status);
      this.doc
        .font(this.template.fonts.secondary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(healthColor)
        .text(`Status: ${data.health.status.toUpperCase()}`, this.template.margins.left, this.yPosition);
      this.yPosition += 15;

      if (data.health.reason) {
        this.doc
          .font(this.template.fonts.primary)
          .fillColor(this.template.colors.text)
          .text(data.health.reason, this.template.margins.left, this.yPosition);
        this.yPosition += 15;
      }
    }

    // Audit trail
    if (this.options.includeAuditTrail && data.auditTrail && data.auditTrail.length > 0) {
      this.checkPageBreak(150);
      this.addSection('Activity Timeline');
      this.addTable(
        ['Date', 'Action', 'By', 'Details'],
        data.auditTrail.map((event) => [
          formatDate(event.timestamp, this.options.timezone, true),
          event.action,
          event.actor,
          event.details || '-',
        ]),
        [100, 100, 100, 150]
      );
    }
  }

  // ============================================================================
  // INVOICE
  // ============================================================================

  private generateInvoice(data: InvoiceExportData): void {
    this.startPage();
    this.addHeader('Invoice', data.invoiceNumber);

    // Status
    this.addStatusBadge(data.status);

    // Invoice info
    this.addSection('Invoice Details');
    this.addKeyValuePairs([
      { label: 'Invoice Number', value: data.invoiceNumber },
      { label: 'Order Number', value: data.orderNumber },
      { label: 'Status', value: this.formatStatus(data.status) },
      { label: 'Issue Date', value: formatDate(data.issuedAt, this.options.timezone) },
      { label: 'Due Date', value: formatDate(data.dueAt, this.options.timezone) },
      { label: 'Payment Terms', value: data.paymentTerms },
    ]);

    // Parties
    const colWidth = (this.getContentWidth() - 20) / 2;
    const leftX = this.template.margins.left;
    const rightX = leftX + colWidth + 20;

    this.yPosition += 10;

    // From (Seller)
    this.addInfoBox('From', [
      data.seller.companyName,
      data.seller.contactName,
      data.seller.email,
      data.seller.taxId ? `Tax ID: ${data.seller.taxId}` : '',
    ], leftX, this.yPosition, colWidth);

    // To (Buyer)
    this.addInfoBox('Bill To', [
      data.buyer.companyName,
      data.buyer.contactName,
      data.buyer.email,
      this.formatAddress(data.billingAddress),
    ], rightX, this.yPosition, colWidth);

    this.yPosition += 120;

    // Line items
    this.addSection('Items');
    this.addTable(
      ['#', 'Description', 'Qty', 'Unit Price', 'Tax', 'Total'],
      data.items.map((item) => [
        item.lineNumber.toString(),
        item.name,
        formatNumber(item.quantity),
        formatCurrency(item.unitPrice, this.options.currency),
        item.taxAmount ? formatCurrency(item.taxAmount, this.options.currency) : '-',
        formatCurrency(item.total, this.options.currency),
      ]),
      [30, 180, 50, 80, 60, 80]
    );

    // Totals
    this.addTotalsBox([
      { label: 'Subtotal', value: formatCurrency(data.subtotal, this.options.currency) },
      { label: `VAT (${formatPercentage(data.taxRate)})`, value: formatCurrency(data.taxAmount, this.options.currency) },
      { label: 'Shipping', value: formatCurrency(data.shipping, this.options.currency) },
      ...(data.discount ? [{ label: 'Discount', value: `-${formatCurrency(data.discount, this.options.currency)}` }] : []),
      { label: 'Total', value: formatCurrency(data.total, this.options.currency), bold: true },
      { label: 'Amount Paid', value: formatCurrency(data.amountPaid, this.options.currency) },
      { label: 'Amount Due', value: formatCurrency(data.amountDue, this.options.currency), bold: true },
    ]);

    // Payment instructions
    if (data.bankDetails) {
      this.checkPageBreak(100);
      this.addSection('Payment Information');
      this.addKeyValuePairs([
        { label: 'Bank Name', value: data.bankDetails.bankName },
        { label: 'Account Holder', value: data.bankDetails.accountHolder },
        { label: 'IBAN', value: data.bankDetails.iban || 'N/A' },
        { label: 'SWIFT/BIC', value: data.bankDetails.swiftBic || 'N/A' },
      ]);
    }

    // Notes
    if (data.notes) {
      this.checkPageBreak(80);
      this.addSection('Notes');
      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.text)
        .text(data.notes, this.template.margins.left, this.yPosition, {
          width: this.getContentWidth(),
        });
      this.yPosition = this.doc.y + 15;
    }

    // Terms
    if (data.termsAndConditions) {
      this.checkPageBreak(80);
      this.addSection('Terms & Conditions');
      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.small)
        .fillColor(this.template.colors.textLight)
        .text(data.termsAndConditions, this.template.margins.left, this.yPosition, {
          width: this.getContentWidth(),
        });
    }
  }

  // ============================================================================
  // PAYOUT
  // ============================================================================

  private generatePayout(data: PayoutExportData): void {
    this.startPage();
    this.addHeader('Payout Statement', data.payoutNumber);

    // Status
    this.addStatusBadge(data.status);

    // Payout summary
    this.addSection('Payout Summary');
    this.addKeyValuePairs([
      { label: 'Payout Number', value: data.payoutNumber },
      { label: 'Status', value: this.formatStatus(data.status) },
      { label: 'Period', value: `${formatDate(data.periodStart, this.options.timezone)} - ${formatDate(data.periodEnd, this.options.timezone)}` },
      { label: 'Scheduled', value: formatDate(data.scheduledAt, this.options.timezone) },
      { label: 'Processed', value: data.processedAt ? formatDate(data.processedAt, this.options.timezone) : 'Pending' },
    ]);

    // Seller info
    this.addSection('Seller Information');
    this.addKeyValuePairs([
      { label: 'Company', value: data.seller.companyName },
      { label: 'Contact', value: data.seller.contactName },
      { label: 'Email', value: data.seller.email },
    ]);

    // Amounts
    this.addSection('Payout Breakdown');
    this.addTotalsBox([
      { label: 'Gross Amount', value: formatCurrency(data.grossAmount, this.options.currency) },
      { label: `Platform Fee (${formatPercentage(data.platformFeeRate)})`, value: `-${formatCurrency(data.platformFee, this.options.currency)}` },
      { label: 'Processing Fee', value: `-${formatCurrency(data.processingFee, this.options.currency)}` },
      ...(data.adjustments !== 0 ? [{ label: 'Adjustments', value: formatCurrency(data.adjustments, this.options.currency) }] : []),
      { label: 'Net Payout', value: formatCurrency(data.netAmount, this.options.currency), bold: true },
    ]);

    // Included orders
    this.addSection('Included Transactions');
    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.body)
      .fillColor(this.template.colors.textLight)
      .text(`${data.orderCount} orders | ${data.invoiceCount} invoices`, this.template.margins.left, this.yPosition);
    this.yPosition += 20;

    if (data.lineItems.length > 0) {
      this.addTable(
        ['Order', 'Invoice', 'Gross', 'Fee', 'Net', 'Paid'],
        data.lineItems.map((item) => [
          item.orderNumber,
          item.invoiceNumber,
          formatCurrency(item.grossAmount, this.options.currency),
          formatCurrency(item.platformFee, this.options.currency),
          formatCurrency(item.netAmount, this.options.currency),
          formatDate(item.paidAt, this.options.timezone),
        ]),
        [70, 70, 70, 60, 70, 80]
      );
    }

    // Bank details
    this.checkPageBreak(100);
    this.addSection('Payment Destination');
    this.addKeyValuePairs([
      { label: 'Bank', value: data.bankDetails.bankName },
      { label: 'Account Holder', value: data.bankDetails.accountHolder },
      { label: 'IBAN', value: data.bankDetails.iban || 'N/A' },
      { label: 'Transaction Ref', value: data.transactionRef || 'Pending' },
    ]);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private startPage(): void {
    this.pageNumber++;
    this.yPosition = this.template.margins.top + this.template.header.height;
  }

  private checkPageBreak(requiredSpace: number): void {
    const pageHeight = this.doc.page.height;
    const availableSpace = pageHeight - this.yPosition - this.template.footer.height - this.template.margins.bottom;

    if (availableSpace < requiredSpace) {
      this.doc.addPage();
      this.startPage();
    }
  }

  private addHeader(title: string, documentNumber: string): void {
    const headerY = this.template.margins.top;

    // Logo placeholder (left side)
    if (this.template.header.showLogo && this.branding.logoUrl) {
      // In production, load image from URL
      this.doc
        .rect(this.template.margins.left, headerY, 60, 40)
        .stroke(this.template.colors.border);
    }

    // Title (center/right)
    const titleX = this.branding.logoUrl ? this.template.margins.left + 80 : this.template.margins.left;

    this.doc
      .font(this.template.fonts.secondary)
      .fontSize(this.template.fonts.sizes.title)
      .fillColor(this.template.colors.primary)
      .text(title, titleX, headerY);

    // Document number
    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.body)
      .fillColor(this.template.colors.textLight)
      .text(documentNumber, titleX, headerY + 30);

    // Date (right aligned)
    const dateText = formatDate(new Date(), this.options.timezone);
    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.small)
      .fillColor(this.template.colors.textLight)
      .text(dateText, this.template.margins.left, headerY, {
        width: this.getContentWidth(),
        align: 'right',
      });

    // Divider line
    const dividerY = headerY + this.template.header.height - 10;
    this.doc
      .moveTo(this.template.margins.left, dividerY)
      .lineTo(this.doc.page.width - this.template.margins.right, dividerY)
      .stroke(this.template.colors.border);
  }

  private addSection(title: string): void {
    this.checkPageBreak(50);

    this.doc
      .font(this.template.fonts.secondary)
      .fontSize(this.template.fonts.sizes.heading)
      .fillColor(this.template.colors.primary)
      .text(title, this.template.margins.left, this.yPosition);

    this.yPosition = this.doc.y + 10;
  }

  private addSubSection(title: string): void {
    this.doc
      .font(this.template.fonts.secondary)
      .fontSize(this.template.fonts.sizes.body)
      .fillColor(this.template.colors.text)
      .text(title, this.template.margins.left, this.yPosition);

    this.yPosition = this.doc.y + 5;
  }

  private addKeyValuePairs(pairs: { label: string; value: string }[]): void {
    const labelWidth = 120;

    pairs.forEach((pair) => {
      if (!pair.value) return;

      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.textLight)
        .text(pair.label + ':', this.template.margins.left, this.yPosition, { continued: false });

      this.doc
        .fillColor(this.template.colors.text)
        .text(pair.value, this.template.margins.left + labelWidth, this.yPosition);

      this.yPosition += 15;
    });

    this.yPosition += 5;
  }

  private addTable(headers: string[], rows: string[][], colWidths: number[]): void {
    const { cellPadding, headerBackground, headerTextColor, alternateRowBackground, borderColor } = this.template.table;
    const startX = this.template.margins.left;
    const rowHeight = 25;

    // Header row
    let x = startX;
    this.doc
      .rect(startX, this.yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight)
      .fill(headerBackground);

    headers.forEach((header, i) => {
      this.doc
        .font(this.template.fonts.secondary)
        .fontSize(this.template.fonts.sizes.small)
        .fillColor(headerTextColor)
        .text(header, x + cellPadding, this.yPosition + cellPadding, {
          width: colWidths[i] - cellPadding * 2,
        });
      x += colWidths[i];
    });

    this.yPosition += rowHeight;

    // Data rows
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight + 10);

      x = startX;
      const isAlternate = rowIndex % 2 === 1;

      if (isAlternate) {
        this.doc
          .rect(startX, this.yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight)
          .fill(alternateRowBackground);
      }

      // Border
      this.doc
        .rect(startX, this.yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight)
        .stroke(borderColor);

      row.forEach((cell, i) => {
        this.doc
          .font(this.template.fonts.primary)
          .fontSize(this.template.fonts.sizes.small)
          .fillColor(this.template.colors.text)
          .text(cell || '-', x + cellPadding, this.yPosition + cellPadding, {
            width: colWidths[i] - cellPadding * 2,
          });
        x += colWidths[i];
      });

      this.yPosition += rowHeight;
    });

    this.yPosition += 10;
  }

  private addTotalsBox(items: { label: string; value: string; bold?: boolean }[]): void {
    const boxWidth = 200;
    const boxX = this.doc.page.width - this.template.margins.right - boxWidth;
    const lineHeight = 18;
    const boxHeight = items.length * lineHeight + 20;

    this.doc
      .rect(boxX, this.yPosition, boxWidth, boxHeight)
      .fill(this.template.colors.background);

    let y = this.yPosition + 10;
    items.forEach((item) => {
      const font = item.bold ? this.template.fonts.secondary : this.template.fonts.primary;

      this.doc
        .font(font)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.text)
        .text(item.label, boxX + 10, y, { continued: false });

      this.doc
        .text(item.value, boxX + 10, y, {
          width: boxWidth - 20,
          align: 'right',
        });

      y += lineHeight;
    });

    this.yPosition += boxHeight + 15;
  }

  private addInfoBox(title: string, lines: string[], x: number, y: number, width: number): void {
    this.doc
      .rect(x, y, width, 90)
      .fill(this.template.colors.background);

    this.doc
      .font(this.template.fonts.secondary)
      .fontSize(this.template.fonts.sizes.small)
      .fillColor(this.template.colors.textLight)
      .text(title.toUpperCase(), x + 10, y + 10);

    let lineY = y + 28;
    lines.filter(Boolean).forEach((line) => {
      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.body)
        .fillColor(this.template.colors.text)
        .text(line, x + 10, lineY, { width: width - 20 });
      lineY += 14;
    });
  }

  private addStatusBadge(status: string): void {
    const color = this.getStatusColor(status);
    const text = this.formatStatus(status);
    const badgeWidth = this.doc.widthOfString(text) + 16;
    const badgeX = this.doc.page.width - this.template.margins.right - badgeWidth;

    this.doc
      .roundedRect(badgeX, this.yPosition - 30, badgeWidth, 20, 4)
      .fill(this.hexToRgba(color, 0.15));

    this.doc
      .font(this.template.fonts.secondary)
      .fontSize(this.template.fonts.sizes.small)
      .fillColor(color)
      .text(text, badgeX + 8, this.yPosition - 26);
  }

  private addBulletPoint(text: string, color?: string): void {
    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.body)
      .fillColor(color || this.template.colors.text)
      .text(`• ${text}`, this.template.margins.left + 10, this.yPosition);
    this.yPosition = this.doc.y + 5;
  }

  private addMetadataFooter(generatedAt: Date, generatedBy: string): void {
    this.yPosition += 20;

    this.doc
      .moveTo(this.template.margins.left, this.yPosition)
      .lineTo(this.doc.page.width - this.template.margins.right, this.yPosition)
      .stroke(this.template.colors.border);

    this.yPosition += 10;

    this.doc
      .font(this.template.fonts.primary)
      .fontSize(this.template.fonts.sizes.small)
      .fillColor(this.template.colors.textLight)
      .text(
        `Generated on ${formatDate(generatedAt, this.options.timezone, true)} by ${generatedBy}`,
        this.template.margins.left,
        this.yPosition
      );
  }

  private addPageNumbers(): void {
    const pageCount = this.doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);

      const text = `Page ${i + 1} of ${pageCount}`;
      const y = this.doc.page.height - this.template.margins.bottom;

      this.doc
        .font(this.template.fonts.primary)
        .fontSize(this.template.fonts.sizes.small)
        .fillColor(this.template.colors.textLight)
        .text(text, this.template.margins.left, y, {
          width: this.getContentWidth(),
          align: 'center',
        });

      // Footer text
      if (this.branding.footerText) {
        this.doc.text(this.branding.footerText, this.template.margins.left, y + 12, {
          width: this.getContentWidth(),
          align: 'center',
        });
      }
    }
  }

  private getContentWidth(): number {
    return this.doc.page.width - this.template.margins.left - this.template.margins.right;
  }

  private formatStatus(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatPriority(priority: string): string {
    const priorities: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'URGENT',
    };
    return priorities[priority] || priority;
  }

  private formatOrderSource(source: string): string {
    const sources: Record<string, string> = {
      rfq: 'From RFQ',
      direct_buy: 'Direct Purchase',
      cart: 'Shopping Cart',
    };
    return sources[source] || source;
  }

  private formatAddress(address: { line1: string; line2?: string; city: string; state?: string; postalCode?: string; country: string }): string {
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
      address.country,
    ].filter(Boolean);
    return parts.join('\n');
  }

  private getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      draft: this.template.colors.textLight,
      pending: this.template.colors.warning,
      pending_confirmation: this.template.colors.warning,
      confirmed: this.template.colors.accent,
      processing: this.template.colors.accent,
      shipped: this.template.colors.primary,
      delivered: this.template.colors.success,
      completed: this.template.colors.success,
      paid: this.template.colors.success,
      cancelled: this.template.colors.error,
      failed: this.template.colors.error,
      overdue: this.template.colors.error,
      disputed: this.template.colors.warning,
      on_hold: this.template.colors.warning,
    };
    return statusColors[status] || this.template.colors.text;
  }

  private getHealthColor(status: string): string {
    const healthColors: Record<string, string> = {
      on_track: this.template.colors.success,
      at_risk: this.template.colors.warning,
      delayed: this.template.colors.error,
      critical: this.template.colors.error,
    };
    return healthColors[status] || this.template.colors.text;
  }

  private getQuoteSellerName(quoteId: string, quotes: QuoteExportData[]): string {
    const quote = quotes.find((q) => q.id === quoteId);
    return quote?.sellerCompany || 'Unknown Seller';
  }

  private hexToRgba(hex: string, alpha: number): string {
    // PDFKit uses hex, but we return the hex for fill
    // This is a placeholder - actual implementation would convert
    return hex;
  }
}

export default PDFGenerator;
