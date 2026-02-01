import React, { useState } from 'react';
import { FileText, Clock, CheckCircle } from 'phosphor-react';
import { Container, PageHeader, DataTable, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface RFQsInboxProps {
  onNavigate: (page: string) => void;
}

interface IncomingRFQ {
  id: string;
  rfqNumber: string;
  buyer: string;
  partNumber: string;
  quantity: number;
  status: 'new' | 'quoted' | 'won' | 'lost';
  deadline: string;
  receivedAt: string;
}

export const RFQsInbox: React.FC<RFQsInboxProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'new' | 'quoted'>('all');
  const rfqs: IncomingRFQ[] = []; // Empty for structure
  const { styles, t } = usePortal();

  const columns = [
    { key: 'rfqNumber', header: t('seller.rfqs.rfqNumber'), width: '12%' },
    { key: 'buyer', header: t('seller.rfqs.buyer'), width: '18%' },
    { key: 'partNumber', header: t('seller.rfqs.partNumber'), width: '15%' },
    { key: 'quantity', header: t('seller.rfqs.qty'), width: '8%' },
    {
      key: 'status',
      header: t('seller.rfqs.status'),
      width: '12%',
      render: (item: IncomingRFQ) => <RFQStatusBadge status={item.status} />,
    },
    { key: 'deadline', header: t('seller.rfqs.deadline'), width: '12%' },
    { key: 'receivedAt', header: t('seller.rfqs.received'), width: '12%' },
    {
      key: 'actions',
      header: '',
      width: '11%',
      render: (item: IncomingRFQ) => <RFQActions status={item.status} />,
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('seller.rfqs.title')}
          subtitle={t('seller.rfqs.subtitle')}
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <FilterTab
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={t('seller.rfqs.allRfqs')}
            count={0}
          />
          <FilterTab
            active={filter === 'new'}
            onClick={() => setFilter('new')}
            label={t('seller.rfqs.new')}
            count={0}
            icon={Clock}
          />
          <FilterTab
            active={filter === 'quoted'}
            onClick={() => setFilter('quoted')}
            label={t('seller.rfqs.quoted')}
            count={0}
            icon={CheckCircle}
          />
        </div>

        {rfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('seller.rfqs.noRfqs')}
            description={t('seller.rfqs.noRfqsDesc')}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rfqs}
            emptyMessage="No RFQs found"
          />
        )}
      </Container>
    </div>
  );
};

const RFQActions: React.FC<{ status: IncomingRFQ['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  return (
    <div className="flex items-center gap-2">
      {status === 'new' && (
        <button
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          {t('common.quote')}
        </button>
      )}
      {status === 'quoted' && (
        <button
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{ color: styles.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {t('common.view')}
        </button>
      )}
    </div>
  );
};

const FilterTab: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
}> = ({ active, onClick, label, count, icon: Icon }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? (styles.isDark ? '#E6E8EB' : '#0F1115') : styles.bgCard,
        color: active ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textSecondary,
        border: active ? 'none' : `1px solid ${styles.border}`,
      }}
    >
      {Icon && <Icon size={14} style={{ color: active ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textMuted }} />}
      {label}
      {count > 0 && (
        <span
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            backgroundColor: active ? 'rgba(255,255,255,0.2)' : styles.bgSecondary,
            color: active ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textMuted,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

const RFQStatusBadge: React.FC<{ status: IncomingRFQ['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  const badgeStyles = {
    new: { bg: styles.isDark ? '#1E3A5F' : '#E3F2FD', text: styles.info },
    quoted: { bg: styles.bgSecondary, text: styles.textSecondary },
    won: { bg: styles.isDark ? '#1B3D2F' : '#E8F5E9', text: styles.success },
    lost: { bg: styles.bgSecondary, text: styles.textMuted },
  };

  const labels = {
    new: t('seller.rfqs.new'),
    quoted: t('seller.rfqs.quoted'),
    won: t('seller.rfqs.won'),
    lost: t('seller.rfqs.lost'),
  };

  return (
    <span
      className="inline-flex px-2.5 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: badgeStyles[status].bg, color: badgeStyles[status].text }}
    >
      {labels[status]}
    </span>
  );
};

export default RFQsInbox;
