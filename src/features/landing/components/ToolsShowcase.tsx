import React from 'react';
import {
    Chalkboard, Note, ChartBar, UsersFour, ArrowsClockwise,
    Lightning, Table, Target, PaintBrush, Flask,
    ListBullets, Kanban, Calendar, Timer, ChartLine,
    FileText, GridFour, ShoppingCart, Truck, Rows, Columns,
    Sparkle, Eye, ArrowRight
} from 'phosphor-react';

// Simple Tools
const simpleTools = [
    { name: 'Whiteboard', icon: Chalkboard, description: 'Visual collaboration canvas' },
    { name: 'Cornell Notes', icon: Note, description: 'Structured note-taking' },
    { name: 'Dashboards', icon: ChartBar, description: 'Real-time analytics views' },
    { name: 'Workload', icon: UsersFour, description: 'Team capacity planning' },
    { name: 'Recurring Logic', icon: ArrowsClockwise, description: 'Automated task scheduling' },
];

// Advanced Tools
const advancedTools = [
    { name: 'Automation Rules', icon: Lightning, description: 'Custom workflow automation' },
    { name: 'Spreadsheets', icon: Table, description: 'Full formula engine support' },
    { name: 'Goals & OKRs', icon: Target, description: 'Objective tracking system' },
    { name: 'Antigravity Designs', icon: PaintBrush, description: 'Design system builder' },
    { name: 'Test Page', icon: Flask, description: 'Development sandbox' },
];

// Board Views
const boardViews = [
    { name: 'Overview', icon: GridFour },
    { name: 'List', icon: ListBullets },
    { name: 'Table', icon: Rows },
    { name: 'Kanban', icon: Kanban },
    { name: 'Calendar', icon: Calendar },
    { name: 'Timeline', icon: Timer },
    { name: 'Gantt Chart', icon: ChartLine },
    { name: 'Forms', icon: FileText },
    { name: 'Pivot Table', icon: Columns },
    { name: 'Doc', icon: FileText },
    { name: 'ListBoard', icon: ListBullets },
    { name: 'Procurement', icon: ShoppingCart },
    { name: 'Supply Chain', icon: Truck },
    { name: 'More...', icon: GridFour },
];

export const ToolsShowcase: React.FC = () => {
    return (
        <>
            {/* Tools Section - Dark Premium Design */}
            <section className="py-20 sm:py-28 md:py-36 bg-zinc-950 relative overflow-hidden">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                {/* Animated Top Gradient Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-zinc-700/30 to-transparent rounded-full blur-3xl"
                     style={{ animation: 'toolsGlow 10s ease-in-out infinite' }} />
                <style>{`
                    @keyframes toolsGlow {
                        0%, 100% { opacity: 0.5; transform: translate(-50%, 0) scale(1) translateZ(0); }
                        50% { opacity: 0.8; transform: translate(-50%, 0) scale(1.1) translateZ(0); }
                    }
                `}</style>

                <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    {/* Section Header */}
                    <div className="text-center mb-12 sm:mb-16 md:mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-sm font-medium mb-6 sm:mb-8">
                            <Sparkle size={14} weight="fill" className="text-zinc-500" />
                            10 Powerful Tools
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 tracking-tight leading-[1.1]">
                            Built for Every Workflow
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                            From simple note-taking to complex automation — tools that scale with your ambition
                        </p>
                    </div>

                    {/* Bento Grid Layout - mobile optimized */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                        {/* Simple Tools */}
                        {simpleTools.map((tool, i) => {
                            const Icon = tool.icon;
                            return (
                                <div
                                    key={tool.name}
                                    className="group relative p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-zinc-900/80 border border-zinc-800/80
                                        hover:border-zinc-600 hover:bg-zinc-800/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20
                                        transition-all duration-300 ease-out opacity-0 animate-fade-in-up"
                                    style={{ animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'forwards' }}
                                >
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-zinc-800 flex items-center justify-center mb-3 sm:mb-4
                                        group-hover:bg-zinc-700 group-hover:scale-110 transition-all duration-300">
                                        <Icon size={18} weight="duotone" className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                                    </div>
                                    <h4 className="font-semibold text-white mb-1 text-xs sm:text-sm md:text-base">{tool.name}</h4>
                                    <p className="text-[10px] sm:text-xs md:text-sm text-zinc-500 leading-relaxed">{tool.description}</p>
                                </div>
                            );
                        })}

                        {/* Advanced Tools with Purple Accent */}
                        {advancedTools.map((tool, i) => {
                            const Icon = tool.icon;
                            return (
                                <div
                                    key={tool.name}
                                    className="group relative p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50
                                        border border-purple-500/20 hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20
                                        transition-all duration-300 ease-out opacity-0 animate-fade-in-up"
                                    style={{ animationDelay: `${0.3 + i * 0.05}s`, animationFillMode: 'forwards' }}
                                >
                                    {/* Animated glow on hover */}
                                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors duration-300" />

                                    <div className="relative z-10">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 sm:mb-4
                                            group-hover:bg-purple-500/25 group-hover:scale-110 transition-all duration-300">
                                            <Icon size={18} weight="duotone" className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                                        </div>
                                        <h4 className="font-semibold text-white mb-1 text-xs sm:text-sm md:text-base">{tool.name}</h4>
                                        <p className="text-[10px] sm:text-xs md:text-sm text-zinc-500 leading-relaxed">{tool.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-8 sm:mt-12 text-center">
                        <button className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium transition-colors group">
                            Explore all tools
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Board Views Section - Light Premium Design */}
            <section className="py-20 sm:py-28 md:py-36 bg-white dark:bg-black relative overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.3] dark:opacity-[0.02]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)`,
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    {/* Section Header */}
                    <div className="text-center mb-12 sm:mb-16 md:mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-6 sm:mb-8">
                            <Eye size={14} weight="duotone" className="text-zinc-500" />
                            14 Board Views
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white mb-6 sm:mb-8 tracking-tight leading-[1.1]">
                            One Board. Every Perspective.
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                            Switch instantly between 14 powerful views — your data, visualized your way
                        </p>
                    </div>

                    {/* Views Showcase - Interactive Pills Grid */}
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 max-w-4xl mx-auto mb-10 sm:mb-16">
                        {boardViews.map((view) => {
                            const Icon = view.icon;
                            const isHighlighted = ['Kanban', 'Gantt Chart', 'Timeline'].includes(view.name);
                            return (
                                <div
                                    key={view.name}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-full border transition-colors cursor-default
                                        ${isHighlighted
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <Icon size={14} weight="duotone" className={isHighlighted ? 'text-white dark:text-zinc-900' : 'text-zinc-500'} />
                                    <span className="text-xs sm:text-sm font-medium">{view.name}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Row - responsive */}
                    <div className="flex justify-center items-center gap-6 sm:gap-10 md:gap-16 pt-6 sm:pt-8 border-t border-zinc-200 dark:border-zinc-800 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">14</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-zinc-500 mt-0.5 sm:mt-1 font-medium">Board Views</div>
                        </div>
                        <div className="w-px h-8 sm:h-12 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">10</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-zinc-500 mt-0.5 sm:mt-1 font-medium">Power Tools</div>
                        </div>
                        <div className="w-px h-8 sm:h-12 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">∞</div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-zinc-500 mt-0.5 sm:mt-1 font-medium">Possibilities</div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
