import React, { useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableGroup } from '../types';
import { GroupDragContext } from '../contexts/GroupDragContext';

// Re-export for backwards compatibility
export { GroupDragContext } from '../contexts/GroupDragContext';

interface SortableGroupWrapperProps {
    group: TableGroup;
    children: React.ReactNode;
}

export const SortableGroupWrapper: React.FC<SortableGroupWrapperProps> = ({ group, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: group.id, data: { type: 'group', group } });

    const style = {
        transform: isDragging ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? transition : undefined,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
            <GroupDragContext.Provider value={{ listeners, attributes }}>
                {children}
            </GroupDragContext.Provider>
        </div>
    );
};

interface GroupDragHandleProps {
    colorClass?: string;
}

export const GroupDragHandle: React.FC<GroupDragHandleProps> = ({ colorClass }) => {
    const { listeners, attributes } = useContext(GroupDragContext);
    return (
        <div
            {...listeners}
            {...attributes}
            className={`w-1.5 h-6 rounded-full ${colorClass} cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none`}
        />
    );
};
