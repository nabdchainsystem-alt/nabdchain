import { API_URL } from '../config/api';
import { serviceLogger } from '../utils/logger';

const API_BASE = API_URL;

export const inviteService = {
    createInvite: async (token: string, email?: string) => {
        try {
            const res = await fetch(`${API_BASE}/invite/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error('Failed to create invite');
            return res.json();
        } catch (error) {
            serviceLogger.error("Create Invite Failed:", error);
            throw error;
        }
    },

    acceptInvite: async (token: string, inviteToken: string) => {
        const res = await fetch(`${API_BASE}/invite/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token: inviteToken })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to accept invite');
        }
        return res.json();
    }
};
