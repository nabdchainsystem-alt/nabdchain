import { Thread, Message } from '../features/discussion/types';

const API_URL = 'http://localhost:3001/api';

export const discussionService = {
    async getThreads(token: string, boardId?: string): Promise<Thread[]> {
        try {
            let url = `${API_URL}/threads`;
            if (boardId) {
                url += `?boardId=${boardId}`;
            }
            // Sorting is handled by backend

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch threads');
            return await response.json();
        } catch (error) {
            console.error('Error fetching threads:', error);
            return [];
        }
    },

    async createThread(token: string, thread: Omit<Thread, 'id' | 'updatedAt'>): Promise<Thread> {
        try {
            const response = await fetch(`${API_URL}/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(thread),
            });

            if (!response.ok) throw new Error('Failed to create thread');
            return await response.json();
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    },

    async updateThread(token: string, thread: Thread): Promise<Thread> {
        try {
            const response = await fetch(`${API_URL}/threads/${thread.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(thread),
            });

            if (!response.ok) throw new Error('Failed to update thread');
            return await response.json();
        } catch (error) {
            console.error('Error updating thread:', error);
            throw error;
        }
    },

    async deleteThread(token: string, id: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/threads/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete thread');
        } catch (error) {
            console.error('Error deleting thread:', error);
            throw error;
        }
    }
};
