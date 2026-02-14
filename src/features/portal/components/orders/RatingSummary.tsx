// =============================================================================
// RatingSummary — Aggregated rating display for supplier/buyer profiles
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Star } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { ratingService } from '../../services/ratingService';
import type { RatingSummary as RatingSummaryType } from '../../types/rating.types';

interface RatingSummaryProps {
  targetRole: 'SELLER' | 'BUYER';
  targetId: string;
  compact?: boolean;
}

export const RatingSummaryCard: React.FC<RatingSummaryProps> = ({ targetRole, targetId, compact = false }) => {
  const { styles } = usePortal();
  const [summary, setSummary] = useState<RatingSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    ratingService
      .getTargetSummary(targetRole, targetId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [targetRole, targetId]);

  if (loading) {
    return <div className="animate-pulse h-8 rounded" style={{ backgroundColor: styles.bgSecondary }} />;
  }

  if (!summary || summary.count === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <Star size={14} style={{ color: styles.textMuted }} />
        <span className="text-xs" style={{ color: styles.textMuted }}>
          No ratings yet
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Star size={14} weight="fill" style={{ color: '#f59e0b' }} />
        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
          {summary.avgScore.toFixed(1)}
        </span>
        <span className="text-xs" style={{ color: styles.textMuted }}>
          ({summary.count})
        </span>
      </div>
    );
  }

  const maxCount = Math.max(...(Object.values(summary.distribution) as number[]), 1);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
          {summary.avgScore.toFixed(1)}
        </span>
        <div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                weight={n <= Math.round(summary.avgScore) ? 'fill' : 'regular'}
                style={{
                  color: n <= Math.round(summary.avgScore) ? '#f59e0b' : styles.textMuted,
                }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: styles.textMuted }}>
            {summary.count} rating{summary.count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.distribution[star] || 0;
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right" style={{ color: styles.textMuted }}>
                {star}
              </span>
              <Star size={10} weight="fill" style={{ color: '#f59e0b' }} />
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${width}%`, backgroundColor: '#f59e0b' }}
                />
              </div>
              <span className="w-4 text-right" style={{ color: styles.textMuted }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent reviews */}
      {summary.recent.length > 0 && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: styles.border }}>
          <span className="text-xs font-medium" style={{ color: styles.textMuted }}>
            Recent Reviews
          </span>
          {summary.recent.slice(0, 3).map((review, i) => (
            <div key={i} className="p-2 rounded-lg text-xs" style={{ backgroundColor: styles.bgSecondary }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={10}
                      weight={n <= review.score ? 'fill' : 'regular'}
                      style={{ color: n <= review.score ? '#f59e0b' : styles.textMuted }}
                    />
                  ))}
                </div>
                <span style={{ color: styles.textMuted }}>{review.orderNumber}</span>
              </div>
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px]"
                      style={{
                        backgroundColor: `${styles.info}15`,
                        color: styles.info,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {review.comment && <p style={{ color: styles.textSecondary }}>{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingSummaryCard;
