import React, { useMemo, useState } from 'react';
import { Globe, Search, ShieldCheck, Star, MapPin, ArrowUpRight, Plane, Sparkles, Building2 } from 'lucide-react';
import { useMarketplaceData } from './integration';

const SPOTLIGHT_ROUTES = [
    {
        id: 'emea',
        title: 'Dubai Free Zone',
        detail: '72h fulfillment window across GCC with bonded storage.',
        badge: 'EMEA',
        gradient: 'from-amber-400/90 via-orange-500/80 to-red-500/80'
    },
    {
        id: 'apac',
        title: 'Singapore Hub',
        detail: 'Priority access to APAC suppliers with digital customs.',
        badge: 'APAC',
        gradient: 'from-cyan-400/80 via-blue-500/80 to-indigo-500/80'
    },
    {
        id: 'americas',
        title: 'Panama Corridor',
        detail: 'North–South cross-dock with guaranteed cold chain.',
        badge: 'AMER',
        gradient: 'from-emerald-400/80 via-green-500/80 to-lime-500/80'
    }
];

const ForeignMarketplacePage: React.FC = () => {
    const { vendors } = useMarketplaceData();
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = useMemo(() => {
        const unique = Array.from(new Set(vendors.map(v => v.category).filter(Boolean)));
        return ['All', ...unique];
    }, [vendors]);

    const filteredVendors = useMemo(() => {
        return vendors.filter(vendor => {
            const matchesCategory = selectedCategory === 'All' || vendor.category === selectedCategory;
            const matchesQuery =
                vendor.name.toLowerCase().includes(query.toLowerCase()) ||
                (vendor.description || '').toLowerCase().includes(query.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [vendors, query, selectedCategory]);

    const totalVendors = vendors.length;
    const averageReliability = totalVendors
        ? Math.round(vendors.reduce((sum, v) => sum + Number(v.reliabilityScore ?? 90), 0) / totalVendors)
        : 0;
    const averageRating = totalVendors
        ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / totalVendors).toFixed(1)
        : '0.0';
    const totalCategories = useMemo(() => new Set(vendors.map(v => v.category).filter(Boolean)).size, [vendors]);

    return (
        <div className="flex flex-col h-full bg-gray-50 text-gray-900 overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white px-6 md:px-10 py-10 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#60a5fa,transparent_35%),radial-gradient(circle_at_80%_0%,#a855f7,transparent_30%),radial-gradient(circle_at_50%_80%,#22c55e,transparent_25%)] pointer-events-none" />
                <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur">
                            <Sparkles size={14} className="text-amber-300" />
                            <span className="text-xs font-semibold tracking-widest">CROSS-BORDER NETWORK</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe size={26} className="text-cyan-200" />
                            <h1 className="text-3xl md:text-4xl font-black leading-tight">Foreign Marketplace</h1>
                        </div>
                        <p className="text-lg text-slate-200/90">
                            Curated, export-ready suppliers with compliance, bonded logistics, and FX-friendly terms.
                            Deploy new trade lanes without leaving your workspace.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                                <p className="text-sm text-slate-200/80">Global Suppliers</p>
                                <p className="text-2xl font-bold mt-1">{totalVendors}</p>
                                <p className="text-xs text-slate-300/80 mt-2">Across {totalCategories} categories</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                                <p className="text-sm text-slate-200/80">Avg. Reliability</p>
                                <p className="text-2xl font-bold mt-1">{averageReliability}%</p>
                                <p className="text-xs text-emerald-200 mt-2 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Verified documents
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                                <p className="text-sm text-slate-200/80">Quality Score</p>
                                <p className="text-2xl font-bold mt-1">{averageRating}</p>
                                <p className="text-xs text-amber-200 mt-2 flex items-center gap-2">
                                    <Star size={14} className="fill-amber-200 text-amber-200" /> Peer-rated partners
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 border border-white/20 rounded-2xl p-5 w-full max-w-md backdrop-blur">
                        <div className="flex items-center gap-3">
                            <Plane size={18} className="text-cyan-200" />
                            <div>
                                <p className="text-xs text-slate-200/80 uppercase tracking-[0.2em]">Route finder</p>
                                <p className="text-lg font-semibold text-white">Find export-grade partners</p>
                            </div>
                        </div>
                        <div className="mt-4 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search suppliers, lanes, or materials"
                                className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-200/70 text-white focus:outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-200/40"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${selectedCategory === cat
                                        ? 'bg-white text-slate-900 border-white shadow-sm'
                                        : 'bg-white/10 text-white border-white/20 hover:border-white/40'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Preferred lanes</p>
                            <h2 className="text-xl font-bold text-gray-900">Spotlight Trade Routes</h2>
                        </div>
                        <button className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            Launch route <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SPOTLIGHT_ROUTES.map(route => (
                            <div
                                key={route.id}
                                className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br ${route.gradient}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-white/15 border border-white/20">{route.badge}</span>
                                    <ShieldCheck size={16} className="text-white/80" />
                                </div>
                                <h3 className="text-lg font-semibold mt-3">{route.title}</h3>
                                <p className="text-sm text-white/90 mt-2 leading-relaxed">{route.detail}</p>
                                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Global suppliers</p>
                            <h3 className="text-lg font-bold text-gray-900">Export-ready partners</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Building2 size={14} />
                            <span>{filteredVendors.length} matches</span>
                        </div>
                    </div>

                    {filteredVendors.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No partners match your filters yet. Try another category or clear the search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
                            {filteredVendors.map(vendor => {
                                const reliability = Number(vendor.reliabilityScore ?? 90);
                                const status = vendor.contractStatus || vendor.status || 'Active';
                                const rating = Number(vendor.rating ?? 0);
                                const paymentTerms = vendor.paymentTerms || 'Net30';

                                return (
                                    <div key={vendor.id} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all bg-white">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{vendor.category || 'General'}</p>
                                                <h4 className="text-lg font-semibold text-gray-900 mt-1">{vendor.name}</h4>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-gray-600">
                                            {vendor.description || 'Export-ready supplier with on-file compliance and bonded logistics support.'}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-gray-700 mt-3">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star size={16} className="fill-amber-500" />
                                                <span className="text-gray-800">{rating.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-emerald-600">
                                                <ShieldCheck size={16} />
                                                <span className="text-gray-800">{reliability}% reliability</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <MapPin size={14} />
                                                <span>Cross-border</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Terms: {paymentTerms}</span>
                                            <button className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                                Open profile <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForeignMarketplacePage;
