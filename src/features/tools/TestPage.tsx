import React from 'react';
import { Plus, X, Flask } from 'phosphor-react';

interface Tab {
    id: string;
    title: string;
    content: React.ReactNode;
}

export const TestPage: React.FC = () => {
    // Clear localStorage on first load to start fresh
    React.useEffect(() => {
        localStorage.removeItem('test-page-tabs');
        localStorage.removeItem('test-page-active-tab');
    }, []);

    const createBlankTab = (id: string, title: string): Tab => ({
        id,
        title,
        content: (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                    <Flask size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Blank Test Canvas</p>
                </div>
            </div>
        )
    });

    const [tabs, setTabs] = React.useState<Tab[]>([
        createBlankTab('tab-1', 'Test 1')
    ]);

    const [activeTabId, setActiveTabId] = React.useState<string>('tab-1');

    const handleAddTab = () => {
        const newId = `tab-${Date.now()}`;
        const newTab = createBlankTab(newId, `Test ${tabs.length + 1}`);
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) return; // Don't close last tab
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const activeTab = tabs.find(t => t.id === activeTabId);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white dark:bg-[#1a1d24] grid grid-rows-[1fr]">
                <div className="overflow-hidden">
                    <div className="pl-[24px] pr-[20px] pt-4 pb-0">
                        {/* Title Row */}
                        <div className="flex items-center justify-between mb-1 gap-4">
                            <div className="relative">
                                <h1 className="text-[32px] font-bold text-[#323338] dark:text-[#d0d1d6] leading-tight tracking-tight outline-none border border-transparent -ml-1.5 px-1.5 rounded-[4px]">
                                    Test Tools
                                </h1>
                            </div>
                        </div>
                        {/* Description Row */}
                        <div className="mb-4 text-[#676879] dark:text-[#9597a1] text-[14px] min-h-[20px]">
                            Testing playground for new tools and components
                        </div>

                        {/* Tabs Row */}
                        <div className="flex items-center gap-0 w-full border-b border-gray-200 dark:border-gray-800">
                            <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                {tabs.map(tab => (
                                    <div
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={`
                                            group flex items-center justify-start text-left gap-2 py-1.5 border-b-2 text-[13.6px] font-medium transition-colors whitespace-nowrap select-none px-3 cursor-pointer
                                            ${activeTabId === tab.id
                                                ? 'border-indigo-500 text-[#323338] dark:text-gray-100'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        <span>{tab.title}</span>
                                        {tabs.length > 1 && (
                                            <button
                                                onClick={(e) => handleCloseTab(tab.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-gray-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddTab}
                                className="flex-shrink-0 ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                                title="Add Tab"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1d24] p-0">
                {activeTab?.content}
            </div>
        </div>
    );
};
