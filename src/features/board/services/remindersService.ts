export interface Reminder {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    time?: string;
    listId?: string;
    tags: string[];
    completed: boolean;
    subtasks: any[];
}

export const remindersService = {
    subscribe: (callback: (reminders: Reminder[]) => void) => {
        return () => { };
    },
    getReminders: async (contextId?: string): Promise<Reminder[]> => {
        return [];
    },
    addReminder: (reminder: Omit<Reminder, 'id'>) => {
    },
    deleteReminder: (id: string) => {
    },
    updateReminder: (id: string, updates: Partial<Reminder>) => {
    },
    sendTask: () => { }
};
