import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, Warning, WarningCircle, Info, X } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

// =============================================================================
// Toast Types
// =============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  undoable?: boolean;
  onUndo?: () => void;
}

// =============================================================================
// Toast Context
// =============================================================================

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// =============================================================================
// Toast Provider
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <div
        className={`fixed z-50 flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
        style={{ maxWidth: '400px', width: '100%' }}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// =============================================================================
// Toast Item Component
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { styles } = usePortal();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  const handleUndo = useCallback(() => {
    if (toast.onUndo) {
      toast.onUndo();
    }
    handleDismiss();
  }, [toast, handleDismiss]);

  const typeConfig: Record<ToastType, {
    icon: typeof CheckCircle;
    color: string;
  }> = {
    success: {
      icon: CheckCircle,
      color: styles.success,
    },
    error: {
      icon: WarningCircle,
      color: styles.error,
    },
    warning: {
      icon: Warning,
      color: styles.warning,
    },
    info: {
      icon: Info,
      color: styles.info,
    },
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto rounded-lg border shadow-lg overflow-hidden
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      style={{
        backgroundColor: styles.bgCard,
        borderColor: `${config.color}40`,
        borderLeftWidth: '4px',
        borderLeftColor: config.color,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon size={20} weight="bold" style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold"
            style={{ color: styles.textPrimary }}
          >
            {toast.title}
          </h4>
          {toast.message && (
            <p
              className="mt-1 text-xs"
              style={{ color: styles.textSecondary }}
            >
              {toast.message}
            </p>
          )}

          {/* Actions */}
          {(toast.action || toast.undoable) && (
            <div className="mt-2 flex items-center gap-3">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    handleDismiss();
                  }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: config.color }}
                >
                  {toast.action.label}
                </button>
              )}
              {toast.undoable && toast.onUndo && (
                <button
                  onClick={handleUndo}
                  className="text-xs font-medium hover:underline"
                  style={{ color: styles.primary }}
                >
                  Undo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={14} style={{ color: styles.textMuted }} />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Standalone Toast Functions (for use without context)
// =============================================================================

/**
 * Helper to create toast content for common actions
 */
export const toastContent = {
  orderConfirmed: (orderNumber: string) => ({
    type: 'success' as ToastType,
    title: 'Order Confirmed',
    message: `Order ${orderNumber} has been confirmed successfully.`,
  }),

  orderShipped: (orderNumber: string, tracking?: string) => ({
    type: 'success' as ToastType,
    title: 'Order Shipped',
    message: tracking
      ? `Order ${orderNumber} shipped. Tracking: ${tracking}`
      : `Order ${orderNumber} has been marked as shipped.`,
  }),

  paymentRecorded: (amount: string) => ({
    type: 'success' as ToastType,
    title: 'Payment Recorded',
    message: `Payment of ${amount} has been recorded.`,
  }),

  quoteSent: (quoteNumber: string) => ({
    type: 'success' as ToastType,
    title: 'Quote Sent',
    message: `Quote ${quoteNumber} has been sent to the buyer.`,
  }),

  quoteAccepted: (quoteNumber: string) => ({
    type: 'success' as ToastType,
    title: 'Quote Accepted',
    message: `You've accepted quote ${quoteNumber}. An order has been created.`,
  }),

  rfqSubmitted: () => ({
    type: 'success' as ToastType,
    title: 'RFQ Submitted',
    message: 'Your request for quote has been sent to the supplier.',
  }),

  itemSaved: () => ({
    type: 'success' as ToastType,
    title: 'Changes Saved',
    message: 'Your changes have been saved successfully.',
  }),

  itemPublished: (itemName: string) => ({
    type: 'success' as ToastType,
    title: 'Item Published',
    message: `"${itemName}" is now live on the marketplace.`,
  }),

  error: (message: string) => ({
    type: 'error' as ToastType,
    title: 'Error',
    message,
  }),

  networkError: () => ({
    type: 'error' as ToastType,
    title: 'Connection Error',
    message: 'Unable to connect. Please check your internet and try again.',
  }),

  validationError: (field: string) => ({
    type: 'warning' as ToastType,
    title: 'Invalid Input',
    message: `Please check the ${field} field.`,
  }),
};

export default ToastProvider;
