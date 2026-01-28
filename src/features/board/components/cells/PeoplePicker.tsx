import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, Check, User, SpinnerGap } from 'phosphor-react';
import { useAuth, useUser } from '../../../../auth-adapter';
import { teamService, TeamMember } from '../../../../services/teamService';
import { assignmentService } from '../../../../services/assignmentService';
import { boardLogger } from '../../../../utils/logger';
import { useAppContext } from '../../../../contexts/AppContext';

interface Person {
    id: string;
    name: string;
    avatar?: string;
    showUserIcon?: boolean;
}

interface PeoplePickerProps {
    onSelect: (person: Person | null) => void;
    onClose: () => void;
    current: { id: string; name: string } | null;
    triggerRect?: DOMRect;
    // Optional props for creating assignments
    boardId?: string;
    rowId?: string;
    rowData?: Record<string, unknown>;
}

export const PeoplePicker: React.FC<PeoplePickerProps> = ({
    onSelect,
    onClose,
    current,
    triggerRect,
    boardId,
    rowId,
    rowData
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { getToken } = useAuth();
    const { user } = useUser();
    const { t } = useAppContext();
    const [teamMembers, setTeamMembers] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    // Handle selecting a person and optionally creating assignment
    const handleSelectPerson = async (person: Person) => {
        // If we have board/row info, create an assignment
        if (boardId && rowId && rowData) {
            setIsAssigning(true);
            try {
                const token = await getToken();
                if (token) {
                    await assignmentService.assignTask(token, {
                        sourceBoardId: boardId,
                        sourceRowId: rowId,
                        sourceTaskData: rowData,
                        assignedToUserId: person.id
                    });
                }
            } catch (error) {
                boardLogger.error('Failed to create assignment:', error);
                // Still proceed with the visual selection even if assignment fails
            } finally {
                setIsAssigning(false);
            }
        }

        // Always call onSelect to update the visual
        onSelect(person);
        onClose();
    };

    // Fetch team members on mount
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setIsLoading(false);
                    return;
                }
                const members = await teamService.getTeamMembers(token);
                // Transform TeamMember to Person format
                const people: Person[] = members.map((member: TeamMember) => ({
                    id: member.id,
                    name: member.name || member.email,
                    avatar: member.avatarUrl || undefined,
                    showUserIcon: !member.avatarUrl
                }));

                // Add current user if not present
                if (user) {
                    const isUserInList = people.some(p => p.id === user.id);
                    if (!isUserInList) {
                        // Handle both Clerk user and Mock user structures
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const u = user as any;
                        const name = u.fullName || u.firstName || u.name || (u.primaryEmailAddress?.emailAddress) || 'Me';
                        const avatar = u.imageUrl || u.avatarUrl;

                        people.unshift({
                            id: u.id,
                            name: name,
                            avatar: avatar,
                            showUserIcon: !avatar
                        });
                    }
                }

                setTeamMembers(people);
            } catch (error) {
                boardLogger.error('Failed to fetch team members:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeamMembers();
    }, [getToken, user]);

    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>(() => {
        if (triggerRect) {
            const menuHeight = 250;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            if (openUp) {
                return {
                    bottom: window.innerHeight - triggerRect.top - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                };
            } else {
                return {
                    top: triggerRect.bottom - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                };
            }
        }
        return { display: 'none' };
    });

    useLayoutEffect(() => {
        if (triggerRect) {
            const menuHeight = 250;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            if (openUp) {
                setPositionStyle({
                    bottom: window.innerHeight - triggerRect.top - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                });
            } else {
                setPositionStyle({
                    top: triggerRect.bottom - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                });
            }
        }
    }, [triggerRect]);

    const content = (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden w-64 p-1 menu-enter"
                style={positionStyle}
            >
                <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 mb-1">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">{t('assign_to')}</span>
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <SpinnerGap size={20} className="text-stone-400 animate-spin" />
                        </div>
                    ) : teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                            <Users size={24} className="text-stone-300 dark:text-stone-600 mb-2" />
                            <p className="text-xs text-stone-500 dark:text-stone-400">{t('no_team_members')}</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{t('connect_team_first')}</p>
                        </div>
                    ) : (
                        teamMembers.map(person => {
                            const isSelected = current?.id === person.id;
                            return (
                                <button
                                    key={person.id}
                                    disabled={isAssigning}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelectPerson(person);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                >
                                    {person.showUserIcon ? (
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                            <User size={14} weight="fill" className="text-white" />
                                        </div>
                                    ) : (
                                        <img src={person.avatar} alt={person.name} className="w-6 h-6 rounded-full bg-stone-200 object-cover" />
                                    )}
                                    <span className="flex-1 truncate text-stone-700 dark:text-stone-200">{person.name}</span>
                                    {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
