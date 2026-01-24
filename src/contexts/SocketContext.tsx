import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { socketLogger } from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    connect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) {
            socketLogger.debug('[SocketContext] Already connected');
            return;
        }

        socketLogger.info('[SocketContext] Connecting to socket server:', API_URL);

        const newSocket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        newSocket.on('connect', () => {
            socketLogger.info('[SocketContext] Connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            socketLogger.info('[SocketContext] Disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            socketLogger.error('[SocketContext] Connection error:', error.message);
            setIsConnected(false);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketLogger.info('[SocketContext] Cleaning up socket connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect }}>
            {children}
        </SocketContext.Provider>
    );
};
