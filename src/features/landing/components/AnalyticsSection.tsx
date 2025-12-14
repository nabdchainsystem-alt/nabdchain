import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts';
import { Activity, Brain, Server, Zap, BarChart2, Network, Users } from 'lucide-react';

const data = [
    { name: 'Mon', value: 20 },
    { name: 'Tue', value: 45 },
    { name: 'Wed', value: 28 },
    { name: 'Thu', value: 80 },
    { name: 'Fri', value: 54 },
    { name: 'Sat', value: 42 },
    { name: 'Sun', value: 90 },
];

export const AnalyticsSection = () => {
    return (
        <section className="py-32 bg-[#050505] overflow-hidden relative">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">

                {/* Part 1: Analytics Engine */}
                <div className="flex flex-col lg:flex-row items-center gap-20 mb-40">
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <BarChart2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-blue-400 font-bold tracking-widest text-xs uppercase">Analytics Engine</span>
                            </div>

                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                                Next-Gen <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Analytics</span>
                            </h2>

                            <p className="text-xl text-gray-400 leading-relaxed mb-8">
                                The heart of your data. A centralized, intelligent core processing millions of
                                signals in real-time to provide actionable insights instantly.
                            </p>
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Platform Overview</h3>
                                    <p className="text-gray-500 text-sm">Real-time data processing</p>
                                </div>
                                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-green-500 text-xs font-bold">Live</span>
                                </div>
                            </div>

                            <div className="h-48 w-full mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 6 ? '#3B82F6' : '#1F2937'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-400">Active Users</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">24.5k</div>
                                    <div className="text-xs text-green-500 font-bold mt-1">↑ 12%</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-400">Throughput</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">1.2 TB</div>
                                    <div className="text-xs text-green-500 font-bold mt-1">↑ 8%</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Part 2: Advanced Insights (Neural Network) */}
                <div className="flex flex-col-reverse lg:flex-row items-center gap-20">
                    <div className="lg:w-1/2 w-full flex justify-center">
                        <motion.div
                            className="relative w-[400px] h-[400px] flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        >
                            {/* Neural Network Visualization (Abstract) */}
                            <div className="absolute inset-0 border border-blue-500/20 rounded-full rounded-tr-[100px] animate-pulse-slow" />
                            <div className="absolute inset-10 border border-purple-500/20 rounded-full rounded-bl-[100px] animate-pulse" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

                            <motion.div
                                className="relative z-10 p-8 rounded-full bg-[#0A0A0A] border border-white/10 shadow-2xl shadow-blue-500/20"
                                whileHover={{ scale: 1.1 }}
                            >
                                <Brain className="w-24 h-24 text-white" />
                            </motion.div>

                            {/* Orbiting nodes */}
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                    style={{
                                        offsetPath: 'path("M-150,0 a150,150 0 1,0 300,0 a150,150 0 1,0 -300,0")',
                                        offsetDistance: `${i * 33}%`
                                    }}
                                    animate={{ offsetDistance: ["0%", "100%"] }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: i * 2 }}
                                />
                            ))}
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2 text-right">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center justify-end gap-3 mb-6">
                                <span className="text-purple-400 font-bold tracking-widest text-xs uppercase">Neural Network</span>
                                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <Network className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>

                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                                Advanced <span className="text-gray-500">Insights</span>
                            </h2>

                            <p className="text-xl text-gray-400 leading-relaxed mb-8 ml-auto max-w-lg">
                                Uncover hidden patterns with AI-driven predictive modeling.
                                A neural network of intelligence at your fingertips that evolves with your data.
                            </p>

                            <div className="inline-flex items-center gap-4 bg-white/5 border border-white/5 rounded-full px-6 py-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#050505]" />
                                    ))}
                                </div>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <span className="text-sm font-medium text-white">AI Models Training...</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
