import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, CheckCircle2, Layers, CheckSquare, Zap } from 'lucide-react';

export const ProcessSection = () => {
    const steps = [
        {
            id: "01",
            title: "Capture",
            desc: "Collect what has your attention. Use the Inbox to write down tasks, ideas, and reminders immediately.",
            icon: Inbox,
            color: "text-blue-400",
            border: "group-hover:border-blue-500/50"
        },
        {
            id: "02",
            title: "Clarify",
            desc: "Process what you've captured. Decide if it's actionable, then decide the next action.",
            icon: CheckCircle2,
            color: "text-orange-400",
            border: "group-hover:border-orange-500/50"
        },
        {
            id: "03",
            title: "Organize",
            desc: "Put everything in the right place. Add actionable items to your lists and calendar.",
            icon: Layers,
            color: "text-purple-400",
            border: "group-hover:border-purple-500/50"
        },
        {
            id: "04",
            title: "Reflect",
            desc: "Review frequently. Update your lists, clear your mind, and get perspective.",
            icon: CheckSquare,
            color: "text-green-400",
            border: "group-hover:border-green-500/50"
        },
        {
            id: "05",
            title: "Engage",
            desc: "Simply do. Use your system to make confident choices about what to do right now.",
            icon: Zap,
            color: "text-pink-400",
            border: "group-hover:border-pink-500/50"
        }
    ];

    return (
        <section className="py-32 bg-[#050505] relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20 animate-fade-in-up">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-widest mb-6">
                        <span className="text-blue-400 mr-2">•</span> New Feature
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
                        Getting Things <span className="text-gray-500">Done.</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        A comprehensive system to stress-free productivity. Transform chaos into control with our integrated workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`group h-full p-8 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:bg-[#0F0F0F] transition-all duration-300 relative overflow-hidden ${step.border}`}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <span className="text-4xl font-black text-[#1A1A1A] group-hover:text-white/10 transition-colors duration-300">
                                    {step.id}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                                {step.desc}
                            </p>

                            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${step.color.replace('text-', 'from-').replace('-400', '-600')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
