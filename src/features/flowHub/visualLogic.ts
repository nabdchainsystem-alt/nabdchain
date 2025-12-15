import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export type FlowNodeType = 'neutral' | 'active' | 'completed' | 'blocked';

export interface FlowNode {
    id: string;
    label: string;
    type: FlowNodeType;
    timestamp: Date;
    details?: {
        entity: string;
        action?: string;
    };
    icon?: string;
    x: number; // Logical X position (stage)
    y: number; // Logical Y position (lane)
}

export interface FlowConnection {
    id: string;
    sourceId: string;
    targetId: string;
    state: 'pending' | 'active' | 'completed';
}

export interface FlowState {
    nodes: FlowNode[];
    connections: FlowConnection[];
}

// --- Mock Data & Generators ---

const EVENT_STAGES = [
    { label: 'Purchase Request', entity: 'Internal', icon: 'FileText' },
    { label: 'RFQ Created', entity: 'Procurement', icon: 'Send' },
    { label: 'Vendor Quote', entity: 'External', icon: 'MessageSquareQuote' },
    { label: 'Evaluation', entity: 'Procurement', icon: 'ClipboardCheck' },
    { label: 'PO Issued', entity: 'Finance', icon: 'FileCheck' },
    { label: 'Shipment', entity: 'Logistics', icon: 'Truck' }, // Added per user request
    { label: 'Invoice Received', entity: 'Vendor', icon: 'Receipt' },
    { label: 'Payment', entity: 'Bank', icon: 'CreditCard' },
];

// const generateNewChain = (startY: number): FlowNode[] => {
//    const chainId = uuidv4(); // Removed to prevent parsing errors
const generateNewChain = (chainIndex: number): FlowNode[] => {
    const chainId = `chain-${chainIndex}`; // Simple, deterministic ID
    const startY = chainIndex; // Ensure Y works as intended

    const nodes: FlowNode[] = [
        {
            id: `${chainId}-pr`, label: 'Purchase Request', type: 'active', timestamp: new Date(),
            icon: 'FileText', x: 0, y: startY, details: { entity: 'Internal' }
        },
        {
            id: `${chainId}-rfq`, label: 'RFQ Created', type: 'neutral', timestamp: new Date(),
            icon: 'Send', x: 1, y: startY, details: { entity: 'Procurement' }
        },
        {
            id: `${chainId}-quote`, label: 'Vendor Quote', type: 'neutral', timestamp: new Date(),
            icon: 'MessageSquareQuote', x: 2, y: startY, details: { entity: 'External' }
        },
        {
            id: `${chainId}-eval`, label: 'Evaluation', type: 'neutral', timestamp: new Date(),
            icon: 'ClipboardCheck', x: 3, y: startY, details: { entity: 'Procurement' }
        },
        {
            id: `${chainId}-po`, label: 'PO Issued', type: 'neutral', timestamp: new Date(),
            icon: 'FileCheck', x: 4, y: startY, details: { entity: 'Finance' }
        },
        // --- Branch 1: Logistics (Straight Line) ---
        {
            id: `${chainId}-ship`, label: 'Shipment', type: 'neutral', timestamp: new Date(),
            icon: 'Truck', x: 5, y: startY, details: { entity: 'Logistics' }
        },
        {
            id: `${chainId}-gr`, label: 'Goods Receipt', type: 'neutral', timestamp: new Date(),
            icon: 'Box', x: 6, y: startY, details: { entity: 'Warehouse' }
        },
        // --- Branch 2: Finance (Shifted Down) ---
        {
            id: `${chainId}-inv`, label: 'Invoice Received', type: 'neutral', timestamp: new Date(),
            icon: 'Receipt', x: 5, y: startY + 0.6, details: { entity: 'Vendor' }
        },
        {
            id: `${chainId}-pay`, label: 'Payment', type: 'neutral', timestamp: new Date(),
            icon: 'CreditCard', x: 6, y: startY + 0.6, details: { entity: 'Bank' }
        }
    ];

    return nodes;
};

const generateConnections = (nodes: FlowNode[]): FlowConnection[] => {
    const connections: FlowConnection[] = [];
    const chainId = nodes[0].id.substring(0, nodes[0].id.lastIndexOf('-'));
    // This robustness works for "chain-0-pr" -> "chain-0"
    // And "uuid-part-pr" -> "uuid-part"

    const link = (srcSuffix: string, tgtSuffix: string) => {
        const src = nodes.find(n => n.id === `${chainId}-${srcSuffix}`);
        const tgt = nodes.find(n => n.id === `${chainId}-${tgtSuffix}`);
        if (src && tgt) {
            connections.push({
                id: `conn-${src.id}-${tgt.id}`,
                sourceId: src.id,
                targetId: tgt.id,
                state: src.type === 'completed' ? 'active' : 'pending' // Simplified initial state logic
            });
        }
    };

    // Main Trunk
    link('pr', 'rfq');
    link('rfq', 'quote');
    link('quote', 'eval');
    link('eval', 'po');

    // Split
    link('po', 'ship'); // To Logistics
    link('po', 'inv');  // To Finance

    // Branches
    link('ship', 'gr');
    link('inv', 'pay');

    return connections;
};

