// =============================================================================
// Business Pulse Chart - Lightweight ECharts Component
// =============================================================================

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartLineUp } from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { BusinessPulseData } from '../../../services/sellerHomeSummaryService';

interface BusinessPulseChartProps {
  data: BusinessPulseData;
  emptyMessage?: string;
}

const BusinessPulseChart: React.FC<BusinessPulseChartProps> = ({ data, emptyMessage }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  // Check if data is empty (all zeros)
  const isEmpty = useMemo(() => {
    const totalRevenue = data.revenue.reduce((sum, v) => sum + v, 0);
    const totalOrders = data.orders.reduce((sum, v) => sum + v, 0);
    return totalRevenue === 0 && totalOrders === 0;
  }, [data]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: styles.bgCard,
      borderColor: styles.border,
      borderWidth: 1,
      textStyle: {
        color: styles.textPrimary,
        fontSize: 12,
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: styles.textMuted,
        },
      },
      formatter: (params: { name: string; seriesName: string; value: number; color: string }[]) => {
        const day = params[0]?.name || '';
        let html = `<div style="font-weight: 600; margin-bottom: 4px;">${day}</div>`;
        params.forEach((param) => {
          const isRevenue = param.seriesName === (isRtl ? 'الإيرادات' : 'Revenue');
          const value = isRevenue
            ? `SAR ${param.value.toLocaleString()}`
            : param.value;
          html += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${param.color};"></span>
            <span style="color: ${styles.textSecondary};">${param.seriesName}:</span>
            <span style="font-weight: 500;">${value}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      show: true,
      bottom: 0,
      left: isRtl ? 'right' : 'left',
      textStyle: {
        color: styles.textSecondary,
        fontSize: 11,
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
    },
    grid: {
      top: 16,
      right: isRtl ? 40 : 16,
      bottom: 40,
      left: isRtl ? 16 : 40,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: isRtl ? [...data.labels].reverse() : data.labels,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: styles.textMuted,
        fontSize: 10,
        margin: 8,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: isRtl ? 'الإيرادات' : 'Revenue',
        position: isRtl ? 'right' : 'left',
        nameTextStyle: {
          color: styles.textMuted,
          fontSize: 10,
          padding: [0, 0, 0, isRtl ? 0 : -24],
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: styles.textMuted,
          fontSize: 10,
          formatter: (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
            return value;
          },
        },
        splitLine: {
          lineStyle: {
            color: styles.border,
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: isRtl ? 'الطلبات' : 'Orders',
        position: isRtl ? 'left' : 'right',
        nameTextStyle: {
          color: styles.textMuted,
          fontSize: 10,
          padding: [0, isRtl ? -24 : 0, 0, 0],
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: styles.textMuted,
          fontSize: 10,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: isRtl ? 'الإيرادات' : 'Revenue',
        type: 'bar',
        data: isRtl ? [...data.revenue].reverse() : data.revenue,
        barWidth: '40%',
        itemStyle: {
          color: styles.info,
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: styles.info,
            opacity: 0.8,
          },
        },
      },
      {
        name: isRtl ? 'الطلبات' : 'Orders',
        type: 'line',
        yAxisIndex: 1,
        data: isRtl ? [...data.orders].reverse() : data.orders,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: styles.success,
          width: 2,
        },
        itemStyle: {
          color: styles.success,
          borderColor: styles.bgCard,
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${styles.success}20` },
              { offset: 1, color: `${styles.success}00` },
            ],
          },
        },
      },
    ],
  }), [data, styles, isRtl]);

  // Empty state
  if (isEmpty) {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        <div className="h-[200px] flex flex-col items-center justify-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <ChartLineUp size={24} weight="duotone" style={{ color: styles.textMuted }} />
          </div>
          <p className="text-sm text-center" style={{ color: styles.textMuted }}>
            {emptyMessage || (isRtl ? 'لا توجد بيانات لعرضها' : 'No data to display')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      <ReactECharts
        option={option}
        style={{ height: '200px', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default BusinessPulseChart;
