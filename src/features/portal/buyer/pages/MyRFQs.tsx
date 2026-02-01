import React from 'react';
import { Plus, FileText } from 'phosphor-react';
import { Container, PageHeader, Button, DataTable, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface MyRFQsProps {
  onNavigate: (page: string) => void;
}

interface RFQ {
  id: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  status: 'pending' | 'quoted' | 'accepted' | 'expired';
  createdAt: string;
  quotesReceived: number;
}

export const MyRFQs: React.FC<MyRFQsProps> = ({ onNavigate }) => {
  const rfqs: RFQ[] = []; // Empty for structure
  const { styles, t } = usePortal();

  const columns = [
    { key: 'partNumber', header: t('buyer.myRfqs.partNumber'), width: '20%' },
    { key: 'manufacturer', header: t('buyer.myRfqs.manufacturer'), width: '15%' },
    { key: 'quantity', header: t('buyer.myRfqs.qty'), width: '10%' },
    {
      key: 'status',
      header: t('buyer.myRfqs.status'),
      width: '15%',
      render: (item: RFQ) => <StatusBadge status={item.status} />,
    },
    { key: 'quotesReceived', header: t('buyer.myRfqs.quotes'), width: '10%' },
    { key: 'createdAt', header: t('buyer.myRfqs.created'), width: '15%' },
    {
      key: 'actions',
      header: '',
      width: '15%',
      render: () => <ActionButton label={t('buyer.myRfqs.viewDetails')} />,
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.myRfqs.title')}
          subtitle={t('buyer.myRfqs.subtitle')}
          actions={
            <Button onClick={() => onNavigate('rfq')}>
              <Plus size={16} className="mr-2" />
              {t('buyer.myRfqs.newRfq')}
            </Button>
          }
        />

        {rfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('buyer.myRfqs.noRfqs')}
            description={t('buyer.myRfqs.noRfqsDesc')}
            action={
              <Button onClick={() => onNavigate('rfq')}>
                {t('buyer.myRfqs.createRfq')}
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={rfqs}
            emptyMessage="No RFQs found"
            onRowClick={() => {}}
          />
        )}
      </Container>
    </div>
  );
};

const ActionButton: React.FC<{ label: string }> = ({ label }) => {
  const { styles } = usePortal();

  return (
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
      {label}
    </button>
  );
};

const StatusBadge: React.FC<{ status: RFQ['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  const badgeStyles = {
    pending: { bg: styles.bgSecondary, text: styles.textSecondary },
    quoted: { bg: styles.isDark ? '#1B3D2F' : '#E8F5E9', text: styles.success },
    accepted: { bg: styles.isDark ? '#E6E8EB' : '#0F1115', text: styles.isDark ? '#0F1115' : '#E6E8EB' },
    expired: { bg: styles.bgSecondary, text: styles.textMuted },
  };

  const labels = {
    pending: t('buyer.myRfqs.pending'),
    quoted: t('buyer.myRfqs.quoted'),
    accepted: t('buyer.myRfqs.accepted'),
    expired: t('buyer.myRfqs.expired'),
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

export default MyRFQs;
