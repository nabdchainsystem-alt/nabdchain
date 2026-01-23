import React, { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

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

// TEMPORARILY DISABLED - Socket connection disabled to debug app reloading issue
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SocketContext.Provider value={{ socket: null, isConnected: false, connect: () => {} }}>
            {children}
        </SocketContext.Provider>
    );
};
