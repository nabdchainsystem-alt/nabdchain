/**
 * Export Routes
 * API endpoints for document export (PDF/Excel)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiLogger } from '../utils/logger';
import {
  exportService,
  ExportDocumentType,
  ExportFormat,
  ExportOptions,
  BrandingConfig,
  QuoteComparisonExportData,
  RFQExportData,
  OrderExportData,
  InvoiceExportData,
  PayoutExportData,
} from '../services/exportService';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ExportOptionsSchema = z.object({
  includeScoring: z.boolean().optional(),
  includeHighlights: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
  includeAuditTrail: z.boolean().optional(),
  language: z.enum(['en', 'ar']).optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  pageSize: z.enum(['A4', 'Letter']).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
});

const BrandingSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  footerText: z.string().optional(),
  showWatermark: z.boolean().optional(),
});

const BaseExportRequestSchema = z.object({
  format: z.enum(['pdf', 'excel']),
  options: ExportOptionsSchema.optional(),
  branding: BrandingSchema.optional(),
});

// ============================================================================
// QUOTE COMPARISON EXPORT
// ============================================================================

const QuoteComparisonExportSchema = BaseExportRequestSchema.extend({
  rfq: z.object({
    id: z.string(),
    rfqNumber: z.string(),
    status: z.string(),
    buyerCompany: z.string(),
    buyerContact: z.string(),
    buyerEmail: z.string(),
    items: z.array(z.object({
      lineNumber: z.number(),
      sku: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number(),
      unit: z.string(),
      targetPrice: z.number().optional(),
      specifications: z.record(z.string(), z.string()).optional(),
    })),
    deliveryLocation: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string(),
    }),
    preferredDeliveryDate: z.string().datetime().optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    quotesReceived: z.number(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
  quotes: z.array(z.object({
    id: z.string(),
    quoteNumber: z.string(),
    rfqId: z.string(),
    status: z.string(),
    sellerCompany: z.string(),
    sellerContact: z.string(),
    sellerEmail: z.string(),
    sellerRating: z.number().optional(),
    sellerReliability: z.string().optional(),
    lineItems: z.array(z.object({
      lineNumber: z.number(),
      rfqItemId: z.string(),
      sku: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number(),
      unit: z.string(),
      unitPrice: z.number(),
      total: z.number(),
      leadTimeDays: z.number().optional(),
      notes: z.string().optional(),
    })),
    subtotal: z.number(),
    taxes: z.number(),
    shipping: z.number(),
    discount: z.number().optional(),
    total: z.number(),
    currency: z.string(),
    validUntil: z.string().datetime(),
    estimatedDelivery: z.string().datetime(),
    leadTimeDays: z.number(),
    paymentTerms: z.string(),
    warranty: z.string().optional(),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    score: z.object({
      total: z.number(),
      breakdown: z.object({
        price: z.number(),
        delivery: z.number(),
        quality: z.number(),
        reliability: z.number(),
      }),
      rank: z.number(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }).optional(),
  })),
  scoring: z.object({
    weights: z.object({
      price: z.number(),
      delivery: z.number(),
      quality: z.number(),
      reliability: z.number(),
    }),
    normalizedScores: z.array(z.object({
      quoteId: z.string(),
      priceScore: z.number(),
      deliveryScore: z.number(),
      qualityScore: z.number(),
      reliabilityScore: z.number(),
      totalScore: z.number(),
    })),
  }).optional(),
  recommendation: z.object({
    bestOverall: z.string(),
    bestPrice: z.string(),
    bestDelivery: z.string(),
    bestQuality: z.string(),
    highlights: z.array(z.object({
      quoteId: z.string(),
      type: z.enum(['price', 'delivery', 'quality', 'reliability']),
      message: z.string(),
      value: z.union([z.string(), z.number()]).optional(),
    })),
    warnings: z.array(z.object({
      quoteId: z.string(),
      type: z.enum(['risk', 'delay', 'quality', 'compliance']),
      severity: z.enum(['low', 'medium', 'high']),
      message: z.string(),
    })),
  }).optional(),
  generatedAt: z.string().datetime().optional(),
  generatedBy: z.string().optional(),
});

/**
 * POST /api/exports/quote-comparison
 * Export quote comparison as PDF or Excel
 */
