import React from 'react';
import { motion } from 'framer-motion';
import {
    FileText, PaperPlaneTilt as Send, Quotes as MessageSquareQuote, ClipboardText as ClipboardCheck, FileCheck, Truck, Receipt, CreditCard,
    Drop as Droplets, Funnel as Filter, Activity, Wind, Flask as FlaskConical, Disc, Tag, Package, Warehouse
} from 'phosphor-react';
import { FlowConnection } from '../../visualLogic';

interface ConnectionPathProps {
    connection: FlowConnection;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    icon?: string;
    isChainComplete?: boolean;
}

export const ConnectionPath: React.FC<ConnectionPathProps> = ({ connection, x1, y1, x2, y2, icon, isChainComplete }) => {
    // Curving logic:
    // Simple cubic bezier: Start -> Control1 -> Control2 -> End
    // Horizontal flow: control points create a smooth S-curve
    const isPending = connection.state === 'pending';
    const isCompleted = connection.state === 'completed';
    const isActive = connection.state === 'active';

    // Smart Color System
    let strokeColor;
    if (isChainComplete) {
        strokeColor = '#10B981'; // Emerald-500 (Success Green)
    } else if (isActive) {
        strokeColor = '#3B82F6'; // Blue-500 (Active)
    } else if (isCompleted) {
        strokeColor = document.documentElement.classList.contains('dark') ? '#4B5563' : '#9CA3AF'; // Gray-400 (History)
    } else {
        strokeColor = document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'; // Gray-200 (Pending)
    }

    // Icon Mapping
    const IconComponent = {
        'FileText': FileText,
        'Send': Send,
        'MessageSquareQuote': MessageSquareQuote,
        'ClipboardCheck': ClipboardCheck,
        'FileCheck': FileCheck,
        'Truck': Truck,
        'Receipt': Receipt,
        'CreditCard': CreditCard,
        'Droplets': Droplets,
        'Filter': Filter,
        'Activity': Activity,
        'Wind': Wind,
        'FlaskConical': FlaskConical,
        'Disc': Disc,
        'Tag': Tag,
        'Package': Package,
        'Warehouse': Warehouse,
        'Box': Truck // Fallback
    }[icon || ''] || null;

    // Calculate path data once
    const controlsX = (x2 - x1) * 0.5;
    const pathData = `M ${x1} ${y1} C ${x1 + controlsX} ${y1}, ${x2 - controlsX} ${y2}, ${x2} ${y2}`;

    return (
        <React.Fragment>
            {/* Background thick path for easier hover (optional) */}
            <path d={pathData} stroke="transparent" strokeWidth="10" fill="none" />

            {/* Visible Path with Drawing Animation */}
            <motion.path
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? 3 : 2} // Thicker active line
                strokeDasharray={isPending ? "4 4" : "none"}
                className="transition-colors duration-500"
                style={{
                    filter: isActive
                        ? 'drop-shadow(0 0 4px rgba(59,130,246,0.6))'
                        : isChainComplete
                            ? 'drop-shadow(0 0 2px rgba(16,185,129,0.4))' // Subtle Green Glow
                            : 'none'
                }}
                strokeLinecap="round"

                // Drawing Animation
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{
                    pathLength: isPending ? 1 : 1, // Draw full line for pending (dashed)
                    opacity: isPending ? 0.2 : 1 // Visible pending lines!
                }}
                transition={{
                    pathLength: { duration: 1.5, ease: "linear" }, // Synced with data packet
                    opacity: { duration: 0.5 }
                }}
            />

            {/* Icon on the Line (Midpoint) - Only show when NOT pending */}
            {IconComponent && !isPending && (
                <foreignObject x={x1 + (x2 - x1) / 2 - 20} y={y1 - 20} width="40" height="40" className="overflow-visible pointer-events-none">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }} // Reduced delay for smoother appearance
                        className={`
                        flex items-center justify-center w-full h-full
                        transition-all duration-300
                    `}>
                        <div className={`
                            flex items-center justify-center
                            p-1.5 rounded-full shadow-sm border
                            ${isChainComplete
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-100' // Green Success
                                : isActive
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 scale-110 shadow-blue-100 ring-2 ring-blue-100 animate-pulse'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500'}
                             transition-all duration-500
                        `}>
                            <IconComponent size={14} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                    </motion.div>
                </foreignObject>
            )}

            {/* Active Data Packet Animation */}
            {isActive && (
                <motion.circle
                    r="4"
                    fill="#3B82F6"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{
                        duration: 1.5,
                        ease: "linear",
                        repeat: Infinity,
                        repeatDelay: 0.5
                    }}
                    style={{
                        offsetPath: `path("${pathData}")`
                    }}
                    className="z-10"
                />
            )}

        </React.Fragment >
    );
};
