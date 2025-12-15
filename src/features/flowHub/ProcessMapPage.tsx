import React, { useState } from 'react';
import { ProcessMap } from './components/visuals/ProcessMap';
import { Settings, Link, Activity, Factory } from 'lucide-react';
import { ProcessType } from './visualLogic';

export const ProcessMapPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ProcessType>('supply-chain');

    return (
        <div className="h-full w-full relative bg-gray-50 dark:bg-monday-dark-bg overflow-hidden">
            {/* Header / Title Overlay */}
            <div className="absolute top-10 left-12 z-20 flex items-center gap-6 pointer-events-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1 tracking-tight">Live Process Map</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Real-time visualization of your operational flow</p>
                </div>

                {/* Sub-Page Tabs */}
                <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-auto">
                    <button
                        onClick={() => setActiveTab('supply-chain')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'supply-chain'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-black/5'
                            }`}
                    >
                        <Link size={16} />
                        Supply Chain
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'maintenance'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-black/5'
                            }`}
                    >
                        <Settings size={16} />
                        Maintenance
                    </button>
                    <button
                        onClick={() => setActiveTab('production')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'production'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-black/5'
                            }`}
                    >
                        <Factory size={16} />
                        Production
                    </button>
                </div>
            </div>

            {/* The Map */}
            <ProcessMap processType={activeTab} />


        </div>
    );
};

export default ProcessMapPage;
