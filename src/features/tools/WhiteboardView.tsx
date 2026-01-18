import React from 'react';
import {
    ShareNetwork,
    UserPlus,
    Stack,
    Cursor,
    Selection,
    Pen,
    PenNib,
    Sparkle,
    Polygon,
    GitFork,
    ArrowUpRight,
    GridFour,
    FrameCorners,
    Note,
    TextT,
    Image as PhImage,
    Eraser,
    Minus,
    Plus,
    CornersOut,
    MagnifyingGlass
} from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

// Custom mapped styles
const styles = `
.dot-grid {
    background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
    background-size: 32px 32px;
}
.dark .dot-grid {
    background-image: radial-gradient(#334155 1px, transparent 1px);
}
.glass-panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}
.dark .glass-panel {
    background: rgba(23, 29, 38, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
/* Custom Range Slider */
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
}
input[type="range"]::-webkit-slider-runnable-track {
    background: #e2e8f0;
    height: 4px;
    border-radius: 2px;
}
.dark input[type="range"]::-webkit-slider-runnable-track {
    background: #334155;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #00bdc7;
    margin-top: -4px;
}
`;

type DrawingTool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'note' | 'laser' | 'image' | 'mindmap' | 'table' | 'frame' | 'connector';

interface TextItem {
    id: string;
    x: number;
    y: number;
    text: string;
    type: 'text' | 'note';
}

