import React from 'react';
import { ProcessMap } from './components/visuals/ProcessMap';

export const ProcessMapPage: React.FC = () => {
    return (
        <div className="h-full w-full relative bg-gray-50 dark:bg-monday-dark-bg overflow-hidden">
            {/* Header / Title Overlay */}
            <div className="absolute top-10 left-12 z-20 pointer-events-none">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2 tracking-tight">Living Process Map</h1>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Real-time visualization of your operational flow</p>
            </div>

            {/* The Map */}
            <ProcessMap />


        </div>
    );
};

export default ProcessMapPage;
