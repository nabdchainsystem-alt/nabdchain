import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash, CheckCircle, Star } from 'phosphor-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | null;
  createdAt: number;
  dueDate?: string;
}

const STORAGE_KEY = 'mobile-tasks-v1';

export const MobileTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Persist tasks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskText.trim(),
      completed: false,
      priority: null,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const togglePriority = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const priorities: Task['priority'][] = [null, 'low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(t.priority);
        const nextPriority = priorities[(currentIndex + 1) % priorities.length];
        return { ...t, priority: nextPriority };
      }),
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Stats */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            <span className="font-semibold text-gray-800">{activeTasks}</span> active
          </span>
          <span className="text-gray-600">
            <span className="font-semibold text-green-600">{completedTasks}</span> done
          </span>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Plus size={20} weight="bold" />
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <CheckCircle size={48} className="mb-2 opacity-50" />
            <p className="text-sm">
              {filter === 'completed'
                ? 'No completed tasks'
                : filter === 'active'
                  ? 'All tasks completed!'
                  : 'No tasks yet. Add one above!'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {task.completed && <Check size={14} weight="bold" />}
                </button>

                {/* Task Text */}
                <span className={`flex-1 text-base ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {task.title}
                </span>

                {/* Priority Star */}
                <button
                  onClick={() => togglePriority(task.id)}
                  className={`p-1.5 rounded-lg transition-colors ${getPriorityColor(task.priority)}`}
                >
                  <Star size={18} weight={task.priority ? 'fill' : 'regular'} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clear Completed */}
      {completedTasks > 0 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={() => setTasks(tasks.filter((t) => !t.completed))}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            Clear {completedTasks} completed task{completedTasks !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileTasks;
