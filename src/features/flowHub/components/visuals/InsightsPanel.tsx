import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Circle, CheckCircle, WarningCircle as AlertCircle, Clock, Lightning as Zap } from 'phosphor-react';
import { FlowNode } from '../../visualLogic';

interface Props {
    nodes: FlowNode[];
}

export const InsightsPanel: React.FC<Props> = ({ nodes }) => {
    const activeCount = nodes.filter(n => n.type === 'active').length;
    const blockedCount = nodes.filter(n => n.type === 'blocked').length;
    const completedCount = nodes.filter(n => n.type === 'completed').length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-l border-gray-200 dark:border-gray-800 shadow-xl pointer-events-auto"
        >
            <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto">

                {/* Header */}
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        System Pulse
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Real-time operational metrics</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</span>
                        <span className="text-xs text-blue-600/60 dark:text-blue-400/60 font-medium mt-1">Active</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-red-500 dark:text-red-400">{blockedCount}</span>
                        <span className="text-xs text-red-500/60 dark:text-red-400/60 font-medium mt-1">Blocked</span>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance</h3>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <Clock size={16} className="text-orange-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cycle Time</span>
                                <span className="text-xs text-gray-400">Average duration</span>
                            </div>
                        </div>
                        <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">4.2s</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <Zap size={16} className="text-yellow-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Throughput</span>
                                <span className="text-xs text-gray-400">Items per minute</span>
                            </div>
                        </div>
                        <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">128</span>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

                {/* Legend */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Legend</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <Circle size={10} className="text-gray-300 fill-current" />
                            <span>Pending Process</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
                            <span className="font-medium text-blue-600 dark:text-blue-400">Active Flow</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle size={14} className="text-gray-400" />
                            <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <AlertCircle size={14} className="text-red-500" />
                            <span>Blocked / Attention</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1" />

                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-400">
                        Select a node to view detailed properties and logs.
                    </p>
                </div>

            </div>
        </motion.div>
    );
};
