// =============================================================================
// PageLayout - Unified Page Structure
// =============================================================================
// Standardized layout for all portal pages with consistent sections:
// 1. Page header with purpose statement
// 2. Decision-focused summary section
// 3. Primary content area
// 4. Secondary actions (collapsible)
// =============================================================================

import React, { useState, ReactNode } from 'react';
import { Spinner, CaretDown, CaretUp, Cube } from 'phosphor-react';
import { Container } from './Container';
import { PageHeader } from './PageHeader';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { usePortal } from '../context/PortalContext';

interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Page subtitle/purpose statement */
  subtitle?: string;
  /** Primary header actions */
  headerActions?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Error retry handler */
  onRetry?: () => void;
  /** Empty state config */
  empty?: {
    show: boolean;
    icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
    title: string;
    description: string;
    action?: ReactNode;
  };
  /** Summary section (decision-focused stats) */
  summary?: ReactNode;
  /** Primary content area */
  children: ReactNode;
  /** Quick actions section */
  quickActions?: ReactNode;
  /** CTA banner config */
  ctaBanner?: {
    title: string;
    description: string;
    action: ReactNode;
    color?: string;
  };
  /** Whether secondary actions are expanded by default */
  secondaryExpanded?: boolean;
  /** Custom loading skeleton */
  loadingSkeleton?: ReactNode;
}

/**
 * PageLayout Component
 *
 * Unified page structure for all portal pages. Provides:
 * - Consistent header with title/subtitle
 * - Loading, error, and empty states
 * - Summary section for key metrics
 * - Primary content area
 * - Collapsible secondary actions
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  headerActions,
  loading = false,
  error,
  onRetry,
  empty,
  summary,
  children,
  quickActions,
  ctaBanner,
  secondaryExpanded = true,
  loadingSkeleton,
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const [showSecondary, setShowSecondary] = useState(secondaryExpanded);

  // Loading state
  if (loading) {
    return (
      <Container variant="full">
        <div
          className="min-h-screen transition-colors"
          style={{ backgroundColor: styles.bgPrimary }}
        >
          <PageHeader title={title} subtitle={subtitle} />
          <Container variant="content">
            {loadingSkeleton || (
              <div className="flex items-center justify-center py-20">
                <Spinner
                  size={32}
                  className="animate-spin"
                  style={{ color: styles.textMuted }}
                />
              </div>
            )}
          </Container>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container variant="full">
        <div
          className="min-h-screen transition-colors"
          style={{ backgroundColor: styles.bgPrimary }}
        >
          <PageHeader title={title} subtitle={subtitle} />
          <Container variant="content">
            <div
              className="rounded-lg p-6 border text-center"
              style={{
                backgroundColor: `${styles.error}10`,
                borderColor: `${styles.error}30`,
              }}
            >
              <p className="font-medium mb-2" style={{ color: styles.error }}>
                {error}
              </p>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  {t('common.retry') || 'Try Again'}
                </Button>
              )}
            </div>
          </Container>
        </div>
      </Container>
    );
  }

  // Empty state
  if (empty?.show) {
    return (
      <Container variant="full">
        <div
          className="min-h-screen transition-colors"
          style={{ backgroundColor: styles.bgPrimary }}
        >
          <PageHeader title={title} subtitle={subtitle} actions={headerActions} />
          <Container variant="content">
            <EmptyState
              icon={empty.icon || Cube}
              title={empty.title}
              description={empty.description}
              action={empty.action}
            />
          </Container>
        </div>
      </Container>
    );
  }

  const hasSecondaryContent = quickActions || ctaBanner;

  return (
    <Container variant="full">
      <div
        className="min-h-screen transition-colors pb-12"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Section 1: Page Header with Purpose Statement */}
        <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

        <Container variant="content">
          {/* Section 2: Decision-Focused Summary */}
          {summary && <div className="mb-8">{summary}</div>}

          {/* Section 3: Primary Content Area */}
          <div className="mb-8">{children}</div>

          {/* Section 4: Secondary Actions (Collapsible) */}
          {hasSecondaryContent && (
            <div className="space-y-6">
              {/* Toggle Button */}
              <button
                onClick={() => setShowSecondary(!showSecondary)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isRtl ? 'flex-row-reverse' : ''
                }`}
                style={{ color: styles.textMuted }}
              >
                {showSecondary ? (
                  <>
                    <CaretUp size={16} />
                    {t('common.hideActions') || 'Hide Actions'}
                  </>
                ) : (
                  <>
                    <CaretDown size={16} />
                    {t('common.showActions') || 'Show Actions'}
                  </>
                )}
              </button>

              {/* Collapsible Content */}
              {showSecondary && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* Quick Actions */}
                  {quickActions && (
                    <div>
                      <h2
                        className={`text-lg font-semibold mb-4 ${isRtl ? 'text-right' : ''}`}
                        style={{
                          color: styles.textPrimary,
                          fontFamily: styles.fontHeading,
                        }}
                      >
                        {t('common.quickActions') || 'Quick Actions'}
                      </h2>
                      {quickActions}
                    </div>
                  )}

                  {/* CTA Banner */}
                  {ctaBanner && (
                    <div
                      className="rounded-xl p-6 border"
                      style={{
                        backgroundColor: `${ctaBanner.color || styles.info}08`,
                        borderColor: `${ctaBanner.color || styles.info}30`,
                      }}
                    >
                      <div
                        className={`flex items-center justify-between gap-4 ${
                          isRtl ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className={isRtl ? 'text-right' : ''}>
                          <h3
                            className="text-lg font-semibold mb-1"
                            style={{
                              color: styles.textPrimary,
                              fontFamily: styles.fontHeading,
                            }}
                          >
                            {ctaBanner.title}
                          </h3>
                          <p className="text-sm" style={{ color: styles.textSecondary }}>
                            {ctaBanner.description}
                          </p>
                        </div>
                        {ctaBanner.action}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Container>
      </div>
    </Container>
  );
};

export default PageLayout;
