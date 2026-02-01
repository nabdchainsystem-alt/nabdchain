import React from 'react';
import {
  TrendUp,
  ShoppingCart,
  Users,
  Percent,
  Package,
  CurrencyDollar,
  ChartLine,
  CheckCircle,
  Clock,
  Activity,
} from 'phosphor-react';
import { Container, PageHeader, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface TestsProps {
  onNavigate: (page: string) => void;
}

// Style 1: Portal StatCard (already imported)
// Style 2: Board-style StatCard
const BoardStatCard: React.FC<{
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, value, trend, trendDirection, icon, color = 'blue' }) => {
  const trendColor =
    trendDirection === 'up'
      ? 'text-green-500'
      : trendDirection === 'down'
        ? 'text-red-500'
        : 'text-gray-500';

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</div>
        {icon && <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        {trend && (
          <div className={`text-xs font-medium mt-1 ${trendColor} flex items-center gap-1`}>
            {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '•'} {trend}
          </div>
        )}
      </div>
    </div>
  );
};

// Style 3: Teams-style StatCard (compact)
const TeamsStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white dark:bg-[#1e1e2d] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div
        className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}
      >
        {icon}
      </div>
    </div>
  );
};

// Style 4: GTD-style StatCard (minimal with count badge)
const GTDStatCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  count: number;
  colorClass: string;
  description?: string;
}> = ({ title, icon, count, colorClass, description }) => {
  const { styles } = usePortal();

  return (
    <div
      className="rounded-3xl p-6 border flex flex-col items-start gap-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-full min-h-[160px]"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <div className="flex items-center gap-2 w-full mb-2">
        <div
          className="p-2 rounded-full group-hover:scale-110 transition-transform duration-300"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <span className={colorClass}>{icon}</span>
        </div>
        <h3
          className="font-bold text-lg flex-1"
          style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
        >
          {title}
        </h3>
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
        >
          {count}
        </span>
      </div>

      <div className="w-full h-[1px]" style={{ backgroundColor: styles.border }} />

      {description && (
        <p className="text-sm" style={{ color: styles.textSecondary }}>
          {description}
        </p>
      )}
    </div>
  );
};

