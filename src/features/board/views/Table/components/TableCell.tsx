import React from 'react';
import { formatCurrency } from '../../../../../utils/formatters';
import { useAppContext } from '../../../../../contexts/AppContext';
import { useUser } from '../../../../../auth-adapter';
import {
    MapPin,
    FileText,
    ArrowSquareOut as ExternalLink,
    UploadSimple as UploadCloud,
    Star,
    ThumbsUp,
    ThumbsDown,
    EnvelopeSimple,
    Phone,
    Globe,
    Tag,
} from 'phosphor-react';
import { Column, Row, StatusOption, PRIORITY_STYLES, formatDate } from '../types';
import { SharedDatePicker } from '../../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../../components/ui/PortalPopup';
import { PeoplePicker } from '../../../components/cells/PeoplePicker';
import { UrlPicker } from '../../../components/cells/UrlPicker';
import { DocPicker } from '../../../components/cells/DocPicker';
import { StatusPicker, SelectPicker, PriorityPicker, CurrencyPicker, TimelinePicker, RatingPicker, VotingPicker, EmailPicker, PhonePicker, WorldClockPicker, getTimezoneDisplay, TagsPicker, getTagColor } from './pickers';
import { formatPriorityLabel, DEFAULT_CHECKBOX_COLOR } from '../utils';

// Constants - must match RoomTable.tsx
const CREATION_ROW_ID = 'creation-row-temp-id';

interface ActiveCell {
    rowId: string;
    colId: string;
    trigger?: HTMLElement;
    rect?: DOMRect;
}

interface TableCellProps {
    col: Column;
    row: Row;
    columns: Column[];
    activeCell: ActiveCell | null;
    customStatuses: StatusOption[];
    boardId?: string; // For assignment creation
    onUpdateRow: (id: string, updates: Partial<Row>, groupId?: string) => void;
    onTextChange: (id: string, colId: string, value: string, groupId?: string) => void;
    onToggleCell: (e: React.MouseEvent, rowId: string, colId: string) => void;
    onSetActiveCell: (cell: ActiveCell | null) => void;
    onNavigateToNextCell: (currentRowId: string, currentColId: string, groupId?: string) => void;
    onAddCustomStatus: (title: string, color: string) => void;
    onDeleteCustomStatus: (id: string) => void;
    onAddColumnOption: (colId: string, optionLabel: string) => void;
    onEditColumnOption?: (colId: string, optionId: string, newLabel: string, newColor: string) => void;
    onDeleteColumnOption?: (colId: string, optionId: string) => void;
    onSetActiveColorMenu: (menu: { rect: DOMRect; colId?: string; rowId?: string } | null) => void;
    onSetActiveTextMenu: (menu: { rowId: string; colId: string; position: { x: number; y: number } } | null) => void;
    onFileUploadRequest?: (rowId: string, colId: string) => void;
    onTextColorChange?: (rowId: string, colId: string, color: string) => void;
    onNavigate?: (view: string) => void;
}

// Helper to get status color classes
const getStatusColorClasses = (color: string): string => {
    const map: Record<string, string> = {
        gray: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return map[color] || map['gray'];
};

// File icon helper
const getFileIcon = (filename: string | undefined | null, mimeType?: string): string => {
    if (!filename) return '📎';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['ppt', 'pptx'].includes(ext || '')) return '📽️';
    if (['zip', 'rar', '7z'].includes(ext || '')) return '📦';
    return '📎';
};

const getShortName = (name: string | undefined | null): string => {
    if (!name) return 'File';
    if (name.length <= 20) return name;
    const ext = name.split('.').pop();
    const baseName = name.slice(0, name.lastIndexOf('.'));
    return baseName.slice(0, 15) + '...' + (ext ? '.' + ext : '');
};

// Priority translation keys
const PRIORITY_TRANSLATION_KEYS: Record<string, string> = {
    'Urgent': 'urgent',
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
};

// Reverse mapping for Arabic priority values to English IDs
const ARABIC_PRIORITY_TO_ID: Record<string, string> = {
    'عاجل': 'Urgent',
    'مرتفع': 'High',
    'متوسط': 'Medium',
    'منخفض': 'Low',
};

