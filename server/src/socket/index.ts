import { Server, Socket } from 'socket.io';
import { socketLogger } from '../utils/logger';

interface RoomUser {
    socketId: string;
    userId: string;
    name?: string;
    avatarUrl?: string;
}

// Store for active users in rooms (in-memory for now, use Redis for scaling)
const rooms: Record<string, RoomUser[]> = {};

export const initializeSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        socketLogger.info(`Client connected: ${socket.id}`);

        // --- User Notification Room ---
        socket.on('join-user-room', ({ userId }: { userId: string }) => {
            socket.join(`user:${userId}`);
            socketLogger.debug(`User ${userId} joined notification room`);
        });

        socket.on('leave-user-room', ({ userId }: { userId: string }) => {
            socket.leave(`user:${userId}`);
            socketLogger.debug(`User ${userId} left notification room`);
        });

        // --- Room Management ---
        socket.on('join-room', ({ roomId, userId, name, avatarUrl }: { roomId: string, userId: string, name?: string, avatarUrl?: string }) => {
            socket.join(roomId);

            if (!rooms[roomId]) rooms[roomId] = [];

            // Avoid duplicates
            if (!rooms[roomId].some(u => u.socketId === socket.id)) {
                // Remove user from room if they re-joined (update info)
                rooms[roomId] = rooms[roomId].filter(u => u.userId !== userId);
                rooms[roomId].push({ socketId: socket.id, userId, name, avatarUrl });
            }

            socketLogger.info(`User ${name || userId} joined room ${roomId}`);

            // Notify others in room
            socket.to(roomId).emit('user-joined', { userId, name, avatarUrl, socketId: socket.id });

            // Send list of current users to the new joiner
            socket.emit('room-users', rooms[roomId]);
        });

        socket.on('leave-room', ({ roomId, userId }: { roomId: string, userId: string }) => {
            handleLeave(socket, roomId);
        });

        socket.on('disconnecting', () => {
            // socket.rooms is a Set containing the socket ID and joined rooms
            for (const roomId of socket.rooms) {
                if (roomId !== socket.id) {
                    handleLeave(socket, roomId);
                }
            }
        });

        socket.on('disconnect', () => {
            socketLogger.info(`Client disconnected: ${socket.id}`);
        });

        // --- Real-time Features ---

        // Cursor Movement
        socket.on('cursor-move', ({ roomId, x, y, userId }: { roomId: string, x: number, y: number, userId: string }) => {
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('cursor-move', { userId, x, y });
        });

        // Board Drawing/Updates
        socket.on('draw-data', ({ roomId, data }: { roomId: string, data: any }) => {
            socketLogger.info(`draw-data from ${socket.id} to room ${roomId}:`, data);
            socket.to(roomId).emit('draw-data', data);
        });

        // --- WebRTC Signaling (Simple-Peer) ---
        // userToCall is the socketID of the peer we want to connect to
        // signalData is the WebRTC offer/answer/candidate
        socket.on('call-user', ({ userToCall, signalData, from, name }: { userToCall: string, signalData: any, from: string, name?: string }) => {
            io.to(userToCall).emit('call-made', { signal: signalData, from, name });
        });

        socket.on('answer-call', ({ to, signal }: { to: string, signal: any }) => {
            io.to(to).emit('call-answered', { signal, to: socket.id }); // 'to' here helps verify source
        });

        // Generic signal relay for updates (ICE candidates etc)
        socket.on('peer-signal', ({ to, signal }: { to: string, signal: any }) => {
            io.to(to).emit('peer-signal', { signal, from: socket.id });
        });
    });
};

const handleLeave = (socket: Socket, roomId: string) => {
    if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(user => user.socketId !== socket.id);
        socket.to(roomId).emit('user-left', { socketId: socket.id });

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    }
    socket.leave(roomId);
};
