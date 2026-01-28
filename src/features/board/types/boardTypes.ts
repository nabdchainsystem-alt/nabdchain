export enum Status {
    ToDo = 'To Do',
    WorkingOnIt = 'Working on it',
    Stuck = 'Stuck',
    Done = 'Done',
    InProgress = 'In Progress',
    Pending = 'Pending',
    AlmostFinish = 'Almost Done'
}

export enum Priority {
    Urgent = 'Urgent',
    High = 'High',
    Medium = 'Medium',
    Normal = 'Normal',
    Low = 'Low'
}

export const STATUS_COLORS: Record<Status, string> = {
    [Status.ToDo]: '#aeaeae',
    [Status.WorkingOnIt]: '#e59935',
    [Status.Stuck]: '#cb3d52',
    [Status.Done]: '#00b369',
    [Status.InProgress]: '#3574dd',
    [Status.Pending]: '#4e8be3',
    [Status.AlmostFinish]: '#9154c6'
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    [Priority.Urgent]: '#2d2d2d',
    [Priority.High]: '#391485',
    [Priority.Medium]: '#4c50c8',
    [Priority.Normal]: '#4e8be3',
    [Priority.Low]: '#c2c2c2'
};

export const PEOPLE = [
    { id: '1', name: 'Max', color: '#ff0000' },
    { id: '2', name: 'Alice', color: '#00ff00' }
];

export interface ITask {
    id: string;
    name: string;
    status: Status;
    priority: Priority;
    personId: string | null;
    dueDate: string;
    textValues: Record<string, string>;
    selected: boolean;
    subtasks?: ITask[];
    people?: any; // To support rich person object sync
    [key: string]: any; // Allow for dynamic column data (e.g. file attachments)
}

export interface IColumn {
    id: string;
    title: string;
    type: string;
    width?: number;
}

export interface IGroup {
    id: string;
    title: string;
    color: string;
    tasks: ITask[];
    columns: IColumn[];
    isPinned: boolean;
}

export interface IBoard {
    id: string;
    name: string;
    groups: IGroup[];
    availableViews?: string[];
    pinnedViews?: string[];
    description?: string;
    defaultView?: string;
}
