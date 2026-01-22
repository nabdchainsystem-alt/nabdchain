import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="flex items-center justify-between px-2 bg-white border-t border-gray-200 shrink-0 h-10 select-none">
            <div className="flex items-center h-full">
                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 mr-2">
                    <span className="material-symbols-outlined text-[20px]">menu</span>
                </button>

                <div className="flex items-end h-full">
                    {/* Active Sheet Tab - Black/White branding */}
                    <div className="flex items-center px-4 h-9 bg-white text-black font-bold text-sm border-b-2 border-black hover:bg-gray-50 cursor-pointer">
                        Sheet1
                        <span className="material-symbols-outlined text-[16px] ml-1">arrow_drop_down</span>
                    </div>
                    {/* Inactive Sheet Tab */}
                    <div className="flex items-center px-4 h-9 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer border-b-2 border-transparent">
                        Sheet2
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Status Item */}
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 px-3 py-1 bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded cursor-pointer transition-all">
                    Sum: $2,599.38
                </div>

                <div className="h-4 w-[1px] bg-gray-300"></div>

                {/* Explore Button - B&W Style */}
                <button className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors group">
                    <span className="material-symbols-outlined text-[18px] text-gray-500 group-hover:text-black transition-colors">colors_spark</span>
                    Explore
                </button>
            </div>
        </footer>
    );
};
