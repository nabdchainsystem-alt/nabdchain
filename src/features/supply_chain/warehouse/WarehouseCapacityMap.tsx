import React, { useEffect, useMemo, useState } from 'react';
import {
    Funnel as Filter,
    SquaresFour as LayoutGrid,
    MapTrifold as MapIcon,
    Package as Package2,
    Sparkle as Sparkles,
    MagnifyingGlassPlus as ZoomIn,
    MagnifyingGlassMinus as ZoomOut
} from 'phosphor-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

enum OccupancyStatus {
    EMPTY = 'EMPTY',
    PARTIAL = 'PARTIAL',
    FULL = 'FULL',
    ISSUE = 'ISSUE'
}

enum Zone {
    ZONE_A = 'Receiving (Zone A)',
    ZONE_B = 'Storage (Zone B)',
    ZONE_C = 'Shipping (Zone C)'
}

interface ActivityEvent {
    id: string;
    time: string;
    actor: string;
    action: string;
    location: string;
    status?: 'warning' | 'success' | 'info';
}

interface BinData {
    id: string;
    zone: Zone;
    aisle: number;
    level: number;
    status: OccupancyStatus;
    sku?: string;
    productName?: string;
    quantity: number;
    maxQuantity: number;
    recentActivity: ActivityEvent[];
}

interface Filters {
    zones: Set<Zone>;
    statuses: Set<OccupancyStatus>;
}

const BIN_DATA: BinData[] = [
    {
        id: 'B-02-C',
        zone: Zone.ZONE_B,
        aisle: 2,
        level: 3,
        status: OccupancyStatus.FULL,
        sku: 'WH-X-2024',
        productName: 'Wireless Headphones - Model X',
        quantity: 450,
        maxQuantity: 450,
        recentActivity: [
            { id: '1', time: '2 mins ago', actor: 'John D.', action: 'picked 50 units from', location: 'B-02-C' }
        ]
    },
    {
        id: 'P-02',
        zone: Zone.ZONE_A,
        aisle: 1,
        level: 1,
        status: OccupancyStatus.PARTIAL,
        sku: 'SKU-7721',
        productName: 'Logistics Pallets',
        quantity: 120,
        maxQuantity: 500,
        recentActivity: []
    },
    {
        id: 'B-04-A',
        zone: Zone.ZONE_B,
        aisle: 1,
        level: 1,
        status: OccupancyStatus.ISSUE,
        sku: 'MNT-901',
        productName: 'Maintenance Kit',
        quantity: 10,
        maxQuantity: 100,
        recentActivity: [
            { id: '2', time: '15 mins ago', actor: 'System', action: 'flagged for maintenance check', location: 'B-04-A', status: 'warning' }
        ]
    },
    {
        id: 'B-06-F',
        zone: Zone.ZONE_B,
        aisle: 3,
        level: 4,
        status: OccupancyStatus.PARTIAL,
        sku: 'CRT-500',
        productName: 'Carton Sleeves',
        quantity: 250,
        maxQuantity: 400,
        recentActivity: [
            { id: '5', time: '5 mins ago', actor: 'Maria', action: 'restocked 120 units in', location: 'B-06-F', status: 'success' }
        ]
    },
    {
        id: 'S-01',
        zone: Zone.ZONE_C,
        aisle: 1,
        level: 1,
        status: OccupancyStatus.EMPTY,
        sku: 'SHIP-01',
        productName: 'Outbound Lane 1',
        quantity: 0,
        maxQuantity: 1,
        recentActivity: []
    }
];

const ACTIVITY: ActivityEvent[] = [
    { id: '1', time: '2 mins ago', actor: 'John D.', action: 'picked 50 units from', location: 'B-02-C' },
    { id: '2', time: '15 mins ago', actor: 'System', action: 'flagged for maintenance check', location: 'B-04-A', status: 'warning' },
    { id: '3', time: '42 mins ago', actor: 'Admin', action: 'receipt completed for PO-9921 at', location: 'Zone A', status: 'success' },
    { id: '4', time: '1 hr ago', actor: 'Sarah M.', action: 'moved stock from A-01 to', location: 'B-10' }
];

const patternStyle: React.CSSProperties = {
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '20px 20px'
};

