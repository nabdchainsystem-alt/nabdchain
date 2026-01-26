import React, { useState, useRef, useEffect } from 'react';
import { Sheet } from '../types';

interface FooterProps {
    sheets: Sheet[];
    activeSheetId: string;
    onAddSheet: () => void;
    onSwitchSheet: (sheetId: string) => void;
    onRenameSheet: (sheetId: string, name: string) => void;
    onDeleteSheet: (sheetId: string) => void;
    onDuplicateSheet?: (sheetId: string) => void;
    selectionSum: number | null;
}

interface SheetTabProps {
    sheet: Sheet;
    isActive: boolean;
    canDelete: boolean;
    onClick: () => void;
    onRename: (name: string) => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const SheetTab: React.FC<SheetTabProps> = ({
    sheet,
    isActive,
    canDelete,
    onClick,
    onRename,
    onDelete,
    onDuplicate,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(sheet.name);
    const [showMenu, setShowMenu] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (editValue.trim() && editValue.trim() !== sheet.name) {
            onRename(editValue.trim());
        } else {
            setEditValue(sheet.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setEditValue(sheet.name);
            setIsEditing(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowMenu(true);
    };

    return (
        <div
            className={`group relative flex items-center px-3 h-full text-[12px] cursor-pointer transition-colors ${
                isActive
                    ? 'bg-white text-[#202124] font-medium border-t-2 border-t-[#1a73e8]'
                    : 'text-[#5f6368] hover:bg-[#e8eaed] border-t-2 border-t-transparent'
            }`}
            onClick={onClick}
            onContextMenu={handleContextMenu}
            onDoubleClick={() => {
                setEditValue(sheet.name);
                setIsEditing(true);
            }}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 text-[12px] font-medium border-b border-[#1a73e8] outline-none bg-transparent"
                />
            ) : (
                <>
                    {sheet.name}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-[#dadce0] rounded p-0.5 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                    </button>
                </>
            )}

            {/* Context Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full left-0 mb-1 bg-white rounded shadow-lg border border-[#dadce0] z-[100] py-1 min-w-[160px]"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            setEditValue(sheet.name);
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-[#202124] text-left hover:bg-[#f1f3f4] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#5f6368]">edit</span>
                        Rename
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onDuplicate();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-[#202124] text-left hover:bg-[#f1f3f4] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#5f6368]">content_copy</span>
                        Duplicate
                    </button>
                    {canDelete && (
                        <>
                            <div className="h-[1px] bg-[#dadce0] my-1 mx-2"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onDelete();
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-left hover:bg-red-50 text-red-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface FooterExtendedProps extends FooterProps {
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    cellCount?: number;
    average?: number | null;
}

export const Footer: React.FC<FooterExtendedProps> = ({
    sheets,
    activeSheetId,
    onAddSheet,
    onSwitchSheet,
    onRenameSheet,
    onDeleteSheet,
    onDuplicateSheet,
    selectionSum,
    zoom = 100,
    onZoomChange,
    cellCount,
    average,
}) => {
    return (
        <footer className="flex items-center justify-between bg-[#f8f9fa] border-t border-[#dadce0] shrink-0 h-[26px] select-none">
            {/* Left side - Sheet tabs */}
            <div className="flex items-center h-full">
                <button
                    onClick={onAddSheet}
                    className="px-2 h-full hover:bg-[#e8eaed] text-[#5f6368] transition-colors flex items-center justify-center"
                    title="Add sheet"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
                <button className="px-2 h-full hover:bg-[#e8eaed] text-[#5f6368] transition-colors flex items-center justify-center border-r border-[#dadce0]" title="All sheets">
                    <span className="material-symbols-outlined text-[18px]">menu</span>
                </button>

                <div className="flex items-end h-full overflow-x-auto no-scrollbar">
                    {sheets.map((sheet) => (
                        <SheetTab
                            key={sheet.id}
                            sheet={sheet}
                            isActive={sheet.id === activeSheetId}
                            canDelete={sheets.length > 1}
                            onClick={() => onSwitchSheet(sheet.id)}
                            onRename={(name) => onRenameSheet(sheet.id, name)}
                            onDelete={() => onDeleteSheet(sheet.id)}
                            onDuplicate={() => onDuplicateSheet?.(sheet.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Right side - Status bar */}
            <div className="flex items-center h-full">
                {/* Statistics */}
                <div className="flex items-center h-full border-l border-[#dadce0] text-[11px] text-[#5f6368]">
                    {cellCount !== undefined && cellCount > 0 && (
                        <div className="px-3 h-full flex items-center hover:bg-[#e8eaed] cursor-pointer transition-colors border-r border-[#dadce0]">
                            <span className="text-[#5f6368]">Count:</span>
                            <span className="ml-1 text-[#202124] font-medium">{cellCount}</span>
                        </div>
                    )}
                    {average !== null && average !== undefined && (
                        <div className="px-3 h-full flex items-center hover:bg-[#e8eaed] cursor-pointer transition-colors border-r border-[#dadce0]">
                            <span className="text-[#5f6368]">Average:</span>
                            <span className="ml-1 text-[#202124] font-medium">{average.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {selectionSum !== null && (
                        <div className="px-3 h-full flex items-center hover:bg-[#e8eaed] cursor-pointer transition-colors border-r border-[#dadce0]">
                            <span className="text-[#5f6368]">Sum:</span>
                            <span className="ml-1 text-[#202124] font-medium">{selectionSum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>

                {/* Zoom controls */}
                <div className="flex items-center h-full px-2 gap-1">
                    <button
                        onClick={() => onZoomChange?.(Math.max(25, zoom - 10))}
                        className="p-0.5 hover:bg-[#e8eaed] rounded text-[#5f6368] transition-colors"
                        title="Zoom out"
                    >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <div className="w-[80px] h-[4px] bg-[#dadce0] rounded-full relative mx-1">
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#5f6368] rounded-full cursor-pointer hover:bg-[#202124] transition-colors"
                            style={{ left: `${Math.min(100, Math.max(0, (zoom - 25) / 1.75))}%` }}
                            title={`${zoom}%`}
                        ></div>
                    </div>
                    <button
                        onClick={() => onZoomChange?.(Math.min(200, zoom + 10))}
                        className="p-0.5 hover:bg-[#e8eaed] rounded text-[#5f6368] transition-colors"
                        title="Zoom in"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                    <span className="text-[11px] text-[#5f6368] ml-1 w-[35px]">{zoom}%</span>
                </div>
            </div>
        </footer>
    );
};
