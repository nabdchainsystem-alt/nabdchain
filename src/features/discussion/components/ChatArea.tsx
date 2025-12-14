import React, { useRef, useEffect, useState } from 'react';
import { Message, Thread, User } from '../types';
import { Send, Paperclip, Loader2, PanelRightOpen, ArrowLeft, Mic, Image as ImageIcon, Bold, Italic, List, AlignLeft, Phone, Video, PanelRightClose } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ChatAreaProps {
  thread: Thread;
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onBack?: () => void;
  users: User[];
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  thread,
  onSendMessage,
  isStreaming,
  onBack,

  users,
  onToggleRightSidebar,
  isRightSidebarOpen
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t, language } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-monday-dark-bg relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-200 dark:border-monday-dark-border flex items-center justify-between bg-white/50 dark:bg-monday-dark-surface/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1 -ms-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
              <ArrowLeft size={20} className="rtl:rotate-180" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg font-medium text-gray-900 dark:text-monday-dark-text leading-none truncate">
              {thread.title}
            </h1>
            <p className="text-xs font-sans text-gray-400 mt-1 flex items-center gap-2">
              <span>{t('discussion.last_active')} {new Date(thread.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Team Members & Actions */}
        <div className="flex items-center gap-4">
          {/* Team Faces */}
          <div className="flex -space-x-2 rtl:space-x-reverse hidden sm:flex">
            {users.map((user) => (
              <div key={user.id} className="relative group cursor-pointer">
                <div className="w-8 h-8 rounded-full border-2 border-gray-50 dark:border-gray-950 bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{user.initials}</span>
                  )}
                </div>
                {/* Status Dot */}
                <span className={`absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />

                {/* Tooltip */}
                <div className="absolute top-full mt-1 start-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-gray-50 text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30">
                  {user.name}
                </div>
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-gray-50 dark:border-gray-950 bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-[10px] text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              +2
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Call">
              <Phone size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Video">
              <Video size={18} />
            </button>
            <button
              onClick={onToggleRightSidebar}
              className={`p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isRightSidebarOpen ? 'text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title={t('discussion.tools.sidebar')}
            >
              {isRightSidebarOpen ? <PanelRightClose size={18} className="rtl:rotate-180" /> : <PanelRightOpen size={18} className="rtl:rotate-180" />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-8">
        {thread.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <div className="w-16 h-16 border-2 border-gray-300 dark:border-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="font-serif text-2xl italic text-gray-400">{language === 'ar' ? 'ج' : 'A'}</span>
            </div>
            <p className="font-serif text-gray-500">{t('discussion.empty_state')}</p>
          </div>
        )}

        {thread.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}
          >
            <div className={`
              max-w-[85%] md:max-w-[75%] 
              ${msg.role === 'user'
                ? 'bg-blue-50 dark:bg-monday-dark-hover border border-blue-100 dark:border-monday-dark-border px-5 py-3 rounded-2xl rounded-tr-sm rtl:rounded-tr-2xl rtl:rounded-tl-sm shadow-sm'
                : 'bg-transparent ps-0 pe-4 py-2'}
            `}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-1.5 opacity-60">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase font-sans">Gemini</span>
                </div>
              )}

              <div className={`
                prose prose-gray dark:prose-invert prose-p:font-serif prose-p:leading-relaxed prose-sm max-w-none
                ${msg.role === 'user' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'}
              `}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('- ') ? 'ms-4' : ''}>{line}</p>
                ))}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse align-middle ms-1" />
                )}
              </div>

              <div className={`
                text-[10px] font-sans text-gray-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity
                ${msg.role === 'user' ? 'text-end' : 'text-start'}
              `}>
                {msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Full Bleed */}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-monday-dark-bg border-t border-gray-200 dark:border-monday-dark-border">
        <div className="w-full relative overflow-hidden">

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
            <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title={t('discussion.tools.bold')}><Bold size={14} /></button>
            <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title={t('discussion.tools.italic')}><Italic size={14} /></button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title={t('discussion.tools.list')}><List size={14} /></button>
            <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"><AlignLeft size={14} /></button>
          </div>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('discussion.start_discussing')}
            className="w-full bg-transparent border-none focus:ring-0 resize-none px-6 py-4 max-h-[150px] font-serif text-gray-800 dark:text-gray-200 placeholder:text-gray-400 placeholder:italic focus:outline-none"
            rows={1}
          />
          <div className="flex justify-between items-center px-5 pb-4 pt-1">
            <div className="flex gap-1">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title={t('discussion.tools.attach')}>
                <Paperclip size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Image">
                <ImageIcon size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title={t('discussion.tools.voice')}>
                <Mic size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-300 font-sans hidden md:block">⌘ + Enter</span>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className="p-2 bg-monday-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rtl:rotate-180" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};