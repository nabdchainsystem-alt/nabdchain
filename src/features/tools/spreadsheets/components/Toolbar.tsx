import React, { useState, useRef, useEffect } from 'react';
import { CellStyle } from '../types';
import { COLOR_PRESETS, FONT_SIZES, FONT_FAMILIES } from '../constants';

interface ToolbarProps {
    currentStyle: CellStyle;
    onToggleBold: () => void;
    onToggleItalic: () => void;
    onToggleStrikethrough: () => void;
    onSetAlignment: (align: 'left' | 'center' | 'right') => void;
    onSetTextColor: (color: string) => void;
    onSetBgColor: (color: string) => void;
    onSetFontSize: (size: number) => void;
    onSetFontFamily: (family: string) => void;
    onFormatCurrency: () => void;
    onFormatPercent: () => void;
    onIncreaseDecimals: () => void;
    onDecreaseDecimals: () => void;
    onClearFormatting: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onToggleWrap?: () => void;
    onSetBorder?: (side: 'all' | 'none' | 'bottom' | 'top' | 'left' | 'right') => void;
}

const Divider = () => <div className="w-[1px] h-5 bg-[#dadce0] mx-0.5"></div>;

interface IconButtonProps {
    icon: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    title?: string;
    size?: 'sm' | 'md';
}

