const API_URL = 'http://localhost:3001/api';

export const boardService = {
    // Boards
    async getAllBoards(token: string) {
        try {
            const response = await fetch(`${API_URL}/boards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch boards');
            return await response.json();
        } catch (error) {
            console.error('Error fetching boards:', error);
            return [];
        }
    },

    async getBoard(token: string, id: string) {
        try {
            const response = await fetch(`${API_URL}/boards/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch board');
            return await response.json();
        } catch (error) {
            console.error('Error fetching board:', error);
            return null;
        }
    },

    async createBoard(token: string, board: any) {
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
            console.error('Error creating board:', error);
            throw error;
        }
    },

    async updateBoard(token: string, id: string, updates: any) {
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
            console.error('Error updating board:', error);
            throw error;
        }
    },

    async deleteBoard(token: string, id: string) {
        try {
            const response = await fetch(`${API_URL}/boards/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete board');
            return true;
        } catch (error) {
            console.error('Error deleting board:', error);
            throw error;
        }
    },

    // Cards
    async getCards(boardId: string) {
        try {
            const response = await fetch(`${API_URL}/cards?boardId=${boardId}`);
            if (!response.ok) throw new Error('Failed to fetch cards');
            return await response.json();
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    },

    async getAllCards() {
        try {
            const response = await fetch(`${API_URL}/cards`);
            if (!response.ok) throw new Error('Failed to fetch cards');
            return await response.json();
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    },

    async createCard(card: any) {
        try {
            const response = await fetch(`${API_URL}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card),
            });
            if (!response.ok) throw new Error('Failed to create card');
            return await response.json();
        } catch (error) {
            console.error('Error creating card:', error);
            throw error;
        }
    },

    async updateCard(id: string, updates: any) {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update card');
            return await response.json();
        } catch (error) {
            console.error('Error updating card:', error);
            throw error;
        }
    },

    async deleteCard(id: string) {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete card');
            return true;
        } catch (error) {
            console.error('Error deleting card:', error);
            throw error;
        }
    }
};
