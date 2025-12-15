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
export type ProcessType = 'supply-chain' | 'maintenance' | 'production';

// ... (existing helper)

const generateNewChain = (chainIndex: number, type: ProcessType): FlowNode[] => {
    const chainId = `chain-${chainIndex}`;
    const startY = chainIndex; // basic Y for the chain
    // For Production, we might want to space chains further apart because each chain has 3 rows?
    // Or just let them overlap/interleave?
    // Better: Production usually has ONE main line running continuously?
    // But our visual engine instantiates multiple "chains" (instances). 
    // If user implies "Production Line", maybe just 1 chain is enough? 
    // Or multiple "Batches"? Let's assume multiple Batches.
    // If batches, we need spacing. `startY = chainIndex * 3`?
    // Adjusting Y spacing in the hook loop is hard.
    // Let's just flatten it:
    // Row 1: Intake..UV
    // Row 2: Blowing..Capping
    // Row 3: Packing..Storage
    // If we have multiple chains, they will overlap if we don't offset Y.
    // Let's assume simple 1-line layout per chain for now to keep it safe, 
    // OR: Use `y: startY * 3`?

    // Let's stick to a single long line or minimal wrap for Production to fit?
    // Or just let them be standard rows.

    if (type === 'production') {
        // Water Factory Flow (Batch)
        // We will make it 2 rows per batch to fit nicely.
        const yOffset = chainIndex * 1.5; // Spread them out a bit more

        return [
            // Stage 1: Treatment
            { id: `${chainId}-intake`, label: 'Raw Intake', type: 'active', timestamp: new Date(), icon: 'Droplets', x: 0, y: yOffset, details: { entity: 'Source' } },
            { id: `${chainId}-filter`, label: 'Filtration', type: 'neutral', timestamp: new Date(), icon: 'Filter', x: 1, y: yOffset, details: { entity: 'Treatment' } },
            { id: `${chainId}-ro`, label: 'RO System', type: 'neutral', timestamp: new Date(), icon: 'Activity', x: 2, y: yOffset, details: { entity: 'Purification' } },

            // Stage 2: Bottling (Shift down)
            { id: `${chainId}-blow`, label: 'Blowing', type: 'neutral', timestamp: new Date(), icon: 'Wind', x: 3, y: yOffset, details: { entity: 'Molding' } },
            { id: `${chainId}-fill`, label: 'Filling', type: 'neutral', timestamp: new Date(), icon: 'FlaskConical', x: 3, y: yOffset + 0.5, details: { entity: 'Filling' } },
            { id: `${chainId}-cap`, label: 'Capping', type: 'neutral', timestamp: new Date(), icon: 'Disc', x: 4, y: yOffset + 0.5, details: { entity: 'Sealing' } },

            // Stage 3: Packaging
            { id: `${chainId}-label`, label: 'Labeling', type: 'neutral', timestamp: new Date(), icon: 'Tag', x: 5, y: yOffset + 0.5, details: { entity: 'Branding' } },
            { id: `${chainId}-pack`, label: 'Packaging', type: 'neutral', timestamp: new Date(), icon: 'Package', x: 6, y: yOffset + 0.5, details: { entity: 'Packing' } },
            { id: `${chainId}-store`, label: 'Warehouse', type: 'neutral', timestamp: new Date(), icon: 'Warehouse', x: 7, y: yOffset + 0.5, details: { entity: 'Storage' } },
        ];
    }

    if (type === 'maintenance') {
        const maintY = chainIndex;
        return [
            { id: `${chainId}-wo`, label: 'Work Order', type: 'active', timestamp: new Date(), icon: 'FileText', x: 0, y: maintY, details: { entity: 'Requester' } },
            { id: `${chainId}-review`, label: 'Review', type: 'neutral', timestamp: new Date(), icon: 'ClipboardCheck', x: 1, y: maintY, details: { entity: 'Supervisor' } },
            { id: `${chainId}-wip`, label: 'In Progress', type: 'neutral', timestamp: new Date(), icon: 'Settings', x: 2, y: maintY, details: { entity: 'Technician' } },
            { id: `${chainId}-verify`, label: 'Verification', type: 'neutral', timestamp: new Date(), icon: 'CheckCircle', x: 3, y: maintY, details: { entity: 'Quality' } },
            { id: `${chainId}-close`, label: 'Closed', type: 'neutral', timestamp: new Date(), icon: 'FileCheck', x: 4, y: maintY, details: { entity: 'System' } },
        ];
    }

    // Supply Chain Flow (Default)
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

const generateConnections = (nodes: FlowNode[], type: ProcessType): FlowConnection[] => {
    const connections: FlowConnection[] = [];
    const chainId = nodes[0].id.substring(0, nodes[0].id.lastIndexOf('-'));

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

    if (type === 'production') {
        link('intake', 'filter');
        link('filter', 'ro');
        link('ro', 'blow'); // Jump to next row
        link('blow', 'fill');
        link('fill', 'cap');
        link('cap', 'label');
        link('label', 'pack');
        link('pack', 'store');
        return connections;
    }

    if (type === 'maintenance') {
        link('wo', 'review');
        link('review', 'wip');
        link('wip', 'verify');
        link('verify', 'close');
        return connections;
    }

    // Supply Chain Trunk
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

export const useFlowSimulation = (processType: ProcessType = 'supply-chain') => {
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
            const chainNodes = generateNewChain(i, processType);
            const chainConns = generateConnections(chainNodes, processType);
            allNodes = [...allNodes, ...chainNodes];
            allConns = [...allConns, ...chainConns];
        }

        setFlowState({ nodes: allNodes, connections: allConns });
    }, [processType]); // Re-run when type changes

    useEffect(() => {
        // Simulation Loop
        const interval = setInterval(() => {
            if (isPaused) return;

            setFlowState(prev => {
                // ... (rest of loop logic acts on current nodes/conns, generic enough to work for any graph)
                // Need to ensure new chains generated in respawn also use correct type!

                const now = Date.now();
                // ... (move logic here? No, loop continues below, just standardizing `processType` usage)
                // Actually, the `respawn` logic calls `generateNewChain`??
                // No, the respawn logic currently just "wakes up" existing nodes.
                // IF we were adding NEW chains, we'd need processType.
                // But we are just resetting `restartNode.type = 'active'`. 
                // So the loop is generic!

                // wait, "generateNewChain" is NOT called in loop. 
                // So we are safe.

                // ... (copy prev logic but just ensure it returns)

                const throttleMs = 2000 / speed;
                if (now - lastUpdateRef.current < throttleMs) return prev;
                lastUpdateRef.current = now;

                const newNodes = prev.nodes.map(node => ({ ...node }));
                const newConns = prev.connections.map(conn => ({ ...conn }));

                // 1. Advance Active Connections
                newConns.forEach(conn => {
                    if (conn.state === 'active') {
                        if (Math.random() > 0.7) {
                            conn.state = 'completed';
                            const targetNode = newNodes.find(n => n.id === conn.targetId);
                            if (targetNode && targetNode.type === 'neutral') {
                                targetNode.type = 'active';
                            }
                        }
                    }
                });

                // 2. Advance Active Nodes
                newNodes.forEach(node => {
                    if (node.type === 'active') {
                        if (Math.random() > 0.5) {
                            node.type = 'completed';
                            const outgoingConns = newConns.filter(c => c.sourceId === node.id);
                            if (outgoingConns.length > 0) {
                                outgoingConns.forEach(c => {
                                    if (c.state === 'pending') {
                                        c.state = 'active';
                                    }
                                });
                            }
                        }
                    }
                });

                // 3. Keep Alive
                if (Math.random() > 0.9) {
                    const startNodes = newNodes.filter(n => n.x === 0 && (n.type === 'completed' || n.type === 'neutral'));
                    if (startNodes.length > 0) {
                        const restartNode = startNodes[Math.floor(Math.random() * startNodes.length)];
                        if (restartNode.type === 'completed') {
                            restartNode.type = 'active';
                            const outConns = newConns.filter(c => c.sourceId === restartNode.id);
                            outConns.forEach(c => c.state = 'pending');
                        }
                    }
                }

                return { nodes: newNodes, connections: newConns };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, speed]); // Removed processType from here because state is reset in the other effect

    return { ...flowState, isPaused, setIsPaused, speed, setSpeed };
};
