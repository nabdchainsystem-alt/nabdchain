import React, { useState } from 'react';
import { ArrowRight, Lightning as Zap } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface GTDCaptureProps {
  onCapture: (text: string) => void;
}

export const GTDCapture: React.FC<GTDCaptureProps> = ({ onCapture }) => {
  const { t, language } = useAppContext();
  const isRTL = language === 'ar';
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onCapture(text);
      setText('');
    }
  };

  return (
    <div className="w-full mb-10">
      <h2
        className={`text-sm font-bold text-gray-500 mb-3 uppercase ${isRTL ? '' : 'tracking-wider'} flex items-center gap-2`}
      >
        <Zap size={16} className="text-yellow-500" /> {t('quick_capture')}
      </h2>
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('whats_on_your_mind')}
          className="w-full h-16 pl-6 pr-32 bg-white dark:bg-monday-dark-elevated rounded-2xl shadow-lg border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg placeholder-gray-400 text-gray-800 dark:text-gray-100 outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="absolute right-3 top-3 bottom-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
        >
          {t('add')} <ArrowRight size={16} />
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-2 ltr:ml-2 rtl:mr-2">{t('press_enter_to_save')}</p>
    </div>
  );
};