const IconButton: React.FC<IconButtonProps> = ({ icon, active = false, disabled = false, onClick, title, size = 'md' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`rounded transition-all duration-100 ${size === 'sm' ? 'p-1' : 'p-1.5'} ${
            disabled
                ? 'text-[#dadce0] cursor-not-allowed'
                : active
                ? 'bg-[#d3e3fd] text-[#1a73e8]'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] active:bg-[#e8eaed]'
        }`}
    >
        <span className={`material-symbols-outlined ${size === 'sm' ? 'text-[16px]' : 'text-[20px]'}`}>{icon}</span>
    </button>
);

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    icon: string;
    title: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, icon, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-[#5f6368] hover:bg-[#f1f3f4] rounded flex flex-col items-center justify-center transition-colors"
                title={title}
            >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <div
                    className="w-[18px] h-[3px] rounded-sm -mt-0.5"
                    style={{ backgroundColor: color || '#000000' }}
                ></div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-0.5 p-3 bg-white rounded shadow-lg border border-[#dadce0] z-[100]">
                    <div className="text-[12px] text-[#5f6368] mb-2 font-medium">Colors</div>
                    <div className="grid grid-cols-10 gap-0.5 w-[200px]">
                        {COLOR_PRESETS.map((c) => (
                            <button
                                key={c}
                                onClick={() => {
                                    onChange(c);
                                    setIsOpen(false);
                                }}
                                className={`w-[18px] h-[18px] rounded-sm transition-all hover:scale-110 ${
                                    color === c ? 'ring-2 ring-[#1a73e8] ring-offset-1' : 'hover:ring-1 hover:ring-[#dadce0]'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#dadce0] flex items-center gap-2">
                        <span className="text-[12px] text-[#5f6368]">Custom</span>
                        <input
                            type="color"
                            value={color || '#000000'}
                            onChange={(e) => {
                                onChange(e.target.value);
                                setIsOpen(false);
                            }}
                            className="w-6 h-6 cursor-pointer border border-[#dadce0] rounded"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

interface DropdownProps {
    value: string | number;
    options: (string | number)[];
    onChange: (value: string | number) => void;
    width?: string;
    showArrow?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, width = 'w-20', showArrow = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-0.5 py-1 px-2 text-[#5f6368] hover:bg-[#f1f3f4] active:bg-[#e8eaed] rounded text-[13px] ${width} justify-between transition-colors`}
            >
                <span className="truncate">{value}</span>
                {showArrow && <span className="material-symbols-outlined text-[18px] text-[#5f6368]">arrow_drop_down</span>}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-0.5 bg-white rounded shadow-lg border border-[#dadce0] z-[100] max-h-60 overflow-auto min-w-full py-1">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full text-left px-3 py-1.5 text-[13px] hover:bg-[#f1f3f4] whitespace-nowrap transition-colors ${
                                value === opt ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124]'
                            }`}
                        >
                            {value === opt && <span className="material-symbols-outlined text-[18px] mr-2 text-[#1a73e8]">check</span>}
                            <span className={value === opt ? '' : 'ml-[26px]'}>{opt}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface BorderMenuProps {
    onSetBorder: (side: 'all' | 'none' | 'bottom' | 'top' | 'left' | 'right') => void;
}

const BorderMenu: React.FC<BorderMenuProps> = ({ onSetBorder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const borderOptions: { label: string; icon: string; value: 'all' | 'none' | 'bottom' | 'top' | 'left' | 'right' }[] = [
        { label: 'All borders', icon: 'border_all', value: 'all' },
        { label: 'No borders', icon: 'border_clear', value: 'none' },
        { label: 'Top border', icon: 'border_top', value: 'top' },
        { label: 'Bottom border', icon: 'border_bottom', value: 'bottom' },
        { label: 'Left border', icon: 'border_left', value: 'left' },
        { label: 'Right border', icon: 'border_right', value: 'right' },
    ];

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-[#5f6368] hover:bg-[#f1f3f4] rounded flex items-center transition-colors"
                title="Borders"
            >
                <span className="material-symbols-outlined text-[20px]">border_all</span>
                <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-0.5 bg-white rounded shadow-lg border border-[#dadce0] z-[100] py-1 min-w-[160px]">
                    {borderOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onSetBorder(opt.value); setIsOpen(false); }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-[#5f6368]">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Toolbar: React.FC<ToolbarProps> = ({
    currentStyle,
    onToggleBold,
    onToggleItalic,
    onToggleStrikethrough,
    onSetAlignment,
    onSetTextColor,
    onSetBgColor,
    onSetFontSize,
    onSetFontFamily,
    onFormatCurrency,
    onFormatPercent,
    onIncreaseDecimals,
    onDecreaseDecimals,
    onClearFormatting,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onToggleWrap,
    onSetBorder,
}) => {
    const [zoom, setZoom] = useState(100);
    const fontSize = currentStyle.fontSize || 10;
    const fontFamily = currentStyle.fontFamily || 'Inter';

    // Get alignment icon based on current alignment
    const getAlignmentIcon = () => {
        switch (currentStyle.align) {
            case 'center': return 'format_align_center';
            case 'right': return 'format_align_right';
            default: return 'format_align_left';
        }
    };

    const [alignMenuOpen, setAlignMenuOpen] = useState(false);
    const alignRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (alignRef.current && !alignRef.current.contains(e.target as Node)) {
                setAlignMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col shrink-0 bg-[#f9fbfd] border-b border-[#dadce0] relative z-30">
            <div className="flex items-center gap-0 px-2 py-1 flex-wrap">
                {/* Undo/Redo */}
                <div className="flex items-center">
                    <IconButton icon="undo" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" />
                    <IconButton icon="redo" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" />
                    <IconButton icon="print" onClick={() => window.print()} title="Print (Ctrl+P)" />
                    <IconButton icon="format_paint" title="Paint format" />
                </div>

                <Divider />

                {/* Zoom */}
                <div className="flex items-center">
                    <Dropdown
                        value={`${zoom}%`}
                        options={[50, 75, 90, 100, 125, 150, 200].map(z => `${z}%`)}
                        onChange={(val) => setZoom(parseInt(String(val)))}
                        width="w-[70px]"
                    />
                </div>

                <Divider />

                {/* Number formatting */}
                <div className="flex items-center">
                    <IconButton icon="attach_money" onClick={onFormatCurrency} title="Format as currency ($)" />
                    <IconButton icon="percent" onClick={onFormatPercent} title="Format as percent (%)" />
                    <IconButton icon="exposure_neg_1" onClick={onDecreaseDecimals} title="Decrease decimal places" size="sm" />
                    <IconButton icon="exposure_plus_1" onClick={onIncreaseDecimals} title="Increase decimal places" size="sm" />
                </div>

                <Divider />

                {/* Font family and size */}
                <div className="flex items-center">
                    <Dropdown
                        value={fontFamily}
                        options={FONT_FAMILIES}
                        onChange={(val) => onSetFontFamily(String(val))}
                        width="w-[120px]"
                    />
                </div>

                <Divider />

                <div className="flex items-center">
                    <IconButton
                        icon="remove"
                        onClick={() => onSetFontSize(Math.max(6, fontSize - 1))}
                        title="Decrease font size"
                        size="sm"
                    />
                    <Dropdown
                        value={fontSize}
                        options={FONT_SIZES}
                        onChange={(val) => onSetFontSize(Number(val))}
                        width="w-[50px]"
                        showArrow={false}
                    />
                    <IconButton
                        icon="add"
                        onClick={() => onSetFontSize(Math.min(72, fontSize + 1))}
                        title="Increase font size"
                        size="sm"
                    />
                </div>

                <Divider />

                {/* Text formatting */}
                <div className="flex items-center">
                    <IconButton
                        icon="format_bold"
                        active={currentStyle.bold}
                        onClick={onToggleBold}
                        title="Bold (Ctrl+B)"
                    />
                    <IconButton
                        icon="format_italic"
                        active={currentStyle.italic}
                        onClick={onToggleItalic}
                        title="Italic (Ctrl+I)"
                    />
                    <IconButton
                        icon="strikethrough_s"
                        active={currentStyle.strikethrough}
                        onClick={onToggleStrikethrough}
                        title="Strikethrough"
                    />

                    <ColorPicker
                        color={currentStyle.color || '#000000'}
                        onChange={onSetTextColor}
                        icon="format_color_text"
                        title="Text color"
                    />

                    <ColorPicker
                        color={currentStyle.bg || '#ffffff'}
                        onChange={onSetBgColor}
                        icon="colors"
                        title="Fill color"
                    />
                </div>

                <Divider />

                {/* Borders and merge */}
                <div className="flex items-center">
                    {onSetBorder ? (
                        <BorderMenu onSetBorder={onSetBorder} />
                    ) : (
                        <IconButton icon="border_all" title="Borders" />
                    )}
                    <IconButton icon="cell_merge" title="Merge cells" />
                </div>

                <Divider />

                {/* Alignment dropdown */}
                <div className="flex items-center">
                    <div ref={alignRef} className="relative">
                        <button
                            onClick={() => setAlignMenuOpen(!alignMenuOpen)}
                            className="p-1.5 text-[#5f6368] hover:bg-[#f1f3f4] rounded flex items-center transition-colors"
                            title="Horizontal alignment"
                        >
                            <span className="material-symbols-outlined text-[20px]">{getAlignmentIcon()}</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                        </button>

                        {alignMenuOpen && (
                            <div className="absolute top-full left-0 mt-0.5 bg-white rounded shadow-lg border border-[#dadce0] z-[100] py-1 min-w-[140px]">
                                <button
                                    onClick={() => { onSetAlignment('left'); setAlignMenuOpen(false); }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 text-[13px] hover:bg-[#f1f3f4] ${
                                        currentStyle.align === 'left' || !currentStyle.align ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">format_align_left</span>
                                    Left
                                </button>
                                <button
                                    onClick={() => { onSetAlignment('center'); setAlignMenuOpen(false); }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 text-[13px] hover:bg-[#f1f3f4] ${
                                        currentStyle.align === 'center' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">format_align_center</span>
                                    Center
                                </button>
                                <button
                                    onClick={() => { onSetAlignment('right'); setAlignMenuOpen(false); }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 text-[13px] hover:bg-[#f1f3f4] ${
                                        currentStyle.align === 'right' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">format_align_right</span>
                                    Right
                                </button>
                            </div>
                        )}
                    </div>

                    <IconButton
                        icon="wrap_text"
                        active={currentStyle.wrap}
                        onClick={onToggleWrap}
                        title="Text wrapping"
                    />
                </div>

                <Divider />

                {/* Other tools */}
                <div className="flex items-center">
                    <IconButton icon="link" title="Insert link" />
                    <IconButton icon="add_comment" title="Insert comment" />
                    <IconButton icon="insert_chart" title="Insert chart" />
                    <IconButton icon="filter_list" title="Create filter" />
                    <IconButton icon="functions" title="Functions" />
                </div>
            </div>
        </div>
    );
};
