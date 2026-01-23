import { createContext } from 'react';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

export interface GroupDragContextValue {
    listeners?: SyntheticListenerMap;
    attributes?: Record<string, any>;
}

export const GroupDragContext = createContext<GroupDragContextValue>({});
