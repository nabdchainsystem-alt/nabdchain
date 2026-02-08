import React, { useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Cursor,
  Play,
  Lightning,
  Link,
  Bell,
  Plus,
  Gear,
  ArrowRight,
  Check,
  Globe,
  Code,
  Warning,
} from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { ButtonConfig } from '../../types';
import { executeButtonAction } from '../../utils/buttonExecution';
import { boardLogger } from '@/utils/logger';

// =============================================================================
// BUTTON PICKER - COMPONENT
// =============================================================================

interface ButtonPickerProps {
  config?: ButtonConfig;
  onConfigChange?: (config: ButtonConfig) => void;
  onClose: () => void;
  onButtonClick?: () => void;
  triggerRect?: DOMRect;
  isConfigMode?: boolean;
}

export const ACTION_TYPES = [
  { type: 'open_url' as const, label: 'Open URL', icon: Link, description: 'Open a link in new tab' },
  { type: 'run_automation' as const, label: 'Run Automation', icon: Lightning, description: 'Trigger an automation' },
  { type: 'update_status' as const, label: 'Update Status', icon: ArrowRight, description: 'Change item status' },
  { type: 'send_notification' as const, label: 'Send Notification', icon: Bell, description: 'Notify team members' },
  { type: 'create_item' as const, label: 'Create Item', icon: Plus, description: 'Create a new item' },
  { type: 'custom_webhook' as const, label: 'Webhook', icon: Globe, description: 'Call external API' },
  { type: 'custom_script' as const, label: 'Smart Logic', icon: Code, description: 'Run custom script' },
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

export const ButtonPicker: React.FC<ButtonPickerProps> = memo(
  ({ config, onConfigChange, onClose, onButtonClick, triggerRect, isConfigMode = false }) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const navigate = useNavigate();
    const [localConfig, setLocalConfig] = useState<ButtonConfig>(
      config || {
        label: 'Click',
        color: '#3b82f6',
        action: { type: 'open_url', config: {} },
      },
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
        return {
          ...baseStyle,
          bottom: windowHeight - triggerRect.top + 4,
          ...(isRtl
            ? right !== undefined
              ? { right: PADDING }
              : { left: PADDING }
            : left !== undefined
              ? { left }
              : { right }),
        };
      }
      return {
        ...baseStyle,
        top: triggerRect.bottom + 4,
        ...(isRtl
          ? right !== undefined
            ? { right: PADDING }
            : { left: PADDING }
          : left !== undefined
            ? { left }
            : { right }),
      };
    }, [triggerRect, isConfigMode, isRtl]);

    const handleExecuteButton = async () => {
      setIsExecuting(true);
      boardLogger.debug('[Button] Execute action', { action: localConfig.action });

      try {
        await new Promise((resolve) => setTimeout(resolve, 600));

        await executeButtonAction(localConfig.action, {
          // Mock context for preview/config mode
          user: 'Current User',
          boardId: 'preview-board',
          rowId: 'preview-row',
          rowData: {},
          navigate,
        });
      } catch (error) {
        boardLogger.error('Action failed', error);
      } finally {
        setIsExecuting(false);
        onButtonClick?.();
        onClose(); // Close the menu if open, though usually this is clicked from CellButton
      }
    };

    const handleSaveConfig = () => {
      onConfigChange?.(localConfig);
      onClose();
    };

    const selectedActionType = ACTION_TYPES.find((a) => a.type === localConfig.action.type);

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
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span
                className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <Cursor size={14} />
                {isConfigMode ? t('configure_button') : t('button_action')}
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
                className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                style={{ backgroundColor: config.color }}
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('running')}
                  </>
                ) : (
                  <>
                    <Play size={18} weight="fill" />
                    {config.label}
                  </>
                )}
              </button>
              <div
                className={`text-xs text-stone-400 flex items-center gap-1 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
              >
                {selectedActionType && <selectedActionType.icon size={12} />}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(selectedActionType?.type as any) || selectedActionType?.description}
              </div>
            </div>
          )}

          {/* Config Mode */}
          {isConfigMode && (
            <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
              {/* Button Label */}
              <div>
                <label
                  className={`block text-[10px] font-medium text-stone-500 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}
                >
                  {t('button_label')}
                </label>
                <input
                  type="text"
                  value={localConfig.label}
                  onChange={(e) => setLocalConfig({ ...localConfig, label: e.target.value })}
                  placeholder={t('click_me') || 'Click me'}
                  className={`w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 ${isRtl ? 'text-right' : ''}`}
                />
              </div>

              {/* Button Color */}
              <div>
                <label
                  className={`block text-[10px] font-medium text-stone-500 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}
                >
                  {t('color')}
                </label>
                <div className={`flex flex-wrap gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {BUTTON_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setLocalConfig({ ...localConfig, color: color.value })}
                      className={`w-7 h-7 rounded-lg transition-all ${
                        localConfig.color === color.value ? 'ring-2 ring-offset-2 ring-stone-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      title={t(color.name.toLowerCase() as any) || color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label
                  className={`block text-[10px] font-medium text-stone-500 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}
                >
                  {t('action')}
                </label>
                <div className="space-y-1">
                  {ACTION_TYPES.map((action) => (
                    <button
                      key={action.type}
                      onClick={() =>
                        setLocalConfig({
                          ...localConfig,
                          action: { type: action.type, config: {} },
                        })
                      }
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left ${isRtl ? 'flex-row-reverse' : ''} ${
                        localConfig.action.type === action.type
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800 border border-transparent'
                      }`}
                    >
                      <action.icon
                        size={16}
                        className={localConfig.action.type === action.type ? 'text-blue-500' : 'text-stone-400'}
                      />
                      <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
                        <div className="text-xs font-medium text-stone-700 dark:text-stone-300">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {t(action.type as any) || action.label}
                        </div>
                        <div className="text-[10px] text-stone-400">{action.description}</div>
                      </div>
                      {localConfig.action.type === action.type && <Check size={14} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Config */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-3">
                <div
                  className={`flex items-center gap-1 text-xs font-medium text-stone-500 uppercase ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <Gear size={12} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(selectedActionType?.type as any) || selectedActionType?.label} {t('configuration')}
                </div>

                {localConfig.action.type === 'open_url' && (
                  <div>
                    <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>URL</label>
                    <input
                      type="url"
                      value={(localConfig.action.config.url as string) || ''}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          action: {
                            ...localConfig.action,
                            config: { ...localConfig.action.config, url: e.target.value },
                          },
                        })
                      }
                      placeholder="https://example.com"
                      className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                )}

                {localConfig.action.type === 'run_automation' && (
                  <div>
                    <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                      {t('automation_id')}
                    </label>
                    <input
                      type="text"
                      value={(localConfig.action.config.automationId as string) || ''}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          action: {
                            ...localConfig.action,
                            config: { ...localConfig.action.config, automationId: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g., AUTO-123"
                      className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                )}

                {localConfig.action.type === 'update_status' && (
                  <div>
                    <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                      {t('new_status')}
                    </label>
                    <select
                      value={(localConfig.action.config.status as string) || ''}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          action: {
                            ...localConfig.action,
                            config: { ...localConfig.action.config, status: e.target.value },
                          },
                        })
                      }
                      className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                    >
                      <option value="">{t('select_status') || 'Select status...'}</option>
                      <option value="Done">Done</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Stuck">Stuck</option>
                    </select>
                  </div>
                )}

                {localConfig.action.type === 'send_notification' && (
                  <>
                    <div>
                      <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                        {t('message')}
                      </label>
                      <input
                        type="text"
                        value={(localConfig.action.config.message as string) || ''}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            action: {
                              ...localConfig.action,
                              config: { ...localConfig.action.config, message: e.target.value },
                            },
                          })
                        }
                        placeholder={t('notification_message') || 'Notification message'}
                        className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                        {t('recipient_id')}
                      </label>
                      <input
                        type="text"
                        value={(localConfig.action.config.recipientId as string) || ''}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            action: {
                              ...localConfig.action,
                              config: { ...localConfig.action.config, recipientId: e.target.value },
                            },
                          })
                        }
                        placeholder="User ID or Email"
                        className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                      />
                    </div>
                  </>
                )}

                {localConfig.action.type === 'create_item' && (
                  <div>
                    <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                      {t('item_name')}
                    </label>
                    <input
                      type="text"
                      value={(localConfig.action.config.itemName as string) || ''}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          action: {
                            ...localConfig.action,
                            config: { ...localConfig.action.config, itemName: e.target.value },
                          },
                        })
                      }
                      placeholder={t('new_item_name') || 'New Item Name'}
                      className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                )}

                {localConfig.action.type === 'custom_webhook' && (
                  <div>
                    <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                      {t('webhook_url')}
                    </label>
                    <input
                      type="url"
                      value={(localConfig.action.config.webhookUrl as string) || ''}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          action: {
                            ...localConfig.action,
                            config: { ...localConfig.action.config, webhookUrl: e.target.value },
                          },
                        })
                      }
                      placeholder="https://api.example.com/webhook"
                      className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                )}

                {localConfig.action.type === 'custom_script' && (
                  <div className="flex flex-col gap-2">
                    <div
                      className={`flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] rounded border border-amber-100 dark:border-amber-800 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                    >
                      <Warning size={14} className="shrink-0 mt-0.5" />
                      <p>
                        {t('script_warning') ||
                          'Write JavaScript code. Available objects: utils.alert(), utils.openUrl(), context.'}
                      </p>
                    </div>
                    <div>
                      <label className={`block text-[10px] text-stone-400 mb-1 ${isRtl ? 'text-right' : ''}`}>
                        {t('script')}
                      </label>
                      <textarea
                        value={(localConfig.action.config.script as string) || ''}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            action: {
                              ...localConfig.action,
                              config: { ...localConfig.action.config, script: e.target.value },
                            },
                          })
                        }
                        placeholder="utils.alert('Hello ' + context.user);"
                        className={`w-full px-2 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 font-mono ${isRtl ? 'text-right' : ''}`}
                        rows={6}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div>
                <label
                  className={`block text-[10px] font-medium text-stone-500 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}
                >
                  {t('preview')}
                </label>
                <button
                  className={`px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
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
                {t('save_button_config')}
              </button>
            </div>
          )}

          {/* Close */}
          <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={onClose}
              className="w-full py-1.5 text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              {t('common_cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      </>
    );

    return createPortal(content, document.body);
  },
);

// Inline button display for table cells
export const CellButton: React.FC<{
  config?: ButtonConfig;
  onClick?: () => void;
  size?: 'sm' | 'md';
}> = memo(({ config, onClick, size = 'sm' }) => {
  const { t } = useLanguage();
  if (!config) {
    return (
      <button onClick={onClick} className="text-xs text-stone-400 hover:text-stone-600">
        + {t('configure')}
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
});

export default ButtonPicker;
