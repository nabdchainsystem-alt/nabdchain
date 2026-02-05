/**
 * Export Service (Frontend)
 * Client-side service for document export functionality
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'excel';
export type ExportDocumentType = 'quote_comparison' | 'rfq' | 'order' | 'invoice' | 'payout';

export interface ExportOptions {
  includeScoring?: boolean;
  includeHighlights?: boolean;
  includeMetadata?: boolean;
  includeAuditTrail?: boolean;
  language?: 'en' | 'ar';
  currency?: string;
  timezone?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export interface BrandingConfig {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
  showWatermark?: boolean;
}

export interface ExportJob {
  id: string;
  type: ExportDocumentType;
  format: ExportFormat;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  progress: number;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  // Try multiple storage locations
  const token = localStorage.getItem('portal_token') ||
                localStorage.getItem('auth_token') ||
                sessionStorage.getItem('portal_token');
  return token;
}

/**
 * Make authenticated request
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const exportService = {
  /**
   * Export quote comparison
   */
  async exportQuoteComparison(
    data: {
      rfq: Record<string, unknown>;
      quotes: Record<string, unknown>[];
      scoring?: Record<string, unknown>;
      recommendation?: Record<string, unknown>;
    },
    format: ExportFormat = 'pdf',
    options?: ExportOptions,
    branding?: BrandingConfig
  ): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/quote-comparison`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
        branding,
        ...data,
        generatedAt: new Date().toISOString(),
        generatedBy: 'User',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
                     `quote_comparison.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Export RFQ
   */
  async exportRFQ(
    data: Record<string, unknown>,
    format: ExportFormat = 'pdf',
    options?: ExportOptions,
    branding?: BrandingConfig
  ): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/rfq`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
        branding,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
                     `rfq.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Export Order
   */
  async exportOrder(
    data: Record<string, unknown>,
    format: ExportFormat = 'pdf',
    options?: ExportOptions,
    branding?: BrandingConfig
  ): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/order`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
        branding,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
                     `order.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Export Invoice
   */
  async exportInvoice(
    data: Record<string, unknown>,
    format: ExportFormat = 'pdf',
    options?: ExportOptions,
    branding?: BrandingConfig
  ): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/invoice`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
        branding,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
                     `invoice.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Export Payout
   */
  async exportPayout(
    data: Record<string, unknown>,
    format: ExportFormat = 'pdf',
    options?: ExportOptions,
    branding?: BrandingConfig
  ): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/payout`, {
      method: 'POST',
      body: JSON.stringify({
        format,
        options,
        branding,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
                     `payout.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Get export jobs
   */
  async getJobs(): Promise<ExportJob[]> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/jobs`);

    if (!response.ok) {
      throw new Error('Failed to fetch export jobs');
    }

    const data = await response.json();
    return data.jobs;
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ExportJob> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/jobs/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch job status');
    }

    return response.json();
  },

  /**
   * Download completed job
   */
  async downloadJob(jobId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/jobs/${jobId}/download`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || 'Download failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export_${jobId}`;

    downloadBlob(blob, fileName);
  },

  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/api/exports/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete job');
    }
  },
};

export default exportService;
