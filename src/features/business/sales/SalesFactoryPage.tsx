import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  Factory,
  Globe,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Wallet,
  Plus
} from 'lucide-react';

const kpis = [
  { label: 'GMV run-rate', value: '$2.8M', delta: '+12% vs 30d', icon: BarChart3, color: 'from-emerald-500 to-teal-500' },
  { label: 'Open POs', value: '24', delta: '8 in SLA', icon: ShoppingCart, color: 'from-blue-500 to-indigo-500' },
  { label: 'Fill rate', value: '92%', delta: '+3% week', icon: ShieldCheck, color: 'from-cyan-500 to-sky-500' },
  { label: 'Avg lead time', value: '4.1 days', delta: '-0.6d vs target', icon: Clock3, color: 'from-amber-500 to-orange-500' }
];

const orderBook = [
  { id: 'PO-1045', buyer: 'Nabd Retail Hub', value: '$82.4K', stage: 'Packing', eta: '2 days', status: 'amber', lines: '118 lines' },
  { id: 'PO-1042', buyer: 'Gulf Mart', value: '$41.9K', stage: 'In transit', eta: 'ETA 03 Mar', status: 'emerald', lines: '64 lines' },
  { id: 'RFQ-239', buyer: 'Nabd Pharma', value: '$27.5K', stage: 'Awaiting confirmation', eta: 'Respond in 6h', status: 'sky', lines: '27 lines' },
  { id: 'PO-1031', buyer: 'Mega Stores', value: '$96.1K', stage: 'Ready to ship', eta: 'Slot 18:00', status: 'blue', lines: '142 lines' }
];

const actionQueue = [
  { title: 'Confirm slot for PO-1045 (Jeddah)', tag: 'Logistics', due: 'Today', owner: 'Fulfillment', tone: 'urgent' },
  { title: 'Upload halal certificate for SKU 8841', tag: 'Compliance', due: 'Due in 2d', owner: 'QA', tone: 'warning' },
  { title: 'Approve promo pricing for Nabd weekend', tag: 'Pricing', due: 'Waiting on you', owner: 'Sales Ops', tone: 'info' },
  { title: 'Replenish Riyadh FC buffer stock', tag: 'Inventory', due: 'Reorder point hit', owner: 'Warehouse', tone: 'info' }
];

const readiness = [
  { label: 'Catalog completeness', value: '34 / 36 SKUs ready', progress: 94 },
  { label: 'Compliance & docs', value: '8 docs expiring in 30d', progress: 78 },
  { label: 'Channel listings', value: '3 programs live, 1 in onboarding', progress: 72 }
];

const programs = [
  { name: 'Nabd Chain Market Prime', detail: 'Auto-replenish for A-class SKUs', status: 'Live', impact: '+18% volume', color: 'emerald' },
  { name: 'Dropship to Stores', detail: 'Same-day to Nabd outlets (KSA)', status: 'Pilot', impact: '4 cities active', color: 'sky' },
  { name: 'Pharma Cold Chain', detail: '2-8°C lanes, proof-of-temp', status: 'Onboarding', impact: 'Docs pending', color: 'amber' }
];

const modules = [
  { title: 'Catalog & Pricing', status: 'Synced', note: 'Master data + tiered price lists', icon: Package, accent: 'blue' },
  { title: 'Orders & Slots', status: 'Live', note: 'PO intake, dock & courier slots', icon: Boxes, accent: 'emerald' },
  { title: 'Fulfillment', status: 'Carrier mix 3 / 5 ready', note: 'Lane adherence 94%', icon: Truck, accent: 'sky' },
  { title: 'Finance', status: 'Self-billing weekly', note: 'Wallet balance 182K SAR', icon: Wallet, accent: 'amber' }
];

const productSpotlight = [
  { name: 'Smart Thermostat Pro', sku: 'THR-8841', channel: 'Nabd Market', price: 'SAR 499', status: 'Live' },
  { name: 'Cold Chain Sensor', sku: 'CCS-220', channel: 'Pharma Hub', price: 'SAR 799', status: 'Live' },
  { name: 'Retail Shelf Camera', sku: 'CAM-551', channel: 'Retail Prime', price: 'SAR 1,299', status: 'Draft' }
];

