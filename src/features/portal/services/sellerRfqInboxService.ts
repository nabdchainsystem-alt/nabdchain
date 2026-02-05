// =============================================================================
// Seller RFQ Inbox Service - Frontend API Client (Stage 2)
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  SellerInboxRFQ,
  InboxFilters,
  InboxResponse,
  StatusUpdateData,
  InternalNoteData,
  RFQEvent,
  // Gmail-style types
  RFQLabel,
  CreateLabelData,
  UpdateLabelData,
  RFQNote,
  CreateNoteData,
  SavedReply,
  CreateSavedReplyData,
  UpdateSavedReplyData,
  SnoozeData,
  BulkIdsData,
  BulkLabelData,
  BulkSnoozeData,
} from '../types/item.types';

// =============================================================================
// Seller RFQ Inbox Service
// =============================================================================

export const sellerRfqInboxService = {
  /**
   * Get paginated RFQ inbox with filters
   */
  async getInbox(token: string, filters: InboxFilters = {}): Promise<InboxResponse> {
    const url = new URL(`${API_URL}/items/rfq/seller/inbox`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.priorityLevel) url.searchParams.append('priorityLevel', filters.priorityLevel);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());
    if (filters.sortBy) url.searchParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) url.searchParams.append('sortOrder', filters.sortOrder);
    // Gmail-style filters
    if (filters.labelId) url.searchParams.append('labelId', filters.labelId);
    if (filters.isRead !== undefined) url.searchParams.append('isRead', filters.isRead.toString());
    if (filters.isArchived !== undefined) url.searchParams.append('isArchived', filters.isArchived.toString());
    if (filters.isSnoozed !== undefined) url.searchParams.append('isSnoozed', filters.isSnoozed.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch inbox');
    }

    return response.json();
  },

  /**
   * Get RFQ detail (auto-marks as VIEWED)
   */
  async getRFQDetail(token: string, rfqId: string): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch RFQ detail');
    }

    return response.json();
  },

  /**
   * Update RFQ status (mark as under_review or ignored)
   */
  async updateStatus(
    token: string,
    rfqId: string,
    data: StatusUpdateData
  ): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update RFQ status');
    }

    return response.json();
  },

  /**
   * Mark RFQ as under review
   */
  async markUnderReview(token: string, rfqId: string): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(token, rfqId, { status: 'under_review' });
  },

  /**
   * Mark RFQ as ignored with reason
   */
  async markIgnored(
    token: string,
    rfqId: string,
    reason: string
  ): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(token, rfqId, { status: 'ignored', ignoredReason: reason });
  },

  /**
   * Add internal note to RFQ
   */
  async addNote(
    token: string,
    rfqId: string,
    data: InternalNoteData
  ): Promise<SellerInboxRFQ | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add note');
    }

    return response.json();
  },

  /**
   * Get RFQ event history
   */
  async getHistory(token: string, rfqId: string): Promise<RFQEvent[] | null> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch history');
    }

    return response.json();
  },

  // =============================================================================
  // Gmail-Style Features: Labels
  // =============================================================================

  /**
   * Get all labels for the seller
   */
  async getLabels(token: string): Promise<RFQLabel[]> {
    const response = await fetch(`${API_URL}/items/rfq/seller/labels`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch labels');
    }

    return response.json();
  },

  /**
   * Create a new label
   */
  async createLabel(token: string, data: CreateLabelData): Promise<RFQLabel> {
    const response = await fetch(`${API_URL}/items/rfq/seller/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create label');
    }

    return response.json();
  },

  /**
   * Update a label
   */
  async updateLabel(token: string, labelId: string, data: UpdateLabelData): Promise<RFQLabel> {
    const response = await fetch(`${API_URL}/items/rfq/seller/labels/${labelId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update label');
    }

    return response.json();
  },

  /**
   * Delete a label
   */
  async deleteLabel(token: string, labelId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/labels/${labelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete label');
    }
  },

  /**
   * Add a label to an RFQ
   */
  async addLabelToRFQ(token: string, rfqId: string, labelId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/labels/${labelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add label');
    }
  },

  /**
   * Remove a label from an RFQ
   */
  async removeLabelFromRFQ(token: string, rfqId: string, labelId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/labels/${labelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove label');
    }
  },

  /**
   * Bulk add/remove label from multiple RFQs
   */
  async bulkUpdateLabels(token: string, data: BulkLabelData): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update labels');
    }

    return response.json();
  },

  // =============================================================================
  // Gmail-Style Features: Threaded Notes
  // =============================================================================

  /**
   * Get all notes for an RFQ (threaded)
   */
  async getNotes(token: string, rfqId: string): Promise<RFQNote[]> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch notes');
    }

    return response.json();
  },

  /**
   * Add a new note to an RFQ
   */
  async addThreadedNote(token: string, rfqId: string, data: CreateNoteData): Promise<RFQNote> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add note');
    }

    return response.json();
  },

  /**
   * Update a note
   */
  async updateNote(token: string, noteId: string, content: string): Promise<RFQNote> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update note');
    }

    return response.json();
  },

  /**
   * Delete a note
   */
  async deleteNote(token: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/notes/${noteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete note');
    }
  },

  // =============================================================================
  // Gmail-Style Features: Saved Replies
  // =============================================================================

  /**
   * Get all saved replies
   */
  async getSavedReplies(token: string, category?: string): Promise<SavedReply[]> {
    const url = new URL(`${API_URL}/items/rfq/seller/saved-replies`);
    if (category) url.searchParams.append('category', category);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch saved replies');
    }

    return response.json();
  },

  /**
   * Create a saved reply
   */
  async createSavedReply(token: string, data: CreateSavedReplyData): Promise<SavedReply> {
    const response = await fetch(`${API_URL}/items/rfq/seller/saved-replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create saved reply');
    }

    return response.json();
  },

  /**
   * Update a saved reply
   */
  async updateSavedReply(token: string, replyId: string, data: UpdateSavedReplyData): Promise<SavedReply> {
    const response = await fetch(`${API_URL}/items/rfq/seller/saved-replies/${replyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update saved reply');
    }

    return response.json();
  },

  /**
   * Delete a saved reply
   */
  async deleteSavedReply(token: string, replyId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/saved-replies/${replyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete saved reply');
    }
  },

  /**
   * Expand a saved reply with RFQ data
   */
  async expandTemplate(token: string, replyId: string, rfqId: string): Promise<string> {
    const response = await fetch(`${API_URL}/items/rfq/seller/saved-replies/${replyId}/expand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rfqId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to expand template');
    }

    const data = await response.json();
    return data.content;
  },

  // =============================================================================
  // Gmail-Style Features: Snooze
  // =============================================================================

  /**
   * Snooze an RFQ
   */
  async snoozeRFQ(token: string, rfqId: string, data: SnoozeData): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to snooze RFQ');
    }
  },

  /**
   * Unsnooze an RFQ
   */
  async unsnoozeRFQ(token: string, rfqId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/snooze`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to unsnooze RFQ');
    }
  },

  /**
   * Bulk snooze multiple RFQs
   */
  async bulkSnooze(token: string, data: BulkSnoozeData): Promise<{ snoozed: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/snooze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to snooze RFQs');
    }

    return response.json();
  },

  // =============================================================================
  // Gmail-Style Features: Read/Unread
  // =============================================================================

  /**
   * Mark an RFQ as read
   */
  async markAsRead(token: string, rfqId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to mark as read');
    }
  },

  /**
   * Mark an RFQ as unread
   */
  async markAsUnread(token: string, rfqId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/read`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to mark as unread');
    }
  },

  /**
   * Bulk mark RFQs as read
   */
  async bulkMarkAsRead(token: string, data: BulkIdsData): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to mark as read');
    }

    return response.json();
  },

  /**
   * Bulk mark RFQs as unread
   */
  async bulkMarkAsUnread(token: string, data: BulkIdsData): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/unread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to mark as unread');
    }

    return response.json();
  },

  // =============================================================================
  // Gmail-Style Features: Archive
  // =============================================================================

  /**
   * Archive an RFQ
   */
  async archiveRFQ(token: string, rfqId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to archive RFQ');
    }
  },

  /**
   * Unarchive an RFQ
   */
  async unarchiveRFQ(token: string, rfqId: string): Promise<void> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/${rfqId}/archive`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to unarchive RFQ');
    }
  },

  /**
   * Bulk archive RFQs
   */
  async bulkArchive(token: string, data: BulkIdsData): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to archive RFQs');
    }

    return response.json();
  },

  /**
   * Bulk unarchive RFQs
   */
  async bulkUnarchive(token: string, data: BulkIdsData): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/items/rfq/seller/inbox/bulk/unarchive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to unarchive RFQs');
    }

    return response.json();
  },
};

export default sellerRfqInboxService;
