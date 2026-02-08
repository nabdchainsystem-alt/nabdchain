import { API_URL } from '../config/api';

export interface EmailAccount {
  id: string;
  provider: string;
  email: string;
}

const API_BASE = API_URL;

export const emailService = {
  getAccounts: async (token: string): Promise<EmailAccount[]> => {
    const res = await fetch(`${API_BASE}/auth/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  disconnectAccount: async (id: string, token: string) => {
    const res = await fetch(`${API_BASE}/auth/accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to disconnect');
    return res.json();
  },

  getFolders: async (token: string): Promise<{ id: string; name: string; messageCount?: number }[]> => {
    const res = await fetch(`${API_BASE}/email/folders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
  },

  getEmails: async (token: string, folderId?: string) => {
    const url = folderId ? `${API_BASE}/email/list?folderId=${encodeURIComponent(folderId)}` : `${API_BASE}/email/list`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
  },

  sendEmail: async (
    token: string,
    to: string,
    subject: string,
    body: string,
    provider: 'google' | 'outlook',
    cc?: string,
    bcc?: string,
  ) => {
    const res = await fetch(`${API_BASE}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, subject, body, provider, cc, bcc }),
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },

  trash: async (token: string, id: string, provider: string) => {
    const res = await fetch(`${API_BASE}/email/trash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, provider }),
    });
    if (!res.ok) throw new Error('Failed to move email to trash');
    return res.json();
  },

  archive: async (token: string, id: string, provider: string) => {
    const res = await fetch(`${API_BASE}/email/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, provider }),
    });
    if (!res.ok) throw new Error('Failed to archive email');
    return res.json();
  },

  markRead: async (token: string, id: string, provider: string) => {
    const res = await fetch(`${API_BASE}/email/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, provider }),
    });
    if (!res.ok) throw new Error('Failed to mark email as read');
    return res.json();
  },

  // New method to get auth url
  getAuthUrl: async (token: string, provider: 'google' | 'outlook') => {
    const res = await fetch(`${API_BASE}/auth/${provider}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to get auth url');
    return res.json(); // Expects { url: "..." }
  },
};
