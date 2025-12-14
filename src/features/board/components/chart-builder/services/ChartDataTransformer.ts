import { EChartsOption } from 'echarts';
import { Column, Row } from '../../../views/Table/RoomTable';
import { ChartBuilderConfig, ChartValidationError } from '../types';

export class ChartDataTransformer {

    /**
     * Validates if the selected config is valid for the chart type
     */
    static validateConfig(config: ChartBuilderConfig, columns: Column[]): ChartValidationError {
        const xCol = columns.find(c => c.id === config.xAxisColumnId);
        const yCol = columns.find(c => c.id === config.yAxisColumnId);

        if (!config.xAxisColumnId) return { isValid: false, message: 'Please select a Group By column.' };

        // Rules per chart type
        if (['line', 'area'].includes(config.chartType)) {
            if (xCol?.type !== 'date') {
                return { isValid: false, message: 'Line/Area charts require a Date column for the X-Axis.' };
            }
        }

        if (['pie', 'doughnut'].includes(config.chartType)) {
            if (!config.xAxisColumnId) {
                return { isValid: false, message: 'Pie charts require a Group By column (Category).' };
            }
            // Logic check: Pie charts shouldn't have too many segments, but that's a soft limit.
        }

        if (config.aggregation !== 'count' && !config.yAxisColumnId) {
            return { isValid: false, message: 'Please select a Metric column or use Count.' };
        }

        if (config.aggregation !== 'count' && yCol?.type !== 'number') {
            return { isValid: false, message: 'Sum/Average requires a Number column.' };
        }

        return { isValid: true };
    }

