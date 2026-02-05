# PDF & Excel Export System

> Professional document export system for Quote Comparisons, RFQs, Orders, Invoices, and Payouts.

---

## Overview

The export system provides server-side generation of branded PDF and Excel documents with support for:

- **Quote Comparisons** - Side-by-side comparison with scoring and recommendations
- **RFQs** - Request for Quote documents with item specifications
- **Orders** - Order confirmations with line items and fulfillment status
- **Invoices** - Professional invoices with tax calculations and payment details
- **Payouts** - Seller payout statements with transaction breakdowns

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ExportButton Component                                                  │
│  ├── Format dropdown (PDF/Excel)                                         │
│  ├── Loading states                                                      │
│  └── Error handling                                                      │
│                                                                          │
│  exportService.ts                                                        │
│  ├── exportQuoteComparison()                                             │
│  ├── exportRFQ()                                                         │
│  ├── exportOrder()                                                       │
│  ├── exportInvoice()                                                     │
│  └── exportPayout()                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP POST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  exportRoutes.ts                                                         │
│  ├── POST /api/exports/quote-comparison                                  │
│  ├── POST /api/exports/rfq                                               │
│  ├── POST /api/exports/order                                             │
│  ├── POST /api/exports/invoice                                           │
│  ├── POST /api/exports/payout                                            │
│  └── GET/DELETE /api/exports/jobs/*                                      │
│                                                                          │
│  exportService/                                                          │
│  ├── index.ts          (Main service, job management)                    │
│  ├── types.ts          (Type definitions)                                │
│  ├── pdfGenerator.ts   (PDFKit-based PDF generation)                     │
│  ├── excelGenerator.ts (ExcelJS-based spreadsheet generation)            │
│  └── formatters.ts     (Currency, date, number formatting)               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FILE STORAGE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Local: /exports/                                                        │
│  ├── quote_comparison_RFQ-2024-001_2024-01-15.pdf                        │
│  ├── order_ORD-2024-001_2024-01-15.xlsx                                  │
│  └── (Auto-cleanup after 24 hours)                                       │
│                                                                          │
│  Production: AWS S3 (configurable)                                       │
│  └── Pre-signed URLs with expiration                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Template Structure

### PDF Templates

PDFs are generated using **PDFKit** with a configurable template system:

```typescript
interface PDFTemplate {
  // Page setup
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top, right, bottom, left };

  // Header configuration
  header: {
    height: number;
    showLogo: boolean;
    showTitle: boolean;
    showDocumentNumber: boolean;
    showDate: boolean;
  };

  // Footer configuration
  footer: {
    height: number;
    showPageNumbers: boolean;
    showGeneratedBy: boolean;
    showTimestamp: boolean;
  };

  // Typography
  fonts: {
    primary: 'Helvetica';
    secondary: 'Helvetica-Bold';
    sizes: { title: 24, subtitle: 16, heading: 14, body: 10, small: 8 };
  };

  // Color scheme (customizable via branding)
  colors: {
    primary: '#2563eb';      // Brand blue
    secondary: '#1e40af';
    accent: '#3b82f6';
    text: '#1f2937';
    textLight: '#6b7280';
    border: '#e5e7eb';
    background: '#f9fafb';
    success: '#10b981';
    warning: '#f59e0b';
    error: '#ef4444';
  };

  // Table styling
  table: {
    headerBackground: '#2563eb';
    headerTextColor: '#ffffff';
    alternateRowBackground: '#f9fafb';
    borderColor: '#e5e7eb';
    cellPadding: 8;
  };
}
```

### PDF Layout Sections

Each document type follows this general structure:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  ├── Logo (left)                                             │
│  ├── Document Title (center)                                 │
│  ├── Document Number                                         │
│  └── Date (right)                                            │
├─────────────────────────────────────────────────────────────┤
│  STATUS BADGE (top-right, color-coded)                       │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Document Details                                   │
│  └── Key-value pairs (label: value)                          │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Parties (2-column layout)                          │
│  ├── From/Seller (left box)                                  │
│  └── To/Buyer (right box)                                    │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Line Items                                         │
│  └── Data table with headers                                 │
├─────────────────────────────────────────────────────────────┤
│  TOTALS BOX (right-aligned)                                  │
│  ├── Subtotal                                                │
│  ├── Taxes                                                   │
│  ├── Shipping                                                │
│  └── TOTAL (bold)                                            │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Additional Info (notes, terms, etc.)               │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
│  ├── Page X of Y (center)                                    │
│  └── "Generated by NABD Marketplace"                         │
└─────────────────────────────────────────────────────────────┘
```

### Excel Templates

Excel files are generated using **ExcelJS** with multiple sheets:

```typescript
interface ExcelTemplate {
  // Sheets configuration
  sheets: [
    { name: 'Summary', columns: [...] },
    { name: 'Details', columns: [...] },
    { name: 'Items', columns: [...] },
  ];

  // Styling
  styles: {
    headerFont: { name: 'Arial', size: 11, bold: true, color: 'FFFFFF' };
    bodyFont: { name: 'Arial', size: 10, color: '1F2937' };
    titleFont: { name: 'Arial', size: 14, bold: true, color: '2563EB' };
    headerFill: '2563EB';       // Blue header row
    alternateFill: 'F9FAFB';    // Zebra striping
    borderColor: 'E5E7EB';
  };
}
```

### Excel Column Types

| Type | Format | Example |
|------|--------|---------|
| `string` | Plain text | "ACME Corp" |
| `number` | Numeric | 1,234 |
| `currency` | SAR X,XXX.XX | SAR 1,234.56 |
| `date` | MMM DD, YYYY | Jan 15, 2024 |
| `percentage` | XX% | 15% |
| `status` | Title Case | "Pending Confirmation" |

---

## Backend Job Flow

### Synchronous Export (Default)

For most exports, documents are generated synchronously:

```
1. Client POST /api/exports/[type]
2. Server validates request (Zod schema)
3. Server generates document (PDFKit/ExcelJS)
4. Server streams buffer back to client
5. Client triggers browser download
```

### Asynchronous Export (Large Documents)

For large exports, a job queue system is available:

```
1. Client POST /api/exports/jobs
2. Server creates job record (status: queued)
3. Server returns job ID immediately
4. Background worker processes job
5. Client polls GET /api/exports/jobs/:id
6. When completed, client downloads via GET /api/exports/jobs/:id/download
```

### Job States

```
queued → processing → completed → expired
                   ↘ failed
```

### Job Cleanup

- Files expire after **24 hours**
- Cleanup runs every **1 hour**
- Expired jobs are deleted from memory
- Expired files are removed from disk

---

## File Storage Strategy

### Development (Local Storage)

```
/exports/
├── quote_comparison_RFQ-2024-001_2024-01-15.pdf
├── quote_comparison_RFQ-2024-001_2024-01-15.xlsx
├── order_ORD-2024-001_2024-01-15.pdf
└── invoice_INV-2024-001_2024-01-15.pdf
```

Configuration:
```env
EXPORT_STORAGE_DIR=/path/to/exports
```

### Production (AWS S3)

For production, integrate with AWS S3:

```typescript
// Future enhancement - S3 storage
const s3Client = new S3Client({ region: 'me-south-1' });

async function uploadToS3(buffer: Buffer, fileName: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_EXPORT_BUCKET,
    Key: `exports/${fileName}`,
    Body: buffer,
    ContentType: getMimeType(fileName),
  });

  await s3Client.send(command);

  // Return pre-signed URL (expires in 24 hours)
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.S3_EXPORT_BUCKET,
    Key: `exports/${fileName}`,
  }), { expiresIn: 86400 });

  return signedUrl;
}
```

### File Naming Convention

```
{document_type}_{identifier}_{date}.{extension}

Examples:
- quote_comparison_RFQ-2024-001_2024-01-15.pdf
- order_ORD-2024-001_2024-01-15.xlsx
- invoice_INV-2024-001_2024-01-15.pdf
- payout_PAY-2024-001_2024-01-15.xlsx
```

---

## API Reference

### Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/exports/quote-comparison` | Export quote comparison |
| POST | `/api/exports/rfq` | Export RFQ |
| POST | `/api/exports/order` | Export order |
| POST | `/api/exports/invoice` | Export invoice |
| POST | `/api/exports/payout` | Export payout |

### Request Schema

```typescript
{
  format: 'pdf' | 'excel',
  options?: {
    includeScoring?: boolean,      // Include scoring data
    includeHighlights?: boolean,   // Include highlights/warnings
    includeMetadata?: boolean,     // Include generation metadata
    includeAuditTrail?: boolean,   // Include activity timeline
    language?: 'en' | 'ar',
    currency?: string,             // Default: 'SAR'
    timezone?: string,             // Default: 'Asia/Riyadh'
    pageSize?: 'A4' | 'Letter',
    orientation?: 'portrait' | 'landscape',
  },
  branding?: {
    companyName?: string,
    logoUrl?: string,
    primaryColor?: string,
    secondaryColor?: string,
    footerText?: string,
    showWatermark?: boolean,
  },
  data: { /* document-specific data */ }
}
```

### Job Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exports/jobs` | List user's export jobs |
| GET | `/api/exports/jobs/:id` | Get job status |
| GET | `/api/exports/jobs/:id/download` | Download completed export |
| DELETE | `/api/exports/jobs/:id` | Delete job and file |

