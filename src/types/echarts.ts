/**
 * Re-exports and utilities for ECharts types used across the codebase.
 * Using the real echarts types ensures compatibility with EChartsOption.
 */

// Re-export commonly used callback types from echarts
export type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared';
