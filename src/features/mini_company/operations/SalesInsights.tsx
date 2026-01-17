import React from 'react';
import { ChartLineUp, Sparkle } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

// Blank placeholder - will be designed as general sales overview
const SalesInsights: React.FC = () => {
    const { t } = useAppContext();
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#1a1d24] p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex items-start gap-3 mb-8">
                    <ChartLineUp size={28} className="text-indigo-500 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sales_overview')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('general_sales_insights')}</p>
                    </div>
                </div>

                {/* Placeholder Content */}
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center mb-6">
                        <Sparkle size={40} className="text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {t('overview_coming_soon')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        {t('overview_coming_soon_desc')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SalesInsights;
