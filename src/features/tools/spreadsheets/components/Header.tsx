import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
    title: string;
    onTitleChange: (title: string) => void;
    isSaved: boolean;
    onNew: () => void;
    onDownloadCSV: () => void;
    onDownloadJSON: () => void;
}

interface MenuProps {
    label: string;
    items: { label: string; onClick: () => void; shortcut?: string; divider?: boolean }[];
}

const Menu: React.FC<MenuProps> = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1 text-[13px] rounded transition-colors ${
                    isOpen ? 'bg-[#e8eaed] text-[#202124]' : 'text-[#202124] hover:bg-[#f1f3f4]'
                }`}
            >
                {label}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-0.5 bg-white rounded shadow-lg border border-[#dadce0] z-[200] py-1.5 min-w-[220px]">
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            {item.divider && <div className="h-[1px] bg-[#dadce0] my-1.5 mx-2"></div>}
                            <button
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-4 py-1.5 text-[13px] text-left text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                            >
                                <span>{item.label}</span>
                                {item.shortcut && (
                                    <span className="text-[#5f6368] text-[12px] ml-6">{item.shortcut}</span>
                                )}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({
    title,
    onTitleChange,
    isSaved,
    onNew,
    onDownloadCSV,
    onDownloadJSON,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSubmit = () => {
        if (editValue.trim()) {
            onTitleChange(editValue.trim());
        } else {
            setEditValue(title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setEditValue(title);
            setIsEditing(false);
        }
    };

    const fileMenuItems = [
        { label: 'New spreadsheet', onClick: onNew, shortcut: '' },
        { label: 'Make a copy', onClick: () => {}, shortcut: '' },
        { label: 'Download as CSV', onClick: onDownloadCSV, shortcut: '', divider: true },
        { label: 'Download as JSON', onClick: onDownloadJSON, shortcut: '' },
    ];

    const editMenuItems = [
        { label: 'Undo', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })), shortcut: 'Ctrl+Z' },
        { label: 'Redo', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true })), shortcut: 'Ctrl+Y' },
        { label: 'Cut', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true })), shortcut: 'Ctrl+X', divider: true },
        { label: 'Copy', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true })), shortcut: 'Ctrl+C' },
        { label: 'Paste', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true })), shortcut: 'Ctrl+V' },
    ];

    const viewMenuItems = [
        { label: 'Show gridlines', onClick: () => {}, shortcut: '' },
        { label: 'Show formula bar', onClick: () => {}, shortcut: '' },
        { label: 'Freeze row 1', onClick: () => {}, shortcut: '', divider: true },
        { label: 'Freeze column A', onClick: () => {}, shortcut: '' },
    ];

    const insertMenuItems = [
        { label: 'Rows above', onClick: () => {}, shortcut: '' },
        { label: 'Rows below', onClick: () => {}, shortcut: '' },
        { label: 'Columns left', onClick: () => {}, shortcut: '', divider: true },
        { label: 'Columns right', onClick: () => {}, shortcut: '' },
        { label: 'New sheet', onClick: () => {}, shortcut: '', divider: true },
    ];

    const formatMenuItems = [
        { label: 'Bold', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true })), shortcut: 'Ctrl+B' },
        { label: 'Italic', onClick: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', ctrlKey: true })), shortcut: 'Ctrl+I' },
        { label: 'Clear formatting', onClick: () => {}, shortcut: '', divider: true },
    ];

    return (
        <header className="flex items-center justify-between bg-white border-b border-[#dadce0] px-2 py-1 shrink-0 z-[60] relative">
            {/* Left: Logo + Title + Menu Bar */}
            <div className="flex items-center gap-1">
                {/* Logo */}
                <div className="w-9 h-9 flex items-center justify-center text-[#0f9d58] rounded hover:bg-[#f1f3f4] cursor-pointer transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[26px]">table_chart</span>
                </div>

                {/* Title */}
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSubmit}
                        onKeyDown={handleKeyDown}
                        className="text-[#202124] text-[14px] font-medium leading-tight border-b-2 border-[#1a73e8] outline-none bg-transparent px-1 min-w-[80px] mr-2"
                    />
                ) : (
                    <h1
                        onClick={() => {
                            setEditValue(title);
                            setIsEditing(true);
                        }}
                        className="text-[#202124] text-[14px] font-medium leading-tight cursor-pointer hover:bg-[#f1f3f4] px-2 py-1 rounded transition-colors mr-2"
                        title="Click to rename"
                    >
                        {title}
                    </h1>
                )}

                {/* Menu Bar */}
                <Menu label="File" items={fileMenuItems} />
                <Menu label="Edit" items={editMenuItems} />
                <Menu label="View" items={viewMenuItems} />
                <Menu label="Insert" items={insertMenuItems} />
                <Menu label="Format" items={formatMenuItems} />
                <button className="px-3 py-1 text-[13px] text-[#202124] hover:bg-[#f1f3f4] rounded transition-colors">
                    Data
                </button>
                <button className="px-3 py-1 text-[13px] text-[#202124] hover:bg-[#f1f3f4] rounded transition-colors">
                    Tools
                </button>
                <button className="px-3 py-1 text-[13px] text-[#202124] hover:bg-[#f1f3f4] rounded transition-colors">
                    Extensions
                </button>
                <button className="px-3 py-1 text-[13px] text-[#202124] hover:bg-[#f1f3f4] rounded transition-colors">
                    Help
                </button>
            </div>

        </header>
    );
};
