import React, { useState } from 'react';
import { Upload, Link, MagnifyingGlass as Search, Trash as Trash2 } from 'phosphor-react';

interface CoverPickerProps {
  onSelect: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

const TABS = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'upload', label: 'Upload' },
  { id: 'link', label: 'Link' },
  { id: 'search', label: 'Search images' },
];

const COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#78716C',
  '#64748B',
  '#1F2937',
];

const GRADIENTS = [
  'linear-gradient(to right, #ff7e5f, #feb47b)',
  'linear-gradient(to right, #6a11cb, #2575fc)',
  'linear-gradient(to right, #00c6ff, #0072ff)',
  'linear-gradient(to right, #f2994a, #f2c94c)',
  'linear-gradient(to right, #00f260, #0575e6)',
  'linear-gradient(to right, #e1eec3, #f05053)',
  'linear-gradient(to right, #8360c3, #2ebf91)',
  'linear-gradient(to right, #f12711, #f5af19)',
];

export const CoverPicker: React.FC<CoverPickerProps> = ({ onSelect, onRemove, _onClose }) => {
  const [activeTab, setActiveTab] = useState('gallery');

  return (
    <div className="absolute right-0 top-full mt-2 w-[480px] bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden z-[50] flex flex-col h-[400px] animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-stone-800 text-stone-900 dark:border-stone-100 dark:text-stone-100'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onRemove}
          className="mr-2 text-xs font-medium text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase mb-3">Colors</div>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onSelect(color)}
                    className="w-full aspect-square rounded-md hover:scale-110 transition-transform ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase mb-3">Gradients</div>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENTS.map((grad) => (
                  <button
                    key={grad}
                    onClick={() => onSelect(grad)}
                    className="w-full h-12 rounded-md hover:scale-105 transition-transform ring-1 ring-black/5 dark:ring-white/10"
                    style={{ background: grad }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {['upload', 'link', 'search'].includes(activeTab) && (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              {activeTab === 'upload' && <Upload size={20} />}
              {activeTab === 'link' && <Link size={20} />}
              {activeTab === 'search' && <Search size={20} />}
            </div>
            <p className="text-sm">This feature is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};
