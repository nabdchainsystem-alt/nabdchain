import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Cursor, Play, Lightning, Link, Bell, PaperPlaneTilt,
    Plus, Gear, ArrowRight, Check, Globe
} from 'phosphor-react';

// =============================================================================
// BUTTON PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export type ButtonActionType =
    | 'open_url'
    | 'run_automation'
    | 'update_status'
    | 'send_notification'
    | 'create_item'
    | 'custom_webhook';

export interface ButtonAction {
    type: ButtonActionType;
    config: Record<string, unknown>;
}

export interface ButtonConfig {
    label: string;
    icon?: string;
    color: string;
    action: ButtonAction;
}

interface ButtonPickerProps {
    config?: ButtonConfig;
    onConfigChange?: (config: ButtonConfig) => void;
    onClose: () => void;
    onButtonClick?: () => void;
    triggerRect?: DOMRect;
    isConfigMode?: boolean;
}

const ACTION_TYPES = [
    { type: 'open_url' as const, label: 'Open URL', icon: Link, description: 'Open a link in new tab' },
    { type: 'run_automation' as const, label: 'Run Automation', icon: Lightning, description: 'Trigger an automation' },
    { type: 'update_status' as const, label: 'Update Status', icon: ArrowRight, description: 'Change item status' },
    { type: 'send_notification' as const, label: 'Send Notification', icon: Bell, description: 'Notify team members' },
    { type: 'create_item' as const, label: 'Create Item', icon: Plus, description: 'Create a new item' },
    { type: 'custom_webhook' as const, label: 'Webhook', icon: Globe, description: 'Call external API' },
];

const BUTTON_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Teal', value: '#14b8a6' },
];

export const ButtonPicker: React.FC<ButtonPickerProps> = ({
    config,
    onConfigChange,
    onClose,
    onButtonClick,
    triggerRect,
    isConfigMode = false,
}) => {
    const [localConfig, setLocalConfig] = useState<ButtonConfig>(
        config || {
            label: 'Click',
            color: '#3b82f6',
            action: { type: 'open_url', config: {} }
        }
    );
    const [isExecuting, setIsExecuting] = useState(false);

    const MENU_WIDTH = isConfigMode ? 320 : 200;
    const MENU_HEIGHT = isConfigMode ? 450 : 180;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        if (openUp) {
            return { ...baseStyle, bottom: windowHeight - triggerRect.top + 4, ...(left !== undefined ? { left } : { right }) };
        }
        return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect, isConfigMode]);

    const handleExecuteButton = async () => {
        setIsExecuting(true);
        // TODO: Implement action execution
        console.log('[Button] Execute action - NOT IMPLEMENTED', localConfig.action);

        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsExecuting(false);
        onButtonClick?.();
        onClose();
    };

    const handleSaveConfig = () => {
        onConfigChange?.(localConfig);
        onClose();
    };

    const selectedActionType = ACTION_TYPES.find(a => a.type === localConfig.action.type);

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                            <Cursor size={14} />
                            {isConfigMode ? 'Configure Button' : 'Button Action'}
                        </span>
                        {isConfigMode && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                                BETA
                            </span>
                        )}
                    </div>
                </div>

                {/* Execute Mode */}
                {!isConfigMode && config && (
                    <div className="p-4 flex flex-col items-center gap-3">
                        <button
                            onClick={handleExecuteButton}
                            disabled={isExecuting}
                            className="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            style={{ backgroundColor: config.color }}
                        >
                            {isExecuting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play size={18} weight="fill" />
                                    {config.label}
                                </>
                            )}
                        </button>
                        <div className="text-xs text-stone-400 flex items-center gap-1">
                            {selectedActionType && <selectedActionType.icon size={12} />}
                            {selectedActionType?.description}
                        </div>
                    </div>
                )}

                {/* Config Mode */}
                {isConfigMode && (
                    <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                        {/* Button Label */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Button Label
                            </label>
                            <input
                                type="text"
                                value={localConfig.label}
                                onChange={(e) => setLocalConfig({ ...localConfig, label: e.target.value })}
                                placeholder="Click me"
                                className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                            />
                        </div>

                        {/* Button Color */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Color
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {BUTTON_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setLocalConfig({ ...localConfig, color: color.value })}
                                        className={`w-7 h-7 rounded-lg transition-all ${
                                            localConfig.color === color.value
                                                ? 'ring-2 ring-offset-2 ring-stone-400'
                                                : 'hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Action Type */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Action
                            </label>
                            <div className="space-y-1">
                                {ACTION_TYPES.map((action) => (
                                    <button
                                        key={action.type}
                                        onClick={() => setLocalConfig({
                                            ...localConfig,
                                            action: { type: action.type, config: {} }
                                        })}
                                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left ${
                                            localConfig.action.type === action.type
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                : 'hover:bg-stone-50 dark:hover:bg-stone-800 border border-transparent'
                                        }`}
                                    >
                                        <action.icon size={16} className={
                                            localConfig.action.type === action.type
                                                ? 'text-blue-500'
                                                : 'text-stone-400'
                                        } />
                                        <div className="flex-1">
                                            <div className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                                {action.label}
                                            </div>
                                            <div className="text-[10px] text-stone-400">
                                                {action.description}
                                            </div>
                                        </div>
                                        {localConfig.action.type === action.type && (
                                            <Check size={14} className="text-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Config (placeholder) */}
                        <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                            <div className="flex items-center gap-1 text-xs text-stone-500">
                                <Gear size={12} />
                                Action configuration coming soon
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Preview
                            </label>
                            <button
                                className="px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2"
                                style={{ backgroundColor: localConfig.color }}
                            >
                                <Play size={14} weight="fill" />
                                {localConfig.label}
                            </button>
                        </div>

                        {/* Save */}
                        <button
                            onClick={handleSaveConfig}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Save Button
                        </button>
                    </div>
                )}

                {/* Close */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={onClose}
                        className="w-full py-1.5 text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

// Inline button display for table cells
export const CellButton: React.FC<{
    config?: ButtonConfig;
    onClick?: () => void;
    size?: 'sm' | 'md';
}> = ({ config, onClick, size = 'sm' }) => {
    if (!config) {
        return (
            <button
                onClick={onClick}
                className="text-xs text-stone-400 hover:text-stone-600"
            >
                + Configure
            </button>
        );
    }

    const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

    return (
        <button
            onClick={onClick}
            className={`${padding} rounded text-white font-medium flex items-center gap-1 hover:opacity-90 transition-opacity`}
            style={{ backgroundColor: config.color }}
        >
            <Play size={size === 'sm' ? 10 : 12} weight="fill" />
            {config.label}
        </button>
    );
};

export default ButtonPicker;
