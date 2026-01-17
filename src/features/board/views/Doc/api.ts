import { Doc } from './types';
import { API_URL } from '../../../../config/api';

const BASE_URL = `${API_URL}/docs`;

const headers = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const docApi = {
    getAll: async (containerId: string, token: string): Promise<Doc[]> => {
        const res = await fetch(`${BASE_URL}/${containerId}`, {
            headers: headers(token)
        });
        if (!res.ok) throw new Error('Failed to fetch docs');
        return res.json();
    },

    getOne: async (id: string, token: string): Promise<Doc> => {
        const res = await fetch(`${BASE_URL}/page/${id}`, {
            headers: headers(token)
        });
        if (!res.ok) throw new Error('Failed to fetch doc');
        return res.json();
    },

    create: async (data: Partial<Doc> & { roomId?: string, boardId?: string, parentId?: string | null }, token: string): Promise<Doc> => {
        const res = await fetch(`${BASE_URL}`, {
            method: 'POST',
            headers: headers(token),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create doc');
        return res.json();
    },

    update: async (id: string, data: Partial<Doc>, token: string): Promise<Doc> => {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: headers(token),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update doc');
        return res.json();
    },

    delete: async (id: string, token: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: headers(token)
        });
        if (!res.ok) throw new Error('Failed to delete doc');
    }
};
