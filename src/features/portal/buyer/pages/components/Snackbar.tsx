// =============================================================================
// Snackbar Component
// Auto-dismissing inline notification
// =============================================================================

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  WarningCircle,
  Info,
  X,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';

export type SnackbarType = 'success' | 'error' | 'info';

export interface SnackbarState {
  show: boolean;
  message: string;
  type: SnackbarType;
}

interface SnackbarProps {
  snackbar: SnackbarState | null;
  onClose: () => void;
  autoHideDuration?: number;
}

const typeConfig: Record<SnackbarType, {
  icon: React.ElementType;
  getColor: (styles: Record<string, string>) => string;
}> = {
  success: { icon: CheckCircle, getColor: (styles) => styles.success },
  error: { icon: WarningCircle, getColor: (styles) => styles.error },
  info: { icon: Info, getColor: (styles) => styles.info },
};

export const Snackbar: React.FC<SnackbarProps> = ({
  snackbar,
  onClose,
  autoHideDuration = 3000,
}) => {
  const { styles, direction } = usePortal();
  const [isVisible, setIsVisible] = useState(false);
  const isRtl = direction === 'rtl';

  useEffect(() => {
    if (snackbar?.show) {
      // Small delay to trigger animation
      requestAnimationFrame(() => setIsVisible(true));

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for exit animation
      }, autoHideDuration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [snackbar, autoHideDuration, onClose]);

  if (!snackbar?.show) return null;

  const config = typeConfig[snackbar.type];
  const Icon = config.icon;
  const color = config.getColor(styles);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        transition-all duration-200 max-w-md
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        backgroundColor: styles.bgCard,
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 20px ${color}20`,
      }}
      role="alert"
    >
      <Icon size={20} weight="fill" style={{ color }} className="flex-shrink-0" />
      <p className="text-sm flex-1" style={{ color: styles.textPrimary }}>
        {snackbar.message}
      </p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 200);
        }}
        className="p-1 rounded-lg transition-colors flex-shrink-0"
        style={{ color: styles.textMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Hook for managing snackbar state
export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({ show: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar(null);
  };

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
  };
}

export default Snackbar;