// --- Hook ---

export const useFlowSimulation = () => {
    const [flowState, setFlowState] = useState<FlowState>({ nodes: [], connections: [] });
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState<1 | 2 | 4>(1);
    const lastUpdateRef = useRef(Date.now());

    useEffect(() => {
        // Initial Seed
        const initialChains = 3;
        let allNodes: FlowNode[] = [];
        let allConns: FlowConnection[] = [];

        for (let i = 0; i < initialChains; i++) {
            const chainNodes = generateNewChain(i);
            const chainConns = generateConnections(chainNodes);
            allNodes = [...allNodes, ...chainNodes];
            allConns = [...allConns, ...chainConns];
        }

        setFlowState({ nodes: allNodes, connections: allConns });

        // Simulation Loop
        const interval = setInterval(() => {
            if (isPaused) return;

            setFlowState(prev => {
                const now = Date.now();
                const throttleMs = 2000 / speed;
                if (now - lastUpdateRef.current < throttleMs) return prev;
                lastUpdateRef.current = now;

                const newNodes = prev.nodes.map(node => ({ ...node }));
                const newConns = prev.connections.map(conn => ({ ...conn }));

                // 1. Advance Active Connections (Data Traveling)
                // We process this FIRST so data arrives at neutral nodes.
                newConns.forEach(conn => {
                    if (conn.state === 'active') {
                        // "Travel time" logic - random chance to arrive
                        // Lower chance = slower travel (gives time for animation)
                        if (Math.random() > 0.7) {
                            conn.state = 'completed';
                            const targetNode = newNodes.find(n => n.id === conn.targetId);
                            if (targetNode && targetNode.type === 'neutral') {
                                targetNode.type = 'active'; // Arrived!
                            }
                        }
                    }
                });

                // 2. Advance Active Nodes (Processing)
                // When done, they should EMIT data (active connection), not instantly teleport it.
                newNodes.forEach(node => {
                    if (node.type === 'active') {
                        // "Processing time" logic
                        if (Math.random() > 0.5) {
                            node.type = 'completed';

                            // Find outgoing connections
                            const outgoingConns = newConns.filter(c => c.sourceId === node.id);

                            if (outgoingConns.length > 0) {
                                // Trigger travel animation for ALL outgoing paths (broadcasting)
                                outgoingConns.forEach(c => {
                                    if (c.state === 'pending') {
                                        c.state = 'active'; // Start traveling!
                                    }
                                });
                            }
                        }
                    }
                });

                // 3. Keep Alive / Respawn
                // If a chain is idle (no active nodes/conns), restart it or spawn new valid entry
                // Simple logic: If first node of a chain is 'completed' and not active, maybe reset it occasionally?
                // Better: Just randomly pick a 'completed' start node and reset its full chain if it looks dead?
                // Simplest for demo: Randomly re-activate start nodes if they are idle.
                if (Math.random() > 0.9) {
                    const startNodes = newNodes.filter(n => n.x === 0 && (n.type === 'completed' || n.type === 'neutral'));
                    if (startNodes.length > 0) {
                        // Pick one
                        const restartNode = startNodes[Math.floor(Math.random() * startNodes.length)];

                        // Reset chain logic is complex without graph traversal, 
                        // so simpler: just set it active and reset its immediate outgoing connections if needed?
                        // Actually, we need to reset the WHOLE chain to 'neutral'/'pending' for it to flow again nicely.
                        // Let's just create "pulses" - set start node active again. 
                        // But we need to reset downstream logic.

                        // Hack for continuous demo:
                        // Just finding pending connections from completed nodes?
                        // Let's just reset the start node to 'active' if it's currently completed.
                        // And we need to reset its outgoing connections to 'pending' to allow re-flow.
                        if (restartNode.type === 'completed') {
                            restartNode.type = 'active';
                            const outConns = newConns.filter(c => c.sourceId === restartNode.id);
                            outConns.forEach(c => c.state = 'pending');
                        }
                    }
                }

                // 4. Random Blockers (Optional - Reduced frequency)
                if (Math.random() > 0.98) {
                    const activeNode = newNodes.find(n => n.type === 'active');
                    if (activeNode) activeNode.type = 'blocked';
                }
                if (Math.random() > 0.9) {
                    const blockedNode = newNodes.find(n => n.type === 'blocked');
                    if (blockedNode) blockedNode.type = 'active';
                }

                return { nodes: newNodes, connections: newConns };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    return { ...flowState, isPaused, setIsPaused, speed, setSpeed };
};
