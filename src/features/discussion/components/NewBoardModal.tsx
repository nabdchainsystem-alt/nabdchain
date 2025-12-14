import React, { useState, useEffect, useRef } from 'react';
import { User, Board } from '../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { X, Check, Folder, Lock, Globe, Palette, ArrowLeft, Layout, Database } from 'lucide-react';
import { TemplatePicker } from '../../board/components/TemplatePicker';
import { BoardTemplate } from '../../board/data/templates';

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (board: Partial<Board>, template?: BoardTemplate) => void;
  availableUsers: User[];
}

export const NewBoardModal: React.FC<NewBoardModalProps> = ({ isOpen, onClose, onCreate, availableUsers }) => {
  const [step, setStep] = useState<'template' | 'details' | 'tool'>('details');
  const [selectedTool, setSelectedTool] = useState<'table' | 'data_table' | 'kanban' | 'list' | 'list_board'>('table');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(undefined);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedTheme, setSelectedTheme] = useState('stone');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();
  const themes = ['stone', 'red', 'blue', 'green', 'orange'];

  const tools = [
    { id: 'table', label: 'Table', icon: Layout, description: 'Classic spreadsheet-like view' },
    { id: 'data_table', label: 'Data Table', icon: Database, description: 'High performance data grid' },
    { id: 'kanban', label: 'Kanban', icon: Folder, description: 'Visual workflow board' }, // TODO: Better icon
    { id: 'list', label: 'List', icon: Check, description: 'Simple task list' },
    { id: 'list_board', label: 'List Board', icon: Globe, description: 'List with board capabilities' },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setSelectedTemplate(undefined);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setName('');
      setDescription('');
      setSelectedMembers(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'details' && isVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, isVisible]);

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
      defaultView: selectedTool // We'll need to update the interface but passing it for now
    }, selectedTemplate);
    onClose();
  };

  const handleTemplateSelect = (template: BoardTemplate) => {
    console.log('handleTemplateSelect called with:', template);
    setSelectedTemplate(template);
    // Auto-fill name if empty
    if (!name) setName(template.name);
    setStep('details');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`
        relative w-full ${step === 'template' ? 'max-w-4xl h-[80vh]' : 'max-w-md'} bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col 
        transition-all duration-400 ease-out transform
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[20px] scale-95'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'details' && (
              <button
                onClick={() => setStep('template')}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {step === 'tool' && (
              <button
                onClick={() => setStep('details')}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-stone-100">
                {step === 'template' ? 'Start from a template' : step === 'tool' ? 'Choose Layout' : t('discussion.new_board_modal.title')}
              </h2>
              {step === 'tool' && (
                <p className="text-xs text-stone-500">Select how you want to visualize your work</p>
              )}
              {step === 'template' && (
                <p className="text-xs text-stone-500">Choose a workflow to get started quickly</p>
              )}
            </div>
          </div>

          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {step === 'template' ? (
          <div className="flex-1 overflow-hidden bg-stone-50/50 dark:bg-stone-950/50 p-4">
            <TemplatePicker onSelect={handleTemplateSelect} selectedTemplateId={selectedTemplate?.id} />
          </div>
        ) : step === 'tool' ? (
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as any)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${selectedTool === tool.id
                      ? 'border-monday-blue bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'}
                  `}
                >
                  <div className={`
                    p-3 rounded-lg 
                    ${selectedTool === tool.id ? 'bg-monday-blue text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}
                  `}>
                    <tool.icon size={24} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${selectedTool === tool.id ? 'text-monday-blue' : 'text-stone-800 dark:text-stone-200'}`}>
                      {tool.label}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                  {selectedTool === tool.id && (
                    <div className="ms-auto text-monday-blue">
                      <Check size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">

            {/* Selected Template Badge */}
            {selectedTemplate && (
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
                <Layout size={14} className="text-purple-500" />
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Using template: <span className="text-stone-900 dark:text-stone-100 font-bold">{selectedTemplate.name}</span>
                </span>
                <button onClick={() => setStep('template')} className="ms-auto text-[10px] text-stone-400 underline hover:text-stone-600">Change</button>
              </div>
            )}

            {/* Main Inputs */}
            <div className="space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('discussion.new_board_modal.name_placeholder')}
                  className="w-full text-lg font-medium border-b border-stone-200 dark:border-stone-700 bg-transparent py-2 focus:outline-none focus:border-stone-500 placeholder:text-stone-300 dark:placeholder:text-stone-600 transition-colors"
                />
              </div>
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('discussion.new_board_modal.desc_placeholder')}
                  rows={2}
                  className="w-full text-sm resize-none bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400 dark:text-stone-300"
                />
              </div>
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                {t('discussion.new_board_modal.team')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableUsers.map(user => {
                  const isSelected = selectedMembers.has(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                        ${isSelected
                          ? 'bg-stone-800 dark:bg-stone-200 text-stone-50 dark:text-stone-900 border-stone-800 dark:border-stone-200'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'}
                      `}
                    >
                      <div className="w-4 h-4 rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center overflow-hidden text-[8px]">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.initials}
                      </div>
                      {user.name}
                      {isSelected && <Check size={10} />}
                    </button>
                  );
                })}
                <button className="px-3 py-1.5 rounded-full text-xs border border-dashed border-stone-300 dark:border-stone-700 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors">
                  + Invite
                </button>
              </div>
            </div>

            {/* Options (Theme) */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                {t('discussion.new_board_modal.options')}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {themes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTheme(t)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${selectedTheme === t ? 'border-stone-800 dark:border-stone-200 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: t === 'stone' ? '#78716c' : t }}
                    />
                  ))}
                </div>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800"></div>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 transition-colors" title="Private">
                    <Lock size={16} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 transition-colors" title="Public">
                    <Globe size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        {step === 'details' && (
          <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              {t('discussion.new_board_modal.cancel')}
            </button>
            <button
              onClick={() => setStep('tool')}
              disabled={!name.trim()}
              className="px-5 py-2 text-sm font-bold bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next: Select Layout
            </button>
          </div>
        )}

        {step === 'tool' && (
          <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              {t('discussion.new_board_modal.cancel')}
            </button>
            <button
              onClick={handleCreate}
              className="px-5 py-2 text-sm font-bold bg-monday-blue text-white rounded-lg shadow-md hover:bg-blue-600 transition-all"
            >
              Create Board
            </button>
          </div>
        )}
      </div>
    </div >
  );
};
