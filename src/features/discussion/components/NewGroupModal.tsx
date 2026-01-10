import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Board } from '../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { X, Check, Layout, Database, Folder, ArrowRight, LayoutTemplate, Palette, Globe, Lock, Sparkles, ChevronRight, Hash, Users, AlignLeft, Monitor } from 'lucide-react';
import { BoardTemplate } from '../../board/data/templates';
import { TemplatePicker } from '../../board/components/TemplatePicker';
import { AnimatePresence, motion } from 'framer-motion';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: Partial<Board>, template?: BoardTemplate) => void;
  availableUsers: User[];
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose, onCreate, availableUsers }) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedTheme, setSelectedTheme] = useState('stone');
  const [isPrivate, setIsPrivate] = useState(false);

  // Configuration State
  const [viewMode, setViewMode] = useState<'main' | 'templates' | 'layouts'>('main');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(undefined);
  const [selectedLayout, setSelectedLayout] = useState<'table' | 'data_table' | 'kanban' | 'list'>('table');

  const themes = ['stone', 'red', 'blue', 'green', 'orange', 'purple', 'rose'];

  const layouts = [
    { id: 'table', label: 'Classic Table', icon: Layout, description: 'Spreadsheet-like flexibility' },
    { id: 'kanban', label: 'Kanban Board', icon: Folder, description: 'Visualize workflow stages' },
    { id: 'list', label: 'Simple List', icon: AlignLeft, description: 'Minimal task tracking' },
    { id: 'data_table', label: 'Data Grid', icon: Database, description: 'High-density data view' },
  ];

  useEffect(() => {
    if (isOpen) {
      setViewMode('main');
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state on close with a slight delay to allow exit animation
      setTimeout(() => {
        setName('');
        setDescription('');
        setSelectedMembers(new Set());
        setSelectedTemplate(undefined);
        setSelectedLayout('table');
        setIsPrivate(false);
      }, 300);
    }
  }, [isOpen]);

  const toggleMember = (userId: string) => {
    const next = new Set(selectedMembers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedMembers(next);
  };

  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name,
      description,
      members: Array.from(selectedMembers),
      theme: selectedTheme,
      defaultView: selectedLayout,
      type: 'discussion' // explicit type
    }, selectedTemplate);
    onClose();
  };

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    if (!name) setName(template.name);
    setViewMode('main');
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={`
              relative w-full max-w-2xl bg-white dark:bg-zinc-900 
              rounded-3xl shadow-2xl shadow-zinc-900/20 
              border border-zinc-200 dark:border-zinc-800 
              overflow-hidden flex flex-col max-h-[90vh]
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                  {viewMode === 'templates' ? 'Choose a Template' :
                    viewMode === 'layouts' ? 'Select Layout' :
                      'Create New Space'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {viewMode === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 space-y-8"
                  >
                    {/* Name & Description */}
                    <div className="space-y-4">
                      <div className="group relative">
                        <div className="absolute left-4 top-3.5 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                          <Hash size={20} strokeWidth={2.5} />
                        </div>
                        <input
                          ref={inputRef}
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Name your space..."
                          className="w-full pl-12 pr-4 py-3 text-lg font-medium bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="group relative">
                        <div className="absolute left-4 top-3.5 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                          <AlignLeft size={20} strokeWidth={2.5} />
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description (optional)..."
                          rows={2}
                          className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400 resize-none"
                        />
                      </div>
                    </div>

                    {/* Quick Config Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Template Selector */}
                      <button
                        onClick={() => setViewMode('templates')}
                        className={`
                          group relative overflow-hidden text-left p-4 rounded-2xl border transition-all duration-300
                          ${selectedTemplate
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
                            : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}
                        `}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`
                            p-2 rounded-lg 
                            ${selectedTemplate ? 'bg-blue-500 text-white' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}
                          `}>
                            <LayoutTemplate size={18} />
                          </div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">Template</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                          {selectedTemplate ? selectedTemplate.name : "Start from scratch or choose a template"}
                        </p>
                        {selectedTemplate && (
                          <div className="absolute top-4 right-4 text-blue-500">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </button>

                      {/* Layout Selector */}
                      <button
                        onClick={() => setViewMode('layouts')}
                        className={`
                          group relative overflow-hidden text-left p-4 rounded-2xl border transition-all duration-300
                          ${selectedLayout !== 'table'
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50'
                            : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}
                        `}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`
                            p-2 rounded-lg 
                            ${selectedLayout !== 'table' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}
                          `}>
                            <Monitor size={18} />
                          </div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">Layout</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                          {layouts.find(l => l.id === selectedLayout)?.label}
                        </p>
                      </button>
                    </div>

                    {/* Team Members */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <Users size={14} /> Team Members
                        </label>
                        <span className="text-xs text-zinc-400">{selectedMembers.size} selected</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableUsers.map(user => {
                          const isSelected = selectedMembers.has(user.id);
                          return (
                            <button
                              key={user.id}
                              onClick={() => toggleMember(user.id)}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
                                ${isSelected
                                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg shadow-zinc-200 dark:shadow-none transform scale-105'
                                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700'}
                              `}
                            >
                              <div className={`
                                w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
                                ${isSelected ? 'bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700'}
                              `}>
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0)}
                              </div>
                              {user.name}
                            </button>
                          );
                        })}
                        <button className="px-3 py-1.5 rounded-full text-sm border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 transition-colors">
                          + Invite
                        </button>
                      </div>
                    </div>

                    {/* Footer Options */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        {/* Theme Circles */}
                        <div className="flex -space-x-1.5 hover:space-x-1 transition-all">
                          {themes.map(t => (
                            <button
                              key={t}
                              onClick={() => setSelectedTheme(t)}
                              className={`
                                w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 transition-transform hover:scale-110 hover:z-10
                                ${selectedTheme === t ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-110 z-10' : ''}
                              `}
                              style={{ backgroundColor: t === 'stone' ? '#71717a' : t }}
                            />
                          ))}
                        </div>

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"></div>

                        {/* Privacy Toggle */}
                        <button
                          onClick={() => setIsPrivate(!isPrivate)}
                          className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        >
                          {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                          {isPrivate ? 'Private' : 'Public'}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreate}
                          disabled={!name.trim()}
                          className="
                            group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 
                            font-semibold shadow-lg shadow-zinc-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] 
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none 
                            transition-all duration-200
                          "
                        >
                          Create Space
                          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {viewMode === 'templates' && (
                  <motion.div
                    key="templates"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <TemplatePicker
                        onSelect={handleTemplateSelect}
                        selectedTemplateId={selectedTemplate?.id}
                      />
                    </div>
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                      <button
                        onClick={() => setViewMode('main')}
                        className="w-full py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}

                {viewMode === 'layouts' && (
                  <motion.div
                    key="layouts"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {layouts.map(layout => (
                        <button
                          key={layout.id}
                          onClick={() => {
                            setSelectedLayout(layout.id as any);
                            setViewMode('main');
                          }}
                          className={`
                            flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
                            ${selectedLayout === layout.id
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                              : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'}
                          `}
                        >
                          <div className={`
                            p-3 rounded-xl 
                            ${selectedLayout === layout.id ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}
                          `}>
                            <layout.icon size={24} />
                          </div>
                          <div>
                            <h3 className={`font-bold ${selectedLayout === layout.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                              {layout.label}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {layout.description}
                            </p>
                          </div>
                          {selectedLayout === layout.id && (
                            <div className="ms-auto text-blue-500">
                              <Check size={20} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-8">
                      <button
                        onClick={() => setViewMode('main')}
                        className="w-full py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
