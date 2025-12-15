import React, { useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useFlowSimulation, FlowNode, FlowConnection } from '../../visualLogic';
import { EventNode } from './EventNode';
import { ConnectionPath } from './ConnectionPath';
import {
    Play, Pause, Zap,
    ZoomIn, ZoomOut, RotateCcw,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
// import { CommandDeck } from './CommandDeck'; // Removed
import { InsightsPanel } from './InsightsPanel';

// Configuration
// Configuration
const X_Spacing = 160; // Reduced by ~11% (was 180)
const Y_Spacing = 108; // Reduced by 10% (was 120)
const PADDING_LEFT = 120;
const PADDING_TOP = 240;

export const ProcessMap: React.FC = () => {
    const { nodes, connections, isPaused, setIsPaused, speed, setSpeed } = useFlowSimulation();
    const [activeZoom, setActiveZoom] = React.useState(0.9);
    const showDetails = true;
    const [pan, setPan] = React.useState({ x: 0, y: 0 });

    // Map logical coordinates to pixels
    const getPos = (x: number, y: number) => ({
        x: x * X_Spacing + PADDING_LEFT,
        y: y * Y_Spacing + PADDING_TOP
    });

    // Calculate dimensions based on content
    const bounds = useMemo(() => {
        let maxX = 0;
        let maxY = 0;
        nodes.forEach(n => {
            if (n.x > maxX) maxX = n.x;
            if (n.y > maxY) maxY = n.y;
        });
        return {
            width: (maxX + 1) * X_Spacing + PADDING_LEFT * 2,
            height: (maxY + 1) * Y_Spacing + PADDING_TOP * 2
        };
    }, [nodes]);

    return (
        <div className="flex w-full h-full bg-gray-50 dark:bg-monday-dark-background overflow-hidden font-sans">

            {/* Main Canvas Area (Block 1) */}
            <div className="flex-1 relative overflow-hidden">
                {/* 
                   Canvas Content
                   We use a large pannable container.
                */}
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out origin-top-left"
                    style={{
                        transform: `scale(${activeZoom}) translate(${pan.x}px, ${pan.y}px)`,
                    }}
                >
                    <svg
                    // ... (svg props)
                    >
                        {connections.map(conn => {
                            // ... (connection logic)

                            // Only render connection if source is visible (not neutral/hidden) or if it's active
                            // actually, source must be completed/active for connection to trigger, so this is handled by state.
                            // But we want to ensure we don't draw pending lines to invisible nodes if that looks weird?
                            // User said "until line reaches it", implying line *does* go there.
                            // So we keep connections as is.

                            // ... (rest of connection rendering)
                            const source = nodes.find(n => n.id === conn.sourceId);
                            const target = nodes.find(n => n.id === conn.targetId);
                            if (!source || !target) return null;

                            const start = getPos(source.x, source.y);
                            const end = getPos(target.x, target.y);

                            // Determine if the connection is active or pending
                            const isActive = conn.status === 'active';
                            const isPending = conn.status === 'pending';

                            // Calculate vector to offset start/end points by node radius (approx 20px visual radius for safety + effect)
                            const dx = end.x - start.x;
                            const dy = end.y - start.y;
                            const angle = Math.atan2(dy, dx);
                            const offset = 20; // Node radius + gap

                            const startX = start.x + Math.cos(angle) * offset;
                            const startY = start.y + Math.sin(angle) * offset;
                            const endX = end.x - Math.cos(angle) * offset;
                            const endY = end.y - Math.sin(angle) * offset;

                            // Calculate path for the connection starting from EDGE of dot
                            const path = `M${startX},${startY} L${endX},${endY}`;

                            return (
                                <Fragment key={conn.id}>
                                    <ConnectionPath
                                        connection={conn}
                                        x1={startX}
                                        y1={startY}
                                        x2={endX}
                                        y2={endY}
                                        icon={target.icon}
                                    />
                                </Fragment>
                            );
                        })}
                    </svg>

                    {nodes.map(node => {
                        const pos = getPos(node.x, node.y);
                        // Hide neutral nodes so they "pop in" when discovered
                        // Exception: Start nodes (x=0) might need to be visible initially? 
                        // If x=0 nodes start as 'active', they are visible.
                        // If they start as 'neutral' (waiting to start), should they be visible?
                        // Usually start nodes should be visible.
                        const isVisible = node.type !== 'neutral' || node.x === 0;

                        return (
                            <div
                                key={node.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <EventNode
                                    node={node}
                                    onClick={(n) => console.log("Clicked node", n.label)}
                                    showDetails={showDetails}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Command Deck Removed - Tools integrated into footer */}
            </div >

            {/* Right Insights Panel (Block 2) */}
            < div className="w-80 h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 shadow-xl" >
                <InsightsPanel nodes={nodes} />
            </div >

            {/* Integrated Footer Toolbar */}
            < div className="absolute bottom-0 left-0 w-full z-30 pointer-events-auto flex items-center justify-center h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" >
                <div className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">

                    {/* Status: Live System */}
                    <div className="flex items-center gap-2.5 px-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="uppercase text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400">Live System</span>
                    </div>

                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    {/* Pan Config (MiniPad) */}
                    <div className="grid grid-cols-3 gap-0.5 w-[60px] opacity-70 hover:opacity-100 transition-opacity">
                        <div />
                        <button onClick={() => setPan(p => ({ ...p, y: p.y + 50 }))} className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronUp size={12} /></button>
                        <div />
                        <button onClick={() => setPan(p => ({ ...p, x: p.x + 50 }))} className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronLeft size={12} /></button>
                        <div className="w-1 h-1 bg-gray-400 rounded-full mx-auto self-center" />
                        <button onClick={() => setPan(p => ({ ...p, x: p.x - 50 }))} className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronRight size={12} /></button>
                        <div />
                        <button onClick={() => setPan(p => ({ ...p, y: p.y - 50 }))} className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronDown size={12} /></button>
                        <div />
                    </div>

                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isPaused ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        >
                            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                        </button>
                        <button
                            onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Zap size={14} className={speed > 1 ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                            <span className="text-xs font-mono w-4">{speed}x</span>
                        </button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><ZoomOut size={16} /></button>
                        <span className="text-xs font-mono w-10 text-center text-gray-500">{Math.round(activeZoom * 100)}%</span>
                        <button onClick={() => setActiveZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><ZoomIn size={16} /></button>
                        <button onClick={() => setActiveZoom(0.9)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 ml-1"><RotateCcw size={14} /></button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    {/* Server Time */}
                    <div className="text-xs font-mono text-gray-400">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                </div>
            </div >
        </div >
    );
};