const toneStyles: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100'
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const ProgressBar: React.FC<{ value: number; tone: 'emerald' | 'amber' | 'sky' }> = ({ value, tone }) => (
  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
    <div
      className={`h-full rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-sky-500'}`}
      style={{ width: `${value}%` }}
    />
  </div>
);

interface SalesFactoryPageProps {
  onNavigate?: (view: string) => void;
}

const SalesFactoryPage: React.FC<SalesFactoryPageProps> = ({ onNavigate }) => {
  const handleInsertProduct = () => {
    if (onNavigate) {
      onNavigate('sales_listing');
    } else {
      localStorage.setItem('app-active-view', 'sales_listing');
    }
  };

  return (
    <div className="min-h-full bg-[#f9f9fb] dark:bg-[#0b0c11] text-[#0f0f10] dark:text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-white/15 flex items-center justify-center">
                <Factory size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Sales portal</p>
                <h1 className="text-2xl font-semibold">Seller workspace</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Publish products, track orders, keep compliance in check.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex flex-col text-right">
                <span className="text-xs uppercase text-gray-500 dark:text-gray-400">Account</span>
                <div className="flex items-center gap-2 justify-end">
                  <BadgeCheck className="text-gray-800 dark:text-white" size={16} />
                  <span className="text-sm font-semibold">Trusted supplier</span>
                </div>
              </div>
              <button
                onClick={handleInsertProduct}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black text-white font-semibold border border-black hover:translate-y-[-1px] transition-transform"
              >
                <Plus size={16} />
                Add product
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{kpi.delta}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</p>
                <p className="text-2xl font-semibold">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Order book */}
          <div className="xl:col-span-2 bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Order book</p>
                  <h2 className="text-lg font-semibold">Live intake & fulfillment</h2>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <Activity size={16} />
                Auto-refreshing every 2m
              </div>
            </div>
            <div className="space-y-3">
              {orderBook.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f121a] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-gray-900 dark:bg-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{order.id}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200">{order.stage}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyer}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{order.lines}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{order.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.eta}</p>
                    </div>
                    <button className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-transparent flex items-center gap-1">
                      Assign slot <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action queue */}
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Action queue</p>
                <h2 className="text-lg font-semibold">What needs you now</h2>
              </div>
            </div>
            <div className="space-y-3">
              {actionQueue.map((item) => (
                <div key={item.title} className={`rounded-xl border ${toneStyles[item.tone]} p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{item.title}</span>
                    {item.tone === 'urgent' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-white/50 border border-current/10">{item.tag}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/50 border border-current/10">{item.owner}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/50 border border-current/10">{item.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Programs */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Market programs</p>
                <h2 className="text-lg font-semibold">Where you are selling</h2>
              </div>
            </div>
            <div className="space-y-3">
              {programs.map((program) => (
                <div key={program.name} className="rounded-xl border border-gray-200 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#0f121a]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                      <BadgeCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{program.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{program.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 rounded-full font-semibold border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200">{program.status}</span>
                    <span className="px-2 py-1 rounded-full bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200">
                      {program.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness */}
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Readiness</p>
                <h2 className="text-lg font-semibold">Keep portal compliant</h2>
              </div>
            </div>
            <div className="space-y-3">
              {readiness.map((item, idx) => (
                <div key={item.label} className="p-3 rounded-xl bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.value}</span>
                  </div>
                  <ProgressBar value={item.progress} tone={idx === 0 ? 'emerald' : idx === 1 ? 'amber' : 'sky'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Building blocks + product spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Factory size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Portal structure</p>
                <h2 className="text-lg font-semibold">Sales factory building blocks</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div key={mod.title} className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-[#0f121a] space-y-2">
                    <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                    <p className="text-sm font-semibold">{mod.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{mod.note}</p>
                    <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border border-gray-200 dark:border-white/10">
                      {mod.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Product spotlight</p>
                <h2 className="text-lg font-semibold">Featured SKUs</h2>
              </div>
              <button onClick={handleInsertProduct} className="text-xs font-semibold underline">Add</button>
            </div>
            <div className="space-y-3">
              {productSpotlight.map((p) => (
                <div key={p.sku} className="border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 bg-white dark:bg-[#0f121a]">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#141824] dark:to-[#1a1f2b] border border-gray-200 dark:border-white/10" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.sku} · {p.channel}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-200">{p.price}</p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesFactoryPage;