---

## Frontend Integration

### ExportButton Component

The `ExportButton` component provides contextual export functionality:

```tsx
import { ExportButton } from '@/features/portal/components/ExportButton';

// Basic usage
<ExportButton
  documentType="order"
  data={orderData}
/>

// Customized
<ExportButton
  documentType="quote_comparison"
  data={{ rfq, quotes, scoring, recommendation }}
  variant="primary"
  size="md"
  options={{
    includeScoring: true,
    includeHighlights: true,
  }}
  onSuccess={() => toast.success('Export downloaded')}
/>

// Icon-only (for table rows)
<ExportIconButton
  documentType="invoice"
  data={invoiceData}
/>

// Pre-selected format
<ExportPDFButton documentType="order" data={orderData} />
<ExportExcelButton documentType="order" data={orderData} />
```

### Button Variants

| Variant | Usage |
|---------|-------|
| `primary` | Main CTA, filled button |
| `secondary` | Default, outlined button |
| `ghost` | Minimal, text-only |
| `icon` | Icon-only, for table rows |

### Contextual Placement

Export buttons should be placed contextually without adding clutter:

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header                                                 │
│  ├── Title: "Order #ORD-2024-001"                            │
│  └── Actions: [Print] [Export ▼] [More ⋮]  ← Export here     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Order Details...                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

