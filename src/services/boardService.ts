import { Board, CreateBoardData, UpdateBoardData, Card, CreateCardData, UpdateCardData } from './types';
import { API_URL } from '../config/api';
import { boardLogger } from '../utils/logger';

export const boardService = {
    // Boards
    async getAllBoards(token: string, workspaceId?: string): Promise<Board[]> {
        try {
            const url = new URL(`${API_URL}/boards`);
            if (workspaceId) url.searchParams.append('workspaceId', workspaceId);

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch boards');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching boards:', error);
            return [];
        }
    },

    async getBoard(token: string, id: string): Promise<Board | null> {
        try {
            const response = await fetch(`${API_URL}/boards/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch board');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching board:', error);
            return null;
        }
    },

    async createBoard(token: string, board: CreateBoardData): Promise<Board> {
        try {
            const response = await fetch(`${API_URL}/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(board),
            });
            if (!response.ok) throw new Error('Failed to create board');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error creating board:', error);
            throw error;
        }
    },

    async updateBoard(token: string, id: string, updates: UpdateBoardData): Promise<Board> {
        try {
            const response = await fetch(`${API_URL}/boards/${id}`, {
                method: 'PUT', // Changed PATCH to PUT to match backend route
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update board');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error updating board:', error);
            throw error;
        }
    },

    async deleteBoard(token: string, id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/boards/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete board');
            return true;
        } catch (error) {
            boardLogger.error('Error deleting board:', error);
            throw error;
        }
    },

    // Cards
    async getCards(boardId: string): Promise<Card[]> {
        try {
            const response = await fetch(`${API_URL}/cards?boardId=${boardId}`);
            if (!response.ok) throw new Error('Failed to fetch cards');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching cards:', error);
            return [];
        }
    },

    async getAllCards(): Promise<Card[]> {
        try {
            const response = await fetch(`${API_URL}/cards`);
            if (!response.ok) throw new Error('Failed to fetch cards');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error fetching cards:', error);
            return [];
        }
    },

    async createCard(card: CreateCardData): Promise<Card> {
        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card),
            });
            if (!response.ok) throw new Error('Failed to create card');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error creating card:', error);
            throw error;
        }
    },

    async updateCard(id: string, updates: UpdateCardData): Promise<Card> {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update card');
            return await response.json();
        } catch (error) {
            boardLogger.error('Error updating card:', error);
            throw error;
        }
    },

    async deleteCard(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete card');
            return true;
        } catch (error) {
            boardLogger.error('Error deleting card:', error);
            throw error;
        }
    }
};
