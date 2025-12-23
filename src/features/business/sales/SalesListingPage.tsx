import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Tag, CheckCircle2, Clock3, BarChart3, Search, Layers, ArrowLeft } from 'lucide-react';

type ListingStatus = 'Draft' | 'Live' | 'Paused';

interface Listing {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  status: ListingStatus;
  channel: string;
  lastUpdated: string;
}

const DEFAULT_LISTINGS: Listing[] = [
  { id: 'L-1045', name: 'Smart Thermostat Pro', sku: 'THR-8841', category: 'IoT & Smart Home', price: 499, currency: 'SAR', stock: 320, status: 'Live', channel: 'Nabd Market', lastUpdated: '2025-02-02T09:20:00Z' },
  { id: 'L-1046', name: 'Cold Chain Sensor', sku: 'CCS-220', category: 'Industrial', price: 799, currency: 'SAR', stock: 85, status: 'Live', channel: 'Pharma Hub', lastUpdated: '2025-02-01T15:40:00Z' },
  { id: 'L-1047', name: 'Retail Shelf Camera', sku: 'CAM-551', category: 'Vision & Analytics', price: 1299, currency: 'SAR', stock: 48, status: 'Draft', channel: 'Nabd Prime', lastUpdated: '2025-01-31T12:05:00Z' }
];

interface SalesListingPageProps {
  onNavigate?: (view: string) => void;
}

const SalesListingPage: React.FC<SalesListingPageProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('sales-listings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_LISTINGS;
      }
    }
    return DEFAULT_LISTINGS;
  });

  const [query, setQuery] = useState('');
  const [form, setForm] = useState<Omit<Listing, 'id' | 'lastUpdated'>>({
    name: '',
    sku: '',
    category: '',
    price: 0,
    currency: 'SAR',
    stock: 0,
    status: 'Draft',
    channel: 'Nabd Market'
  });

  useEffect(() => {
    localStorage.setItem('sales-listings', JSON.stringify(listings));
  }, [listings]);

  const stats = useMemo(() => {
    const live = listings.filter(l => l.status === 'Live').length;
    const draft = listings.filter(l => l.status === 'Draft').length;
    const paused = listings.filter(l => l.status === 'Paused').length;
    const stock = listings.reduce((acc, l) => acc + l.stock, 0);
    const gmv = listings.reduce((acc, l) => acc + l.price * Math.max(1, Math.min(l.stock, 5)), 0);
    return { live, draft, paused, stock, gmv };
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.sku.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.channel.toLowerCase().includes(q)
    );
  }, [listings, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category) return;
    const now = new Date().toISOString();
    const newListing: Listing = {
      ...form,
      id: `L-${Date.now()}`,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      lastUpdated: now
    };
    setListings(prev => [newListing, ...prev]);
    setForm({
      name: '',
      sku: '',
      category: '',
      price: 0,
      currency: 'SAR',
      stock: 0,
      status: 'Draft',
      channel: form.channel
    });
  };

  const goBack = () => {
    if (onNavigate) {
      onNavigate('sales_factory');
    } else {
      localStorage.setItem('app-active-view', 'sales_factory');
    }
  };

  return (
    <div className="min-h-full p-6 bg-[#f9f9fb] dark:bg-[#0b0c11] text-[#0f0f10] dark:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-white/15 flex items-center justify-center">
                <Layers />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Listings</p>
                <h1 className="text-2xl font-semibold">Publish products</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add SKUs, set pricing, and track live status.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={goBack}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-gray-800 dark:text-white hover:-translate-x-0.5 transition-transform"
              >
                <ArrowLeft size={16} />
                Back to Sales Factory
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Live SKUs</p>
                <p className="text-2xl font-semibold">{stats.live}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Drafts</p>
                <p className="text-2xl font-semibold">{stats.draft}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Live</p>
                <p className="text-xl font-semibold">{stats.live}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Draft</p>
                <p className="text-xl font-semibold">{stats.draft}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">GMV potential</p>
                <p className="text-xl font-semibold">{stats.gmv.toLocaleString()} {listings[0]?.currency || 'SAR'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Tag size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Stock</p>
                <p className="text-xl font-semibold">{stats.stock} units</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1 bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">New listing</p>
                <h2 className="text-lg font-semibold">Publish a product</h2>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Product name</label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Smart Thermostat Pro"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">SKU</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    placeholder="THR-1234"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Category</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="IoT & Smart Home"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Price</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Currency</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Stock</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Channel</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.channel}
                    onChange={e => setForm({ ...form, channel: e.target.value })}
                  >
                    <option>Nabd Market</option>
                    <option>Pharma Hub</option>
                    <option>Retail Prime</option>
                    <option>Wholesale</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as ListingStatus })}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Live">Live</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black text-white font-semibold border border-black hover:translate-y-[-1px] transition-transform"
              >
                <Plus size={18} />
                Publish listing
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">All listings</p>
                <h2 className="text-lg font-semibold">Manage SKUs</h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f121a] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="Search name, SKU, channel"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(listing => (
                <div key={listing.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{listing.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{listing.sku} · {listing.category}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200">
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/15">{listing.channel}</span>
                    <span className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/15">{listing.price.toLocaleString()} {listing.currency}</span>
                    <span className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/15">{listing.stock} in stock</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Updated {new Date(listing.lastUpdated).toLocaleString()}</span>
                    <button
                      onClick={() => setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: l.status === 'Live' ? 'Paused' : 'Live' } : l))}
                      className="font-semibold underline"
                    >
                      {listing.status === 'Live' ? 'Pause' : 'Go live'}
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-8 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-white/15 rounded-xl">
                  No listings match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesListingPage;