    /**
     * Transforms raw table rows into aggregated data series
     */
    static transformData(rows: Row[], config: ChartBuilderConfig): { xData: string[], yData: number[] } {
        // 1. Filter
        let filteredRows = rows;

        // Apply Structured Filters
        if (config.filter && config.filter.length > 0) {
            filteredRows = filteredRows.filter(row => {
                return config.filter!.every(f => {
                    const rowValue = row[f.columnId];
                    const filterValue = f.value;
                    const val = rowValue === null || rowValue === undefined ? '' : String(rowValue).toLowerCase();
                    const fVal = String(filterValue).toLowerCase();

                    // Handle Operators
                    switch (f.operator) {
                        case 'contains': return val.includes(fVal);
                        case 'is': return val === fVal;
                        case 'isNot': return val !== fVal;
                        case 'startsWith': return val.startsWith(fVal);
                        case 'endsWith': return val.endsWith(fVal);
                        case 'isEmpty': return val === '';
                        case 'isNotEmpty': return val !== '';
                        // Number ops (basic)
                        case 'gt': return Number(val) > Number(fVal);
                        case 'lt': return Number(val) < Number(fVal);
                        case 'match': return val === fVal; // Alias for is
                        default: return true;
                    }
                });
            });
        }

        // Apply Manual Row Selection (Intersection)
        if (config.includedRowIds && config.includedRowIds.length > 0) {
            // If includedRowIds is set, it means we ONLY show these. 
            // If the user manually UNCHECKED some rows, the passed includedRowIds will be the subset of ALL rows.
            // If we combine this with filters, we should probably respect the Intersection.
            filteredRows = filteredRows.filter(r => config.includedRowIds!.includes(r.id));
        }

        // 2. Group
        const groups: Record<string, number[]> = {};

        filteredRows.forEach(row => {
            let key = row[config.xAxisColumnId];

            // Format dates simply for grouping
            if (key && config.xAxisColumnId.toLowerCase().includes('date')) {
                try {
                    const date = new Date(key);
                    // Simple grouping by day YYYY-MM-DD
                    key = date.toISOString().split('T')[0];
                } catch (e) {
                    key = 'Invalid Date';
                }
            }

            if (key === null || key === undefined) key = 'Unassigned';
            key = String(key);

            if (!groups[key]) groups[key] = [];

            // Value to aggregate
            let val = 0;
            if (config.aggregation === 'count') {
                val = 1;
            } else if (config.yAxisColumnId) {
                val = Number(row[config.yAxisColumnId]) || 0;
            }

            groups[key].push(val);
        });

        // 3. Aggregate
        const xData: string[] = Object.keys(groups);
        const yData: number[] = xData.map(key => {
            const values = groups[key];
            if (config.aggregation === 'sum') return values.reduce((a, b) => a + b, 0);
            if (config.aggregation === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
            if (config.aggregation === 'min') return Math.min(...values);
            if (config.aggregation === 'max') return Math.max(...values);
            return values.length; // Count
        });

        // 4. Sort (Optional but good for Charts)
        // If date, sort chronologically. Otherwise sort by value descending? 
        // Let's sort dates chronologically, others by Y count? Or just alpha?
        // Let's keeping it simple: sort X axis alphabetically/chronologically
        if (config.xAxisColumnId.toLowerCase().includes('date')) {
            const combined = xData.map((x, i) => ({ x, y: yData[i] }));
            combined.sort((a, b) => a.x.localeCompare(b.x));
            return {
                xData: combined.map(d => d.x),
                yData: combined.map(d => d.y)
            };
        }

        return { xData, yData };
    }

    /**
     * Generates ECharts Option object
     */
    static generateOption(data: { xData: string[], yData: number[] }, config: ChartBuilderConfig): EChartsOption {
        const { xData, yData } = data;
        const color = '#6366f1'; // Indigo-500 primary

        const baseTooltip = {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)' // Default for pie
        };

        if (['bar', 'line', 'area'].includes(config.chartType)) {
            return {
                title: {
                    text: config.title,
                    left: 'center',
                    textStyle: { fontSize: 14, color: '#57534e' }
                },
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: {
                    type: 'category',
                    data: xData,
                    axisLabel: { interval: 0, rotate: 30, fontSize: 10 }
                },
                yAxis: { type: 'value' },
                series: [
                    {
                        data: yData,
                        type: config.chartType === 'area' ? 'line' : config.chartType as any,
                        areaStyle: config.chartType === 'area' ? { opacity: 0.2 } : undefined,
                        smooth: true,
                        itemStyle: { color: color, borderRadius: config.chartType === 'bar' ? [4, 4, 0, 0] : 0 }
                    }
                ]
            };
        }

        if (['pie', 'doughnut'].includes(config.chartType)) {
            const piezoData = xData.map((x, i) => ({ value: yData[i], name: x }));
            return {
                title: {
                    text: config.title,
                    left: 'center',
                    textStyle: { fontSize: 14, color: '#57534e' }
                },
                tooltip: { trigger: 'item' },
                legend: { top: 'bottom', type: 'scroll' },
                series: [
                    {
                        name: config.title,
                        type: 'pie',
                        radius: config.chartType === 'doughnut' ? ['40%', '70%'] : '50%',
                        data: piezoData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
        }

        if (config.chartType === 'scatter') {
            return {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'item' },
                xAxis: { type: 'category', data: xData },
                yAxis: { type: 'value' },
                series: [{
                    type: 'scatter',
                    data: yData,
                    itemStyle: { color: color },
                    symbolSize: 10
                }]
            };
        }

        if (config.chartType === 'radar') {
            const maxVal = Math.max(...yData) || 100;
            return {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'item' },
                radar: {
                    indicator: xData.map(name => ({ name, max: maxVal + (maxVal * 0.1) }))
                },
                series: [{
                    name: config.title,
                    type: 'radar',
                    data: [{ value: yData, name: config.title }],
                    areaStyle: { opacity: 0.2, color: color },
                    itemStyle: { color: color }
                }]
            };
        }

        if (config.chartType === 'funnel') {
            const funnelData = xData.map((x, i) => ({ value: yData[i], name: x })).sort((a, b) => b.value - a.value);
            return {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'item' },
                series: [{
                    name: config.title,
                    type: 'funnel',
                    left: '10%', top: 60, bottom: 60, width: '80%',
                    sort: 'descending',
                    gap: 2,
                    label: { show: true, position: 'inside' },
                    data: funnelData
                }]
            };
        }

        if (config.chartType === 'gauge') {
            // For gauge, we sum everything up or take average? usually gauge is single value.
            // Let's show the Aggregate Total.
            const total = yData.reduce((a, b) => a + b, 0);
            return {
                title: { text: config.title, left: 'center' },
                series: [{
                    type: 'gauge',
                    progress: { show: true },
                    detail: { valueAnimation: true, formatter: '{value}' },
                    data: [{ value: total, name: 'Total' }]
                }]
            };
        }

        if (config.chartType === 'treemap') {
            const treeData = xData.map((x, i) => ({ value: yData[i], name: x }));
            return {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'item' },
                series: [{
                    type: 'treemap',
                    data: treeData,
                    breadcrumb: { show: false },
                    itemStyle: { borderRadius: 4, gapWidth: 1 }
                }]
            };
        }

        return {};
    }
}
