
import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../auth-adapter';
import {
    CaretLeft,
    PencilSimple,
    Eraser,
    Circle,
    Square,
    LineSegment,
    Trash,
    ArrowCounterClockwise,
    Palette
} from 'phosphor-react';
import { socketLogger } from '../../utils/logger';

interface Cursor {
    userId: string;
    x: number;
    y: number;
    color: string;
}

interface Point {
    x: number;
    y: number;
}

interface DrawAction {
    type: 'line' | 'shape' | 'clear';
    data: any;
}

type Tool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#FFD700', '#FF69B4', '#000000', '#FFFFFF'];
const BRUSH_SIZES = [2, 4, 8, 16];

export const LiveBoard: React.FC<{ roomId: string, onClose: () => void }> = ({ roomId, onClose }) => {
    const { socket } = useSocket();
    const { user } = useUser();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursors, setCursors] = useState<Record<string, Cursor>>({});
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPoint = useRef<Point | null>(null);
    const shapeStart = useRef<Point | null>(null);

    // Tool state
    const [activeTool, setActiveTool] = useState<Tool>('pen');
    const [brushSize, setBrushSize] = useState(4);
    const [activeColor, setActiveColor] = useState('#000000');
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Undo stack
    const [history, setHistory] = useState<ImageData[]>([]);
    const maxHistory = 20;

    // Join the socket room when whiteboard opens
    useEffect(() => {
        if (!socket) {
            socketLogger.debug('[LiveBoard] No socket connection');
            return;
        }

        socketLogger.info('[LiveBoard] Joining room:', roomId);
        socket.emit('join-room', {
            roomId,
            userId: user?.id || 'guest',
            name: user?.firstName || 'Guest'
        });

        return () => {
            socketLogger.info('[LiveBoard] Leaving room:', roomId);
            socket.emit('leave-room', { roomId, userId: user?.id || 'guest' });
        };
    }, [socket, roomId, user]);

    useEffect(() => {
        if (!socket) return;

        const handleRemoteCursor = ({ userId, x, y }: { userId: string, x: number, y: number }) => {
            setCursors(prev => ({
                ...prev,
                [userId]: { userId, x, y, color: prev[userId]?.color || COLORS[Math.floor(Math.random() * COLORS.length)] }
            }));
        };

        const handleRemoteDraw = (data: any) => {
            socketLogger.debug('[LiveBoard] Received draw-data:', data);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = canvas.width;
            const h = canvas.height;

            if (data.type === 'line') {
                drawLine(ctx, data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size, data.eraser);
            } else if (data.type === 'shape') {
                drawShape(ctx, data.shape, data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size);
            } else if (data.type === 'clear') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
            }
        };

        socket.on('cursor-move', handleRemoteCursor);
        socket.on('draw-data', handleRemoteDraw);

        return () => {
            socket.off('cursor-move', handleRemoteCursor);
            socket.off('draw-data', handleRemoteDraw);
        };
    }, [socket]);

    // Handle Window Resize & Initialize Canvas
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                // Save current content
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

                canvas.width = containerRef.current.offsetWidth;
                canvas.height = containerRef.current.offsetHeight;

                // Fill with white background
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Restore content if we had any
                    if (imageData) {
                        ctx.putImageData(imageData, 0, 0);
                    }
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            const newHistory = [...prev, imageData];
            if (newHistory.length > maxHistory) {
                return newHistory.slice(-maxHistory);
            }
            return newHistory;
        });
    };

    const undo = () => {
        if (history.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const previousState = history[history.length - 1];
        ctx.putImageData(previousState, 0, 0);
        setHistory(prev => prev.slice(0, -1));
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveToHistory();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Broadcast clear
        socket?.emit('draw-data', {
            roomId,
            data: { type: 'clear' }
        });
    };

    const drawLine = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, size: number, isEraser: boolean = false) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
        ctx.lineWidth = isEraser ? size * 3 : size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.closePath();
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: string, x0: number, y0: number, x1: number, y1: number, color: string, size: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';

        if (shape === 'line') {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
        } else if (shape === 'rectangle') {
            ctx.rect(x0, y0, x1 - x0, y1 - y0);
        } else if (shape === 'circle') {
            const radiusX = Math.abs(x1 - x0) / 2;
            const radiusY = Math.abs(y1 - y0) / 2;
            const centerX = Math.min(x0, x1) + radiusX;
            const centerY = Math.min(y0, y1) + radiusY;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        }

        ctx.stroke();
        ctx.closePath();
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !socket) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Broadcast relative position (0-1)
        const relX = x / rect.width;
        const relY = y / rect.height;

        socket.emit('cursor-move', { roomId, x: relX, y: relY, userId: user?.id || 'guest' });

        if (isDrawing && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            if (activeTool === 'pen' || activeTool === 'eraser') {
                if (lastPoint.current) {
                    const isEraser = activeTool === 'eraser';
                    drawLine(ctx, lastPoint.current.x, lastPoint.current.y, x, y, activeColor, brushSize, isEraser);

                    // Broadcast draw event
                    socket.emit('draw-data', {
                        roomId,
                        data: {
                            type: 'line',
                            x0: lastPoint.current.x / rect.width,
                            y0: lastPoint.current.y / rect.height,
                            x1: relX,
                            y1: relY,
                            color: activeColor,
                            size: brushSize,
                            eraser: isEraser
                        }
                    });
                }
                lastPoint.current = { x, y };
            }
        }
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        saveToHistory();
        setIsDrawing(true);
        lastPoint.current = { x, y };
        shapeStart.current = { x, y };
    };

    const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !canvasRef.current || !socket) return;

        // If drawing a shape, finalize it
        if (isDrawing && shapeStart.current && (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle')) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ctx = canvasRef.current.getContext('2d');

            if (ctx) {
                drawShape(ctx, activeTool, shapeStart.current.x, shapeStart.current.y, x, y, activeColor, brushSize);

                // Broadcast shape
                socket.emit('draw-data', {
                    roomId,
                    data: {
                        type: 'shape',
                        shape: activeTool,
                        x0: shapeStart.current.x / rect.width,
                        y0: shapeStart.current.y / rect.height,
                        x1: x / rect.width,
                        y1: y / rect.height,
                        color: activeColor,
                        size: brushSize
                    }
                });
            }
        }

        setIsDrawing(false);
        lastPoint.current = null;
        shapeStart.current = null;
    };

    const ToolButton = ({ tool, icon, label }: { tool: Tool, icon: React.ReactNode, label: string }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`p-2 rounded-lg transition-all ${
                activeTool === tool
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
            title={label}
        >
            {icon}
        </button>
    );

    return (
        <div className="fixed inset-0 z-40 bg-white/50 backdrop-blur-sm" style={{ display: 'flex' }}>
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-2xl shadow-xl p-2 border border-gray-200 z-50">
                {/* Back Button */}
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close whiteboard"
                >
                    <CaretLeft size={24} />
                </button>

                <div className="w-px h-8 bg-gray-200" />

                {/* Drawing Tools */}
                <ToolButton tool="pen" icon={<PencilSimple size={24} />} label="Pen" />
                <ToolButton tool="eraser" icon={<Eraser size={24} />} label="Eraser" />

                <div className="w-px h-8 bg-gray-200" />

                {/* Shape Tools */}
                <ToolButton tool="line" icon={<LineSegment size={24} />} label="Line" />
                <ToolButton tool="rectangle" icon={<Square size={24} />} label="Rectangle" />
                <ToolButton tool="circle" icon={<Circle size={24} />} label="Circle" />

                <div className="w-px h-8 bg-gray-200" />

                {/* Brush Size */}
                <div className="flex items-center gap-1">
                    {BRUSH_SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => setBrushSize(size)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                brushSize === size
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white hover:bg-gray-100'
                            }`}
                            title={`Size ${size}`}
                        >
                            <div
                                className="rounded-full bg-current"
                                style={{ width: size + 4, height: size + 4 }}
                            />
                        </button>
                    ))}
                </div>

                <div className="w-px h-8 bg-gray-200" />

                {/* Color Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                        title="Color picker"
                    >
                        <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: activeColor }}
                        />
                        <Palette size={20} className="text-gray-500" />
                    </button>

                    {showColorPicker && (
                        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl p-3 border border-gray-200 grid grid-cols-3 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setActiveColor(color);
                                        setShowColorPicker(false);
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                        activeColor === color ? 'border-blue-500 scale-110' : 'border-gray-200'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            {/* Custom color input */}
                            <input
                                type="color"
                                value={activeColor}
                                onChange={(e) => setActiveColor(e.target.value)}
                                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200"
                                title="Custom color"
                            />
                        </div>
                    )}
                </div>

                <div className="w-px h-8 bg-gray-200" />

                {/* Actions */}
                <button
                    onClick={undo}
                    disabled={history.length === 0}
                    className={`p-2 rounded-lg transition-colors ${
                        history.length === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title="Undo"
                >
                    <ArrowCounterClockwise size={24} />
                </button>
                <button
                    onClick={clearCanvas}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                    title="Clear canvas"
                >
                    <Trash size={24} />
                </button>
            </div>

            {/* Board Container */}
            <div
                ref={containerRef}
                className="relative flex-1 bg-white m-4 mt-20 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                style={{ cursor: activeTool === 'eraser' ? 'cell' : 'crosshair' }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {/* Remote Cursors */}
                {Object.values(cursors).map((cursor: Cursor) => (
                    <div
                        key={cursor.userId}
                        className="absolute pointer-events-none transition-all duration-75 ease-linear flex items-start"
                        style={{
                            left: `${cursor.x * 100}%`,
                            top: `${cursor.y * 100}%`
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill={cursor.color} stroke="white" />
                        </svg>
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded-md whitespace-nowrap opacity-60">
                            {cursor.userId.slice(0, 8)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
