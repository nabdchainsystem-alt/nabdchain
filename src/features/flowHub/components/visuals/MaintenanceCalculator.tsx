import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Wrench, ArrowsClockwise as RefreshCw, TrendUp as TrendingUp, Warning as AlertTriangle, Clock, Activity, Gear as Settings } from 'phosphor-react';

interface CostItem {
    id: string;
    label: string;
    value: number;
    unit: string;
}

export const MaintenanceCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // --- State ---
    const [operatingHours, setOperatingHours] = useState(168); // 24/7 for a week

    // Costs
    const [maintenanceCosts, setMaintenanceCosts] = useState<CostItem[]>([
        { id: 'mc-1', label: 'Technician Labor', value: 2500, unit: 'weekly' },
        { id: 'mc-2', label: 'Spare Parts', value: 1200, unit: 'weekly' },
        { id: 'mc-3', label: 'Contractor Svc', value: 800, unit: 'weekly' },
    ]);

    // Metrics
    const [reliability, setReliability] = useState({
        mtbf: 48, // Mean Time Between Failures (hours)
        mttr: 2,  // Mean Time To Repair (hours)
    });

    // --- Calculations ---
    const totalMaintenanceCost = useMemo(() => {
        return maintenanceCosts.reduce((sum, item) => sum + item.value, 0);
    }, [maintenanceCosts]);

    const availability = useMemo(() => {
        // Availability = MTBF / (MTBF + MTTR)
        const val = reliability.mtbf / (reliability.mtbf + reliability.mttr);
        return Math.min(100, Math.max(0, val * 100));
    }, [reliability]);

    const downtimeCosts = useMemo(() => {
        // Estimated downtime hours per week based on availability
        const downtimeHours = operatingHours * (1 - (availability / 100));
        // Assume cost of downtime $500/hr
        return downtimeHours * 500;
    }, [availability, operatingHours]);

    const totalCostOfReliability = totalMaintenanceCost + downtimeCosts;

    // Handlers
    const updateCost = (id: string, val: number) => {
        setMaintenanceCosts(prev => prev.map(m => m.id === id ? { ...m, value: val } : m));
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-[500px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-gray-200 dark:border-gray-700 flex flex-col font-sans"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-b from-orange-50/80 to-transparent dark:from-white/5 dark:to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/20">
                        <Wrench size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Maintenance Ops</h3>
                        <p className="text-xs text-gray-500 font-medium">Reliability & Cost Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-gray-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto px-8 py-2 space-y-8 custom-scrollbar">

                {/* 1. Reliability Metrics */}
                <section>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">System Reliability</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <Activity size={16} />
                                <span className="text-xs font-semibold">MTBF (Hrs)</span>
                            </div>
                            <input
                                type="number"
                                value={reliability.mtbf}
                                onChange={(e) => setReliability({ ...reliability, mtbf: Number(e.target.value) })}
                                className="w-full text-2xl font-bold bg-transparent outline-none text-gray-900 dark:text-gray-100 border-b border-transparent focus:border-orange-500 transition-colors"
                            />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <Clock size={16} />
                                <span className="text-xs font-semibold">MTTR (Hrs)</span>
                            </div>
                            <input
                                type="number"
                                value={reliability.mttr}
                                onChange={(e) => setReliability({ ...reliability, mttr: Number(e.target.value) })}
                                className="w-full text-2xl font-bold bg-transparent outline-none text-gray-900 dark:text-gray-100 border-b border-transparent focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Direct Costs */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Weekly Costs</label>
                        <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs font-mono font-medium">
                            ${(totalMaintenanceCost).toLocaleString()}
                        </div>
                    </div>
                    <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                        {maintenanceCosts.map(item => (
                            <div key={item.id} className="group flex items-center gap-3 text-sm">
                                <span className="flex-1 text-gray-600 dark:text-gray-300 font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.label}</span>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all shadow-sm">
                                    <span className="text-xs text-gray-400">$</span>
                                    <input
                                        type="number"
                                        value={item.value}
                                        onChange={(e) => updateCost(item.id, Number(e.target.value))}
                                        className="w-20 text-right bg-transparent font-mono text-gray-900 dark:text-gray-100 outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Availability Impact */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><AlertTriangle size={14} /> Downtime Risk</label>
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-mono font-medium">
                            ${downtimeCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 uppercase font-bold">Projected Availability</span>
                            <span className={`text-sm font-bold ${availability > 98 ? 'text-green-500' : availability > 90 ? 'text-amber-500' : 'text-red-500'}`}>
                                {availability.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${availability}%` }}
                                className={`h-full ${availability > 98 ? 'bg-green-500' : availability > 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Loss of ${(500).toLocaleString()}/hr during downtime.
                        </p>
                    </div>
                </section>

            </div>

            {/* Footer Summary Container */}
            <div className="bg-white/50 dark:bg-black/20 p-8 border-t border-gray-200 dark:border-gray-800 backdrop-blur-md">
                <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden group">
                    {/* Gloss effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-colors duration-500"></div>

                    <div className="flex items-end justify-between relative z-10 mb-6">
                        <div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Reliability Cost</span>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">${totalCostOfReliability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-orange-400 text-sm font-medium flex items-center justify-end gap-1"><Settings size={14} /> Weekly</div>
                            <div className="text-2xl font-mono font-semibold text-white/90 mt-1">{availability.toFixed(1)}%</div>
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider">Uptime</span>
                        </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex mb-3 ring-1 ring-white/10">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(totalMaintenanceCost / totalCostOfReliability) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-orange-600 to-orange-400" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(downtimeCosts / totalCostOfReliability) * 100}%` }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-gradient-to-r from-red-600 to-red-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-400">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Direct Maint. Cost</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Downtime Impact</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
