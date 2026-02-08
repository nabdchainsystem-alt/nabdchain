/**
 * Export Service
 * Main entry point for document export functionality
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { apiLogger } from '../../utils/logger';
import { PDFGenerator } from './pdfGenerator';
import { ExcelGenerator } from './excelGenerator';
import {
  ExportRequest,
  ExportResult,
  ExportJob,
  ExportJobStatus,
  ExportDocumentType,
  ExportFormat,
  ExportOptions,
  BrandingConfig,
  DEFAULT_BRANDING,
  QuoteComparisonExportData,
  RFQExportData,
  OrderExportData,
  InvoiceExportData,
  PayoutExportData,
} from './types';
import { generateFileName } from './formatters';

// Re-export types
export * from './types';
export { formatCurrency, formatDate, formatNumber, formatPercentage, formatStatus } from './formatters';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EXPORT_CONFIG = {
  // Storage directory for generated files
  storageDir: process.env.EXPORT_STORAGE_DIR || path.join(process.cwd(), 'exports'),

  // File expiration time (24 hours)
  fileExpirationMs: 24 * 60 * 60 * 1000,

  // Maximum concurrent jobs per user
  maxConcurrentJobs: 3,

  // Cleanup interval (1 hour)
  cleanupIntervalMs: 60 * 60 * 1000,
};

// ============================================================================
// JOB STORAGE (In-memory for now, can be replaced with Redis/DB)
// ============================================================================

const jobStore = new Map<string, ExportJob>();

// ============================================================================
// EXPORT SERVICE CLASS
// ============================================================================

export class ExportService {
  private storageDir: string;

  constructor() {
    this.storageDir = EXPORT_CONFIG.storageDir;
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      apiLogger.error('Failed to create export storage directory:', error);
    }
  }

  /**
   * Generate export document
   */
  async generateExport(
    type: ExportDocumentType,
    format: ExportFormat,
    data: QuoteComparisonExportData | RFQExportData | OrderExportData | InvoiceExportData | PayoutExportData,
    options?: ExportOptions,
    branding?: Partial<BrandingConfig>
  ): Promise<ExportResult> {
    const jobId = uuidv4();
    const startTime = Date.now();

    try {
      // Generate document
      let buffer: Buffer;
      let mimeType: string;
      let extension: string;

      if (format === 'pdf') {
        const generator = new PDFGenerator({}, branding, options);
        buffer = await generator.generate(type, data);
        mimeType = 'application/pdf';
        extension = 'pdf';
      } else {
        const generator = new ExcelGenerator({}, branding, options);
        buffer = await generator.generate(type, data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      }

      // Generate filename
      const documentId = this.getDocumentId(type, data);
      const fileName = generateFileName(type, documentId, extension);

      // Save file
      const filePath = path.join(this.storageDir, fileName);
      await fs.writeFile(filePath, buffer);

      // Calculate expiration
      const expiresAt = new Date(Date.now() + EXPORT_CONFIG.fileExpirationMs);

      return {
        success: true,
        jobId,
        status: 'completed',
        filePath,
        fileName,
        fileSize: buffer.length,
        mimeType,
        expiresAt,
      };
    } catch (error) {
      apiLogger.error('Export generation failed:', error);
      return {
        success: false,
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate export and return buffer directly (for streaming)
   */
  async generateExportBuffer(
    type: ExportDocumentType,
    format: ExportFormat,
    data: QuoteComparisonExportData | RFQExportData | OrderExportData | InvoiceExportData | PayoutExportData,
    options?: ExportOptions,
    branding?: Partial<BrandingConfig>
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (format === 'pdf') {
      const generator = new PDFGenerator({}, branding, options);
      buffer = await generator.generate(type, data);
      mimeType = 'application/pdf';
      extension = 'pdf';
    } else {
      const generator = new ExcelGenerator({}, branding, options);
      buffer = await generator.generate(type, data);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    }

    const documentId = this.getDocumentId(type, data);
    const fileName = generateFileName(type, documentId, extension);

    return { buffer, mimeType, fileName };
  }

  /**
   * Create async export job (for large exports)
   */
  async createExportJob(
    userId: string,
    request: ExportRequest
  ): Promise<ExportJob> {
    const jobId = uuidv4();
    const now = new Date();

    const job: ExportJob = {
      id: jobId,
      userId,
      request,
      status: 'queued',
      progress: 0,
      createdAt: now,
    };

    jobStore.set(jobId, job);

    // In production, this would be sent to a job queue (Bull, etc.)
    // For now, we'll process immediately in background
    this.processJobAsync(job);

    return job;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ExportJob | undefined {
    return jobStore.get(jobId);
  }

  /**
   * Get user's jobs
   */
  getUserJobs(userId: string): ExportJob[] {
    return Array.from(jobStore.values())
      .filter((job) => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete a job and its file
   */
  async deleteJob(jobId: string): Promise<boolean> {
    const job = jobStore.get(jobId);
    if (!job) return false;

    if (job.filePath) {
      try {
        await fs.unlink(job.filePath);
      } catch {
        // File may already be deleted
      }
    }

    jobStore.delete(jobId);
    return true;
  }

  /**
   * Get file for download
   */
  async getFile(filePath: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Cleanup expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [jobId, job] of jobStore.entries()) {
      if (job.expiresAt && job.expiresAt.getTime() < now) {
        if (job.filePath) {
          try {
            await fs.unlink(job.filePath);
          } catch {
            // Ignore errors
          }
        }
        jobStore.delete(jobId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async processJobAsync(job: ExportJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;

      // Simulate fetching data (in production, this would query the database)
      job.progress = 30;

      // Note: In production, you would fetch the actual data here
      // const data = await this.fetchExportData(job.request);

      // For now, we expect data to be passed with the request
      // This is a placeholder - actual implementation would vary

      job.progress = 50;

      // Generate document
      // const result = await this.generateExport(...)

      job.progress = 90;
      job.status = 'completed';
      job.completedAt = new Date();
      job.expiresAt = new Date(Date.now() + EXPORT_CONFIG.fileExpirationMs);
      job.progress = 100;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
    }
  }

  private getDocumentId(
    type: ExportDocumentType,
    data: QuoteComparisonExportData | RFQExportData | OrderExportData | InvoiceExportData | PayoutExportData
  ): string {
    switch (type) {
      case 'quote_comparison':
        return (data as QuoteComparisonExportData).rfq.rfqNumber;
      case 'rfq':
        return (data as RFQExportData).rfqNumber;
      case 'order':
        return (data as OrderExportData).orderNumber;
      case 'invoice':
        return (data as InvoiceExportData).invoiceNumber;
      case 'payout':
        return (data as PayoutExportData).payoutNumber;
      default:
        return 'document';
    }
  }
}

// Singleton instance
export const exportService = new ExportService();

// Start cleanup job
setInterval(() => {
  exportService.cleanupExpiredFiles().catch(apiLogger.error);
}, EXPORT_CONFIG.cleanupIntervalMs);

export default exportService;
