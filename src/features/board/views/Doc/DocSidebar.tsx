import React, { useState } from 'react';
import {
  CaretRight as ChevronRight,
  CaretDown as ChevronDown,
  FileText,
  Plus as PlusIcon,
  MagnifyingGlass as Search,
  Gear as Settings,
} from 'phosphor-react';
import { NavItem } from './types';

import { INITIAL_NAV_ITEMS } from './constants';

interface SidebarItemProps {
  item: NavItem;
  level?: number;
  activeId?: string;
  onSelect?: (item: NavItem) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, level = 0, activeId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeId === item.id;

  const handleToggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    } else {
      onSelect?.(item);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`
          group flex items-center gap-2 px-3 py-1.5 min-h-[32px]
          text-sm font-medium
          ${
            isActive
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-200'
          }
          cursor-pointer rounded-md transition-colors mx-2
        `}
        style={{ paddingInlineStart: `${level * 12 + 12}px` }}
        onClick={handleToggle}
      >
        <span
          className={`
          ${isActive ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'} 
          transition-colors
          ${!hasChildren && !item.icon ? 'opacity-0' : ''}
        `}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            item.icon || <FileText size={14} />
          )}
        </span>

        <span className="truncate flex-1">{item.label}</span>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col mt-0.5">
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} level={level + 1} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

interface DocSidebarProps {
  activeId?: string;
  onSelect?: (item: NavItem) => void;
}

export const DocSidebar: React.FC<DocSidebarProps> = ({ activeId, onSelect }) => {
  return (
    <div className="font-outfit flex flex-col h-full py-4">
      {/* Workspace Switcher / Profile */}
      <div className="px-4 mb-4 flex items-center justify-between group cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-serif font-normal text-stone-600 dark:text-stone-300">
            M
          </div>
          <span className="font-normal text-sm text-stone-700 dark:text-stone-200">maxxx</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Settings size={14} className="text-stone-400" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 mb-2">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700">
          <Search size={14} />
          <span>Search</span>
          <span className="ms-auto text-xs text-stone-400 font-mono">⌘K</span>
        </button>
      </div>

      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700">
          <PlusIcon size={14} />
          <span>New Page</span>
        </button>
      </div>

      {/* Nav Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider ms-2">Favorites</div>
        {/* Example hardcoded favorites */}
        <div className="mb-4">
          <div className="group flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
            <FileText size={14} className="text-stone-400" />
            <span>Quarterly Goals</span>
          </div>
        </div>

        <div className="px-2 mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider ms-2">Private</div>
        {INITIAL_NAV_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 mt-auto">
        <div className="text-xs text-stone-400 text-center">v1.2.0 &middot; Synced</div>
      </div>
    </div>
  );
};
