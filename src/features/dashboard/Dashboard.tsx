import React, { useState } from 'react';
import { Plus, Search, HelpCircle, X, Sparkles, Layout, Clock, FolderOpen } from 'lucide-react';
import { generateBoardFromPrompt } from '../../services/geminiService';
import { Board } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface DashboardProps {
  onBoardCreated: (board: Board) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBoardCreated }) => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppContext();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateBoardFromPrompt(prompt);
      const newBoard: Board = {
        id: Date.now().toString(),
        ...data
      };
      onBoardCreated(newBoard);
      setIsAiModalOpen(false);
    } catch (err) {
      setError("Failed to generate board. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-monday-dark-bg p-8 overflow-y-auto h-full text-[#323338] dark:text-monday-dark-text">
      {/* Greeting Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-light text-gray-500 dark:text-monday-dark-text-secondary">{t('good_evening')}, <span className="text-gray-800 dark:text-monday-dark-text font-semibold">User!</span></h1>

          {/* Banner */}
          <div className="mt-8 w-full h-40 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-monday-dark-surface dark:via-[#2a2f4a] dark:to-[#353a56] rounded-lg relative overflow-hidden flex items-center px-10">
            <div className="relative z-10">
              <div className="max-w-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-monday-purple" size={20} /> {t('ai_generator')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-4">{t('describe_workflow')}</p>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="bg-monday-blue hover:bg-monday-blue-hover text-white text-sm font-medium px-5 py-2.5 rounded transition-colors"
                >
                  {t('try_it_out')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">

            {/* Recently Visited */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-monday-dark-border pb-2">
                <div className="flex items-center gap-2 text-gray-800 dark:text-monday-dark-text font-semibold text-lg">
                  <Clock size={20} className="text-gray-400" /> {t('recently_visited')}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 justify-between p-6 bg-gray-50 dark:bg-monday-dark-surface rounded-lg">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{t('add_board')}</p>
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-monday-dark-border rounded bg-white dark:bg-monday-dark-bg hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-gray-300 text-sm transition-colors"
                  >
                    <Plus size={16} /> {t('add_board')}
                  </button>
                </div>
              </div>
            </div>

            {/* My Workspaces */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-monday-dark-border pb-2">
                <div className="flex items-center gap-2 text-gray-800 dark:text-monday-dark-text font-semibold text-lg">
                  <FolderOpen size={20} className="text-gray-400" /> {t('my_workspaces')}
                </div>
              </div>

              <div className="group flex items-center gap-4 p-2 hover:bg-gray-50 dark:hover:bg-monday-dark-surface rounded transition-colors cursor-pointer -mx-2">
                <div className="w-12 h-12 rounded bg-gradient-to-tr from-orange-400 to-red-500 text-white flex items-center justify-center text-xl font-bold">M</div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-monday-dark-text group-hover:text-monday-blue transition-colors">Main workspace</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-monday-purple flex items-center justify-center"></span>
                    work management
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8 pt-2">
            {/* Templates */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text mb-3 text-sm uppercase tracking-wider text-gray-400">{t('templates')}</h3>
              <div className="bg-gray-50 dark:bg-monday-dark-surface p-6 rounded-lg text-center">
                <Layout className="mx-auto mb-3 text-monday-purple" size={32} />
                <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text mb-2">Boost your workflow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set up in minutes with ready-made templates.</p>
                <button className="w-full border border-gray-300 dark:border-monday-dark-border rounded py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-monday-dark-hover transition-colors">{t('templates')}</button>
              </div>
            </div>

            {/* Help */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text mb-3 text-sm uppercase tracking-wider text-gray-400">{t('support')}</h3>
              <div className="flex items-center gap-4 p-2 hover:bg-gray-50 dark:hover:bg-monday-dark-surface rounded transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-blue-50 dark:bg-monday-blue/20 rounded flex items-center justify-center text-monday-blue">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-monday-dark-text">{t('help_center')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Learn and get support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-monday-dark-surface rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-monday-dark-border">
            <div className="p-6 border-b border-gray-100 dark:border-monday-dark-border">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-monday-dark-text">
                <Sparkles className="text-monday-purple" /> {t('ai_generator')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Describe what you need to manage, and we'll build it.</p>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A marketing campaign for Q4 with task owners, status, and deadlines'"
                className="w-full h-32 p-3 bg-gray-50 dark:bg-monday-dark-bg border-none rounded focus:ring-1 focus:ring-monday-blue outline-none resize-none text-sm text-gray-700 dark:text-monday-dark-text placeholder-gray-400"
              ></textarea>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-sm font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="px-6 py-2 bg-monday-blue hover:bg-monday-blue-hover text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('generating')}
                    </>
                  ) : (
                    t('create_board')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};