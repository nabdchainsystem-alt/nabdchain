import { API_URL } from '../config/api';

export interface Assignment {
    id: string;
    sourceBoardId: string;
    sourceRowId: string;
    sourceTaskData: Record<string, unknown>;
    assignedFromUserId: string;
    assignedToUserId: string;
    isViewed: boolean;
    viewedAt: string | null;
    createdAt: string;
    copiedBoardId: string | null;
    copiedRowId: string | null;
    assignedFromUser: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

export interface AssignTaskData {
    sourceBoardId: string;
    sourceRowId: string;
    sourceTaskData: Record<string, unknown>;
    assignedToUserId: string;
}

export const assignmentService = {
    // Assign a task to a team member
    async assignTask(token: string, data: AssignTaskData): Promise<Assignment> {
        const response = await fetch(`${API_URL}/assignments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign task');
        }

        return response.json();
    },

    // Get pending (unviewed) assignments
    async getPendingAssignments(token: string): Promise<Assignment[]> {
        const response = await fetch(`${API_URL}/assignments/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pending assignments');
        }

        return response.json();
    },

    // Get unread count
    async getUnreadCount(token: string): Promise<number> {
        const response = await fetch(`${API_URL}/assignments/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assignment count');
        }

        const data = await response.json();
        return data.count;
    },

    // Mark assignment as viewed
    async markAsViewed(token: string, assignmentId: string): Promise<Assignment> {
        const response = await fetch(`${API_URL}/assignments/${assignmentId}/viewed`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to mark assignment as viewed');
        }

        return response.json();
    },

    // Get all assignments (history)
    async getAllAssignments(token: string): Promise<Assignment[]> {
        const response = await fetch(`${API_URL}/assignments/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assignments');
        }

        return response.json();
    }
};
