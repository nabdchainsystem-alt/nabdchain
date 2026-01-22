import React from 'react';

const Divider = () => <div className="w-[1px] h-5 bg-gray-300 mx-1"></div>;

const IconButton = ({ icon, active = false }: { icon: string; active?: boolean }) => (
    <button
        className={`p-1 rounded transition-colors ${active ? 'bg-gray-200 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
    >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
);

export const Toolbar: React.FC = () => {
    return (
        <div className="flex flex-col shrink-0 bg-[#f9fafb] border-b border-gray-200">
            <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto no-scrollbar">
                <div className="flex gap-0.5 items-center pr-2 border-r border-gray-300">
                    <IconButton icon="undo" />
                    <IconButton icon="redo" />
                    <IconButton icon="print" />
                    <IconButton icon="format_paint" />
                </div>

                <div className="flex gap-0.5 items-center px-2 border-r border-gray-300">
                    <button className="flex items-center gap-1 p-1 px-2 text-gray-700 hover:bg-gray-100 rounded text-sm font-medium">
                        100% <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                    </button>
                </div>

                <div className="flex gap-0.5 items-center px-2 border-r border-gray-300">
                    <IconButton icon="attach_money" />
                    <IconButton icon="percent" />
                    <IconButton icon="decimal_decrease" />
                    <IconButton icon="decimal_increase" />
                </div>

                <div className="flex gap-0.5 items-center px-2 border-r border-gray-300">
                    <button className="flex items-center gap-6 p-1 px-2 text-gray-700 hover:bg-gray-100 rounded text-sm font-medium w-32 justify-between">
                        Inter <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                    </button>
                    <Divider />
                    <IconButton icon="remove" />
                    <input
                        className="w-8 text-center text-sm bg-transparent border-none p-0 focus:ring-0 text-gray-900"
                        type="text"
                        defaultValue="10"
                    />
                    <IconButton icon="add" />
                </div>

                <div className="flex gap-0.5 items-center px-2 border-r border-gray-300">
                    <IconButton icon="format_bold" active />
                    <IconButton icon="format_italic" />
                    <IconButton icon="format_strikethrough" />

                    <button className="p-1 text-gray-700 hover:bg-gray-100 rounded flex flex-col items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-[18px]">format_color_text</span>
                        <div className="w-4 h-1 bg-black"></div>
                    </button>

                    <button className="p-1 text-gray-700 hover:bg-gray-100 rounded flex flex-col items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-[18px]">format_color_fill</span>
                        <div className="w-4 h-1 bg-white border border-gray-300"></div>
                    </button>
                </div>

                <div className="flex gap-0.5 items-center px-2">
                    <IconButton icon="border_all" />
                    <IconButton icon="merge_type" />
                    <IconButton icon="format_align_left" />
                    <IconButton icon="vertical_align_center" />
                    <IconButton icon="wrap_text" />
                    <IconButton icon="filter_alt" />
                    <IconButton icon="functions" />
                </div>
            </div>
        </div>
    );
};
