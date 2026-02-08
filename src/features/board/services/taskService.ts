import { ITask as Task } from '../types/boardTypes';

export const taskService = {
  getTasks: async (_filter?: Record<string, unknown>, _contextId?: string): Promise<Task[]> => {
    return [];
  },
  createTask: async (_task: Partial<Task>): Promise<Task> => {
    return {} as Task;
  },
  updateTask: async (_id: string, _updates: Partial<Task>): Promise<Task> => {
    return {} as Task;
  },
  deleteTask: async (_id: string): Promise<void> => {},
};
