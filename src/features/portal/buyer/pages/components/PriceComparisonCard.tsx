// =============================================================================
// Price Comparison Card Component
// Shows current price vs historical prices with trend indicator
// =============================================================================

import React from 'react';
import { TrendUp, TrendDown, Minus, CurrencyDollar, ChartLine } from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import {
  PriceComparison,
  PriceTrend,
  getTrendColor,
  getSavingsColor,
  getSavingsLabel,
  formatVariance,
} from '../../../types/purchase.types';

interface PriceComparisonCardProps {
  comparison: PriceComparison | null;
  currentPrice: number;
  currency?: string;
}

const TrendIcon: React.FC<{ trend: PriceTrend; size?: number }> = ({ trend, size = 16 }) => {
  if (trend === 'up') return <TrendUp size={size} weight="bold" />;
  if (trend === 'down') return <TrendDown size={size} weight="bold" />;
  return <Minus size={size} weight="bold" />;
};

export const PriceComparisonCard: React.FC<PriceComparisonCardProps> = ({
  comparison,
  currentPrice,
  currency = 'SAR',
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const formatCurrency = (amount: number): string => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // No history available
  if (!comparison) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ChartLine size={18} style={{ color: styles.textMuted }} />
          <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('buyer.purchases.priceComparison') || 'Price Comparison'}
          </h4>
        </div>
        <div className="text-center py-4">
          <CurrencyDollar size={32} style={{ color: styles.textMuted }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: styles.textMuted }}>
            {t('buyer.purchases.noPriceHistory') || 'No price history for this item yet'}
          </p>
          <p className="text-2xl font-bold mt-2" style={{ color: styles.textPrimary }}>
            {formatCurrency(currentPrice)}
          </p>
        </div>
      </div>
    );
  }

  const trendColor = getTrendColor(comparison.trend);
  const savingsColor = getSavingsColor(comparison.recommendation);
  const isGoodDeal = comparison.recommendation === 'good_deal';
  const isOverpaying = comparison.recommendation === 'overpaying';

  // Calculate position on the price range bar
  const range = comparison.historicalMax - comparison.historicalMin || 1;
  const position = Math.min(100, Math.max(0, ((currentPrice - comparison.historicalMin) / range) * 100));

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: styles.bgSecondary,
        borderColor: isGoodDeal ? `${styles.success}40` : isOverpaying ? `${styles.error}40` : styles.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartLine size={18} style={{ color: styles.textMuted }} />
          <h4 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
            {t('buyer.purchases.priceComparison') || 'Price Comparison'}
          </h4>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: `${savingsColor}15`,
            color: savingsColor,
          }}
        >
          {getSavingsLabel(comparison.recommendation)}
        </span>
      </div>

      {/* Current price with trend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('buyer.purchases.currentPrice') || 'Current Price'}
          </p>
          <p className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
            {formatCurrency(currentPrice)}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ backgroundColor: `${trendColor}15` }}
        >
          <TrendIcon trend={comparison.trend} size={14} />
          <span className="text-sm font-medium" style={{ color: trendColor }}>
            {formatVariance(comparison.variance)}
          </span>
        </div>
      </div>

      {/* Price range bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full relative overflow-hidden" style={{ backgroundColor: styles.bgCard }}>
          {/* Range visualization */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: '0',
              right: '0',
              background: `linear-gradient(to right, ${styles.success}, ${styles.warning}, ${styles.error})`,
              opacity: 0.3,
            }}
          />
          {/* Current position marker */}
          <div
            className="absolute w-3 h-3 rounded-full -top-0.5 transform -translate-x-1/2 border-2"
            style={{
              left: `${position}%`,
              backgroundColor: styles.bgCard,
              borderColor: savingsColor,
            }}
          />
        </div>
        {/* Range labels */}
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: styles.textMuted }}>
          <span>{formatCurrency(comparison.historicalMin)}</span>
          <span>
            {t('buyer.purchases.avg') || 'Avg'}: {formatCurrency(comparison.historicalAvg)}
          </span>
          <span>{formatCurrency(comparison.historicalMax)}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: styles.border }}>
        <div className="flex items-center gap-1">
          <ChartLine size={12} style={{ color: styles.textMuted }} />
          <span style={{ color: styles.textMuted }}>
            {comparison.purchaseCount} {t('buyer.purchases.previousPurchases') || 'previous purchases'}
          </span>
        </div>
        {isGoodDeal && (
          <span style={{ color: styles.success }}>
            {t('buyer.purchases.savingMoney') || 'Saving'}{' '}
            {formatCurrency(Math.abs(comparison.historicalAvg - currentPrice))}
          </span>
        )}
        {isOverpaying && (
          <span style={{ color: styles.error }}>
            {t('buyer.purchases.overAvg') || 'Over avg'} {formatCurrency(currentPrice - comparison.historicalAvg)}
          </span>
        )}
      </div>
    </div>
  );
};

export default PriceComparisonCard;