// Normalize priority value to English ID
const normalizePriorityValue = (value: string): string => {
    if (!value) return value;
    // If it's already an English key, return as-is
    if (PRIORITY_TRANSLATION_KEYS[value]) return value;
    // If it's an Arabic value, convert to English ID
    if (ARABIC_PRIORITY_TO_ID[value]) return ARABIC_PRIORITY_TO_ID[value];
    // Otherwise return as-is
    return value;
};

// Status translation keys (English ID -> translation key)
const STATUS_TRANSLATION_KEYS: Record<string, string> = {
    'To Do': 'to_do',
    'In Progress': 'in_progress',
    'Q&A': 'qa',
    'Done': 'done',
    'Stuck': 'stuck',
    'Rejected': 'rejected',
};

// Reverse mapping for Arabic status values to English IDs (for backwards compatibility)
const ARABIC_STATUS_TO_ID: Record<string, string> = {
    'للتنفيذ': 'To Do',
    'قيد التنفيذ': 'In Progress',
    'سؤال وجواب': 'Q&A',
    'تم': 'Done',
    'متوقف': 'Stuck',
    'مرفوض': 'Rejected',
};

// Normalize status value to English ID
const normalizeStatusValue = (value: string): string => {
    if (!value) return value;
    // If it's already an English key, return as-is
    if (STATUS_TRANSLATION_KEYS[value]) return value;
    // If it's an Arabic value, convert to English ID
    if (ARABIC_STATUS_TO_ID[value]) return ARABIC_STATUS_TO_ID[value];
    // Otherwise return as-is (custom status)
    return value;
};

