import React from 'react';
import {
  TrendDown,
  Users,
  CurrencyDollar,
  Lightning,
  ArrowRight,
  Circle,
  ChartLineUp,
  Wallet,
  ArrowUp,
  ArrowDown,
} from 'phosphor-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Revised Sparkline Card Component
const ImprovedSparklineCard: React.FC<{
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  data: number[];
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, change, trend, data, color = '#10b981', icon }) => {
  const isPositive = trend === 'up';
  const chartData = data.map((v, i) => ({ value: v, i }));

  return (
    <div className="relative flex flex-col justify-between p-5 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all h-[140px] overflow-hidden group">
      <div className="z-10 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPositive
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {isPositive ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
            {change}
          </div>
        </div>
        <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 w-full opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${label})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CardContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`relative bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${className}`}
  >
    {children}
  </div>
);

export const AntigravityDesigns: React.FC = () => {
  return (
    <div className="space-y-12 pb-10">
      {/* Section 0: Redesigned Sparkline Cards (Requested) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ChartLineUp size={24} weight="fill" className="text-black dark:text-white" />
          Redesigned Sparkline Cards
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Compact, responsive cards with improved area charts. Fits 4 per row.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImprovedSparklineCard
            label="Total Revenue"
            value="$54,230"
            change="12.5%"
            trend="up"
            data={[40, 55, 45, 60, 58, 75, 82]}
            color="#10b981"
            icon={<CurrencyDollar size={18} weight="fill" />}
          />
          <ImprovedSparklineCard
            label="Active Users"
            value="12,500"
            change="8.2%"
            trend="up"
            data={[20, 35, 40, 38, 55, 60, 75]}
            color="#3b82f6"
            icon={<Users size={18} weight="fill" />}
          />
          <ImprovedSparklineCard
            label="Bounce Rate"
            value="42.5%"
            change="2.1%"
            trend="down"
            data={[65, 58, 60, 50, 48, 45, 42]}
            color="#f59e0b"
            icon={<TrendDown size={18} weight="fill" />}
          />
          <ImprovedSparklineCard
            label="Server Load"
            value="32%"
            change="5.4%"
            trend="up"
            data={[25, 30, 45, 35, 42, 38, 32]}
            color="#6366f1"
            icon={<Lightning size={18} weight="fill" />}
          />
        </div>
      </div>

      {/* Section 1: Uber Prime & Airy */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Lightning size={24} weight="fill" className="text-black dark:text-white" />
          Ultra-Premium & Minimal
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          High-contrast, bold typography designs focusing on essential data.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Uber Prime: Heavy Contrast */}
          <div className="bg-black text-white p-6 rounded-xl shadow-xl flex flex-col justify-between h-[160px] group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={20} className="-rotate-45" />
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Revenue</span>
            </div>
            <div>
              <span className="text-5xl font-bold tracking-tighter mb-1 block">$12.4k</span>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold text-white">+12%</span>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            </div>
          </div>

          {/* 2. Uber Airy: Clean & Subtle */}
          <CardContainer className="h-[160px] flex flex-col justify-between !border-transparent shadow-sm hover:shadow-md bg-white">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users size={20} className="text-black dark:text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+4.2%</span>
            </div>
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-1 block">8,249</span>
              <span className="text-sm text-gray-500 font-medium">Active Drivers</span>
            </div>
          </CardContainer>

          {/* 3. Performance Pulse: Live Status */}
          <CardContainer className="h-[160px] flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-600">Live</span>
            </div>
            <div className="mb-2 text-gray-400">
              <Lightning size={32} weight="fill" />
            </div>
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">99.9%</span>
            <span className="text-sm text-gray-500 mt-1">System Uptime</span>
          </CardContainer>

          {/* 4. Data Stack: Information Hierarchy */}
          <CardContainer className="h-[160px] flex flex-col justify-center">
            <div className="flex items-baseline justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <span className="text-sm font-medium text-gray-500">Avg. Trip</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">$24.50</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-500">Distance</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">4.2km</span>
            </div>
          </CardContainer>
        </div>
      </div>

      {/* Section 2: Visual & Contextual */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ChartLineUp size={24} weight="fill" className="text-black dark:text-white" />
          Visual & Contextual
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Communicating trends and actions through visual metaphors.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 5. Market Trend: Area Smooth */}
          <CardContainer className="!p-0 h-[160px] flex flex-col justify-between overflow-hidden">
            <div className="p-6 pb-0">
              <span className="text-sm text-gray-500 font-medium block">Market Share</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">42%</span>
            </div>
            <div className="relative h-16 w-full">
              {/* CSS-only simple curve approximation */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/20"></div>
              <svg viewBox="0 0 100 25" className="w-full h-full absolute bottom-0" preserveAspectRatio="none">
                <path d="M0 25 L0 15 Q 25 5 50 15 T 100 10 L 100 25 Z" fill="#3b82f6" fillOpacity="0.1" />
                <path d="M0 15 Q 25 5 50 15 T 100 10" fill="none" stroke="#2563eb" strokeWidth="2" />
              </svg>
            </div>
          </CardContainer>

          {/* 6. Action Tile: Interactive */}
          <div className="group h-[160px] bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative cursor-pointer hover:border-black dark:hover:border-white transition-colors duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-black text-white rounded-lg group-hover:bg-gray-800 transition-colors">
                <Wallet size={20} weight="fill" />
              </div>
              <ArrowRight
                size={20}
                className="text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors"
              />
            </div>
            <div>
              <span className="text-sm text-gray-500 font-medium block mb-1">Total Balance</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:underline decoration-2 underline-offset-4">
                $8,290.00
              </span>
            </div>
          </div>

          {/* 7. Balance Ring: Radial CSS */}
          <CardContainer className="h-[160px] flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
              {/* Simple CSS conic gradient for 75% */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black dark:border-t-white border-r-black dark:border-r-white border-b-black dark:border-b-white rotate-[-45deg]"></div>
              <span className="text-xl font-bold">75%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-medium">Goal Status</span>
              <span className="text-lg font-bold">On Track</span>
              <button className="text-xs text-blue-600 font-semibold mt-1 text-left">View Details</button>
            </div>
          </CardContainer>

          {/* 8. Context Card: Pill Label */}
          <CardContainer className="h-[160px] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Circle size={8} weight="fill" className="text-purple-500" />
              <span className="text-sm font-medium text-gray-500">Engagement</span>
            </div>
            <span className="text-4xl font-bold text-gray-900 dark:text-white mb-3">28m</span>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Top 5%</span>
              </div>
              <span className="text-xs text-gray-400">of creators</span>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};