// Style 5: Gradient StatCard
const GradientStatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: string;
}> = ({ title, value, icon, gradient, change }) => {
  return (
    <div className={`${gradient} p-6 rounded-xl text-white shadow-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && <p className="text-white/70 text-xs mt-1">{change}</p>}
        </div>
        <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
      </div>
    </div>
  );
};

// Style 6: Minimal StatCard
const MinimalStatCard: React.FC<{
  label: string;
  value: string | number;
  sublabel?: string;
}> = ({ label, value, sublabel }) => {
  const { styles } = usePortal();

  return (
    <div
      className="p-4 rounded-lg border text-center"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: styles.textMuted }}>
        {label}
      </p>
      <p
        className="text-3xl font-bold mt-1"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs mt-1" style={{ color: styles.textSecondary }}>
          {sublabel}
        </p>
      )}
    </div>
  );
};

// Style 7: Icon-left StatCard
const IconLeftStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  iconBg: string;
}> = ({ icon, label, value, trend, iconBg }) => {
  const { styles } = usePortal();

  return (
    <div
      className="p-5 rounded-xl border flex items-center gap-4"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
          {label}
        </p>
        <p
          className="text-2xl font-bold"
          style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
        >
          {value}
        </p>
        {trend && (
          <p
            className="text-xs font-medium"
            style={{ color: trend.positive ? '#22c55e' : '#ef4444' }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
};

export const Tests: React.FC<TestsProps> = ({ onNavigate }) => {
  const { styles, t } = usePortal();

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('seller.tests.title')}
          subtitle={t('seller.tests.subtitle')}
        />

        {/* Style 1: Portal StatCard (Current) */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 1: Portal StatCard (Current)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Revenue"
              value="$124,500"
              icon={TrendUp}
              change={{ value: '+18% vs last period', positive: true }}
            />
            <StatCard
              label="Orders"
              value="156"
              icon={ShoppingCart}
              change={{ value: '+12%', positive: true }}
            />
            <StatCard label="New Buyers" value="34" icon={Users} change={{ value: '+8%', positive: true }} />
            <StatCard label="Win Rate" value="68%" icon={Percent} change={{ value: '+5%', positive: true }} />
          </div>
        </div>

        {/* Style 2: Board StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 2: Board StatCard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BoardStatCard
              title="Total Revenue"
              value="$89,400"
              trend="+12% vs last week"
              trendDirection="up"
              icon={<CurrencyDollar size={20} />}
              color="blue"
            />
            <BoardStatCard
              title="Active Orders"
              value="243"
              trend="+8%"
              trendDirection="up"
              icon={<Package size={20} />}
              color="green"
            />
            <BoardStatCard
              title="Pending RFQs"
              value="18"
              trend="-5%"
              trendDirection="down"
              icon={<Clock size={20} />}
              color="orange"
            />
            <BoardStatCard
              title="Conversion"
              value="72%"
              trend="No change"
              trendDirection="neutral"
              icon={<ChartLine size={20} />}
              color="purple"
            />
          </div>
        </div>

        {/* Style 3: Teams StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 3: Teams StatCard (Compact)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TeamsStatCard
              icon={<Users size={20} />}
              label="Total Members"
              value="24"
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <TeamsStatCard
              icon={<CheckCircle size={20} />}
              label="Active"
              value="18"
              color="bg-gradient-to-br from-green-500 to-emerald-600"
            />
            <TeamsStatCard
              icon={<Clock size={20} />}
              label="Pending"
              value="4"
              color="bg-gradient-to-br from-orange-500 to-amber-600"
            />
            <TeamsStatCard
              icon={<Activity size={20} />}
              label="Tasks Done"
              value="156"
              color="bg-gradient-to-br from-purple-500 to-violet-600"
            />
          </div>
        </div>

        {/* Style 4: GTD StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 4: GTD StatCard (Card with Badge)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GTDStatCard
              title="Inbox"
              icon={<Package size={20} />}
              count={12}
              colorClass="text-blue-500"
              description="Items awaiting processing"
            />
            <GTDStatCard
              title="Next Actions"
              icon={<CheckCircle size={20} />}
              count={8}
              colorClass="text-green-500"
              description="Ready to execute"
            />
            <GTDStatCard
              title="Waiting For"
              icon={<Clock size={20} />}
              count={5}
              colorClass="text-orange-500"
              description="Pending external input"
            />
            <GTDStatCard
              title="Projects"
              icon={<Activity size={20} />}
              count={14}
              colorClass="text-purple-500"
              description="Active multi-step outcomes"
            />
          </div>
        </div>

        {/* Style 5: Gradient StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 5: Gradient StatCard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GradientStatCard
              title="Total Sales"
              value="$284K"
              icon={<CurrencyDollar size={24} />}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              change="+24% this month"
            />
            <GradientStatCard
              title="New Customers"
              value="1,429"
              icon={<Users size={24} />}
              gradient="bg-gradient-to-br from-green-500 to-emerald-700"
              change="+18% this month"
            />
            <GradientStatCard
              title="Avg Order"
              value="$198"
              icon={<ShoppingCart size={24} />}
              gradient="bg-gradient-to-br from-orange-500 to-red-600"
              change="+7% this month"
            />
            <GradientStatCard
              title="Growth Rate"
              value="32%"
              icon={<TrendUp size={24} />}
              gradient="bg-gradient-to-br from-purple-500 to-indigo-700"
              change="+12% vs Q3"
            />
          </div>
        </div>

        {/* Style 6: Minimal StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 6: Minimal StatCard (Centered)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <MinimalStatCard label="Views" value="24K" sublabel="This week" />
            <MinimalStatCard label="Clicks" value="1.2K" sublabel="+12%" />
            <MinimalStatCard label="CTR" value="4.8%" sublabel="Good" />
            <MinimalStatCard label="Sales" value="$18K" sublabel="Target: $20K" />
            <MinimalStatCard label="Users" value="892" sublabel="Active" />
            <MinimalStatCard label="NPS" value="72" sublabel="Excellent" />
          </div>
        </div>

        {/* Style 7: Icon-left StatCard */}
        <div className="mb-10">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Style 7: Icon-left StatCard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IconLeftStatCard
              icon={<CurrencyDollar size={28} className="text-blue-600" />}
              label="Revenue"
              value="$94,200"
              trend={{ value: '12% increase', positive: true }}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
            />
            <IconLeftStatCard
              icon={<Package size={28} className="text-green-600" />}
              label="Orders"
              value="1,284"
              trend={{ value: '8% increase', positive: true }}
              iconBg="bg-green-100 dark:bg-green-900/30"
            />
            <IconLeftStatCard
              icon={<Users size={28} className="text-purple-600" />}
              label="Customers"
              value="3,492"
              trend={{ value: '24% increase', positive: true }}
              iconBg="bg-purple-100 dark:bg-purple-900/30"
            />
            <IconLeftStatCard
              icon={<TrendUp size={28} className="text-orange-600" />}
              label="Growth"
              value="18.2%"
              trend={{ value: '3% decrease', positive: false }}
              iconBg="bg-orange-100 dark:bg-orange-900/30"
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Tests;