export const TableCell: React.FC<TableCellProps> = React.memo(({
    col,
    row,
    columns,
    activeCell,
    customStatuses,
    boardId,
    onUpdateRow,
    onTextChange,
    onToggleCell,
    onSetActiveCell,
    onNavigateToNextCell,
    onAddCustomStatus,
    onDeleteCustomStatus,
    onAddColumnOption,
    onEditColumnOption,
    onDeleteColumnOption,
    onSetActiveColorMenu,
    onSetActiveTextMenu,
    onFileUploadRequest,
    onNavigate,
}) => {
    const value = row[col.id];
    const isActiveCell = activeCell?.rowId === row.id && activeCell?.colId === col.id;
    const { user: currentUser } = useUser();
    const { currency: globalCurrency, t, dir, language } = useAppContext();

    // Helper to get the live avatar for a person (uses current user's live avatar if it's the current user)
    const getPersonAvatar = (person: { id?: string; avatar?: string }) => {
        if (currentUser && person.id === currentUser.id) {
            // Use current user's live avatar from auth context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = currentUser as any;
            return u.imageUrl || u.avatarUrl || person.avatar;
        }
        return person.avatar;
    };

    // Select/Checkbox column
    if (col.id === 'select') {
        return (
            <div className="flex items-center justify-center w-full h-full" role="gridcell">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onUpdateRow(row.id, { [col.id]: e.target.checked }, row.groupId)}
                    className="rounded border-stone-300 dark:border-stone-600 cursor-pointer w-4 h-4 accent-blue-600"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={value ? 'Deselect row' : 'Select row'}
                />
            </div>
        );
    }

    // Status column
    if (col.type === 'status') {
        // Normalize the value to English ID for consistent lookup
        const normalizedValue = value ? normalizeStatusValue(value) : value;
        const statusObj = customStatuses.find(s => s.title === normalizedValue || s.id === normalizedValue || s.title === value || s.id === value);
        const color = statusObj?.color ||
            (normalizedValue === 'Done' ? 'emerald' :
                normalizedValue === 'In Progress' ? 'blue' :
                    normalizedValue === 'Stuck' ? 'orange' :
                        normalizedValue === 'Rejected' ? 'rose' : 'gray');

        const statusStyle = value ? getStatusColorClasses(color) : 'bg-transparent text-stone-400';
        // Get translated status label using normalized value
        const translatedStatus = normalizedValue && STATUS_TRANSLATION_KEYS[normalizedValue] ? t(STATUS_TRANSLATION_KEYS[normalizedValue]) : value;

        return (
            <div className="relative w-full h-full flex items-center justify-center p-1">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className={`w-full h-full flex items-center justify-center px-2 transition-all overflow-hidden ${value ? statusStyle + ' rounded-md' : 'hover:bg-stone-100 dark:hover:bg-stone-800/50 rounded'}`}
                >
                    {value ? (
                        <span className="text-xs font-semibold font-sans truncate">{translatedStatus}</span>
                    ) : (
                        <span className={`${row.id === CREATION_ROW_ID ? 'text-[11px]' : 'text-xs'} text-stone-400 group-hover:text-stone-500`}>-</span>
                    )}
                </button>

                {isActiveCell && activeCell?.trigger && (
                    <StatusPicker
                        current={value}
                        onSelect={(s) => onUpdateRow(row.id, { [col.id]: s }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                        options={customStatuses}
                        onAdd={onAddCustomStatus}
                        onDelete={onDeleteCustomStatus}
                    />
                )}
            </div>
        );
    }

    // Date column
    if (col.type === 'date') {
        // Map language to locale for date formatting (ar-EG uses Gregorian calendar)
        const dateLocale = language === 'ar' ? 'ar-EG' : 'en-GB';
        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center px-3 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    <span className={`text-sm font-datetime truncate ${value ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400'}`} dir="ltr">
                        {formatDate(value, dateLocale) || t('set_date')}
                    </span>
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <PortalPopup
                        triggerRef={{ current: activeCell.trigger } as React.RefObject<HTMLElement>}
                        align={columns.findIndex(c => c.id === col.id) > (columns.length / 2) ? 'end' : 'start'}
                        onClose={() => onSetActiveCell(null)}
                    >
                        <SharedDatePicker
                            selectedDate={value}
                            onSelectDate={(dueDate) => onUpdateRow(row.id, { [col.id]: dueDate.toISOString() }, row.groupId)}
                            onClear={() => onUpdateRow(row.id, { [col.id]: null }, row.groupId)}
                            onClose={() => onSetActiveCell(null)}
                        />
                    </PortalPopup>
                )}
            </div>
        );
    }

    // Timeline column (date range with start and end)
    if (col.type === 'timeline') {
        const timelineValue = value as { startDate: string | null; endDate: string | null } | null;
        const dateLocale = language === 'ar' ? 'ar-EG' : 'en-GB';

        const formatTimelineDisplay = () => {
            if (!timelineValue?.startDate && !timelineValue?.endDate) {
                return null;
            }
            const start = timelineValue?.startDate ? formatDate(timelineValue.startDate, dateLocale) : '';
            const end = timelineValue?.endDate ? formatDate(timelineValue.endDate, dateLocale) : '';
            if (start && end) {
                return `${start} - ${end}`;
            }
            return start || end;
        };

        const displayValue = formatTimelineDisplay();

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center px-3 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {displayValue ? (
                        <span className="text-sm font-datetime text-stone-600 dark:text-stone-300 truncate" dir="ltr">
                            {displayValue}
                        </span>
                    ) : (
                        <span className="text-xs text-stone-400">{t('set_timeline') || 'Set timeline'}</span>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <TimelinePicker
                        value={timelineValue}
                        onSelect={(newValue) => onUpdateRow(row.id, { [col.id]: newValue }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Number column
    if (col.type === 'number') {
        if (isActiveCell) {
            return (
                <div className="h-full w-full">
                    <input
                        type="number"
                        autoFocus
                        onBlur={() => onSetActiveCell(null)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // Creation row needs navigateToNextCell to trigger task creation
                                // Existing rows just exit edit mode and blur
                                if (row.id === CREATION_ROW_ID) {
                                    onNavigateToNextCell(row.id, col.id, row.groupId);
                                } else {
                                    (e.target as HTMLInputElement).blur();
                                    onSetActiveCell(null);
                                }
                            }
                            if (e.key === 'Escape') {
                                (e.target as HTMLInputElement).blur();
                                onSetActiveCell(null);
                            }
                        }}
                        value={value || ''}
                        onChange={(e) => onUpdateRow(row.id, { [col.id]: e.target.value }, row.groupId)}
                        className="w-full h-full bg-stone-50 dark:bg-stone-800 border-none outline-none px-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400"
                    />
                </div>
            );
        }

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {value ? (
                        <span className="text-sm font-datetime text-stone-600 dark:text-stone-300 truncate">
                            {Number(value).toLocaleString()}
                        </span>
                    ) : (
                        <span className="text-xs text-stone-400">{t('add_value')}</span>
                    )}
                </button>
            </div>
        );
    }

    // Currency column
    if (col.type === 'currency') {
        // Use column-specific currency if available, otherwise fall back to global
        const currencyCode = col.currency?.code || globalCurrency.code;
        const currencySymbol = col.currency?.symbol || globalCurrency.symbol;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {value ? (
                        <span className="text-sm font-datetime text-stone-600 dark:text-stone-300 truncate">
                            {formatCurrency(Number(value), currencyCode, currencySymbol)}
                        </span>
                    ) : (
                        <span className="text-xs text-stone-400">{currencySymbol} -</span>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <CurrencyPicker
                        value={value ? Number(value) : null}
                        baseCurrency={{ code: currencyCode, symbol: currencySymbol }}
                        onSelect={(newValue, newCurrency) => {
                            onUpdateRow(row.id, { [col.id]: newValue }, row.groupId);
                            // If currency changed, we could update the column config here
                            // For now, we just update the value
                        }}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Dropdown column
    if (col.type === 'dropdown') {
        const selectedOption = col.options?.find(o => o.label === value);
        const bgColor = selectedOption?.color || 'bg-stone-500';

        return (
            <div className="relative w-full h-full p-1">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className={`w-full h-full rounded flex items-center justify-center px-2 hover:opacity-80 transition-opacity ${value ? bgColor : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}
                >
                    {value ? (
                        <span className="text-xs font-medium text-white truncate">{value}</span>
                    ) : (
                        <span className="text-xs text-stone-400">{t('select_option')}</span>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <SelectPicker
                        options={col.options || []}
                        current={value}
                        onSelect={(s) => onUpdateRow(row.id, { [col.id]: s }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                        onAdd={(label) => onAddColumnOption(col.id, label)}
                        onEdit={onEditColumnOption ? (optionId, newLabel, newColor) => onEditColumnOption(col.id, optionId, newLabel, newColor) : undefined}
                        onDelete={onDeleteColumnOption ? (optionId) => onDeleteColumnOption(col.id, optionId) : undefined}
                    />
                )}
            </div>
        );
    }

    // Doc column
    if (col.type === 'doc') {
        return (
            <div className="relative w-full h-full p-1 group/doc">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full rounded flex items-center px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {value ? (
                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                            <div className="p-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                <FileText size={12} />
                            </div>
                            <span className="text-sm text-stone-700 dark:text-stone-300 truncate hover:underline hover:text-blue-600 dark:hover:text-blue-400">
                                {value.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-stone-400 group-hover/doc:text-stone-500 transition-colors">{t('select_doc')}</span>
                    )}
                </button>
                {value && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRow(row.id, { [col.id]: null }, row.groupId);
                        }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover/doc:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-all"
                        title={t('remove')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {isActiveCell && activeCell?.trigger && (
                    <DocPicker
                        current={value}
                        currentBoardId={boardId}
                        onSelect={(doc) => onUpdateRow(row.id, { [col.id]: doc }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // People column
    if (col.type === 'people') {
        const people = Array.isArray(value) ? value : (value ? [value] : []);

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {people.length > 0 ? (
                        <div className="flex -space-x-2">
                            {people.slice(0, 3).map((person: { id?: string; name?: string; avatar?: string }, i: number) => {
                                const avatar = getPersonAvatar(person);
                                return (
                                    <div
                                        key={person.id || i}
                                        className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-stone-900"
                                        title={person.name || 'User'}
                                    >
                                        {avatar ? (
                                            <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (person.name || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                );
                            })}
                            {people.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-stone-900">
                                    +{people.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center">
                            <span className="text-stone-400 text-xs">+</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <PeoplePicker
                        current={people}
                        onSelect={(selected) => onUpdateRow(row.id, { [col.id]: selected }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.trigger.getBoundingClientRect()}
                        boardId={boardId}
                        rowId={row.id}
                        rowData={row as Record<string, unknown>}
                    />
                )}
            </div>
        );
    }

    // Priority column
    if (col.type === 'priority') {
        // First normalize Arabic values to English, then format
        const normalizedValue = value ? normalizePriorityValue(value) : null;
        const normalized = normalizedValue ? formatPriorityLabel(normalizedValue) : null;
        const bgClass = (normalized && PRIORITY_STYLES[normalized]) ? PRIORITY_STYLES[normalized] : 'hover:bg-stone-100 dark:hover:bg-stone-800/50';
        // Get translated priority label
        const translatedPriority = normalized && PRIORITY_TRANSLATION_KEYS[normalized] ? t(PRIORITY_TRANSLATION_KEYS[normalized]) : normalized;

        return (
            <div className="relative w-full h-full p-1">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className={`w-full h-full rounded flex items-center justify-center gap-1.5 px-2 transition-all ${normalized ? bgClass + ' shadow-sm' : bgClass}`}
                >
                    {normalized ? (
                        <span className="text-xs font-medium truncate">{translatedPriority}</span>
                    ) : (
                        <span className={`${row.id === CREATION_ROW_ID ? 'text-[11px]' : 'text-xs'} text-stone-400`}>-</span>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <PriorityPicker
                        current={value}
                        onSelect={(p) => onUpdateRow(row.id, { [col.id]: p }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // URL/Link column
    if (col.type === 'url' || col.type === 'link') {
        const urlData = value as { url: string; text?: string } | string | null;
        const urlString = typeof urlData === 'string' ? urlData : urlData?.url;
        const displayText = typeof urlData === 'object' ? urlData?.text || urlData?.url : urlData;

        return (
            <div className="relative w-full h-full group/url">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center px-3 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {urlString ? (
                        <div className="flex items-center gap-2 max-w-full overflow-hidden">
                            <a
                                href={urlString}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 truncate hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {displayText}
                            </a>
                            <ExternalLink size={12} className="shrink-0 text-stone-400" />
                        </div>
                    ) : (
                        <span className={`${row.id === CREATION_ROW_ID ? 'text-[11px]' : 'text-xs'} text-stone-400`}>{t('add_url')}</span>
                    )}
                </button>
                {urlString && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRow(row.id, { [col.id]: null }, row.groupId);
                        }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover/url:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-all"
                        title={t('remove')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {isActiveCell && activeCell?.trigger && (
                    <UrlPicker
                        current={typeof urlData === 'object' ? urlData : { url: urlData || '', text: '' }}
                        onSelect={(val) => onUpdateRow(row.id, { [col.id]: val }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Location column
    if (col.type === 'location') {
        const locationData = value as { url: string; text?: string } | null;
        const displayText = locationData?.text || locationData?.url;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center px-3 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden group/location"
                >
                    {displayText ? (
                        <div className="flex items-center gap-2 truncate text-blue-600 dark:text-blue-400">
                            <MapPin size={14} className="shrink-0" />
                            <a
                                href={locationData?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {displayText}
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-stone-400">
                            <MapPin size={14} />
                            <span className={`${row.id === CREATION_ROW_ID ? 'text-[11px]' : 'text-xs'}`}>{t('location_placeholder')}</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <UrlPicker
                        current={locationData}
                        onSelect={(val) => onUpdateRow(row.id, { [col.id]: val })}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Files column
    if (col.type === 'files' || col.type === 'file') {
        const files = Array.isArray(value) ? value : (value ? [value] : []);

        return (
            <div className="relative w-full h-full group/files">
                <button
                    onClick={(e) => {
                        if (files.length === 0 && onFileUploadRequest) {
                            onFileUploadRequest(row.id, col.id);
                        } else {
                            onToggleCell(e, row.id, col.id);
                        }
                    }}
                    className="w-full h-full flex items-center justify-center px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {files.length > 0 && files[0] ? (
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                            <span className="text-base">{getFileIcon(files[0]?.title || files[0]?.name, files[0]?.type)}</span>
                            <span className="text-sm text-stone-600 dark:text-stone-300 truncate">{getShortName(files[0]?.title || files[0]?.name)}</span>
                            {files.length > 1 && (
                                <span className="text-xs text-stone-400 shrink-0">+{files.length - 1}</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-stone-400 group-hover/files:text-stone-500 transition-colors">
                            <UploadCloud size={14} />
                            <span className={`${row.id === CREATION_ROW_ID ? 'text-[11px]' : 'text-xs'}`}>{t('upload')}</span>
                        </div>
                    )}
                </button>
                {files.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRow(row.id, { [col.id]: null }, row.groupId);
                        }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover/files:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-all"
                        title={t('remove')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {/* File picker popup when cell is active */}
                {isActiveCell && activeCell?.trigger && files.length > 0 && (
                    <PortalPopup
                        triggerRef={{ current: activeCell.trigger } as React.RefObject<HTMLElement>}
                        onClose={() => onSetActiveCell(null)}
                        align="center"
                    >
                        <div className="w-72 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                            <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('files_count')} ({files.length})</span>
                                <button
                                    onClick={() => {
                                        onSetActiveCell(null);
                                        if (onFileUploadRequest) onFileUploadRequest(row.id, col.id);
                                    }}
                                    className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                >
                                    <UploadCloud size={12} />
                                    {t('add')}
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {files.filter((f: any) => f).map((file: any, idx: number) => (
                                    <div key={file?.id || idx} className="flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                                        <span className="text-lg shrink-0">{getFileIcon(file?.title || file?.name, file?.type)}</span>
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (file?.id) {
                                                    localStorage.setItem('vault-navigate-to', file.id);
                                                    if (file?.folderId) {
                                                        localStorage.setItem('vault-navigate-folder', file.folderId);
                                                    }
                                                    onSetActiveCell(null);
                                                    if (onNavigate) {
                                                        onNavigate('vault');
                                                    }
                                                }
                                            }}
                                        >
                                            <p className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">{file?.title || file?.name || 'File'}</p>
                                            {file?.metadata?.size && (
                                                <p className="text-xs text-stone-400">{typeof file.metadata.size === 'number' ? (file.metadata.size / 1024).toFixed(1) + ' KB' : file.metadata.size}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newFiles = files.filter((_: any, i: number) => i !== idx);
                                                onUpdateRow(row.id, { [col.id]: newFiles.length > 0 ? newFiles : null }, row.groupId);
                                                if (newFiles.length === 0) onSetActiveCell(null);
                                            }}
                                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-colors"
                                            title={t('remove_file')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PortalPopup>
                )}
            </div>
        );
    }

    // Rating column
    if (col.type === 'rating') {
        const ratingValue = typeof value === 'number' ? value : (value ? Number(value) : null);
        const maxRating = col.maxRating || 5;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-0.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {ratingValue ? (
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: maxRating }, (_, i) => i + 1).map((starNum) => (
                                <Star
                                    key={starNum}
                                    size={14}
                                    weight={starNum <= ratingValue ? 'fill' : 'regular'}
                                    className={starNum <= ratingValue ? 'text-yellow-400' : 'text-stone-300 dark:text-stone-600'}
                                />
                            ))}
                            <span className="ms-1 text-xs text-stone-500 dark:text-stone-400">
                                {ratingValue}/{maxRating}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: maxRating }, (_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    weight="regular"
                                    className="text-stone-300 dark:text-stone-600"
                                />
                            ))}
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <RatingPicker
                        value={ratingValue}
                        maxRating={maxRating}
                        onSelect={(rating) => onUpdateRow(row.id, { [col.id]: rating }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Voting column
    if (col.type === 'voting') {
        const voteValue = typeof value === 'number' ? value : (value ? Number(value) : null);
        const displayValue = voteValue || 0;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-1.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    <div className="flex items-center gap-1">
                        {displayValue > 0 ? (
                            <ThumbsUp size={14} weight="fill" className="text-emerald-500" />
                        ) : displayValue < 0 ? (
                            <ThumbsDown size={14} weight="fill" className="text-red-500" />
                        ) : (
                            <ThumbsUp size={14} weight="regular" className="text-stone-400" />
                        )}
                        <span className={`text-sm font-medium ${
                            displayValue > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : displayValue < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-stone-400'
                        }`}>
                            {displayValue > 0 ? `+${displayValue}` : displayValue}
                        </span>
                    </div>
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <VotingPicker
                        value={voteValue}
                        onSelect={(vote) => onUpdateRow(row.id, { [col.id]: vote }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Email column
    if (col.type === 'email') {
        const emailValue = typeof value === 'string' ? value : null;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-1.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {emailValue ? (
                        <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                            <EnvelopeSimple size={14} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-stone-700 dark:text-stone-300 truncate">
                                {emailValue}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <EnvelopeSimple size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-400">{t('add_email')}</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <EmailPicker
                        value={emailValue}
                        onSelect={(email) => onUpdateRow(row.id, { [col.id]: email }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Phone column
    if (col.type === 'phone') {
        const phoneValue = typeof value === 'string' ? value : null;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-1.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {phoneValue ? (
                        <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                            <Phone size={14} className="text-green-500 shrink-0" />
                            <span className="text-xs text-stone-700 dark:text-stone-300 truncate">
                                {phoneValue}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Phone size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-400">{t('add_phone')}</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <PhonePicker
                        value={phoneValue}
                        onSelect={(phone) => onUpdateRow(row.id, { [col.id]: phone }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // World Clock column
    if (col.type === 'world_clock') {
        const timezoneValue = typeof value === 'string' ? value : null;
        const tzDisplay = timezoneValue ? getTimezoneDisplay(timezoneValue) : null;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-1.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors"
                >
                    {tzDisplay ? (
                        <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                            <Globe size={14} className="text-indigo-500 shrink-0" />
                            <span className="text-xs text-stone-700 dark:text-stone-300 truncate">
                                {tzDisplay.city}
                            </span>
                            <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                                {tzDisplay.time}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Globe size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-400">{t('select_timezone')}</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <WorldClockPicker
                        value={timezoneValue}
                        onSelect={(tz) => onUpdateRow(row.id, { [col.id]: tz }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Tags column
    if (col.type === 'tags') {
        const tagsValue = Array.isArray(value) ? value : null;

        return (
            <div className="relative w-full h-full">
                <button
                    onClick={(e) => onToggleCell(e, row.id, col.id)}
                    className="w-full h-full flex items-center justify-center gap-1 px-2 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                >
                    {tagsValue && tagsValue.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap justify-center max-w-full overflow-hidden">
                            {tagsValue.slice(0, 3).map((tag, i) => (
                                <span
                                    key={i}
                                    className={`px-1.5 py-0.5 text-[10px] font-medium text-white rounded-full truncate max-w-[80px] ${getTagColor(tag)}`}
                                >
                                    {tag}
                                </span>
                            ))}
                            {tagsValue.length > 3 && (
                                <span className="text-[10px] text-stone-400">
                                    +{tagsValue.length - 3}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Tag size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-400">{t('add_tags')}</span>
                        </div>
                    )}
                </button>
                {isActiveCell && activeCell?.trigger && (
                    <TagsPicker
                        value={tagsValue}
                        availableTags={col.options?.map(o => o.label) || []}
                        onSelect={(tags) => onUpdateRow(row.id, { [col.id]: tags }, row.groupId)}
                        onClose={() => onSetActiveCell(null)}
                        triggerRect={activeCell.rect || activeCell.trigger.getBoundingClientRect()}
                    />
                )}
            </div>
        );
    }

    // Checkbox column (non-select)
    if (col.type === 'checkbox') {
        return (
            <div
                className="w-full h-full flex items-center justify-center"
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetActiveColorMenu({ rect: e.currentTarget.getBoundingClientRect(), colId: col.id, rowId: row.id });
                }}
            >
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onUpdateRow(row.id, { [col.id]: e.target.checked })}
                    style={{ accentColor: row._styles?.[col.id]?.color || col.color || DEFAULT_CHECKBOX_COLOR }}
                    className="rounded border-stone-300 dark:border-stone-600 cursor-pointer w-4 h-4"
                />
            </div>
        );
    }

    // Default: Text cell
    const textColor = row._styles?.[col.id]?.color;
    const cellStyle: React.CSSProperties = {};
    if (textColor) cellStyle.color = textColor;

    // Show placeholder for creation row on primary column (first non-select column)
    const isCreationRow = row.id === CREATION_ROW_ID;
    const primaryColId = (columns.find(c => c.id === 'name') || columns.find(c => c.id !== 'select'))?.id;
    const placeholder = isCreationRow && col.id === primaryColId ? t('start_typing_to_add') : '';

    return (
        <div className="h-full w-full">
            <input
                type="text"
                autoFocus
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onTextChange(row.id, col.id, e.target.value, row.groupId)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // Creation row needs navigateToNextCell to trigger task creation
                        // Existing rows just exit edit mode and blur
                        if (isCreationRow) {
                            onNavigateToNextCell(row.id, col.id, row.groupId);
                        } else {
                            (e.target as HTMLInputElement).blur();
                            onSetActiveCell(null);
                        }
                    }
                    if (e.key === 'Escape') {
                        (e.target as HTMLInputElement).blur();
                        onSetActiveCell(null);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onSetActiveTextMenu({
                        rowId: row.id,
                        colId: col.id,
                        position: { x: e.clientX, y: e.clientY }
                    });
                }}
                style={{ ...cellStyle, textAlign: col.id === primaryColId ? 'start' : 'center' }}
                className="w-full h-full bg-transparent border-none outline-none px-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 focus:bg-stone-50 dark:focus:bg-stone-800/50 transition-colors"
            />
        </div>
    );
});

TableCell.displayName = 'TableCell';

export default TableCell;
