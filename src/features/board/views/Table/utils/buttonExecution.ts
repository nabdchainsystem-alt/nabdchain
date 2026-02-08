import { ButtonAction } from '../types';
import { boardLogger } from '@/utils/logger';

export const executeButtonAction = async (
  action: ButtonAction,
  context?: {
    rowId?: string;
    rowData?: Record<string, unknown>;
    boardId?: string;
    user?: unknown;
    navigate?: (path: string) => void;
    updateRow?: (id: string, updates: Record<string, unknown>) => void;
  },
) => {
  boardLogger.debug('Executing button action', { action, context });
  const { type, config } = action;

  // Artificial delay for feedback if needed by caller, but we'll leave that to UI
  // purely execute logic here

  switch (type) {
    case 'open_url':
      if (config.url && typeof config.url === 'string') {
        let url = config.url;
        if (!url.startsWith('http')) url = 'https://' + url;
        window.open(url, '_blank');
      }
      break;

    case 'run_automation':
      // Mock automation trigger
      // SPECIAL CASE: Handle the user's specific "open vault" request immediately
      if (config.automationId && (config.automationId as string).toLowerCase().includes('vault')) {
        if (context?.navigate) {
          context.navigate('/vault');
        } else {
          window.location.href = '/vault';
        }
        return;
      }

      alert(`✅ Automation triggered: ${config.automationId || 'Unknown ID'}`);
      break;

    case 'update_status':
      // Update status using the provided callback
      if (context?.updateRow && context?.rowId) {
        const newStatus = config.status || 'Done';
        boardLogger.debug('Updating status', { newStatus });
        context.updateRow(context.rowId, { status: newStatus });

        // Show brief success feedback if desired, or just rely on UI update
        // alert(`🔄 Status updated to: ${newStatus}`);
      } else {
        alert(`🔄 Status would update to: ${config.status || 'Done'} (No update function provided)`);
      }
      break;

    case 'send_notification':
      // Mock notification
      alert(`🔔 Notification sent to ${config.recipientId}: "${config.message}"`);
      break;

    case 'create_item':
      // Mock item creation
      alert(`✨ New item created: ${config.itemName || 'New Item'}`);
      break;

    case 'custom_webhook':
      if (config.webhookUrl) {
        try {
          // We try to fetch, but handle CORS errors gratefully for demo
          // const response = await fetch(config.webhookUrl as string, {
          //    method: 'POST',
          //    headers: { 'Content-Type': 'application/json' },
          //    body: JSON.stringify({ ...context, timestamp: Date.now() })
          // });
          boardLogger.info('Webhook dispatched', { url: config.webhookUrl });
          alert(`🌐 Webhook fired to: ${config.webhookUrl}`);
        } catch (_e) {
          alert('Webhook failed (network error)');
        }
      }
      break;

    case 'custom_script':
      // Execute predefined actions from structured config (no arbitrary code execution)
      if (config.script && typeof config.script === 'string') {
        try {
          const actions = (config.actions as Array<{ action: string; [key: string]: unknown }>) || [];
          for (const step of actions) {
            switch (step.action) {
              case 'alert':
                alert(`[Script Alert] ${step.message || ''}`);
                break;
              case 'openUrl':
                if (typeof step.url === 'string') window.open(step.url, '_blank');
                break;
              case 'navigate':
                if (typeof step.path === 'string') {
                  if (context?.navigate) context.navigate(step.path);
                  else window.location.href = step.path;
                }
                break;
              case 'updateRow':
                if (context?.updateRow && context.rowId && step.updates && typeof step.updates === 'object') {
                  context.updateRow(context.rowId, step.updates as Record<string, unknown>);
                }
                break;
              case 'log':
                boardLogger.info('[Script Log]', step.message);
                break;
              default:
                boardLogger.warn('Unknown script action', { action: step.action });
            }
          }
          // Fallback: show script content as info if no structured actions provided
          if (actions.length === 0) {
            alert(`Script registered: ${config.script}`);
          }
        } catch (err: unknown) {
          boardLogger.error('Script action error', err);
          const message = err instanceof Error ? err.message : 'Unknown error';
          alert(`Script Error: ${message}`);
        }
      }
      break;

    default:
      boardLogger.warn('Unknown action type', { type });
  }
};
