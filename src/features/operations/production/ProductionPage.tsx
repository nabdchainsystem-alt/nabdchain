import React from 'react';
import PlaceholderPage from '../../../components/PlaceholderPage';
import { useAppContext } from '../../../contexts/AppContext';

const ProductionPage: React.FC = () => {
    const { t } = useAppContext();
    return <PlaceholderPage title={t('production')} />;
};
export default ProductionPage;
