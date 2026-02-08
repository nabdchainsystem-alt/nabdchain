// =============================================================================
// Verification Banner Component
// Shows status banners for sellers based on their verification state
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ClockCounterClockwise, Warning, ShieldCheck, Prohibit, ArrowRight, Lock, Info } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import {
  featureGatingService,
  GatedAction as GatedActionType,
  GatingResult,
} from '../../services/featureGatingService';

export type SellerStatus = 'incomplete' | 'pending_review' | 'approved' | 'suspended';

interface VerificationBannerProps {
  status: SellerStatus;
  onCompleteOnboarding?: () => void;
  className?: string;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({
  status,
  onCompleteOnboarding,
  className = '',
}) => {
  const { styles } = usePortal();

  if (status === 'approved') {
    return null;
  }

  const configs: Record<
    Exclude<SellerStatus, 'approved'>,
    {
      icon: React.ElementType;
      iconColor: string;
      bgColor: string;
      borderColor: string;
      title: string;
      description: string;
      showAction: boolean;
      actionLabel?: string;
    }
  > = {
    incomplete: {
      icon: Warning,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      title: 'Complete Your Store Setup',
      description: 'Finish setting up your store to start listing products and receiving orders.',
      showAction: true,
      actionLabel: 'Continue Setup',
    },
    pending_review: {
      icon: ClockCounterClockwise,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      title: 'Verification In Progress',
      description:
        "Your store is being reviewed. You can add products, but they won't be visible to buyers until approved.",
      showAction: false,
    },
    suspended: {
      icon: Prohibit,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      title: 'Store Suspended',
      description: 'Your store has been suspended. Please contact support for assistance.',
      showAction: false,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon size={24} weight="fill" className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${styles.textPrimary}`}>{config.title}</h3>
          <p className={`text-sm ${styles.textMuted} mt-0.5`}>{config.description}</p>
          {config.showAction && onCompleteOnboarding && (
            <button
              onClick={onCompleteOnboarding}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {config.actionLabel}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Feature Gating Hook (Enhanced)
// =============================================================================

interface FeatureGating {
  // Legacy compatibility
  canList: boolean;
  canPublish: boolean;
  canReceiveOrders: boolean;
  status: SellerStatus;
  // New enhanced features
  features: Record<GatedActionType, GatingResult>;
  checkFeature: (action: GatedActionType) => GatingResult;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useSellerFeatureGating = (): FeatureGating => {
  const [features, setFeatures] = useState<Record<GatedActionType, GatingResult>>(() => {
    const cached = featureGatingService.getCachedFeatureAccess();
    return cached.features;
  });
  const [status, setStatus] = useState<SellerStatus>(() => {
    return (localStorage.getItem('seller_status') as SellerStatus) || 'incomplete';
  });
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await featureGatingService.getFeatureAccess();
      if (response.success) {
        setFeatures(response.features);
        setStatus(response.status);
        featureGatingService.cacheFeatureAccess({
          status: response.status,
          features: response.features,
        });
        localStorage.setItem('seller_status', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch feature access:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount if user is logged in
    const userId = localStorage.getItem('portal_user_id');
    if (userId) {
      refresh();
    }
  }, [refresh]);

  const checkFeature = useCallback(
    (action: GatedActionType): GatingResult => {
      return features[action] || { allowed: false, reason: 'Feature not available', reasonCode: 'UNKNOWN' };
    },
    [features],
  );

  // Legacy compatibility mappings
  const canList = features.create_draft?.allowed ?? false;
  const canPublish = features.publish_listing?.allowed ?? false;
  const canReceiveOrders = features.accept_order?.allowed ?? false;

  return {
    canList,
    canPublish,
    canReceiveOrders,
    status,
    features,
    checkFeature,
    isLoading,
    refresh,
  };
};

// =============================================================================
// Gated Button Component
// A button that automatically handles feature gating
// =============================================================================

interface GatedButtonProps {
  action: GatedActionType;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabledClassName?: string;
  showReason?: boolean;
  onGatingDenied?: (result: GatingResult) => void;
}

export const GatedButton: React.FC<GatedButtonProps> = ({
  action,
  onClick,
  children,
  className = '',
  disabledClassName = '',
  showReason = true,
  onGatingDenied,
}) => {
  const { styles } = usePortal();
  const { checkFeature } = useSellerFeatureGating();
  const [showTooltip, setShowTooltip] = useState(false);

  const gatingResult = checkFeature(action);

  const handleClick = () => {
    if (gatingResult.allowed) {
      onClick();
    } else {
      onGatingDenied?.(gatingResult);
      // If there's a redirect, navigate
      if (gatingResult.redirectTo) {
        window.location.href = gatingResult.redirectTo;
      }
    }
  };

  if (!gatingResult.allowed) {
    return (
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`${className} ${disabledClassName} opacity-60 cursor-not-allowed flex items-center gap-1.5`}
          disabled
        >
          <Lock size={14} className="flex-shrink-0" />
          {children}
        </button>
        {showReason && showTooltip && gatingResult.reason && (
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 ${styles.bgSecondary} border ${styles.border} rounded-lg shadow-lg text-xs ${styles.textSecondary} whitespace-nowrap z-50 max-w-xs`}
          >
            <div className="flex items-start gap-2">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>{gatingResult.reason}</span>
            </div>
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-200 dark:border-t-zinc-700`}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

// =============================================================================
// Gated Action Wrapper
// Wraps any content and shows a message if action is not allowed
// =============================================================================

interface GatedActionProps {
  action: GatedActionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const GatedAction: React.FC<GatedActionProps> = ({ action, children, fallback }) => {
  const { checkFeature } = useSellerFeatureGating();
  const gatingResult = checkFeature(action);

  if (!gatingResult.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
};

// =============================================================================
// Inline Status Badge
// =============================================================================

interface StatusBadgeProps {
  status: SellerStatus;
  size?: 'sm' | 'md';
}

export const SellerStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<SellerStatus, { label: string; className: string }> = {
    incomplete: {
      label: 'Setup Incomplete',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    pending_review: {
      label: 'Pending Review',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    approved: { label: 'Verified', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = configs[status];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.className} ${sizeClass}`}>
      {status === 'approved' && <ShieldCheck size={size === 'sm' ? 12 : 14} weight="fill" className="mr-1" />}
      {config.label}
    </span>
  );
};

export default VerificationBanner;
