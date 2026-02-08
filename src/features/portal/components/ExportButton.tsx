/**
 * ExportButton Component
 * Contextual export button that integrates seamlessly into existing UI
 *
 * Features:
 * - Dropdown menu for format selection
 * - Loading state during export
 * - Error handling with toast notifications
 * - Minimal footprint - designed to not add UI clutter
 */

import React, { useState, useRef, useEffect } from 'react';
import { usePortal } from '../context/PortalContext';
import exportService, {
  ExportFormat,
  ExportDocumentType,
  ExportOptions,
  BrandingConfig,
} from '../services/exportService';

// ============================================================================
// TYPES
// ============================================================================

interface ExportButtonProps {
  /** Document type to export */
  documentType: ExportDocumentType;

  /** Data to export - structure depends on documentType */
  data: Record<string, unknown>;

  /** Optional: Pre-selected format (skips dropdown) */
  format?: ExportFormat;

  /** Optional: Export options */
  options?: ExportOptions;

  /** Optional: Branding configuration */
  branding?: BrandingConfig;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Custom button label */
  label?: string;

  /** Show format dropdown */
  showFormatDropdown?: boolean;

  /** Callback on export success */
  onSuccess?: () => void;

  /** Callback on export error */
  onError?: (error: Error) => void;

  /** Additional class names */
  className?: string;

  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const SpreadsheetIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const ExportButton: React.FC<ExportButtonProps> = ({
  documentType,
  data,
  format: preselectedFormat,
  options,
  branding,
  variant = 'secondary',
  size = 'md',
  label,
  showFormatDropdown = true,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles } = usePortal();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get document type label
  const getDocumentLabel = (): string => {
    const labels: Record<ExportDocumentType, string> = {
      quote_comparison: 'Quote Comparison',
      rfq: 'RFQ',
      order: 'Order',
      invoice: 'Invoice',
      payout: 'Payout',
    };
    return labels[documentType] || 'Document';
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    setIsLoading(true);
    setError(null);
    setIsOpen(false);

    try {
      switch (documentType) {
        case 'quote_comparison':
          await exportService.exportQuoteComparison(
            data as { rfq: Record<string, unknown>; quotes: Record<string, unknown>[] },
            format,
            options,
            branding,
          );
          break;
        case 'rfq':
          await exportService.exportRFQ(data, format, options, branding);
          break;
        case 'order':
          await exportService.exportOrder(data, format, options, branding);
          break;
        case 'invoice':
          await exportService.exportInvoice(data, format, options, branding);
          break;
        case 'payout':
          await exportService.exportPayout(data, format, options, branding);
          break;
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle button click
  const handleClick = () => {
    if (preselectedFormat && !showFormatDropdown) {
      handleExport(preselectedFormat);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Variant classes
  const getVariantClasses = () => {
    const base =
      'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    switch (variant) {
      case 'primary':
        return `${base} bg-blue-600 text-white hover:opacity-90 focus:ring-blue-500`;
      case 'secondary':
        return `${base} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500`;
      case 'ghost':
        return `${base} text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500`;
      case 'icon':
        return `${base} p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:ring-gray-500`;
      default:
        return base;
    }
  };

  // Button content
  const buttonLabel = label || (variant === 'icon' ? '' : 'Export');

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          ${getVariantClasses()}
          ${variant !== 'icon' ? sizeClasses[size] : ''}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={variant === 'icon' ? `Export ${getDocumentLabel()}` : undefined}
      >
        {isLoading ? (
          <LoadingSpinner className={iconSizeClasses[size]} />
        ) : (
          <DownloadIcon className={iconSizeClasses[size]} />
        )}

        {buttonLabel && <span>{buttonLabel}</span>}

        {showFormatDropdown && variant !== 'icon' && (
          <ChevronDownIcon className={`${iconSizeClasses[size]} ml-0.5 -mr-1`} />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && showFormatDropdown && (
        <div
          className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
        >
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Export {getDocumentLabel()}
            </div>

            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <DocumentIcon className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="font-medium">PDF Document</div>
                <div className="text-xs text-gray-500">Best for printing & sharing</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <SpreadsheetIcon className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Excel Spreadsheet</div>
                <div className="text-xs text-gray-500">Best for data analysis</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute right-0 z-50 mt-1 w-64 rounded-md bg-red-50 p-3 shadow-lg ring-1 ring-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto pl-3 text-red-400 hover:text-red-600">
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

/**
 * Minimal icon-only export button for table rows
 */
export const ExportIconButton: React.FC<Omit<ExportButtonProps, 'variant'>> = (props) => (
  <ExportButton {...props} variant="icon" showFormatDropdown />
);

/**
 * Export button with pre-selected PDF format
 */
export const ExportPDFButton: React.FC<Omit<ExportButtonProps, 'format' | 'showFormatDropdown'>> = (props) => (
  <ExportButton {...props} format="pdf" showFormatDropdown={false} label={props.label || 'Export PDF'} />
);

/**
 * Export button with pre-selected Excel format
 */
export const ExportExcelButton: React.FC<Omit<ExportButtonProps, 'format' | 'showFormatDropdown'>> = (props) => (
  <ExportButton {...props} format="excel" showFormatDropdown={false} label={props.label || 'Export Excel'} />
);

export default ExportButton;
