import React, { useState, useRef, memo } from 'react';
import { useInView } from 'framer-motion';
import {
    Play,
    Kanban,
    Table,
    Calendar,
    ChartLine,
    CheckCircle,
    Circle,
    Plus,
    ArrowRight,
    Lightning,
    Users,
    Bell,
    Gear,
    Lock,
    Globe,
    Shield
} from 'phosphor-react';

// Kanban Preview Card
const KanbanPreview = memo(() => {
    const columns = [
        { label: 'To Do', count: 3, color: 'bg-zinc-300 dark:bg-zinc-600' },
        { label: 'In Progress', count: 2, color: 'bg-zinc-400 dark:bg-zinc-500' },
        { label: 'Done', count: 4, color: 'bg-zinc-500 dark:bg-zinc-400' },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Kanban size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Board Views</span>
                </div>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
                Switch between Kanban, Table, Calendar, Timeline, and 10 more views instantly.
            </p>

            <div className="flex-1 flex gap-2">
                {columns.map((col) => (
                    <div key={col.label} className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500">{col.label}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{col.count}</span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            {Array.from({ length: Math.min(col.count, 3) }).map((_, i) => (
                                <div key={i} className={`h-6 rounded ${col.color} opacity-60`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Automation Preview Card
const AutomationPreview = memo(() => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Lightning size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Automations</span>
            </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
            Create custom automation rules without code. Trigger actions based on any condition.
        </p>

        <div className="space-y-2">
            {[
                { trigger: 'Status → Done', action: 'Notify team', active: true },
                { trigger: 'Due date passed', action: 'Move to Urgent', active: true },
                { trigger: 'New comment', action: 'Send email', active: false },
            ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${rule.active ? 'bg-zinc-500 dark:bg-zinc-400' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{rule.trigger}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">→ {rule.action}</span>
                </div>
            ))}
        </div>
    </div>
));

// Collaboration Preview Card
const CollaborationPreview = memo(() => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Users size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Real-time Collaboration</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600">3 online</span>
            </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
            See who's working on what in real-time. Live cursors, presence, and instant updates.
        </p>

        <div className="flex-1 flex items-center justify-center">
            <div className="flex -space-x-2">
                {['SK', 'JD', 'MR'].map((initials, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
                        {initials}
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">
                    +5
                </div>
            </div>
        </div>
    </div>
));

// Dashboards Preview Card
const DashboardsPreview = memo(() => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <ChartLine size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">50+ Dashboards</span>
            </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
            Pre-built dashboards for every department. Customize or build your own from scratch.
        </p>

        <div className="flex-1 grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded bg-zinc-100 dark:bg-zinc-800 flex items-end p-1.5">
                    <div className="w-full flex items-end gap-0.5">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div
                                key={j}
                                className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded-sm"
                                style={{ height: `${12 + Math.random() * 16}px` }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
));

// Security Preview Card
const SecurityPreview = memo(() => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Shield size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Enterprise Security</span>
            </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
            SOC 2 compliant. Role-based access control. SSO integration. Audit logs.
        </p>

        <div className="space-y-2">
            {[
                { icon: Lock, label: 'End-to-end encryption' },
                { icon: Globe, label: 'SSO & SAML support' },
                { icon: Gear, label: 'Custom permissions' },
            ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                    <Icon size={12} className="text-zinc-500" />
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{label}</span>
                </div>
            ))}
        </div>
    </div>
));

// Integrations Preview Card
const IntegrationsPreview = memo(() => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Globe size={16} weight="duotone" className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Integrations</span>
            </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
            Connect with Slack, Google, Microsoft, and 50+ other tools your team already uses.
        </p>

        <div className="flex-1 grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
            ))}
        </div>
    </div>
));

interface LiveDemoSectionProps {
    onTryDemo?: () => void;
}

export const LiveDemoSection: React.FC<LiveDemoSectionProps> = ({ onTryDemo }) => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const cards = [
        { id: 'kanban', component: KanbanPreview, span: 'sm:col-span-2' },
        { id: 'automation', component: AutomationPreview, span: '' },
        { id: 'collab', component: CollaborationPreview, span: '' },
        { id: 'dashboards', component: DashboardsPreview, span: '' },
        { id: 'security', component: SecurityPreview, span: '' },
        { id: 'integrations', component: IntegrationsPreview, span: 'sm:col-span-2' },
    ];

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-white dark:bg-zinc-950 relative overflow-hidden">
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-[0.5] dark:opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                            text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6">
                            <Play size={14} weight="fill" />
                            Platform Features
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-zinc-900 dark:text-white leading-[1.1]">
                            Everything you need
                        </h2>

                        <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Built for teams that want to move fast. All the tools you need in one place.
                        </p>
                    </div>
                )}

                {/* Bento Grid */}
                {isInView && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
                        {cards.map((card, index) => {
                            const Component = card.component;
                            return (
                                <div
                                    key={card.id}
                                    className={`p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                                        hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-none transition-all duration-300
                                        ${card.span} min-h-[200px]`}
                                    style={{
                                        opacity: 0,
                                        animation: 'fadeInUp 0.5s ease-out forwards',
                                        animationDelay: `${0.1 + index * 0.05}s`
                                    }}
                                >
                                    <Component />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CTA */}
                {isInView && (
                    <div className="text-center"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.4s' }}>
                        <button
                            onClick={onTryDemo}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                                bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
                                font-semibold text-sm
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200"
                        >
                            Start Free Trial
                            <ArrowRight size={16} weight="bold" />
                        </button>
                        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-600">
                            No credit card required
                        </p>
                    </div>
                )}
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </section>
    );
};
