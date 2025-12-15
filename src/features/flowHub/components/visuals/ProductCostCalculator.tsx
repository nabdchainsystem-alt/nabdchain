import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, RefreshCw, DollarSign, TrendingUp, Package, Users, Zap, Truck, Layers } from 'lucide-react';

interface CostItem {
    id: string;
    label: string;
    value: number;
    unit: string;
}

export const ProductCostCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // --- State ---
    const [batchSize, setBatchSize] = useState(10000);
    const [activeTab, setActiveTab] = useState<'batch' | 'materials' | 'labor' | 'overhead'>('batch');

    // Materials
    const [materials, setMaterials] = useState<CostItem[]>([
        { id: 'mat-1', label: 'Resin (PET)', value: 0.05, unit: 'per unit' },
        { id: 'mat-2', label: 'Caps', value: 0.01, unit: 'per unit' },
        { id: 'mat-3', label: 'Labels', value: 0.02, unit: 'per unit' },
        { id: 'mat-4', label: 'Water Treatment', value: 0.005, unit: 'per unit' },
    ]);

    // Labor
    const [labor, setLabor] = useState({
        headcount: 12,
        avgHourlyRate: 25,
        hoursPerBatch: 8
    });

    // Overhead
    const [overhead, setOverhead] = useState([
        { id: 'ov-1', label: 'Energy (kWh)', value: 150, unit: 'total' },
        { id: 'ov-2', label: 'Maintenance', value: 50, unit: 'total' },
        { id: 'ov-3', label: 'Depreciation', value: 200, unit: 'total' },
    ]);

    // Logistics
    const [logistics, setLogistics] = useState({
        storageCost: 0.01, // per unit
        shippingCost: 0.05 // per unit
    });

    // --- Calculations ---
    const totalMaterials = useMemo(() => {
        return materials.reduce((sum, item) => sum + item.value, 0) * batchSize;
    }, [materials, batchSize]);

    const totalLabor = useMemo(() => {
        return labor.headcount * labor.avgHourlyRate * labor.hoursPerBatch;
    }, [labor]);

    const totalOverhead = useMemo(() => {
        return overhead.reduce((sum, item) => sum + item.value, 0);
    }, [overhead]);

    const totalLogistics = useMemo(() => {
        return (logistics.storageCost + logistics.shippingCost) * batchSize;
    }, [logistics, batchSize]);

    const totalCost = totalMaterials + totalLabor + totalOverhead + totalLogistics;
    const costPerUnit = totalCost / batchSize;

    // Handlers
    const updateMaterial = (id: string, val: number) => {
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, value: val } : m));
    };

    const updateOverhead = (id: string, val: number) => {
        setOverhead(prev => prev.map(o => o.id === id ? { ...o, value: val } : o));
    };

    const tabs = [
        { id: 'batch', label: 'Batch', icon: Package },
        { id: 'materials', label: 'Materials', icon: Layers }, // Need Layers import
        { id: 'labor', label: 'Labor', icon: Users },
        { id: 'overhead', label: 'Overhead', icon: Zap },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 z-40"
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 h-full w-[500px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-gray-200 dark:border-gray-700 flex flex-col font-sans"
            >
                {/* Header */}
                <div className="flex flex-col px-8 py-6 bg-gradient-to-b from-gray-50/80 to-transparent dark:from-white/5 dark:to-transparent border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <Calculator size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Cost Calculator</h3>
                                <p className="text-xs text-gray-500 font-medium">Unit Economics</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                <RefreshCw size={18} />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Scroll */}
                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">

                    <AnimatePresence mode="wait">
                        {activeTab === 'batch' && (
                            <motion.div
                                key="batch"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <section>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Production Parameters</label>
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                            <Package size={24} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block">Target Output</span>
                                            <span className="text-xs text-gray-500">Units per Batch</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={batchSize}
                                            onChange={(e) => setBatchSize(Number(e.target.value))}
                                            className="w-32 text-right bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-600 rounded-lg pl-3 pr-2 py-2 text-base font-mono font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                </section>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                                        <TrendingUp size={16} /> Impact Analysis
                                    </h4>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                                        Increasing batch size typically reduces per-unit overhead allocation but increases raw material holding costs. Current efficiency rating: <strong>Optimal</strong>.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'materials' && (
                            <motion.div
                                key="materials"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Bill of Materials</label>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-mono font-medium">
                                            ${(totalMaterials).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                                        {materials.map(mat => (
                                            <div key={mat.id} className="group flex items-center gap-3 text-sm">
                                                <span className="flex-1 text-gray-600 dark:text-gray-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{mat.label}</span>
                                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
                                                    <span className="text-xs text-gray-400">$</span>
                                                    <input
                                                        type="number" step="0.001" value={mat.value}
                                                        onChange={(e) => updateMaterial(mat.id, Number(e.target.value))}
                                                        className="w-20 text-right bg-transparent font-mono text-gray-900 dark:text-gray-100 outline-none"
                                                    />
                                                    <span className="text-[10px] text-gray-400 w-12 text-right border-l border-gray-100 dark:border-gray-800 pl-2">{mat.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'labor' && (
                            <motion.div
                                key="labor"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><Users size={14} /> Direct Labor</label>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-mono font-medium">
                                            ${(totalLabor).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: 'Headcount', val: labor.headcount, set: (v: number) => setLabor({ ...labor, headcount: v }) },
                                            { label: 'Rate / Hr', val: labor.avgHourlyRate, set: (v: number) => setLabor({ ...labor, avgHourlyRate: v }) },
                                            { label: 'Hrs / Batch', val: labor.hoursPerBatch, set: (v: number) => setLabor({ ...labor, hoursPerBatch: v }) }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                                                <input
                                                    type="number" value={item.val}
                                                    onChange={e => item.set(Number(e.target.value))}
                                                    className="w-24 text-right bg-transparent font-mono text-lg font-semibold text-gray-900 dark:text-gray-100 outline-none border-b border-transparent focus:border-purple-500 transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'overhead' && (
                            <motion.div
                                key="overhead"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <section>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Manufacturing Overhead</label>
                                    <div className="space-y-3">
                                        {overhead.map(ov => (
                                            <div key={ov.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">{ov.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">$</span>
                                                    <span className="font-mono text-gray-900 dark:text-gray-100">{ov.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="mt-8">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Logistics</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-500 block mb-1">Storage / Unit</span>
                                            <input type="number" step="0.01" value={logistics.storageCost} onChange={e => setLogistics({ ...logistics, storageCost: Number(e.target.value) })} className="w-full bg-transparent font-mono text-sm outline-none" />
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-500 block mb-1">Shipping / Unit</span>
                                            <input type="number" step="0.01" value={logistics.shippingCost} onChange={e => setLogistics({ ...logistics, shippingCost: Number(e.target.value) })} className="w-full bg-transparent font-mono text-sm outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Footer Summary Container */}
                <div className="bg-white/50 dark:bg-black/20 p-8 border-t border-gray-200 dark:border-gray-800 backdrop-blur-md">
                    <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden group">
                        {/* Gloss effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500"></div>

                        <div className="flex items-end justify-between relative z-10 mb-6">
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Estimated Unit Cost</span>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">${costPerUnit.toFixed(4)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-emerald-400 text-sm font-medium flex items-center justify-end gap-1"><TrendingUp size={14} /> +24% Margin</div>
                                <div className="text-2xl font-mono font-semibold text-white/90 mt-1">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Total Batch</span>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex mb-3 ring-1 ring-white/10">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(totalMaterials / totalCost) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(totalLabor / totalCost) * 100}%` }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-gradient-to-r from-purple-600 to-purple-400" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(totalOverhead / totalCost) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-orange-600 to-orange-400" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(totalLogistics / totalCost) * 100}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-gray-400">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Materials</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Labor</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Overhead</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Logistics</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};
