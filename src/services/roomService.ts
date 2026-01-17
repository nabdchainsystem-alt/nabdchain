import { Room, CreateRoomData, Row, CreateRowData, UpdateRowData, Column } from './types';
import { API_BASE_URL } from '../config/api';
import { boardLogger } from '../utils/logger';

const API_URL = API_BASE_URL;

export const roomService = {
    // Rooms
    async getAllRooms(): Promise<Room[]> {
        try {
            const response = await fetch(`${API_URL}/rooms`);
            if (!response.ok) throw new Error('Failed to fetch rooms');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching rooms:', error);
            return [];
        }
    },

    async getRoom(id: string): Promise<Room | null> {
        try {
            const response = await fetch(`${API_URL}/rooms/${id}`);
            if (!response.ok) throw new Error('Failed to fetch room');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching room:', error);
            return null;
        }
    },

    async createRoom(room: CreateRoomData): Promise<Room> {
        try {
            const response = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(room),
            });
            if (!response.ok) throw new Error('Failed to create room');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error creating room:', error);
            throw error;
        }
    },

    // Rows
    async getRows(roomId: string): Promise<Row[]> {
        try {
            const response = await fetch(`${API_URL}/rows?roomId=${roomId}`);
            if (!response.ok) throw new Error('Failed to fetch rows');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching rows:', error);
            return [];
        }
    },

    async createRow(row: CreateRowData): Promise<Row> {
        try {
            const response = await fetch(`${API_URL}/rows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(row),
            });
            if (!response.ok) throw new Error('Failed to create row');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error creating row:', error);
            throw error;
        }
    },

    async updateRow(id: string, updates: UpdateRowData): Promise<Row> {
        try {
            const response = await fetch(`${API_URL}/rows/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update row');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error updating row:', error);
            throw error;
        }
    },

    async deleteRow(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/rows/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete row');
            return true;
        } catch (error) {
            boardLogger.error('Error deleting row:', error);
            throw error;
        }
    },

    // Columns
    async getColumns(roomId: string): Promise<Column[]> {
        try {
            const response = await fetch(`${API_URL}/columns?roomId=${roomId}`);
            if (!response.ok) throw new Error('Failed to fetch columns');
            const result = await response.json();
            return result.length > 0 ? result[0].columns : [];
        } catch (error) {
            boardLogger.error('Error fetching columns:', error);
            return [];
        }
    },

    async updateColumns(roomId: string, columns: Column[]): Promise<{ id: string; roomId: string; columns: Column[] }> {
        try {
            // First, check if columns already exist for this room
            const existing = await fetch(`${API_URL}/columns?roomId=${roomId}`);
            const existingData = await existing.json();

            if (existingData.length > 0) {
                // Update existing
                const response = await fetch(`${API_URL}/columns/${existingData[0].id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ columns }),
                });
                if (!response.ok) throw new Error('Failed to update columns');
                return await response.json();
            } else {
                // Create new
                const response = await fetch(`${API_URL}/columns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId, columns }),
                });
                if (!response.ok) throw new Error('Failed to create columns');
                return await response.json();
            }
        } catch (error) {
            boardLogger.error('Error updating columns:', error);
            throw error;
        }
    }
};
