// =============================================================================
// Internal Notes Section Component
// =============================================================================
// Seller-only: Display and edit internal notes, show automation signals
// =============================================================================

import React, { useState } from 'react';
import {
  NotePencil,
  Lightning,
  PaperPlaneTilt,
  X,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { InternalNotesSectionProps } from './tracking.types';

// =============================================================================
// Main Component
// =============================================================================

export const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({
  notes,
  automationSignals,
  onUpdateNotes,
}) => {
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');

  const handleSave = () => {
    onUpdateNotes?.(editedNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(notes || '');
    setIsEditing(false);
  };

  return (
    <div
      className="mx-6 mb-6 p-4 rounded-xl"
      style={{
        backgroundColor: styles.bgCard,
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <NotePencil size={18} style={{ color: styles.textMuted }} />
          <span
            className="text-sm font-medium"
            style={{ color: styles.textPrimary }}
          >
            {t('tracking.internalNotes') || 'Internal Notes'}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}>
            {t('tracking.sellerOnly') || 'Seller Only'}
          </span>
        </div>

        {!isEditing && onUpdateNotes && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium transition-colors"
            style={{ color: styles.info }}
          >
            {notes ? (t('tracking.edit') || 'Edit') : (t('tracking.addNote') || 'Add Note')}
          </button>
        )}
      </div>

      {/* Notes content or editor */}
      {isEditing ? (
        <div>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder={t('tracking.notesPlaceholder') || 'Add internal notes about this order...'}
            className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textPrimary,
              border: `1px solid ${styles.border}`,
              minHeight: '100px',
            }}
            autoFocus
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <div className={`flex items-center gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: styles.isDark ? '#3B82F6' : '#2563EB',
                color: '#FFFFFF',
              }}
            >
              <PaperPlaneTilt size={14} weight="bold" />
              {t('tracking.save') || 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: 'transparent',
                color: styles.textSecondary,
                border: `1px solid ${styles.border}`,
              }}
            >
              <X size={14} weight="bold" />
              {t('tracking.cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: styles.textSecondary }}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {notes}
            </p>
          ) : (
            <p
              className="text-sm italic"
              style={{ color: styles.textMuted }}
            >
              {t('tracking.noNotes') || 'No internal notes yet.'}
            </p>
          )}
        </div>
      )}

      {/* Automation signals */}
      {automationSignals && automationSignals.length > 0 && (
        <div
          className="mt-4 pt-4 border-t space-y-2"
          style={{ borderColor: styles.border }}
        >
          <p className="text-xs font-medium" style={{ color: styles.textMuted }}>
            {t('tracking.automationSignals') || 'Automation Signals'}
          </p>
          {automationSignals.map((signal, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: `${styles.warning}08`,
              }}
            >
              <Lightning size={14} weight="fill" style={{ color: styles.warning }} />
              <span className="text-xs" style={{ color: styles.warning }}>
                {signal}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternalNotesSection;
