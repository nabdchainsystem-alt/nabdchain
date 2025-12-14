import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Layers, Zap, CheckCircle2, Globe, Users, Database, Cpu, Layout, Activity, BarChart2, MessageSquare, Briefcase } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface LandingPageProps {
    onEnterSystem: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterSystem }) => {
    const { t } = useAppContext();
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

    const features = [
        {
            icon: MessageSquare,
            title: "Capture",
            desc: "Collect what has your attention. Use the Inbox to write down tasks, ideas, and reminders immediately.",
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-100",
            gradient: "from-blue-500 to-cyan-400"
        },
        {
            icon: CheckCircle2,
            title: "Clarify",
            desc: "Process what you've captured. Decide if it's actionable, then decide the next action.",
            color: "text-orange-500",
            bg: "bg-orange-50",
            border: "border-orange-100",
            gradient: "from-orange-500 to-amber-400"
        },
        {
            icon: Database,
            title: "Organize",
            desc: "Put everything in the right place. Add actionable items to your lists and calendar.",
            color: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-100",
            gradient: "from-purple-500 to-pink-400"
        },
        {
            icon: BarChart2,
            title: "Reflect",
            desc: "Review frequently. Update your lists, clear your mind, and get perspective.",
            color: "text-green-500",
            bg: "bg-green-50",
            border: "border-green-100",
            gradient: "from-green-500 to-emerald-400"
        },
        {
            icon: Zap,
            title: "Engage",
            desc: "Simply do. Use your system to make confident choices about what to do right now.",
            color: "text-pink-500",
            bg: "bg-pink-50",
            border: "border-pink-100",
            gradient: "from-pink-500 to-rose-400"
        }
    ];

    return (
        <div className="min-h-screen bg-white text-[#323338] font-sans selection:bg-black selection:text-white">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg shadow-black/20">
                            <div className="w-5 h-5 border-2 border-white rounded-md" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">NABD CHAIN</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
                        <button className="hover:text-black transition-colors">Features</button>
                        <button className="hover:text-black transition-colors">Pricing</button>
                        <button className="hover:text-black transition-colors">Enterprise</button>
                    </div>
                    <button
                        onClick={onEnterSystem}
                        className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-black/10"
                    >
                        Enter System
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                <motion.div style={{ opacity, scale }} className="text-center relative z-10 px-6 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 mb-8 shadow-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        SYSTEM V3.0 ONLINE
                    </motion.div>

                    <motion.h1
                        className="text-7xl md:text-9xl font-black tracking-tighter mb-6 leading-[0.9]"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        NABD CHAIN
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-800 to-gray-400">
                            SYSTEM
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium mb-12"
                    >
                        The ultimate monochromatic ecosystem for enterprise management.
                        <br />
                        <span className="text-gray-900 font-semibold mt-2 block">Data • Analytics • Marketplace • Smart Tools</span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={onEnterSystem}
                            className="group px-10 py-5 rounded-full bg-black text-white text-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition-all hover:scale-105 shadow-2xl shadow-blue-500/20"
                        >
                            Enter System
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-10 py-5 rounded-full bg-white text-gray-900 border border-gray-200 text-lg font-bold hover:bg-gray-50 transition-all hover:scale-105 hover:border-gray-300">
                            Documentation
                        </button>
                    </motion.div>
                </motion.div>

                {/* Hero Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-100 rounded-full blur-[100px] opacity-40 mix-blend-multiply" />
                    <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-100 rounded-full blur-[100px] opacity-40 mix-blend-multiply" />
                </div>
            </div>

            {/* Value Prop Section */}
            <section className="py-32 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-6xl md:text-8xl font-black tracking-tight text-gray-900 mb-8"
                    >
                        MANAGE YOUR
                        <br />
                        <span className="text-gray-400">WHOLE COMPANY</span>
                    </motion.h2>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Reports", value: "128,000+", icon: Layers, color: "text-blue-600" },
                        { label: "Production Line", value: "Simulator", icon: Cpu, color: "text-purple-600" },
                        { label: "Super Advanced Tools", value: "20+", icon: Briefcase, color: "text-orange-600" },
                        { label: "Verified Supplier", value: "3,000K", icon: Users, color: "text-green-600" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 text-center hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group"
                        >
                            <div className={`w-14 h-14 mx-auto rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                            <div className="text-4xl font-black text-gray-900 mb-2">{stat.value}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid (GTD) */}
            <section className="py-32 bg-gray-900 text-white relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
                            New Feature
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                            Getting Things <span className="text-gray-500">Done.</span>
                        </h2>
                        <p className="max-w-3xl mx-auto text-xl text-gray-400 leading-relaxed">
                            A comprehensive system to stress-free productivity. Transform chaos into control with our integrated workflow.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 relative overflow-hidden group hover:bg-gray-800 transition-colors duration-300"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="absolute -right-4 -bottom-8 text-9xl font-black text-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-500 select-none">
                                    0{i + 1}
                                </div>

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 bg-white text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8">
                        Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">transform</span> your workflow?
                    </h2>
                    <button
                        onClick={onEnterSystem}
                        className="px-12 py-6 rounded-full bg-black text-white text-xl font-bold hover:bg-gray-900 transition-all hover:scale-105 shadow-2xl shadow-black/20"
                    >
                        Start Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white rounded-sm" />
                        </div>
                        <span className="font-bold text-lg">NABD CHAIN SYSTEM</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">© 2025 NCS. All rights reserved.</p>
                    <div className="flex gap-8 text-sm font-bold text-gray-500">
                        <a href="#" className="hover:text-black transition-colors">Privacy</a>
                        <a href="#" className="hover:text-black transition-colors">Terms</a>
                        <a href="#" className="hover:text-black transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
