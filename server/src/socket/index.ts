
import { Server, Socket } from 'socket.io';

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
        console.log(`[Socket] Client connected: ${socket.id}`);

        // --- Room Management ---
        socket.on('join-room', ({ roomId, userId, name, avatarUrl }) => {
            socket.join(roomId);

            if (!rooms[roomId]) rooms[roomId] = [];

            // Avoid duplicates
            if (!rooms[roomId].some(u => u.socketId === socket.id)) {
                // Remove user from room if they re-joined (update info)
                rooms[roomId] = rooms[roomId].filter(u => u.userId !== userId);
                rooms[roomId].push({ socketId: socket.id, userId, name, avatarUrl });
            }

            console.log(`[Socket] User ${name || userId} joined room ${roomId}`);

            // Notify others in room
            socket.to(roomId).emit('user-joined', { userId, name, avatarUrl, socketId: socket.id });

            // Send list of current users to the new joiner
            socket.emit('room-users', rooms[roomId]);
        });

        socket.on('leave-room', ({ roomId, userId }) => {
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
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });

        // --- Real-time Features ---

        // Cursor Movement
        socket.on('cursor-move', ({ roomId, x, y, userId }) => {
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('cursor-move', { userId, x, y });
        });

        // Board Drawing/Updates
        socket.on('draw-data', ({ roomId, data }) => {
            socket.to(roomId).emit('draw-data', data);
        });

        // --- WebRTC Signaling (Simple-Peer) ---
        // userToCall is the socketID of the peer we want to connect to
        // signalData is the WebRTC offer/answer/candidate
        socket.on('call-user', ({ userToCall, signalData, from, name }) => {
            io.to(userToCall).emit('call-made', { signal: signalData, from, name });
        });

        socket.on('answer-call', ({ to, signal }) => {
            io.to(to).emit('call-answered', { signal, to: socket.id }); // 'to' here helps verify source
        });

        // Generic signal relay for updates (ICE candidates etc)
        socket.on('peer-signal', ({ to, signal }) => {
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
