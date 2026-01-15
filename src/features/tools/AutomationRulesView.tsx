import React from 'react';
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Rocket,
    Zap,
    ArrowRight,
    Send,
    Clock,
    CheckCircle2,
    Mail,
    PauseCircle,
    AlertTriangle,
    FileText,
    Database
} from 'lucide-react';

const AutomationRulesView: React.FC<{ boardId: string }> = ({ boardId }) => {
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');

    return (
        <div className="text-gray-900 font-sans h-full flex flex-col antialiased bg-gray-50 overflow-auto">
            <div className="relative z-10 flex flex-col w-full px-4 py-6 md:px-8 flex-grow">
                <header className="flex flex-col gap-8 mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Automation Rules</h1>
                            <p className="text-gray-500 text-lg font-normal">
                                Manage your workflow logic and integrations.
                            </p>
                        </div>
                        <button className="group flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0">
                            <Plus size={20} />
                            <span>Create New Rule</span>
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white border border-gray-200 p-1.5 rounded-xl shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                        <div className="relative w-full lg:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={20} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm font-medium"
                                placeholder="Search rules..."
                                type="text"
                            />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 px-2 lg:px-0 no-scrollbar">
                            <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden lg:block"></div>
                            <button className="whitespace-nowrap px-4 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-colors">
                                All Rules
                            </button>
                            <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
                                Active <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold border border-indigo-100">8</span>
                            </button>
                            <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors">
                                Paused
                            </button>
                            <button className="whitespace-nowrap px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-colors">
                                Drafts
                            </button>
                            <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid View"
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="List View"
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className={`grid gap-6 pb-12 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {/* Card 1: Project Kickoff */}
                    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                                    <Rocket className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">Project Kickoff</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: #RULE-8821</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-4 mb-5 border border-gray-100">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                                        <Zap size={18} />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Task Completed</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Status = 'Done'</p>
                                </div>
                                <div className="text-gray-300 flex items-center justify-center pb-4">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                        <Send size={18} className="-ml-0.5 mt-0.5" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Notify Slack</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Channel #general</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <Clock size={14} />
                                    <span>24m ago</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                <CheckCircle2 size={14} className="text-green-600" />
                                <span className="text-xs font-bold text-green-700">98% Success</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Email Digest */}
                    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] opacity-80 hover:opacity-100">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <Mail className="text-gray-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-700 font-bold text-lg leading-tight">Email Digest</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: #RULE-1042</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-4 mb-5 border border-gray-100 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                                        <Zap size={18} />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Time Schedule</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Every Friday</p>
                                </div>
                                <div className="text-gray-300 flex items-center justify-center pb-4">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                        <Send size={18} className="-ml-0.5 mt-0.5" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Send Report</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Email to Admin</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <PauseCircle size={14} />
                                <span>Paused by User</span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                No recent data
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Urgent Ticket Alert */}
                    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-bold text-lg leading-tight group-hover:text-red-600 transition-colors">Urgent Ticket Alert</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: #RULE-991A</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-4 mb-5 border border-gray-100">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                                        <Zap size={18} />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Ticket Tagged</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Tag = 'Urgent'</p>
                                </div>
                                <div className="text-gray-300 flex items-center justify-center pb-4">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                        <Send size={18} className="-ml-0.5 mt-0.5" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Page On-Call</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">OpsGenie</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <Clock size={14} />
                                    <span>5m ago</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                <CheckCircle2 size={14} className="text-green-600" />
                                <span className="text-xs font-bold text-green-700">100% Success</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Draft */}
                    <div className="group relative flex flex-col bg-white border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-6 transition-all duration-300">
                        <div className="absolute top-4 right-4 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded uppercase tracking-wider border border-yellow-100">
                            Draft
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-800 font-bold text-lg leading-tight">New Lead Processing</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: #RULE-DRAFT</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
                            <div className="flex items-center justify-center h-[98px] text-gray-400 text-sm italic">
                                Logic configuration incomplete...
                            </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Last edited 3d ago</span>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors shadow-sm">
                                Continue Setup
                            </button>
                        </div>
                    </div>

                    {/* Card 5: Sync to Airtable */}
                    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-xl p-6 transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] hover:border-indigo-100 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                                    <Database className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-bold text-lg leading-tight group-hover:text-teal-600 transition-colors">Sync to Airtable</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: #RULE-332B</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-4 mb-5 border border-gray-100">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                                        <Zap size={18} />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">New User</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">On Signup</p>
                                </div>
                                <div className="text-gray-300 flex items-center justify-center pb-4">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                        <Send size={18} className="-ml-0.5 mt-0.5" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">Create Record</p>
                                    <p className="text-[10px] text-gray-500 truncate w-full">Airtable: Users</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <Clock size={14} />
                                    <span>2h ago</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                <CheckCircle2 size={14} className="text-green-600" />
                                <span className="text-xs font-bold text-green-700">95% Success</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 6: Add New */}
                    <button className="group flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-white rounded-xl p-6 transition-all duration-300 min-h-[280px]">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 group-hover:shadow-md group-hover:scale-110 flex items-center justify-center mb-4 transition-all duration-300">
                            <Plus className="text-gray-400 group-hover:text-indigo-600 transition-colors" size={32} />
                        </div>
                        <h3 className="text-gray-500 group-hover:text-indigo-600 font-bold text-lg transition-colors">Create New Rule</h3>
                        <p className="text-gray-400 text-sm mt-1">Start from scratch or use a template</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutomationRulesView;