For tables with multiple rows:

```
┌─────────────────────────────────────────────────────────────┐
│  # │ Order      │ Status    │ Total      │ Actions          │
├────┼────────────┼───────────┼────────────┼──────────────────┤
│  1 │ ORD-001    │ Delivered │ SAR 1,234  │ [👁] [📥] [⋮]    │
│  2 │ ORD-002    │ Shipped   │ SAR 2,345  │ [👁] [📥] [⋮]    │
└─────────────────────────────────────────────────────────────┘
                                              ↑
                                        Export icon button
```

---

## Dependencies

### Backend

```json
{
  "pdfkit": "^0.14.0",
  "exceljs": "^4.4.0",
  "@types/pdfkit": "^0.13.4"
}
```

### Installation

```bash
cd server
pnpm add pdfkit exceljs
pnpm add -D @types/pdfkit
```

---

## Security Considerations

1. **Authentication**: All export endpoints require authentication
2. **Authorization**: Users can only export documents they have access to
3. **Input Validation**: All requests validated with Zod schemas
4. **File Access**: Exported files are user-specific and expire
5. **Rate Limiting**: Consider adding rate limits for large exports

---

## Future Enhancements

1. **Batch Export**: Export multiple documents as ZIP
2. **Email Delivery**: Send exports directly to email
3. **Scheduled Exports**: Generate reports on schedule
4. **Template Customization**: User-defined templates
5. **RTL Support**: Full Arabic language support with RTL layout
6. **Digital Signatures**: PDF signing for invoices

---

*This document describes the export system architecture and usage patterns.*
