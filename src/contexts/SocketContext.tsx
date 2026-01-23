
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth-adapter';
import { socketLogger } from '../utils/logger';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

// Use environment variable for socket URL, fallback to localhost for dev
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { userId, isLoaded } = useAuth(); // Clerk Auth

    useEffect(() => {
        if (!isLoaded || !userId) return;

        socketLogger.info('Initializing socket connection to:', SOCKET_URL);

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            socketLogger.info('Connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            socketLogger.info('Disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            socketLogger.error('Connection Error:', err.message);
        });

        setSocket(newSocket);

        return () => {
            socketLogger.debug('Cleaning up socket');
            newSocket.disconnect();
        };
    }, [isLoaded, userId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
