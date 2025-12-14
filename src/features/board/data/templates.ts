import { v4 as uuidv4 } from 'uuid';

// Forced update to refresh cache
export interface TemplateColumn {
    id: string;
    label: string;
    type: 'text' | 'person' | 'status' | 'date' | 'priority' | 'number' | 'select' | 'dropdown';
    width: number;
    options?: { id: string; label: string; color: string }[];
}

export interface TemplateGroup {
    id: string;
    title: string;
    color: string;
    tasks?: any[]; // Allow pre-filled tasks if needed
}

export interface TemplateItem {
    [key: string]: any;
}

export interface BoardTemplate {
    id: string;
    name: string;
    description: string;
    category: 'Personal' | 'Work' | 'Management' | 'HR' | 'Development'; // Keeping categories for UI grouping if needed, defaulting if not provided
    columns: TemplateColumn[];
    groups: TemplateGroup[];
    items?: TemplateItem[];
}

const mapColumns = (cols: string[]): TemplateColumn[] => {
    // Always add selection column first
    const mapped: TemplateColumn[] = [
        { id: 'select', label: '', type: 'select', width: 40 }
    ];

    cols.forEach(c => {
        if (c === 'Name') mapped.push({ id: 'name', label: c, type: 'text', width: 300 });
        else if (c === 'Status') mapped.push({ id: 'status', label: c, type: 'status', width: 140 });
        else if (c === 'Owner') mapped.push({ id: 'assignees', label: c, type: 'person', width: 140 });
        else if (c === 'Due Date' || c === 'Date') mapped.push({ id: 'dueDate', label: c, type: 'date', width: 140 });
        else if (c === 'Priority') mapped.push({ id: 'priority', label: c, type: 'priority', width: 140 });
        else if (c === 'Review Date') mapped.push({ id: 'review_date', label: c, type: 'date', width: 140 });
        else if (c === 'Progress %' || c === 'Completion %') mapped.push({ id: 'progress', label: c, type: 'number', width: 120 });
        else if (c === 'Estimated Hours') mapped.push({ id: 'est_hours', label: c, type: 'number', width: 140 });
        else if (c === 'Actual Hours') mapped.push({ id: 'act_hours', label: c, type: 'number', width: 140 });
        else mapped.push({ id: c.toLowerCase().replace(/ /g, '_'), label: c, type: 'text', width: 150 });
    });
    return mapped;
};

// Default groups since user JSON didn't provide them, but items use them.
const DEFAULT_GROUPS: TemplateGroup[] = [
    { id: 'To Do', title: 'To Do', color: '#c4c4c4' },
    { id: 'In Progress', title: 'In Progress', color: '#fdab3d' },
    { id: 'Done', title: 'Done', color: '#00c875' }
];

export const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: "task-management",
        name: "Task Management",
        description: "Track daily work tasks.",
        category: "Work",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Prepare weekly report", "Status": "In Progress", "Owner": "Alex" },
            { "Name": "Reply to client emails", "Status": "To Do", "Owner": "Sara" },
            { "Name": "Update task documentation", "Status": "Done", "Owner": "John" }
        ]
    },
    {
        id: "project-planning",
        name: "Project Planning",
        description: "Organize project-related work.",
        category: "Management",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Define project scope", "Status": "Done", "Owner": "Mohamed" },
            { "Name": "Create timeline", "Status": "In Progress", "Owner": "Alex" },
            { "Name": "Assign responsibilities", "Status": "To Do", "Owner": "Lina" }
        ]
    },
    {
        id: "employee-workload",
        name: "Employee Workload",
        description: "Monitor employee assigned work.",
        category: "Management",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Design homepage UI", "Status": "In Progress", "Owner": "UI Team" },
            { "Name": "Backend API integration", "Status": "To Do", "Owner": "Backend Team" },
            { "Name": "QA testing", "Status": "To Do", "Owner": "QA Team" }
        ]
    },
    {
        id: "meeting-tracker",
        name: "Meeting Tracker",
        description: "Track meetings and follow-ups.",
        category: "Work",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Weekly team meeting", "Status": "Done", "Owner": "Manager" },
            { "Name": "Client kickoff meeting", "Status": "In Progress", "Owner": "Sales" },
            { "Name": "Retrospective meeting", "Status": "To Do", "Owner": "Scrum Master" }
        ]
    },
    {
        id: "hr-operations",
        name: "HR Operations",
        description: "Handle HR related tasks.",
        category: "HR",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Review CVs", "Status": "In Progress", "Owner": "HR" },
            { "Name": "Schedule interviews", "Status": "To Do", "Owner": "HR" },
            { "Name": "Employee onboarding", "Status": "Done", "Owner": "HR" }
        ]
    },
    {
        id: "performance-review",
        name: "Performance Review",
        description: "Track employee performance reviews.",
        category: "HR",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Q1 review - Alex", "Status": "Done", "Owner": "Manager" },
            { "Name": "Q1 review - Sara", "Status": "In Progress", "Owner": "Manager" },
            { "Name": "Q1 review - John", "Status": "To Do", "Owner": "Manager" }
        ]
    },
    {
        id: "training-plan",
        name: "Training Plan",
        description: "Organize employee training.",
        category: "HR",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "React basics training", "Status": "Done", "Owner": "Tech Lead" },
            { "Name": "Security awareness", "Status": "In Progress", "Owner": "IT" },
            { "Name": "Leadership workshop", "Status": "To Do", "Owner": "HR" }
        ]
    },
    {
        id: "company-goals",
        name: "Company Goals",
        description: "Track company objectives.",
        category: "Management",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Increase productivity", "Status": "In Progress", "Owner": "Management" },
            { "Name": "Reduce operational costs", "Status": "To Do", "Owner": "Finance" },
            { "Name": "Improve employee retention", "Status": "Done", "Owner": "HR" }
        ]
    },
    {
        id: "daily-standup",
        name: "Daily Standup",
        description: "Daily team check-ins.",
        category: "Development",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "Yesterday's work summary", "Status": "Done", "Owner": "Team" },
            { "Name": "Today's plan", "Status": "In Progress", "Owner": "Team" },
            { "Name": "Blockers discussion", "Status": "To Do", "Owner": "Team" }
        ]
    },
    {
        id: "internal-requests",
        name: "Internal Requests",
        description: "Manage internal company requests.",
        category: "Work",
        columns: mapColumns(["Name", "Status", "Owner"]),
        groups: DEFAULT_GROUPS,
        items: [
            { "Name": "New laptop request", "Status": "In Progress", "Owner": "IT" },
            { "Name": "Access permission update", "Status": "Done", "Owner": "Admin" },
            { "Name": "Office supplies request", "Status": "To Do", "Owner": "Operations" }
        ]
    }
];
