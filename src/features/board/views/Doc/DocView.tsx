import React, { useState, useEffect } from 'react';
import { Plus as PlusIcon } from 'phosphor-react';

import { DocEditor } from './DocEditor';
import { Theme, NavItem } from './types';
import { INITIAL_NAV_ITEMS } from './constants';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface DocViewProps {
  roomId: string;
}

export const DocView: React.FC<DocViewProps> = ({ roomId }) => {
  const { t, dir } = useLanguage();
  const [theme, setTheme] = useState<Theme>('light');
  const [activeItemId, _setActiveItemId] = useState<string>('1'); // Default to Inbox ('1')

  // Initialize theme based on system preference or default
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Apply theme class to document
  // NOTE: This might interfere with global theme, but keeping as per request to copy behavior
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Helper to find item by ID recursively
  const findItemById = (items: NavItem[], id: string): NavItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeItem = findItemById(INITIAL_NAV_ITEMS, activeItemId);
  const activePageTitle = activeItem ? activeItem.label : 'Untitled';

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300"
      dir={dir}
    >
      {/* Sidebar Removed as per request */}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative bg-white dark:bg-stone-900 transition-colors duration-300">
        {/* Document Canvas */}
        <main className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden scrollbar-none">
          {/* Add Page Button (Corner) */}
          <div className="absolute top-4 start-4 z-20">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:shadow-md text-stone-600 dark:text-stone-300 text-sm font-medium transition-all group">
              <PlusIcon
                size={16}
                className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200"
              />
              {t('doc_add_page')}
            </button>
          </div>

          <DocEditor
            key={`${roomId}-${activeItemId}`}
            storageKey={`doc-data-${roomId}-${activeItemId}`}
            defaultTitle={activePageTitle}
          />
        </main>
      </div>
    </div>
  );
};
