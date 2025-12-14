import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Terminal, Shield, Database, ShoppingBag } from 'lucide-react';

export const MarketplaceSection = () => {
    return (
        <section className="py-32 bg-[#050505] relative overflow-hidden">

            {/* Part 1: Global Marketplace (Globe) */}
            <div className="max-w-7xl mx-auto px-6 mb-40">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-blue-400 font-bold tracking-widest text-xs uppercase">Global Network</span>
                            </div>

                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                                Global <span className="text-gray-500">Marketplace</span>
                            </h2>
                            <p className="text-xl text-gray-400 leading-relaxed mb-8">
                                Command your supply chain. A unified interface connecting you to suppliers, logistics,
                                and markets worldwide.
                            </p>

                            <div className="flex gap-4">
                                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-blue-500/50 transition-colors w-40">
                                    <div className="text-2xl font-bold text-white mb-1">842</div>
                                    <div className="text-xs text-blue-400 font-bold uppercase tracking-wide">Active Fleets</div>
                                </div>
                                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-green-500/50 transition-colors w-40">
                                    <div className="text-2xl font-bold text-white mb-1">$4.2B</div>
                                    <div className="text-xs text-green-400 font-bold uppercase tracking-wide">Market Vol</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2 relative h-[500px] w-full flex items-center justify-center">
                        {/* Abstract Globe Visualization */}
                        <div className="absolute w-[400px] h-[400px] rounded-full border border-blue-500/10 animate-[spin_60s_linear_infinite]" />
                        <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-blue-500/20 animate-[spin_40s_linear_infinite_reverse]" />
                        <div className="absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                        <motion.div
                            className="relative z-10 bg-[#0A0A0A] p-6 rounded-2xl border border-white/10 shadow-2xl"
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ShoppingBag className="w-16 h-16 text-blue-500" />
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0A0A0A]" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Part 2: Data Command Center (Terminal) */}
            <div className="max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 mb-8 border border-white/10">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                        Data <span className="text-gray-500">Command Center</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-16">
                        Your central nervous system. Monitor, manage, and control every aspect of your operation
                        from a single, immersive interface.
                    </p>

                    {/* Terminal Window */}
                    <div className="w-full bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl text-left font-mono">
                        <div className="bg-[#151515] px-4 py-3 border-b border-white/5 flex items-center gap-2">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="ml-4 text-xs text-gray-500">admin@nabd-command:~</div>
                        </div>
                        <div className="p-6 text-sm">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded bg-white/5">
                                    <div className="text-gray-500 text-xs mb-1">System Load</div>
                                    <div className="text-green-400 font-bold">42%</div>
                                    <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="w-[42%] bg-green-500 h-full" />
                                    </div>
                                </div>
                                <div className="p-4 rounded bg-white/5">
                                    <div className="text-gray-500 text-xs mb-1">Active Nodes</div>
                                    <div className="text-white font-bold">1,204</div>
                                    <div className="flex gap-1 mt-2">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-1 rounded-full bg-green-500" />)}
                                    </div>
                                </div>
                                <div className="p-4 rounded bg-white/5">
                                    <div className="text-gray-500 text-xs mb-1">Security Status</div>
                                    <div className="text-white font-bold flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-green-500" /> Secure
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-gray-300">
                                <div className="flex gap-2">
                                    <span className="text-green-500">$</span>
                                    <span>systemctl status nabd-core</span>
                                </div>
                                <div className="pl-4 text-gray-500">
                                    ● nabd-core.service - NABD Core Service<br />
                                    &nbsp;&nbsp;Loaded: loaded (/etc/systemd/system/nabd.service; enabled)<br />
                                    &nbsp;&nbsp;Active: <span className="text-green-500 font-bold">active (running)</span> since Mon 2023-10-23 14:00:00 UTC
                                </div>
                                <div className="flex gap-2 animate-pulse">
                                    <span className="text-green-500">$</span>
                                    <span className="w-2 h-5 bg-gray-500 block" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
