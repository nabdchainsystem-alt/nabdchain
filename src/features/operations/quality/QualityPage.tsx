import React from 'react';
import PlaceholderPage from '../../../components/PlaceholderPage';
import { useAppContext } from '../../../contexts/AppContext';

const QualityPage: React.FC = () => {
    const { t } = useAppContext();
    return <PlaceholderPage title={t('quality')} />;
};
export default QualityPage;
