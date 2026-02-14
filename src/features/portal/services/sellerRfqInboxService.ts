// =============================================================================
// Seller RFQ Inbox Service - Frontend API Client (Stage 2)
// =============================================================================

import { portalApiClient } from './portalApiClient';
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
  async getInbox(filters: InboxFilters = {}): Promise<InboxResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.priorityLevel) params.append('priorityLevel', filters.priorityLevel);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    // Gmail-style filters
    if (filters.labelId) params.append('labelId', filters.labelId);
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString());
    if (filters.isSnoozed !== undefined) params.append('isSnoozed', filters.isSnoozed.toString());

    const qs = params.toString();
    return portalApiClient.get<InboxResponse>(`/api/items/rfq/seller/inbox${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get RFQ detail (auto-marks as VIEWED)
   */
  async getRFQDetail(rfqId: string): Promise<SellerInboxRFQ | null> {
    try {
      // Backend returns { rfq, history }, extract just the rfq
      const data = await portalApiClient.get<{ rfq?: SellerInboxRFQ } & SellerInboxRFQ>(
        `/api/items/rfq/seller/inbox/${rfqId}`,
      );
      return data.rfq || data;
    } catch {
      return null;
    }
  },

  /**
   * Update RFQ status (mark as under_review or ignored)
   */
  async updateStatus(rfqId: string, data: StatusUpdateData): Promise<SellerInboxRFQ | null> {
    try {
      return await portalApiClient.patch<SellerInboxRFQ>(`/api/items/rfq/seller/inbox/${rfqId}/status`, data);
    } catch {
      return null;
    }
  },

  /**
   * Mark RFQ as under review
   */
  async markUnderReview(rfqId: string): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(rfqId, { status: 'under_review' });
  },

  /**
   * Mark RFQ as ignored with reason
   */
  async markIgnored(rfqId: string, reason: string): Promise<SellerInboxRFQ | null> {
    return this.updateStatus(rfqId, { status: 'ignored', ignoredReason: reason });
  },

  /**
   * Add internal note to RFQ
   */
  async addNote(rfqId: string, data: InternalNoteData): Promise<SellerInboxRFQ | null> {
    try {
      return await portalApiClient.post<SellerInboxRFQ>(`/api/items/rfq/seller/inbox/${rfqId}/notes`, data);
    } catch {
      return null;
    }
  },

  /**
   * Get RFQ event history
   */
  async getHistory(rfqId: string): Promise<RFQEvent[] | null> {
    try {
      return await portalApiClient.get<RFQEvent[]>(`/api/items/rfq/seller/inbox/${rfqId}/history`);
    } catch {
      return null;
    }
  },

  // =============================================================================
  // Gmail-Style Features: Labels
  // =============================================================================

  /**
   * Get all labels for the seller
   */
  async getLabels(): Promise<RFQLabel[]> {
    return portalApiClient.get<RFQLabel[]>(`/api/items/rfq/seller/labels`);
  },

  /**
   * Create a new label
   */
  async createLabel(data: CreateLabelData): Promise<RFQLabel> {
    return portalApiClient.post<RFQLabel>(`/api/items/rfq/seller/labels`, data);
  },

  /**
   * Update a label
   */
  async updateLabel(labelId: string, data: UpdateLabelData): Promise<RFQLabel> {
    return portalApiClient.patch<RFQLabel>(`/api/items/rfq/seller/labels/${labelId}`, data);
  },

  /**
   * Delete a label
   */
  async deleteLabel(labelId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/labels/${labelId}`);
  },

  /**
   * Add a label to an RFQ
   */
  async addLabelToRFQ(rfqId: string, labelId: string): Promise<void> {
    await portalApiClient.post(`/api/items/rfq/seller/inbox/${rfqId}/labels/${labelId}`);
  },

  /**
   * Remove a label from an RFQ
   */
  async removeLabelFromRFQ(rfqId: string, labelId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/inbox/${rfqId}/labels/${labelId}`);
  },

  /**
   * Bulk add/remove label from multiple RFQs
   */
  async bulkUpdateLabels(data: BulkLabelData): Promise<{ updated: number }> {
    return portalApiClient.post<{ updated: number }>(`/api/items/rfq/seller/inbox/bulk/labels`, data);
  },

  // =============================================================================
  // Gmail-Style Features: Threaded Notes
  // =============================================================================

  /**
   * Get all notes for an RFQ (threaded)
   */
  async getNotes(rfqId: string): Promise<RFQNote[]> {
    return portalApiClient.get<RFQNote[]>(`/api/items/rfq/seller/inbox/${rfqId}/notes`);
  },

  /**
   * Add a new note to an RFQ
   */
  async addThreadedNote(rfqId: string, data: CreateNoteData): Promise<RFQNote> {
    return portalApiClient.post<RFQNote>(`/api/items/rfq/seller/inbox/${rfqId}/notes`, data);
  },

  /**
   * Update a note
   */
  async updateNote(noteId: string, content: string): Promise<RFQNote> {
    return portalApiClient.patch<RFQNote>(`/api/items/rfq/seller/inbox/notes/${noteId}`, { content });
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/inbox/notes/${noteId}`);
  },

  // =============================================================================
  // Gmail-Style Features: Saved Replies
  // =============================================================================

  /**
   * Get all saved replies
   */
  async getSavedReplies(category?: string): Promise<SavedReply[]> {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return portalApiClient.get<SavedReply[]>(`/api/items/rfq/seller/saved-replies${qs}`);
  },

  /**
   * Create a saved reply
   */
  async createSavedReply(data: CreateSavedReplyData): Promise<SavedReply> {
    return portalApiClient.post<SavedReply>(`/api/items/rfq/seller/saved-replies`, data);
  },

  /**
   * Update a saved reply
   */
  async updateSavedReply(replyId: string, data: UpdateSavedReplyData): Promise<SavedReply> {
    return portalApiClient.patch<SavedReply>(`/api/items/rfq/seller/saved-replies/${replyId}`, data);
  },

  /**
   * Delete a saved reply
   */
  async deleteSavedReply(replyId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/saved-replies/${replyId}`);
  },

  /**
   * Expand a saved reply with RFQ data
   */
  async expandTemplate(replyId: string, rfqId: string): Promise<string> {
    const data = await portalApiClient.post<{ content: string }>(
      `/api/items/rfq/seller/saved-replies/${replyId}/expand`,
      { rfqId },
    );
    return data.content;
  },

  // =============================================================================
  // Gmail-Style Features: Snooze
  // =============================================================================

  /**
   * Snooze an RFQ
   */
  async snoozeRFQ(rfqId: string, data: SnoozeData): Promise<void> {
    await portalApiClient.post(`/api/items/rfq/seller/inbox/${rfqId}/snooze`, data);
  },

  /**
   * Unsnooze an RFQ
   */
  async unsnoozeRFQ(rfqId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/inbox/${rfqId}/snooze`);
  },

  /**
   * Bulk snooze multiple RFQs
   */
  async bulkSnooze(data: BulkSnoozeData): Promise<{ snoozed: number }> {
    return portalApiClient.post<{ snoozed: number }>(`/api/items/rfq/seller/inbox/bulk/snooze`, data);
  },

  // =============================================================================
  // Gmail-Style Features: Read/Unread
  // =============================================================================

  /**
   * Mark an RFQ as read
   */
  async markAsRead(rfqId: string): Promise<void> {
    await portalApiClient.post(`/api/items/rfq/seller/inbox/${rfqId}/read`);
  },

  /**
   * Mark an RFQ as unread
   */
  async markAsUnread(rfqId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/inbox/${rfqId}/read`);
  },

  /**
   * Bulk mark RFQs as read
   */
  async bulkMarkAsRead(data: BulkIdsData): Promise<{ updated: number }> {
    return portalApiClient.post<{ updated: number }>(`/api/items/rfq/seller/inbox/bulk/read`, data);
  },

  /**
   * Bulk mark RFQs as unread
   */
  async bulkMarkAsUnread(data: BulkIdsData): Promise<{ updated: number }> {
    return portalApiClient.post<{ updated: number }>(`/api/items/rfq/seller/inbox/bulk/unread`, data);
  },

  // =============================================================================
  // Gmail-Style Features: Archive
  // =============================================================================

  /**
   * Archive an RFQ
   */
  async archiveRFQ(rfqId: string): Promise<void> {
    await portalApiClient.post(`/api/items/rfq/seller/inbox/${rfqId}/archive`);
  },

  /**
   * Unarchive an RFQ
   */
  async unarchiveRFQ(rfqId: string): Promise<void> {
    await portalApiClient.delete(`/api/items/rfq/seller/inbox/${rfqId}/archive`);
  },

  /**
   * Bulk archive RFQs
   */
  async bulkArchive(data: BulkIdsData): Promise<{ updated: number }> {
    return portalApiClient.post<{ updated: number }>(`/api/items/rfq/seller/inbox/bulk/archive`, data);
  },

  /**
   * Bulk unarchive RFQs
   */
  async bulkUnarchive(data: BulkIdsData): Promise<{ updated: number }> {
    return portalApiClient.post<{ updated: number }>(`/api/items/rfq/seller/inbox/bulk/unarchive`, data);
  },
};

export default sellerRfqInboxService;
