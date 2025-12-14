
export enum TeamRole {
    ADMIN = 'Admin',
    MEMBER = 'Member',
    GUEST = 'Guest'
}

export enum TeamStatus {
    ACTIVE = 'Active',
    INVITED = 'Invited',
    AWAY = 'Away'
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: TeamRole;
    status: TeamStatus;
    avatarUrl?: string; // Optional URL for avatar image
    initials: string;   // Fallback if no avatar
    department: string;
    lastActive: string;
    location?: string;
    color: string;      // Background color for avatar fallback
}
