import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-4 py-2 shrink-0 z-50">
            <div className="flex items-center gap-4">
                {/* Simplified B&W branding: Black icon instead of blue */}
                <div className="size-8 flex items-center justify-center text-gray-900">
                    <span className="material-symbols-outlined text-[32px]">table_chart</span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-gray-900 text-lg font-bold leading-tight">Untitled Spreadsheet</h1>
                        <span className="material-symbols-outlined text-gray-400 text-lg cursor-pointer hover:text-gray-900 transition-colors">star</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg cursor-pointer hover:text-gray-900 transition-colors">drive_file_move</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg cursor-pointer hover:text-gray-900 transition-colors">cloud_done</span>
                    </div>
                    {/* Menu Bar */}
                    <div className="flex gap-1 mt-1">
                        {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map((item) => (
                            <button key={item} className="px-2 py-0.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">history</span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">comment</span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">videocam</span>
                </button>
                {/* Black share button for branding */}
                <button className="flex items-center justify-center rounded-full h-9 px-6 bg-gray-900 text-white text-sm font-bold gap-2 hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Share</span>
                </button>
                {/* Placeholder Avatar */}
                <div
                    className="bg-center bg-no-repeat bg-cover rounded-full size-9 border border-gray-200"
                    style={{ backgroundImage: 'url("https://picsum.photos/64/64")' }}
                />
            </div>
        </header>
    );
};
