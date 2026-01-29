import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Kanban,
    ChartPie,
    Briefcase,
    Clock,
    UsersThree,
    Folder,
    Bell,
    Robot
} from 'phosphor-react';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}

const features: Feature[] = [
    {
        icon: <Kanban size={28} weight="duotone" />,
        title: "Project Management",
        description: "Kanban boards, Gantt charts, and timeline views. Manage any project with the flexibility your team needs.",
        delay: 0
    },
    {
        icon: <ChartPie size={28} weight="duotone" />,
        title: "Analytics & Insights",
        description: "Real-time dashboards with actionable insights. Make data-driven decisions with beautiful visualizations.",
        delay: 0.1
    },
    {
        icon: <Briefcase size={28} weight="duotone" />,
        title: "Company Operations",
        description: "Procurement, warehouse, shipping, and fleet management in one unified system.",
        delay: 0.2
    },
    {
        icon: <Clock size={28} weight="duotone" />,
        title: "Time Tracking",
        description: "Built-in time tracking with automatic reports. Know where every hour goes.",
        delay: 0.3
    },
    {
        icon: <UsersThree size={28} weight="duotone" />,
        title: "Team Collaboration",
        description: "Real-time editing, comments, and notifications. Keep your entire team aligned and productive.",
        delay: 0.4
    },
    {
        icon: <Folder size={28} weight="duotone" />,
        title: "Document Vault",
        description: "Secure file storage with version control. All your documents organized and accessible.",
        delay: 0.5
    },
    {
        icon: <Bell size={28} weight="duotone" />,
        title: "Smart Notifications",
        description: "Stay informed without the noise. AI-powered notification management keeps you focused.",
        delay: 0.6
    },
    {
        icon: <Robot size={28} weight="duotone" />,
        title: "AI Assistant",
        description: "Automate repetitive tasks and get intelligent suggestions powered by advanced AI.",
        delay: 0.7
    }
];

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: feature.delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="group relative"
        >
            <div className="relative h-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800
                hover:border-zinc-700 transition-all duration-300
                hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]
                hover:-translate-y-1">

                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6
                    group-hover:bg-white transition-colors duration-300">
                    <span className="text-zinc-400 group-hover:text-black transition-colors duration-300">
                        {feature.icon}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                    {feature.description}
                </p>

                {/* Hover Arrow */}
                <div className="mt-6 flex items-center text-sm font-medium text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    <span>Learn more</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

export const FeaturesShowcase: React.FC = () => {
    const headerRef = useRef(null);
    const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

    return (
        <section className="py-32 bg-black relative overflow-hidden">
            {/* Spotlight Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold mb-6">
                        Powerful Features
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
                        Everything you need to
                        <br />
                        <span className="text-zinc-500">
                            run your business
                        </span>
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        From project planning to company analytics, NABD provides all the tools
                        your team needs to succeed.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
