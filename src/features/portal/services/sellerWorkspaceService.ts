// =============================================================================
// Seller Workspace Service - Frontend API Client
// =============================================================================

import { portalApiClient } from './portalApiClient';
import type {
  InventoryItem,
  StockAdjustment,
  ItemCostTag,
  CostSummary,
  SellerBuyerProfile,
} from '../types/workspace.types';

// =============================================================================
// Inventory / Stock
// =============================================================================

async function getInventory(): Promise<InventoryItem[]> {
  return portalApiClient.get<InventoryItem[]>(`/api/seller/workspace/inventory`);
}

async function getStockAdjustments(filters?: { itemId?: string; reason?: string }): Promise<StockAdjustment[]> {
  const params = new URLSearchParams();
  if (filters?.itemId) params.append('itemId', filters.itemId);
  if (filters?.reason) params.append('reason', filters.reason);
  const qs = params.toString();

  return portalApiClient.get<StockAdjustment[]>(`/api/seller/workspace/stock-adjustments${qs ? `?${qs}` : ''}`);
}

// =============================================================================
// Cost Tags
// =============================================================================

async function getCostTags(filters?: { costType?: string }): Promise<ItemCostTag[]> {
  const params = new URLSearchParams();
  if (filters?.costType) params.append('costType', filters.costType);
  const qs = params.toString();

  return portalApiClient.get<ItemCostTag[]>(`/api/seller/workspace/cost-tags${qs ? `?${qs}` : ''}`);
}

async function getCostSummary(): Promise<CostSummary> {
  return portalApiClient.get<CostSummary>(`/api/seller/workspace/cost-summary`);
}

// =============================================================================
// Buyer Profiles
// =============================================================================

async function getBuyerProfiles(filters?: { search?: string; rating?: number }): Promise<SellerBuyerProfile[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.rating) params.append('rating', String(filters.rating));
  const qs = params.toString();

  return portalApiClient.get<SellerBuyerProfile[]>(`/api/seller/workspace/buyer-profiles${qs ? `?${qs}` : ''}`);
}

export const sellerWorkspaceService = {
  getInventory,
  getStockAdjustments,
  getCostTags,
  getCostSummary,
  getBuyerProfiles,
};
