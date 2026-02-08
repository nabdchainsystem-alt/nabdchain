// =============================================================================
// Action Panel Component
// =============================================================================
// Role-based action buttons for buyer and seller tracking views
// =============================================================================

import React from 'react';
import { ChatCircle, ShieldWarning, DownloadSimple, Truck, CheckSquare, Warning, NotePencil } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { ActionPanelProps, TrackingAction } from './tracking.types';
import { ThemeStyles } from '../../../../theme/portalColors';

// =============================================================================
// Button Component
// =============================================================================

interface ActionButtonProps {
  action: TrackingAction;
  styles: ThemeStyles;
  isRtl: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, styles, isRtl }) => {
  const IconMap: Record<string, React.ElementType> = {
    ChatCircle,
    ShieldWarning,
    DownloadSimple,
    Truck,
    CheckSquare,
    Warning,
    NotePencil,
  };

  const Icon = action.icon ? IconMap[action.icon] : null;

  const getButtonStyles = () => {
    switch (action.variant) {
      case 'primary':
        return {
          backgroundColor: styles.isDark ? '#3B82F6' : '#2563EB',
          color: '#FFFFFF',
          border: 'none',
        };
      case 'danger':
        return {
          backgroundColor: `${styles.error}10`,
          color: styles.error,
          border: `1px solid ${styles.error}30`,
        };
      case 'secondary':
      default:
        return {
          backgroundColor: 'transparent',
          color: styles.textSecondary,
          border: `1px solid ${styles.border}`,
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } ${isRtl ? 'flex-row-reverse' : ''}`}
      style={buttonStyles}
    >
      {Icon && <Icon size={18} weight="bold" />}
      {action.label}
    </button>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const ActionPanel: React.FC<ActionPanelProps> = ({
  role,
  order,
  deliveryConfidence,
  onContactSeller,
  onOpenDispute,
  onDownloadSummary,
  onUpdateShipment,
  onConfirmDispatch,
  onReportDelay,
  onAddNote,
}) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';

  // Build actions based on role
  const buildBuyerActions = (): TrackingAction[] => {
    const actions: TrackingAction[] = [];

    // Contact Seller - always available
    if (onContactSeller) {
      actions.push({
        id: 'contact-seller',
        label: t('tracking.actions.contactSeller') || 'Contact Seller',
        variant: 'primary',
        icon: 'ChatCircle',
        onClick: onContactSeller,
      });
    }

    // Open Dispute - only if delayed
    if (onOpenDispute && deliveryConfidence === 'delayed') {
      actions.push({
        id: 'open-dispute',
        label: t('tracking.actions.openDispute') || 'Open Dispute',
        variant: 'danger',
        icon: 'ShieldWarning',
        onClick: onOpenDispute,
      });
    }

    // Download Summary - always available
    if (onDownloadSummary) {
      actions.push({
        id: 'download-summary',
        label: t('tracking.actions.downloadSummary') || 'Download Summary',
        variant: 'secondary',
        icon: 'DownloadSimple',
        onClick: onDownloadSummary,
      });
    }

    return actions;
  };

  const buildSellerActions = (): TrackingAction[] => {
    const actions: TrackingAction[] = [];

    // Update Shipment Info - available when order is in progress
    if (onUpdateShipment && ['confirmed', 'in_progress'].includes(order.status)) {
      actions.push({
        id: 'update-shipment',
        label: t('tracking.actions.updateShipment') || 'Update Shipment Info',
        variant: 'primary',
        icon: 'Truck',
        onClick: onUpdateShipment,
      });
    }

    // Confirm Dispatch - available when order is ready to ship
    if (onConfirmDispatch && order.status === 'in_progress') {
      actions.push({
        id: 'confirm-dispatch',
        label: t('tracking.actions.confirmDispatch') || 'Confirm Dispatch',
        variant: 'primary',
        icon: 'CheckSquare',
        onClick: onConfirmDispatch,
      });
    }

    // Report Delay - always available for active orders
    if (onReportDelay && !['delivered', 'cancelled', 'failed', 'refunded'].includes(order.status)) {
      actions.push({
        id: 'report-delay',
        label: t('tracking.actions.reportDelay') || 'Report Delay',
        variant: 'secondary',
        icon: 'Warning',
        onClick: onReportDelay,
      });
    }

    // Add Internal Note - always available
    if (onAddNote) {
      actions.push({
        id: 'add-note',
        label: t('tracking.actions.addNote') || 'Add Note',
        variant: 'secondary',
        icon: 'NotePencil',
        onClick: onAddNote,
      });
    }

    return actions;
  };

  const actions = role === 'buyer' ? buildBuyerActions() : buildSellerActions();

  // Filter out hidden actions
  const visibleActions = actions.filter((a) => !a.hidden);

  if (visibleActions.length === 0) {
    return null;
  }

  // Split into primary and secondary actions
  const primaryActions = visibleActions.filter((a) => a.variant === 'primary');
  const otherActions = visibleActions.filter((a) => a.variant !== 'primary');

  return (
    <div
      className="px-6 py-4 border-t"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgPrimary,
      }}
    >
      {/* Primary actions row */}
      {primaryActions.length > 0 && (
        <div className={`flex gap-3 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {primaryActions.map((action) => (
            <div key={action.id} className="flex-1">
              <ActionButton action={action} styles={styles} isRtl={isRtl} />
            </div>
          ))}
        </div>
      )}

      {/* Secondary/danger actions row */}
      {otherActions.length > 0 && (
        <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {otherActions.map((action) => (
            <div key={action.id} className="flex-1">
              <ActionButton action={action} styles={styles} isRtl={isRtl} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionPanel;
