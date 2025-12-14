import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Sparkles, Users } from 'lucide-react';

export const StatsSection = () => {
    const stats = [
        { label: "Reports", sub: "REPORTS", value: "128,000+", icon: FileText },
        { label: "Simulator", sub: "PRODUCTION LINE", value: "Simulator", icon: Cpu },
        { label: "Super Advanced Tools", sub: "SUPER ADVANCED TOOLS", value: "20+", icon: Sparkles },
        { label: "Verified Supplier", sub: "VERIFIED SUPPLIER", value: "3,000K", icon: Users },
    ];

    return (
        <section className="py-24 bg-[#050505] relative z-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="flex flex-col items-center group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#0F0F0F] border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/5 transition-colors duration-300">
                                <stat.icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
