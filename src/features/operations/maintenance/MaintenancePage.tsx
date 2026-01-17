import React from 'react';
import PlaceholderPage from '../../../components/PlaceholderPage';
import { useAppContext } from '../../../contexts/AppContext';

const MaintenancePage: React.FC = () => {
    const { t } = useAppContext();
    return <PlaceholderPage title={t('maintenance')} />;
};
export default MaintenancePage;
