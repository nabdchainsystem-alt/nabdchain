import { TeamMember, TeamRole, TeamStatus } from './types';

export const MOCK_MEMBERS: TeamMember[] = [
    {
        id: '1',
        name: 'Alexandra Connors',
        email: 'alex.connors@example.com',
        role: TeamRole.ADMIN,
        status: TeamStatus.ACTIVE,
        initials: 'AC',
        department: 'Engineering',
        lastActive: 'Just now',
        location: 'San Francisco, CA',
        color: 'bg-purple-500'
    },
    {
        id: '2',
        name: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        role: TeamRole.MEMBER,
        status: TeamStatus.ACTIVE,
        initials: 'MC',
        department: 'Design',
        lastActive: '5 mins ago',
        location: 'New York, NY',
        color: 'bg-blue-500'
    },
    {
        id: '3',
        name: 'Sarah Miller',
        email: 'sarah.miller@example.com',
        role: TeamRole.MEMBER,
        status: TeamStatus.AWAY,
        initials: 'SM',
        department: 'Product',
        lastActive: '2 days ago',
        location: 'London, UK',
        color: 'bg-green-500'
    },
    {
        id: '4',
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        role: TeamRole.GUEST,
        status: TeamStatus.INVITED,
        initials: 'DW',
        department: 'Marketing',
        lastActive: '-',
        location: 'Remote',
        color: 'bg-yellow-500'
    },
    {
        id: '5',
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        role: TeamRole.MEMBER,
        status: TeamStatus.ACTIVE,
        initials: 'ED',
        department: 'Sales',
        lastActive: '1 hour ago',
        location: 'Chicago, IL',
        color: 'bg-pink-500'
    },
    {
        id: '6',
        name: 'James Rodriguez',
        email: 'james.r@example.com',
        role: TeamRole.MEMBER,
        status: TeamStatus.ACTIVE,
        initials: 'JR',
        department: 'Engineering',
        lastActive: '15 mins ago',
        location: 'Austin, TX',
        color: 'bg-indigo-500'
    }
];
