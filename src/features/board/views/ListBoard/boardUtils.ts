import { ITask, IGroup, Status } from '../../types/boardTypes';

export const statusColorMap: Record<Status, string> = {
    [Status.ToDo]: '#9095a6',
    [Status.WorkingOnIt]: '#e5ab5c',
    [Status.Stuck]: '#dd6b20',
    [Status.Done]: '#2dc486',
    [Status.InProgress]: '#3574dd',
    [Status.Pending]: '#e5c339',
    [Status.AlmostFinish]: '#b07cd8',
};

export const normalizeStatus = (raw?: string): Status => {
    if (!raw) return Status.ToDo;
    const val = raw.toLowerCase();
    if (val.includes('done') || val.includes('complete')) return Status.Done;
    if (val.includes('working on it')) return Status.WorkingOnIt;
    if (val.includes('progress') || val.includes('doing')) return Status.InProgress;
    if (val.includes('stuck') || val.includes('block')) return Status.Stuck;
    if (val.includes('pending') || val.includes('backlog')) return Status.Pending;
    if (val.includes('almost') || val.includes('review')) return Status.AlmostFinish;
    if (val.includes('todo') || val.includes('to do')) return Status.ToDo;
    return Status.ToDo;
};

export const resolveTaskStatus = (group: IGroup, task: ITask): Status => {
    const statusColId = group.columns.find(c => c.type === 'status')?.id;
    const rawStatus = task.status || (statusColId ? task.textValues?.[statusColId] : undefined);
    return normalizeStatus(rawStatus as string | undefined);
};

export const calculateProgress = (group: IGroup, tasksOverride?: ITask[]) => {
    const allTasks = (tasksOverride ?? group.tasks).flatMap(t => [t, ...(t.subtasks || [])]);
    if (allTasks.length === 0) {
        return {
            counts: { done: 0, working: 0, stuck: 0, pending: 0, almostFinish: 0, todo: 0 },
            weighted: 0,
            total: 0
        };
    }

    const counts = allTasks.reduce((acc, task) => {
        const status = resolveTaskStatus(group, task);
        acc[status === Status.Done ? 'done'
            : status === Status.WorkingOnIt ? 'working'
                : status === Status.InProgress ? 'working'
                    : status === Status.Stuck ? 'stuck'
                        : status === Status.Pending ? 'pending'
                            : status === Status.AlmostFinish ? 'almostFinish'
                                : 'todo'] += 1;
        return acc;
    }, { done: 0, working: 0, stuck: 0, pending: 0, almostFinish: 0, todo: 0 });

    const total = allTasks.length;
    const weighted = (
        counts.done * 1 +
        counts.almostFinish * 0.75 +
        counts.working * 0.5 +
        counts.pending * 0.25 +
        counts.todo * 0.1 +
        counts.stuck * 0
    ) / total * 100;

    return {
        counts,
        weighted,
        total
    };
};