router.post('/quote-comparison', async (req: Request, res: Response) => {
  try {
    const parsed = QuoteComparisonExportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { format, options, branding, ...data } = parsed.data;

    // Convert date strings to Date objects
    const exportData: QuoteComparisonExportData = {
      rfq: {
        ...data.rfq,
        preferredDeliveryDate: data.rfq.preferredDeliveryDate ? new Date(data.rfq.preferredDeliveryDate) : undefined,
        createdAt: new Date(data.rfq.createdAt),
        expiresAt: new Date(data.rfq.expiresAt),
        deliveryLocation: data.rfq.deliveryLocation,
      },
      quotes: data.quotes.map((q) => ({
        ...q,
        validUntil: new Date(q.validUntil),
        estimatedDelivery: new Date(q.estimatedDelivery),
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      })),
      scoring: data.scoring || {
        weights: { price: 0.4, delivery: 0.25, quality: 0.2, reliability: 0.15 },
        normalizedScores: [],
      },
      recommendation: data.recommendation || {
        bestOverall: data.quotes[0]?.id || '',
        bestPrice: data.quotes[0]?.id || '',
        bestDelivery: data.quotes[0]?.id || '',
        bestQuality: data.quotes[0]?.id || '',
        highlights: [],
        warnings: [],
      },
      generatedAt: data.generatedAt ? new Date(data.generatedAt) : new Date(),
      generatedBy: data.generatedBy || 'System',
    };

    const result = await exportService.generateExportBuffer(
      'quote_comparison',
      format as ExportFormat,
      exportData,
      options as ExportOptions,
      branding as Partial<BrandingConfig>
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);

    return res.send(result.buffer);
  } catch (error) {
    apiLogger.error('Export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// RFQ EXPORT
// ============================================================================

const RFQExportSchema = BaseExportRequestSchema.extend({
  data: z.object({
    id: z.string(),
    rfqNumber: z.string(),
    status: z.string(),
    buyerCompany: z.string(),
    buyerContact: z.string(),
    buyerEmail: z.string(),
    items: z.array(z.any()),
    deliveryLocation: z.any(),
    preferredDeliveryDate: z.string().datetime().optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    quotesReceived: z.number(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
});

router.post('/rfq', async (req: Request, res: Response) => {
  try {
    const parsed = RFQExportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { format, options, branding, data } = parsed.data;

    const exportData: RFQExportData = {
      ...data,
      preferredDeliveryDate: data.preferredDeliveryDate ? new Date(data.preferredDeliveryDate) : undefined,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };

    const result = await exportService.generateExportBuffer(
      'rfq',
      format as ExportFormat,
      exportData,
      options as ExportOptions,
      branding as Partial<BrandingConfig>
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);

    return res.send(result.buffer);
  } catch (error) {
    apiLogger.error('Export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ORDER EXPORT
// ============================================================================

const OrderExportSchema = BaseExportRequestSchema.extend({
  data: z.object({
    id: z.string(),
    orderNumber: z.string(),
    source: z.enum(['rfq', 'direct_buy', 'cart']),
    sourceId: z.string().optional(),
    status: z.string(),
    buyer: z.any(),
    seller: z.any(),
    items: z.array(z.any()),
    subtotal: z.number(),
    taxes: z.number(),
    taxRate: z.number().optional(),
    shipping: z.number(),
    discount: z.number().optional(),
    total: z.number(),
    currency: z.string(),
    paymentStatus: z.string(),
    paymentMethod: z.string().optional(),
    paidAt: z.string().datetime().optional(),
    fulfillmentStatus: z.string(),
    shippingAddress: z.any(),
    billingAddress: z.any().optional(),
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    health: z.any().optional(),
    createdAt: z.string().datetime(),
    confirmedAt: z.string().datetime().optional(),
    processedAt: z.string().datetime().optional(),
    shippedAt: z.string().datetime().optional(),
    deliveredAt: z.string().datetime().optional(),
    cancelledAt: z.string().datetime().optional(),
    auditTrail: z.array(z.any()).optional(),
  }),
});

router.post('/order', async (req: Request, res: Response) => {
  try {
    const parsed = OrderExportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { format, options, branding, data } = parsed.data;

    const exportData: OrderExportData = {
      ...data,
      createdAt: new Date(data.createdAt),
      confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : undefined,
      processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
      shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
      deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      auditTrail: data.auditTrail?.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
    };

    const result = await exportService.generateExportBuffer(
      'order',
      format as ExportFormat,
      exportData,
      options as ExportOptions,
      branding as Partial<BrandingConfig>
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);

    return res.send(result.buffer);
  } catch (error) {
    apiLogger.error('Export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// INVOICE EXPORT
// ============================================================================

const InvoiceExportSchema = BaseExportRequestSchema.extend({
  data: z.object({
    id: z.string(),
    invoiceNumber: z.string(),
    orderId: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    seller: z.any(),
    buyer: z.any(),
    billingAddress: z.any(),
    shippingAddress: z.any().optional(),
    items: z.array(z.any()),
    subtotal: z.number(),
    taxRate: z.number(),
    taxAmount: z.number(),
    shipping: z.number(),
    discount: z.number().optional(),
    total: z.number(),
    amountPaid: z.number(),
    amountDue: z.number(),
    currency: z.string(),
    issuedAt: z.string().datetime(),
    dueAt: z.string().datetime(),
    paidAt: z.string().datetime().optional(),
    paymentTerms: z.string(),
    paymentInstructions: z.string().optional(),
    bankDetails: z.any().optional(),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
    reference: z.string().optional(),
    poNumber: z.string().optional(),
  }),
});

router.post('/invoice', async (req: Request, res: Response) => {
  try {
    const parsed = InvoiceExportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { format, options, branding, data } = parsed.data;

    const exportData: InvoiceExportData = {
      ...data,
      issuedAt: new Date(data.issuedAt),
      dueAt: new Date(data.dueAt),
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    };

    const result = await exportService.generateExportBuffer(
      'invoice',
      format as ExportFormat,
      exportData,
      options as ExportOptions,
      branding as Partial<BrandingConfig>
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);

    return res.send(result.buffer);
  } catch (error) {
    apiLogger.error('Export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PAYOUT EXPORT
// ============================================================================

const PayoutExportSchema = BaseExportRequestSchema.extend({
  data: z.object({
    id: z.string(),
    payoutNumber: z.string(),
    sellerId: z.string(),
    status: z.string(),
    seller: z.any(),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    grossAmount: z.number(),
    platformFee: z.number(),
    platformFeeRate: z.number(),
    processingFee: z.number(),
    adjustments: z.number(),
    netAmount: z.number(),
    currency: z.string(),
    lineItems: z.array(z.any()),
    orderCount: z.number(),
    invoiceCount: z.number(),
    bankDetails: z.any(),
    scheduledAt: z.string().datetime(),
    processedAt: z.string().datetime().optional(),
    settledAt: z.string().datetime().optional(),
    transactionRef: z.string().optional(),
  }),
});

router.post('/payout', async (req: Request, res: Response) => {
  try {
    const parsed = PayoutExportSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { format, options, branding, data } = parsed.data;

    const exportData: PayoutExportData = {
      ...data,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      scheduledAt: new Date(data.scheduledAt),
      processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
      settledAt: data.settledAt ? new Date(data.settledAt) : undefined,
      lineItems: data.lineItems.map((item: any) => ({
        ...item,
        paidAt: new Date(item.paidAt),
      })),
    };

    const result = await exportService.generateExportBuffer(
      'payout',
      format as ExportFormat,
      exportData,
      options as ExportOptions,
      branding as Partial<BrandingConfig>
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);

    return res.send(result.buffer);
  } catch (error) {
    apiLogger.error('Export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// JOB MANAGEMENT (for async/large exports)
// ============================================================================

/**
 * GET /api/exports/jobs
 * Get user's export jobs
 */
router.get('/jobs', (req: Request, res: Response) => {
  const userId = (req as { userId?: string }).userId || 'anonymous';
  const jobs = exportService.getUserJobs(userId);

  return res.json({
    jobs: jobs.map((job) => ({
      id: job.id,
      type: job.request.type,
      format: job.request.format,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      expiresAt: job.expiresAt,
      error: job.error,
    })),
  });
});

/**
 * GET /api/exports/jobs/:jobId
 * Get specific job status
 */
router.get('/jobs/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const job = exportService.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({
    id: job.id,
    type: job.request.type,
    format: job.request.format,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    expiresAt: job.expiresAt,
    fileUrl: job.fileUrl,
    error: job.error,
  });
});

/**
 * GET /api/exports/jobs/:jobId/download
 * Download completed export file
 */
router.get('/jobs/:jobId/download', async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const job = exportService.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed' || !job.filePath) {
    return res.status(400).json({ error: 'Export not ready for download' });
  }

  const buffer = await exportService.getFile(job.filePath);

  if (!buffer) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const mimeType = job.request.format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const extension = job.request.format === 'pdf' ? 'pdf' : 'xlsx';
  const fileName = `${job.request.type}_${jobId}.${extension}`;

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);

  return res.send(buffer);
});

/**
 * DELETE /api/exports/jobs/:jobId
 * Delete an export job
 */
router.delete('/jobs/:jobId', async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const deleted = await exportService.deleteJob(jobId);

  if (!deleted) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({ success: true });
});

export default router;
