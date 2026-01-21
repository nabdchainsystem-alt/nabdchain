import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Stack as Layers, Circle, CheckCircle, WarningCircle as AlertCircle } from 'phosphor-react';
import { FlowNode } from '../../visualLogic';

interface Props {
    nodes: FlowNode[];
}

export const StatsWidget: React.FC<Props> = ({ nodes }) => {
    const activeCount = nodes.filter(n => n.type === 'active').length;
    const blockedCount = nodes.filter(n => n.type === 'blocked').length;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-24 right-12 z-40 bg-white dark:bg-monday-dark-surface p-4 rounded-xl shadow-lg border border-gray-100 dark:border-monday-dark-border w-64"
        >
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                Live System Metrics
            </h3>

            <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Active Processes</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{activeCount}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Bottlenecks</span>
                    <span className={`text-sm font-bold ${blockedCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{blockedCount}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Avg Cycle Time</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">4.2s</span>
                </div>
            </div>
        </motion.div>
    );
};

export const LegendWidget: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-10 left-12 z-40 bg-white dark:bg-monday-dark-surface p-4 rounded-xl shadow-lg border border-gray-100 dark:border-monday-dark-border"
        >
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Flow Status
            </h3>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Circle size={12} className="text-gray-300 fill-current" />
                    <span>Pending</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircle size={12} className="text-blue-500" />
                    <span>Active</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Circle size={12} className="text-gray-400" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <AlertCircle size={12} className="text-red-500" />
                    <span>Blocked</span>
                </div>
            </div>
        </motion.div>
    );
}