const mapStatuses: Array<{ key: OccupancyStatus; label: string; color: string }> = [
    { key: OccupancyStatus.EMPTY, label: 'Empty', color: 'bg-slate-200' },
    { key: OccupancyStatus.PARTIAL, label: 'Partial', color: 'bg-blue-200' },
    { key: OccupancyStatus.FULL, label: 'Full', color: 'bg-blue-500' },
    { key: OccupancyStatus.ISSUE, label: 'Issue', color: 'bg-amber-500' }
];

const getBinColor = (status: OccupancyStatus) => {
    switch (status) {
        case OccupancyStatus.EMPTY: return 'bg-slate-100';
        case OccupancyStatus.PARTIAL: return 'bg-blue-100';
        case OccupancyStatus.FULL: return 'bg-blue-500 text-white';
        case OccupancyStatus.ISSUE: return 'bg-amber-500 text-white';
        default: return 'bg-slate-100';
    }
};

const CapacityFilters: React.FC<{
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}> = ({ filters, setFilters }) => {
    const toggleZone = (zone: Zone) => {
        const next = new Set(filters.zones);
        next.has(zone) ? next.delete(zone) : next.add(zone);
        setFilters({ ...filters, zones: next });
    };

    const toggleStatus = (status: OccupancyStatus) => {
        const next = new Set(filters.statuses);
        next.has(status) ? next.delete(status) : next.add(status);
        setFilters({ ...filters, statuses: next });
    };

    const reset = () => {
        setFilters({
            zones: new Set(Object.values(Zone)),
            statuses: new Set(Object.values(OccupancyStatus))
        });
    };

    return (
        <aside className="w-72 flex-none bg-white border-r border-slate-200 flex-col hidden xl:flex">
            <div className="p-5 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-800">
                    <Filter size={16} />
                    <h3 className="font-semibold text-sm">Filters</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Refine the floor view</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Zones</h4>
                    <div className="space-y-2">
                        {[Zone.ZONE_A, Zone.ZONE_B, Zone.ZONE_C].map(zone => (
                            <label key={zone} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.zones.has(zone)}
                                    onChange={() => toggleZone(zone)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{zone}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {mapStatuses.map(({ key, label, color }) => {
                            const active = filters.statuses.has(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleStatus(key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                                        active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-200 text-slate-700'
                                    }`}
                                >
                                    <span className={`size-2.5 rounded-full ${color}`}></span>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={reset}
                    className="w-full py-2 px-4 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
                >
                    Reset Filters
                </button>
            </div>
        </aside>
    );
};

const KpiCards: React.FC<{
    bins: BinData[];
}> = ({ bins }) => {
    const totals = useMemo(() => {
        const quantity = bins.reduce((sum, b) => sum + b.quantity, 0);
        const maxQuantity = bins.reduce((sum, b) => sum + b.maxQuantity, 0);
        const issues = bins.filter(b => b.status === OccupancyStatus.ISSUE).length;
        const inbound = bins.filter(b => b.zone === Zone.ZONE_A && b.status !== OccupancyStatus.EMPTY).length;
        const utilization = maxQuantity ? Math.round((quantity / maxQuantity) * 100) : 0;
        return { quantity, maxQuantity, issues, inbound, utilization };
    }, [bins]);

    const cards = [
        { label: 'Capacity Used', value: `${totals.utilization}%`, delta: '+2%', positive: true },
        { label: 'Pending In', value: totals.inbound.toString(), delta: '+1 PO', positive: true },
        { label: 'Total Units', value: totals.quantity.toLocaleString(), delta: null, positive: null },
        { label: 'Issues', value: totals.issues.toString(), delta: totals.issues ? '+1' : '0', positive: totals.issues === 0 }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => (
                <div key={card.label} className="flex flex-col gap-1 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{card.value}</span>
                        {card.delta && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                card.positive === true ? 'bg-emerald-100 text-emerald-700' :
                                card.positive === false ? 'bg-amber-100 text-amber-700' : 'text-slate-400'
                            }`}>
                                {card.delta}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const WarehouseGrid: React.FC<{
    bins: BinData[];
    selectedBinId?: string;
    onSelectBin: (bin: BinData) => void;
}> = ({ bins, selectedBinId, onSelectBin }) => {
    const zoneABins = bins.filter(b => b.zone === Zone.ZONE_A);
    const zoneBBins = bins.filter(b => b.zone === Zone.ZONE_B);
    const zoneCBins = bins.filter(b => b.zone === Zone.ZONE_C);

    const aisles = [1, 2, 3];
    const levels = [1, 2, 3, 4, 5, 6];

    return (
        <div className="flex-1 px-6 pb-6">
            <div className="relative w-full h-full rounded-2xl border border-slate-200 bg-white shadow-inner overflow-hidden flex flex-col">
                <div className="absolute inset-0 opacity-50 pointer-events-none" style={patternStyle}></div>
                <div className="w-full h-full overflow-auto p-8">
                    <div className="relative mx-auto max-w-6xl h-full min-h-full border-4 border-slate-300 rounded-xl p-8 bg-slate-50/70 shadow-xl grid grid-cols-12 grid-rows-6 gap-6">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-b-lg shadow-md flex items-center gap-1">
                            <MapIcon size={12} />
                            Receiving Bay
                        </div>

                        <div className="col-span-3 row-span-6 border-2 border-dashed border-slate-300 rounded-lg p-4 relative bg-white/70">
                            <div className="absolute top-2 right-2 text-[10px] text-slate-400 uppercase font-bold">Zone A</div>
                            <div className="grid grid-cols-2 gap-3">
                                {zoneABins.map(bin => (
                                    <button
                                        key={bin.id}
                                        onClick={() => onSelectBin(bin)}
                                        className={`aspect-square rounded-lg border border-blue-100 flex items-center justify-center text-[11px] font-bold ${getBinColor(bin.status)} ${
                                            selectedBinId === bin.id ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''
                                        } transition`}
                                    >
                                        {bin.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-6 row-span-6 flex flex-col justify-around px-2">
                            {aisles.map(aisle => (
                                <div key={aisle} className="w-full space-y-2">
                                    <div className="grid grid-cols-6 gap-2">
                                        {levels.map(level => {
                                            const bin = zoneBBins.find(b => b.aisle === aisle && b.level === level);
                                            return (
                                                <button
                                                    key={`${aisle}-${level}`}
                                                    onClick={() => bin && onSelectBin(bin)}
                                                    className={`h-12 rounded border border-slate-300 ${bin ? getBinColor(bin.status) : 'bg-slate-100'} ${selectedBinId === bin?.id ? 'ring-2 ring-blue-600 ring-inset' : ''} transition`}
                                                    aria-label={`Aisle ${aisle} slot ${level}`}
                                                >
                                                    {bin && (
                                                        <span className="text-[10px] font-semibold">{bin.id}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-[0.2em]">Aisle {aisle}</p>
                                </div>
                            ))}
                        </div>

                        <div className="col-span-3 row-span-6 border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white/70 flex flex-col justify-end gap-3">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
                                <span>Zone C</span>
                                <span className="flex items-center gap-1 text-blue-600"><LayoutGrid size={12} /> Shipping</span>
                            </div>
                            {zoneCBins.map(bin => (
                                <button
                                    key={bin.id}
                                    onClick={() => onSelectBin(bin)}
                                    className={`h-14 rounded border border-slate-200 flex items-center justify-between px-3 text-sm ${selectedBinId === bin.id ? 'ring-2 ring-blue-600' : ''} ${getBinColor(bin.status)} transition`}
                                >
                                    <span className="font-semibold">{bin.productName || bin.id}</span>
                                    <span className="text-[11px] uppercase font-bold">{bin.id}</span>
                                </button>
                            ))}
                            {!zoneCBins.length && (
                                <div className="h-14 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                                    No outbound lanes
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailsPanel: React.FC<{ selectedBin: BinData | null; activity: ActivityEvent[]; aiTip: string; aiLoading: boolean }> = ({ selectedBin, activity, aiTip, aiLoading }) => (
    <aside className="w-80 flex-none bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-base">Details</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
            {selectedBin ? (
                <div className="p-5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Package2 size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold leading-tight">Bin {selectedBin.id}</h4>
                            <p className="text-xs text-slate-500">{selectedBin.zone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                            <span className={`text-xs font-bold ${selectedBin.status === OccupancyStatus.ISSUE ? 'text-amber-700' : 'text-emerald-600'}`}>{selectedBin.status}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Occupancy</p>
                            <span className="text-xs font-bold">{Math.round((selectedBin.quantity / selectedBin.maxQuantity) * 100)}%</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 mb-1">Stock Item</p>
                        <p className="text-sm font-bold">{selectedBin.productName || 'Unassigned'}</p>
                        <p className="text-[10px] text-blue-600 font-mono mt-0.5">{selectedBin.sku}</p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 mb-1">Quantity</p>
                        <div className="flex justify-between text-sm font-bold mb-1">
                            <span>{selectedBin.quantity} Units</span>
                            <span className="text-slate-400">/ {selectedBin.maxQuantity}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${(selectedBin.quantity / selectedBin.maxQuantity) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                            <Sparkles size={14} className="text-blue-600" />
                            Smart Tip
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{aiLoading ? 'Analyzing live capacity...' : aiTip || 'Enable Gemini API to see live recommendations.'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Activity</h4>
                        <div className="space-y-4">
                            {(selectedBin.recentActivity.length ? selectedBin.recentActivity : activity).map(ev => (
                                <div key={ev.id} className="flex gap-3 text-xs">
                                    <div className={`size-2 mt-1 rounded-full ${ev.status === 'warning' ? 'bg-amber-500' : ev.status === 'success' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{ev.actor}</p>
                                        <p className="text-slate-600">{ev.action} {ev.location}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{ev.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 text-slate-400 text-center">
                    <Package2 size={40} className="opacity-30" />
                    <p className="text-sm mt-3">Select a storage bin on the map to see details</p>
                </div>
            )}
        </div>
    </aside>
);

export const WarehouseCapacityMap: React.FC<{ boardName?: string }> = ({ boardName }) => {
    const [filters, setFilters] = useState<Filters>({
        zones: new Set(Object.values(Zone)),
        statuses: new Set(Object.values(OccupancyStatus))
    });
    const [selectedBin, setSelectedBin] = useState<BinData | null>(BIN_DATA[0] || null);
    const [aiTip, setAiTip] = useState('AI is standing by with recommendations.');
    const [aiLoading, setAiLoading] = useState(false);

    const filteredBins = useMemo(() => {
        return BIN_DATA.filter(bin => filters.zones.has(bin.zone) && filters.statuses.has(bin.status));
    }, [filters]);

    useEffect(() => {
        if (selectedBin && !filteredBins.find(b => b.id === selectedBin.id)) {
            setSelectedBin(filteredBins[0] || null);
        } else if (!selectedBin && filteredBins.length) {
            setSelectedBin(filteredBins[0]);
        }
    }, [filteredBins, selectedBin]);

    useEffect(() => {
        const runAi = async () => {
            const apiKey =
                (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
                (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || process.env.API_KEY : '');
            if (!apiKey) {
                setAiTip('Add VITE_GEMINI_API_KEY to enable Smart Tips.');
                return;
            }
            try {
                setAiLoading(true);
                const ai = new GoogleGenerativeAI(apiKey);
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const utilization = filteredBins.reduce((sum, b) => sum + b.quantity, 0) / Math.max(1, filteredBins.reduce((sum, b) => sum + b.maxQuantity, 0));
                const issues = filteredBins.filter(b => b.status === OccupancyStatus.ISSUE).length;
                const prompt = `You are an operations analyst. Current warehouse utilization is ${(utilization * 100).toFixed(1)}% with ${issues} flagged issues. Provide one concise, actionable tip (max 35 words).`;
                const response = await model.generateContent(prompt);
                const text = response.response.text();
                if (text) setAiTip(text);
            } catch (err) {
                setAiTip('Smart Tips are temporarily unavailable.');
            } finally {
                setAiLoading(false);
            }
        };
        runAi();
    }, [filteredBins]);

    return (
        <div className="flex h-full w-full bg-white text-slate-900">
            <div className="flex flex-1 overflow-hidden">
                <CapacityFilters filters={filters} setFilters={setFilters} />

                <main className="flex-1 flex flex-col min-w-0">
                    <div className="flex-none p-6 pb-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl md:text-[32px] font-medium tracking-tight leading-tight text-slate-900">
                                    {boardName || 'Warehouse'} Capacity Map
                                </h1>
                                <p className="text-base md:text-lg text-slate-600 font-normal leading-relaxed">
                                    Live inventory positioning and facility status
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-blue-300">
                                    <ZoomIn size={14} /> Zoom In
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:border-blue-300">
                                    <ZoomOut size={14} /> Zoom Out
                                </button>
                            </div>
                        </div>
                        <KpiCards bins={filteredBins} />
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        <WarehouseGrid
                            bins={filteredBins}
                            selectedBinId={selectedBin?.id}
                            onSelectBin={setSelectedBin}
                        />
                        <DetailsPanel selectedBin={selectedBin} activity={ACTIVITY} aiTip={aiTip} aiLoading={aiLoading} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WarehouseCapacityMap;
