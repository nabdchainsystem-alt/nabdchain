import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, RefreshCw, BarChart3, Users, Clock, Box } from 'lucide-react';

export const PlanningTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // --- State ---
    const [weeklyDemand, setWeeklyDemand] = useState(50000); // Units per week

    // Shifts
    const [shiftConfig, setShiftConfig] = useState({
        shiftsPerDay: 2,
        hoursPerShift: 8,
        daysPerWeek: 5,
    });

    // Line Capacity
    const [lineSpeed, setLineSpeed] = useState(1200); // Units per hour (theoretical)
    const [efficiency, setEfficiency] = useState(0.85); // OEE 85%

    // --- Calculations ---
    const totalOperatingHours = useMemo(() => {
        return shiftConfig.shiftsPerDay * shiftConfig.hoursPerShift * shiftConfig.daysPerWeek;
    }, [shiftConfig]);

    const effectiveCapacity = useMemo(() => {
        return Math.floor(totalOperatingHours * lineSpeed * efficiency);
    }, [totalOperatingHours, lineSpeed, efficiency]);

    const variance = effectiveCapacity - weeklyDemand;
    const utilization = useMemo(() => {
        return (weeklyDemand / (totalOperatingHours * lineSpeed)) * 100;
    }, [weeklyDemand, totalOperatingHours, lineSpeed]);

    const requiredHours = useMemo(() => {
        return Math.ceil(weeklyDemand / (lineSpeed * efficiency));
    }, [weeklyDemand, lineSpeed, efficiency]);


    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-[500px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-gray-200 dark:border-gray-700 flex flex-col font-sans"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-b from-purple-50/80 to-transparent dark:from-white/5 dark:to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Production Planning</h3>
                        <p className="text-xs text-gray-500 font-medium">Capacity & Demand Balancing</p>
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

                {/* 1. Demand Input */}
                <section>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Demand Forecast</label>

                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-shadow hover:shadow-md">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <Box size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block">Weekly Target</span>
                            <span className="text-xs text-gray-500">Units required</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={weeklyDemand}
                                onChange={(e) => setWeeklyDemand(Number(e.target.value))}
                                className="w-32 text-right bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-600 rounded-lg pl-3 pr-2 py-2 text-base font-mono font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Capacity Config */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Shift Configuration</label>
                        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-mono font-medium">
                            {totalOperatingHours} Hrs / Wk
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Shifts/Day', val: shiftConfig.shiftsPerDay, set: (v: number) => setShiftConfig({ ...shiftConfig, shiftsPerDay: v }) },
                            { label: 'Hrs/Shift', val: shiftConfig.hoursPerShift, set: (v: number) => setShiftConfig({ ...shiftConfig, hoursPerShift: v }) },
                            { label: 'Days/Week', val: shiftConfig.daysPerWeek, set: (v: number) => setShiftConfig({ ...shiftConfig, daysPerWeek: v }) }
                        ].map((item, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                                <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5">{item.label}</span>
                                <input
                                    type="number"
                                    value={item.val}
                                    onChange={e => item.set(Number(e.target.value))}
                                    className="w-full bg-transparent font-mono text-lg font-semibold text-center text-gray-900 dark:text-gray-100 outline-none border-b border-transparent focus:border-purple-500 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Efficiency & Line Speed */}
                <section>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Line Performance</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">Max Speed (UPH)</span>
                            <input
                                type="number"
                                value={lineSpeed}
                                onChange={e => setLineSpeed(Number(e.target.value))}
                                className="w-full bg-transparent font-mono text-xl font-bold text-gray-900 dark:text-gray-100 outline-none"
                            />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">Efficiency (OEE)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.01"
                                    value={efficiency}
                                    onChange={e => setEfficiency(Number(e.target.value))}
                                    className="flex-1 accent-purple-600"
                                />
                                <span className="font-mono text-sm font-bold w-12 text-right">{(efficiency * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer Summary Container */}
            <div className="bg-white/50 dark:bg-black/20 p-8 border-t border-gray-200 dark:border-gray-800 backdrop-blur-md">
                <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden group">
                    {/* Gloss effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors duration-500"></div>

                    <div className="flex items-end justify-between relative z-10 mb-6">
                        <div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Effective Capacity</span>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{effectiveCapacity.toLocaleString()}</span>
                                <span className="text-sm text-gray-500 font-medium">units</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-medium flex items-center justify-end gap-1 ${variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                <BarChart3 size={14} /> {variance >= 0 ? '+' : ''}{variance.toLocaleString()}
                            </div>
                            <div className="text-2xl font-mono font-semibold text-white/90 mt-1">{requiredHours} Hrs</div>
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider">Required Time</span>
                        </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex mb-3 ring-1 ring-white/10 relative">
                        {/* Capacity Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20" style={{ left: '100%' }}></div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (weeklyDemand / effectiveCapacity) * 100)}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full bg-gradient-to-r ${weeklyDemand > effectiveCapacity ? 'from-red-600 to-red-400' : 'from-blue-600 to-blue-400'}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-400">
                        <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${weeklyDemand > effectiveCapacity ? 'bg-red-500' : 'bg-blue-500'}`} /> Demand Load</div>
                        <div className="flex items-center gap-1.5 justify-end">Utilization: {utilization.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