const WhiteboardView: React.FC<{ boardId: string }> = ({ boardId }) => {
    const { t } = useAppContext();
    const [showProperties, setShowProperties] = React.useState(false);
    const [zoom, setZoom] = React.useState(100);
    const [currentTool, setCurrentTool] = React.useState<DrawingTool>('select');
    const [strokeColor, setStrokeColor] = React.useState('#00bdc7');
    const [strokeWidth, setStrokeWidth] = React.useState(2);
    const [strokeOpacity, setStrokeOpacity] = React.useState(100);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const isDrawing = React.useRef(false);
    const lastPos = React.useRef<{ x: number, y: number } | null>(null);
    const snapshot = React.useRef<ImageData | null>(null);

    // Overlays
    const [textItems, setTextItems] = React.useState<TextItem[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Laser fading
    React.useEffect(() => {
        if (currentTool !== 'laser') return;

        // Simple fade effect loop could go here, but for now we'll just treat it as a dedicated pen style
        // that creates a separate "laser" feel (red, glow).
    }, [currentTool]);

    // Initialize Canvas
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Re-setup context defaults if needed after resize
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const getPointerPos = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        // Adjust for zoom
        const scale = zoom / 100;
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const startDrawing = (e: React.PointerEvent) => {
        if (currentTool === 'select') return;

        // Handle Text/Note placement
        if (['text', 'note'].includes(currentTool)) {
            const pos = getPointerPos(e);
            setTextItems(prev => [...prev, {
                id: Date.now().toString(),
                x: pos.x,
                y: pos.y,
                text: '',
                type: currentTool as 'text' | 'note'
            }]);
            setCurrentTool('select'); // Switch back after placing
            return;
        }

        // Image handled via button click, but if they click canvas maybe nothing?

        if (!['pen', 'highlighter', 'eraser', 'rectangle', 'circle', 'laser', 'mindmap', 'table', 'frame', 'connector', 'image'].includes(currentTool)) return;

        isDrawing.current = true;
        const pos = getPointerPos(e);
        lastPos.current = pos;

        // Capture snapshot for shapes
        if (['rectangle', 'circle', 'mindmap', 'table', 'frame', 'image'].includes(currentTool)) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
        }

        // Prevent scrolling
        e.preventDefault();
    };

    const draw = (e: React.PointerEvent) => {
        if (!isDrawing.current || !lastPos.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const currentPos = getPointerPos(e);

        if (['rectangle', 'circle', 'mindmap', 'table', 'frame'].includes(currentTool)) {
            // Restore snapshot
            if (snapshot.current) {
                ctx.putImageData(snapshot.current, 0, 0);
            }

            ctx.beginPath();
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.globalAlpha = strokeOpacity / 100;

            // Adjust calculations for logic coords (getPointerPos handles zoom scale)
            const startX = lastPos.current.x;
            const startY = lastPos.current.y;
            const curX = currentPos.x;
            const curY = currentPos.y;

            if (currentTool === 'rectangle' || currentTool === 'table' || currentTool === 'frame' || currentTool === 'mindmap') {
                ctx.strokeRect(startX, startY, curX - startX, curY - startY);

                // Add label for complex tools
                if (['table', 'frame', 'mindmap'].includes(currentTool)) {
                    ctx.font = '12px sans-serif';
                    ctx.fillStyle = strokeColor;
                    ctx.fillText(currentTool.toUpperCase(), startX + 5, startY + 15);
                }
            } else if (currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(curX - startX, 2) + Math.pow(curY - startY, 2));
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }

        } else {
            // Freehand Logic
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(currentPos.x, currentPos.y);

            // Style based on Tool
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = strokeWidth * 5; // Eraser is bigger
                ctx.globalAlpha = 1;
            } else if (currentTool === 'highlighter') {
                ctx.globalCompositeOperation = 'multiply'; // Better highlighting effect
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth * 3; // Highlighter is thicker
                ctx.globalAlpha = 0.5; // Always semi-transparent
            } else if (currentTool === 'laser') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 4;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0000';
                ctx.globalAlpha = 1;
            } else if (currentTool === 'connector') {
                // Connectors just act like straight lines for now, or just pen?
                // Let's make it a straight line from last to current if we wanted, 
                // but for freehand 'connector' usually implies line. 
                // Simple pen for now.
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.setLineDash([5, 5]); // Dashed for connector
                ctx.globalAlpha = strokeOpacity / 100;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.shadowBlur = 0;
                ctx.setLineDash([]);
                ctx.globalAlpha = strokeOpacity / 100;
            }

            ctx.stroke();

            // Reset context styles that might leak
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);

            if (!['rectangle', 'circle', 'mindmap', 'table', 'frame'].includes(currentTool)) {
                lastPos.current = currentPos;
            }
        }
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
        snapshot.current = null;
    };

    const zoomIn = () => setZoom(prev => Math.min(prev + 10, 300));

    const zoomOut = () => setZoom(prev => Math.max(prev - 10, 20));
    const resetZoom = () => setZoom(100);

    return (
        <div className="relative w-full h-full bg-white dark:bg-monday-dark-bg font-sans overflow-hidden select-none">
            <style>{styles}</style>

            {/* Background Grid & Canvas */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-200 ease-out origin-center"
                style={{ transform: `scale(${zoom / 100})` }}
            >
                <div className="absolute inset-0 dot-grid" />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full touch-none"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                />

                {/* Text & Note Overlays */}
                {textItems.map(item => (
                    <div
                        key={item.id}
                        className={`absolute p-2 shadow-sm rounded border ${item.type === 'note'
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-900 shadow-md rotate-1'
                            : 'bg-transparent border-transparent'
                            }`}
                        style={{
                            left: item.x,
                            top: item.y,
                            minWidth: item.type === 'note' ? '150px' : 'auto',
                            minHeight: item.type === 'note' ? '150px' : 'auto',
                        }}
                    >
                        <textarea
                            autoFocus={!item.text}
                            className={`w-full h-full bg-transparent resize-none focus:outline-none ${item.type === 'text' ? 'text-2xl font-bold text-gray-800' : 'text-sm font-medium'}`}
                            placeholder={item.type === 'text' ? t('type_something') : t('sticky_note_placeholder')}
                            defaultValue={item.text}
                            onBlur={(e) => {
                                const val = e.target.value;
                                if (!val.trim()) {
                                    setTextItems(prev => prev.filter(i => i.id !== item.id));
                                } else {
                                    item.text = val;
                                }
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // Allow editing without dragging canvas
                        />
                    </div>
                ))}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                    const ctx = canvasRef.current?.getContext('2d');
                                    // Draw image at center for now (simple)
                                    ctx?.drawImage(img, 100, 100, 300, 300 * (img.height / img.width));
                                    setCurrentTool('select');
                                };
                                img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
            </div>

            {/* Static Content from Mockup - REMOVED */}


            {/* UI Overlays */}
            <div className="relative z-10 w-full h-full flex flex-col px-6 pt-6 pb-2 pointer-events-none">
                {/* Top Bar */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="glass-panel px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00bdc7] rounded-lg flex items-center justify-center text-white">
                            <ShareNetwork size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{t('mindmap_studio')}</h1>
                            <span className="text-[10px] text-gray-500 font-medium italic">{t('collaborative_workspace')}</span>
                        </div>
                    </div>

                    <div className="glass-panel flex items-center gap-4 px-2 py-2 rounded-xl shadow-sm">
                        <div className="flex items-center px-2">
                            {/* Avatars */}
                            <div className="flex -space-x-2 overflow-hidden">
                                <div className="z-30 inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-monday-dark-bg bg-center bg-cover border border-white" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAK2xh5jgqi0xaEVydCWWbsfYdUrjoVWw_Trypbzbs8-hiz_WAQ2FKiw4m_9lzr7gUuGcWdP_Jq5YHbbBDg0_kf6E5u4BrW7CHIsdn3_1FTG0_0UY0HhdHQp2gLggOE2bg3iKfRbmU9wa374WU5DqhZw8KVU2M7U1-WhSZzUANXJDvUvLvcI5c3KxCf_dy3cm8bKmZiZ3HhCtYAO5GPRqmDcrd-Gxkz4irDj8dsrb1MUHMUM4mMQSRDcHIDs9AHGFnFUvRTZCGruSKR")' }}></div>
                                <div className="z-20 inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-monday-dark-bg bg-center bg-cover border border-white" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCRCbbKse96EXyElTNnTs07-a8WvljrY_6eIrP-rf6ACh2LWfSYiApx916H7khlnWmletK2eq2Jp9Bn52sb4D4vjf_sQBApz6Gsc0uw4KMWYLdAYMVQ0eEIcyjjZBa0hQdOQhw3NFGeZqBm1rlahMfsiIHZtETNJ6OhO4jLcmCHO5R4yOnA9SiEp9pivSxBzUheDH-OcWLp3VKpMheLc4rCXYOHUu-ckEI0sPz1OIFFq0GOu7J8hUxlR7K7w56cr3YaUsZh0DcAQ9Qm")' }}></div>
                                <div className="z-10 bg-[#00bdc7]/20 text-[#00bdc7] rounded-full flex items-center justify-center h-9 w-9 ring-2 ring-white dark:ring-monday-dark-bg text-xs font-bold border border-white">
                                    +4
                                </div>
                            </div>
                        </div>
                        <div className="h-6 w-px bg-gray-200 dark:bg-monday-dark-border"></div>
                        <button className="flex items-center justify-center rounded-lg h-9 bg-[#00bdc7] text-white gap-2 text-xs font-bold px-4 hover:brightness-110 transition-all">
                            <UserPlus size={16} />
                            <span>{t('share')}</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1"></div>

                {/* Bottom Controls */}
                <div className="flex justify-between items-end gap-6 pointer-events-auto">
                    {/* Left Tools (Properties) */}
                    <div className="flex flex-col gap-4 items-start relative">
                        {showProperties && (
                            <div className="glass-panel p-3 rounded-2xl shadow-xl flex flex-col gap-4 w-48 animate-in slide-in-from-bottom-5 duration-200">
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => setStrokeColor('#000000')}
                                        className={`w-6 h-6 rounded-md bg-black border border-white/20 ${strokeColor === '#000000' ? 'ring-2 ring-black ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#00bdc7')}
                                        className={`w-6 h-6 rounded-md bg-[#00bdc7] border border-white/20 ${strokeColor === '#00bdc7' ? 'ring-2 ring-[#00bdc7] ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#fb923c')}
                                        className={`w-6 h-6 rounded-md bg-orange-400 border border-white/20 ${strokeColor === '#fb923c' ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#ef4444')}
                                        className={`w-6 h-6 rounded-md bg-red-500 border border-white/20 ${strokeColor === '#ef4444' ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#3b82f6')}
                                        className={`w-6 h-6 rounded-md bg-blue-500 border border-white/20 ${strokeColor === '#3b82f6' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#22c55e')}
                                        className={`w-6 h-6 rounded-md bg-green-500 border border-white/20 ${strokeColor === '#22c55e' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#a855f7')}
                                        className={`w-6 h-6 rounded-md bg-purple-500 border border-white/20 ${strokeColor === '#a855f7' ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                    <button
                                        onClick={() => setStrokeColor('#e5e7eb')}
                                        className={`w-6 h-6 rounded-md bg-gray-200 border border-white/20 ${strokeColor === '#e5e7eb' ? 'ring-2 ring-gray-200 ring-offset-2 dark:ring-offset-monday-dark-bg' : ''}`}
                                    ></button>
                                </div>
                                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-monday-dark-border">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            <span>{t('weight')}</span>
                                            <span className="text-[#00bdc7]">{strokeWidth}px</span>
                                        </div>
                                        <input
                                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            max="20" min="1" type="range"
                                            value={strokeWidth}
                                            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            <span>{t('opacity')}</span>
                                            <span className="text-[#00bdc7]">{strokeOpacity}%</span>
                                        </div>
                                        <input
                                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            max="100" min="10" type="range"
                                            value={strokeOpacity}
                                            onChange={(e) => setStrokeOpacity(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowProperties(!showProperties)}
                            className={`glass-panel p-2.5 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors group ${showProperties ? 'bg-blue-50 dark:bg-blue-900/20 text-[#00bdc7]' : 'text-gray-600 dark:text-monday-dark-text-muted'}`}
                        >
                            <Stack size={20} className="group-hover:text-[#00bdc7]" />
                        </button>
                    </div>

                    {/* Center Toolbar */}
                    <div className="flex-1 flex justify-center">
                        <div className="glass-panel flex items-center p-2 rounded-2xl shadow-2xl gap-1">
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setCurrentTool('select')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'select' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Select"
                                >
                                    <Cursor size={20} />
                                </button>
                                <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary transition-colors" title="Lasso Select">
                                    <Selection size={20} />
                                </button>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-monday-dark-border mx-1"></div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setCurrentTool('pen')}
                                    className={`p-2.5 rounded-xl transition-colors relative ${currentTool === 'pen' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Pen"
                                >
                                    <Pen size={20} />
                                    {currentTool === 'pen' && <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#00bdc7] animate-pulse"></div>}
                                </button>
                                <button
                                    onClick={() => setCurrentTool('highlighter')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'highlighter' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Highlighter"
                                >
                                    <PenNib size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('laser')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'laser' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Laser Pointer"
                                >
                                    <Sparkle size={20} />
                                </button>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-monday-dark-border mx-1"></div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setCurrentTool('rectangle')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'rectangle' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Rectangle"
                                >
                                    <FrameCorners size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('circle')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'circle' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Circle"
                                >
                                    <Polygon size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('mindmap')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'mindmap' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Mind-map Node"
                                >
                                    <GitFork size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('connector')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'connector' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Connectors"
                                >
                                    <ArrowUpRight size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('table')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'table' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Table"
                                >
                                    <GridFour size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('frame')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'frame' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Frame Container"
                                >
                                    <FrameCorners size={20} />
                                </button>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-monday-dark-border mx-1"></div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setCurrentTool('note')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'note' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Sticky Note"
                                >
                                    <Note size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentTool('text')}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'text' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Text Tool"
                                >
                                    <TextT size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentTool('image');
                                        fileInputRef.current?.click();
                                    }}
                                    className={`p-2.5 rounded-xl transition-colors ${currentTool === 'image' ? 'bg-[#00bdc7]/10 text-[#00bdc7] border border-[#00bdc7]/20 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary'}`}
                                    title="Images"
                                >
                                    <PhImage size={20} />
                                </button>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-monday-dark-border mx-1"></div>
                            <button
                                onClick={() => setCurrentTool('eraser')}
                                className={`p-2.5 rounded-xl transition-colors ${currentTool === 'eraser' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-monday-dark-text-secondary hover:text-red-500'}`}
                                title="Eraser"
                            >
                                <Eraser size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Right Zoom/Nav */}
                    <div className="flex flex-col items-end gap-3 pointer-events-auto">
                        {/* Navigator removed */}
                        <div className="glass-panel flex items-center p-1 rounded-xl shadow-lg">
                            <div className="flex items-center">
                                <button
                                    onClick={zoomOut}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary active:scale-90 transition-transform"
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="px-2 min-w-[50px] text-center">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white select-none">{zoom}%</span>
                                </div>
                                <button
                                    onClick={zoomIn}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary active:scale-90 transition-transform"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="w-px h-6 bg-gray-200 dark:bg-monday-dark-border mx-1"></div>
                            <button
                                onClick={resetZoom}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary active:scale-90 transition-transform"
                                title="Reset Zoom"
                            >
                                <CornersOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Overlay (Hidden by default in mockup but HTML had group-focus logic, here just laying it out) */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 transition-all opacity-0 pointer-events-none data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto">
                <div className="glass-panel rounded-2xl shadow-2xl p-2 flex items-center">
                    <div className="text-[#00bdc7] px-3">
                        <MagnifyingGlass size={20} />
                    </div>
                    <input className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium py-3 placeholder:text-gray-400" placeholder={t('search_commands')} />
                    <div className="flex items-center gap-1 px-3">
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-monday-dark-hover border border-gray-300 dark:border-monday-dark-border text-[10px] text-gray-500 font-bold">ESC</kbd>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhiteboardView;
