
import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../auth-adapter';
import { CaretLeft } from 'phosphor-react';

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

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5'];

export const LiveBoard: React.FC<{ roomId: string, onClose: () => void }> = ({ roomId, onClose }) => {
    const { socket } = useSocket();
    const { user } = useUser();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursors, setCursors] = useState<Record<string, Cursor>>({});
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPoint = useRef<Point | null>(null);

    // Random color for this user
    const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

    useEffect(() => {
        if (!socket) return;

        const handleRemoteCursor = ({ userId, x, y }: { userId: string, x: number, y: number }) => {
            // x, y are percentages to handle different screen sizes
            setCursors(prev => ({
                ...prev,
                [userId]: { userId, x, y, color: prev[userId]?.color || COLORS[Math.floor(Math.random() * COLORS.length)] }
            }));
        };

        const handleRemoteDraw = ({ x0, y0, x1, y1, color }: any) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Convert percentages back to pixels
            const w = canvas.width;
            const h = canvas.height;

            drawLine(ctx, x0 * w, y0 * h, x1 * w, y1 * h, color);
        };

        socket.on('cursor-move', handleRemoteCursor);
        socket.on('draw-data', handleRemoteDraw);

        return () => {
            socket.off('cursor-move', handleRemoteCursor);
            socket.off('draw-data', handleRemoteDraw);
        };
    }, [socket]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.offsetWidth;
                canvasRef.current.height = containerRef.current.offsetHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const drawLine = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
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

        if (isDrawing && lastPoint.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawLine(ctx, lastPoint.current.x, lastPoint.current.y, x, y, userColor.current);

                // Broadcast draw event
                socket.emit('draw-data', {
                    roomId,
                    data: {
                        x0: lastPoint.current.x / rect.width,
                        y0: lastPoint.current.y / rect.height,
                        x1: relX,
                        y1: relY,
                        color: userColor.current
                    }
                });
            }
            lastPoint.current = { x, y };
        }
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        lastPoint.current = { x, y };
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        lastPoint.current = null;
    };

    return (
        <div className="fixed inset-0 z-40 bg-white/50 backdrop-blur-sm" style={{ display: 'flex' }}>
            {/* Board Container */}
            <div
                ref={containerRef}
                className="relative flex-1 bg-white m-4 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden cursor-crosshair"
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
                            {cursor.userId}
                        </span>
                    </div>
                ))}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
                >
                    <CaretLeft size={24} />
                </button>
            </div>
        </div>
    );
};
