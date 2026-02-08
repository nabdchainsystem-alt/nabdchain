export interface Reminder {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  time?: string;
  listId?: string;
  tags: string[];
  completed: boolean;
  subtasks: { id: string; title: string; completed: boolean }[];
}

export const remindersService = {
  subscribe: (_callback: (reminders: Reminder[]) => void) => {
    return () => {};
  },
  getReminders: async (_contextId?: string): Promise<Reminder[]> => {
    return [];
  },
  addReminder: (_reminder: Omit<Reminder, 'id'>) => {},
  deleteReminder: (_id: string) => {},
  updateReminder: (_id: string, _updates: Partial<Reminder>) => {},
  sendTask: () => {},
};
