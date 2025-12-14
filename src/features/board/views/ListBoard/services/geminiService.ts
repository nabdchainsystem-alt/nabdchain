
export interface AIUsageStats {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
}

export const generateTasksForGroup = async (groupTitle: string): Promise<Array<{ name: string; status?: string }>> => {


    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response based on group title keywords
    if (groupTitle.toLowerCase().includes('plan')) {
        return [
            { name: 'Research requirements', status: 'Done' },
            { name: 'Draft initial plan', status: 'Working on it' },
            { name: 'Review with team', status: 'Stuck' },
            { name: 'Finalize milestones', status: 'Empty' }
        ];
    }

    if (groupTitle.toLowerCase().includes('dev') || groupTitle.toLowerCase().includes('backend')) {
        return [
            { name: 'Setup environment', status: 'Done' },
            { name: 'Implement API endpoints', status: 'Working on it' },
            { name: 'Write unit tests', status: 'Empty' },
            { name: 'Deploy to staging', status: 'Empty' }
        ];
    }

    // Default mock tasks
    return [
        { name: 'New Task 1', status: 'Empty' },
        { name: 'New Task 2', status: 'Working on it' },
        { name: 'New Task 3', status: 'Stuck' }
    ];
};
