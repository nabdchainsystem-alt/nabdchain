import React from 'react';
import {
  Plus,
  MagnifyingGlass as Search,
  GridFour as LayoutGrid,
  List,
  Rocket,
  Lightning as Zap,
  ArrowRight,
  PaperPlaneTilt as Send,
  Clock,
  CheckCircle as CheckCircle2,
  Envelope as Mail,
  PauseCircle,
  Warning as AlertTriangle,
  FileText,
  Database,
} from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

const AutomationRulesView: React.FC<{ boardId: string }> = ({ _boardId }) => {
  const { t } = useAppContext();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');

  return (
    <div className="text-gray-900 dark:text-monday-dark-text font-sans h-full flex flex-col antialiased bg-gray-50 dark:bg-monday-dark-bg overflow-auto">
      <div className="relative z-10 flex flex-col w-full px-4 py-6 md:px-8 flex-grow">
        <header className="flex flex-col gap-8 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-monday-dark-text">
                {t('automation_rules')}
              </h1>
              <p className="text-gray-500 dark:text-monday-dark-text-secondary text-lg font-normal">
                {t('manage_workflow')}
              </p>
            </div>
            <button className="group flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-indigo-300 dark:hover:shadow-indigo-800/40 hover:-translate-y-0.5 active:translate-y-0">
              <Plus size={20} />
              <span>{t('create_new_rule')}</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border p-1.5 rounded-xl shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                className="block w-full ps-10 pe-4 py-2.5 bg-transparent border-none text-gray-900 dark:text-monday-dark-text placeholder-gray-400 dark:placeholder-monday-dark-text-muted focus:outline-none focus:ring-0 sm:text-sm font-medium"
                placeholder={t('search_rules')}
                type="text"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 px-2 lg:px-0 no-scrollbar">
              <div className="h-6 w-[1px] bg-gray-200 dark:bg-monday-dark-border mx-2 hidden lg:block"></div>
              <button className="whitespace-nowrap px-4 py-2 rounded-lg bg-gray-100 dark:bg-monday-dark-hover text-gray-900 dark:text-monday-dark-text text-sm font-semibold hover:bg-gray-200 dark:hover:bg-monday-dark-active transition-colors">
                {t('all_rules')}
              </button>
              <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 dark:text-monday-dark-text-secondary hover:text-gray-900 dark:hover:text-monday-dark-text hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-sm font-medium transition-colors flex items-center gap-2">
                {t('active')}{' '}
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold border border-indigo-100 dark:border-indigo-800">
                  8
                </span>
              </button>
              <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 dark:text-monday-dark-text-secondary hover:text-gray-900 dark:hover:text-monday-dark-text hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-sm font-medium transition-colors">
                {t('paused')}
              </button>
              <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 dark:text-monday-dark-text-secondary hover:text-gray-900 dark:hover:text-monday-dark-text hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-sm font-medium transition-colors">
                {t('draft')}
              </button>
              <div className="h-6 w-[1px] bg-gray-200 dark:bg-monday-dark-border mx-2"></div>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 dark:text-monday-dark-text-muted hover:text-gray-600 dark:hover:text-monday-dark-text-secondary'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List View"
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 dark:text-monday-dark-text-muted hover:text-gray-600 dark:hover:text-monday-dark-text-secondary'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </header>

        <div
          className={`grid gap-6 pb-12 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
        >
          {/* Card 1: Project Kickoff */}
          <div className="group relative flex flex-col bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 dark:hover:border-indigo-800 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                  <Rocket className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-monday-dark-text font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                    Project Kickoff
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium mt-1">
                    ID: #RULE-8821
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-monday-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="bg-gray-50/80 dark:bg-monday-dark-elevated/50 rounded-xl p-4 mb-5 border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                    <Zap size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('task_completed')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    Status = 'Done'
                  </p>
                </div>
                <div className="text-gray-300 dark:text-monday-dark-text-muted flex items-center justify-center pb-4">
                  <ArrowRight size={24} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Send size={18} className="-ms-0.5 mt-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('notify_slack')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    Channel #general
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-monday-dark-border pt-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-monday-dark-text-secondary dark:text-monday-dark-text-secondary font-medium">
                  <Clock size={14} />
                  <span>24m ago</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-800">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">98% Success</span>
              </div>
            </div>
          </div>

          {/* Card 2: Email Digest */}
          <div className="group relative flex flex-col bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] opacity-80 hover:opacity-100">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-monday-dark-elevated flex items-center justify-center border border-gray-100 dark:border-monday-dark-border">
                  <Mail className="text-gray-400" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-700 dark:text-monday-dark-text-secondary font-bold text-lg leading-tight">
                    Email Digest
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium mt-1">
                    ID: #RULE-1042
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-monday-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="bg-gray-50/50 dark:bg-monday-dark-elevated/30 rounded-xl p-4 mb-5 border border-gray-100 dark:border-monday-dark-border grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                    <Zap size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('time_schedule')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    {t('every_friday')}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-monday-dark-text-muted flex items-center justify-center pb-4">
                  <ArrowRight size={24} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Send size={18} className="-ms-0.5 mt-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('send_report')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    {t('email_to_admin')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-monday-dark-border pt-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-monday-dark-text-secondary dark:text-monday-dark-text-secondary font-medium">
                <PauseCircle size={14} />
                <span>{t('paused_by_user')}</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium">
                {t('no_recent_data')}
              </div>
            </div>
          </div>

          {/* Card 3: Urgent Ticket Alert */}
          <div className="group relative flex flex-col bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 dark:hover:border-indigo-800 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-monday-dark-text font-bold text-lg leading-tight group-hover:text-red-600 transition-colors">
                    {t('urgent_ticket_alert')}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium mt-1">
                    ID: #RULE-991A
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-monday-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="bg-gray-50/80 dark:bg-monday-dark-elevated/50 rounded-xl p-4 mb-5 border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                    <Zap size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('ticket_tagged')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    Tag = 'Urgent'
                  </p>
                </div>
                <div className="text-gray-300 dark:text-monday-dark-text-muted flex items-center justify-center pb-4">
                  <ArrowRight size={24} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Send size={18} className="-ms-0.5 mt-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('page_oncall')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">OpsGenie</p>
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-monday-dark-border pt-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-monday-dark-text-secondary dark:text-monday-dark-text-secondary font-medium">
                  <Clock size={14} />
                  <span>5m ago</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-800">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">100% Success</span>
              </div>
            </div>
          </div>

          {/* Card 4: Draft */}
          <div className="group relative flex flex-col bg-white border-2 border-dashed border-gray-200 dark:border-monday-dark-border hover:border-gray-300 dark:hover:border-monday-dark-border-strong rounded-xl p-6 transition-all duration-300">
            <div className="absolute top-4 end-4 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold rounded uppercase tracking-wider border border-yellow-100 dark:border-yellow-800">
              {t('draft')}
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-monday-dark-elevated flex items-center justify-center border border-gray-100 dark:border-monday-dark-border text-gray-400">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-gray-800 dark:text-monday-dark-text font-bold text-lg leading-tight">
                    New Lead Processing
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium mt-1">
                    ID: #RULE-DRAFT
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-monday-dark-elevated rounded-xl p-4 mb-5 border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center justify-center h-[98px] text-gray-400 dark:text-monday-dark-text-muted text-sm italic">
                {t('logic_incomplete')}
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-monday-dark-border pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-monday-dark-text-secondary">
                <span>
                  {t('last_edited')} 3 {t('days_ago')}
                </span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-monday-dark-text hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-monday-dark-bg text-xs font-bold transition-colors shadow-sm">
                {t('continue_setup')}
              </button>
            </div>
          </div>

          {/* Card 5: Sync to Airtable */}
          <div className="group relative flex flex-col bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-monday-dark-border rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 dark:hover:border-indigo-800 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                  <Database className="text-teal-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-monday-dark-text font-bold text-lg leading-tight group-hover:text-teal-600 transition-colors">
                    Sync to Airtable
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-monday-dark-text-muted font-medium mt-1">
                    ID: #RULE-332B
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-monday-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="bg-gray-50/80 dark:bg-monday-dark-elevated/50 rounded-xl p-4 mb-5 border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                    <Zap size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('new_user')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    {t('on_signup')}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-monday-dark-text-muted flex items-center justify-center pb-4">
                  <ArrowRight size={24} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Send size={18} className="-ms-0.5 mt-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-monday-dark-text truncate w-full">
                    {t('create_record')}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-monday-dark-text-muted truncate w-full">
                    Airtable: Users
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-monday-dark-border pt-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-monday-dark-text-secondary dark:text-monday-dark-text-secondary font-medium">
                  <Clock size={14} />
                  <span>2h ago</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-800">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">95% Success</span>
              </div>
            </div>
          </div>

          {/* Card 6: Add New */}
          <button className="group flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-white dark:hover:bg-monday-dark-surface rounded-xl p-6 transition-all duration-300 min-h-[280px]">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-monday-dark-surface shadow-sm border border-gray-100 dark:border-monday-dark-border group-hover:shadow-md group-hover:scale-110 flex items-center justify-center mb-4 transition-all duration-300">
              <Plus
                className="text-gray-400 dark:text-monday-dark-text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                size={32}
              />
            </div>
            <h3 className="text-gray-500 dark:text-monday-dark-text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-bold text-lg transition-colors">
              {t('create_new_rule')}
            </h3>
            <p className="text-gray-400 dark:text-monday-dark-text-muted text-sm mt-1">{t('start_from_scratch')}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationRulesView;
