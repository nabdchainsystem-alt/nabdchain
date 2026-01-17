/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Base API URL from environment variable, with fallback for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API endpoints
export const API_URL = `${API_BASE_URL}/api`;

// Specific endpoint builders
export const endpoints = {
    // Auth
    auth: {
        google: `${API_URL}/auth/google`,
        outlook: `${API_URL}/auth/outlook`,
    },
    // Workspaces
    workspaces: `${API_URL}/workspaces`,
    workspace: (id: string) => `${API_URL}/workspaces/${id}`,
    // Boards
    boards: `${API_URL}/boards`,
    board: (id: string) => `${API_URL}/boards/${id}`,
    // Rooms
    rooms: (boardId: string) => `${API_URL}/rooms/${boardId}`,
    room: (id: string) => `${API_URL}/rooms/room/${id}`,
    // Rows
    rows: (roomId: string) => `${API_URL}/rows/${roomId}`,
    row: (id: string) => `${API_URL}/rows/row/${id}`,
    // Activities
    activities: `${API_URL}/activities`,
    // Email
    email: {
        accounts: `${API_URL}/email/accounts`,
        messages: (accountId: string) => `${API_URL}/email/${accountId}/messages`,
        folders: (accountId: string) => `${API_URL}/email/${accountId}/folders`,
        send: (accountId: string) => `${API_URL}/email/${accountId}/send`,
    },
    // Vault/Storage
    vault: `${API_URL}/vault`,
    vaultItem: (id: string) => `${API_URL}/vault/${id}`,
    // Docs
    docs: `${API_URL}/docs`,
    doc: (id: string) => `${API_URL}/docs/${id}`,
    // Invites
    invites: `${API_URL}/invites`,
};
