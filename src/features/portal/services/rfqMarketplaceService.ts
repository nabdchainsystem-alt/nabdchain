// =============================================================================
// RFQ Marketplace Service - Seller Discovery of Open Buyer Requests
// =============================================================================

import {
  MarketplaceRFQ,
  MarketplaceFilters,
  MarketplaceResponse,
  MarketplaceQuoteSubmission,
  SubmittedMarketplaceQuote,
  SaveRFQResponse,
  MarketplaceStats,
  getDeadlineUrgency,
} from '../types/rfq-marketplace.types';

const API_BASE = '/api/v1';

// =============================================================================
// Mock Data Generator
// =============================================================================

const MOCK_COMPANY_NAMES = [
  'Al Rajhi Industries',
  'Saudi Mining Corp',
  'Gulf Manufacturing',
  'Aramco Contractors',
  'SABIC Partners',
  'National Steel Works',
  'Emirates Heavy Equipment',
  'Kuwait Petroleum Services',
  'Qatar Construction Group',
  'Bahrain Industrial',
];

const MOCK_PART_NAMES = [
  'Hydraulic Pump Assembly',
  'Industrial Bearing Set',
  'Electric Motor 50kW',
  'Pneumatic Cylinder Kit',
  'Heat Exchanger Unit',
  'Conveyor Belt System',
  'Pressure Gauge Digital',
  'Safety Relief Valve',
  'Stainless Steel Pipe',
  'Welding Electrode Pack',
  'Circuit Breaker Panel',
  'Forklift Spare Parts',
  'Compressor Oil Filter',
  'Generator Alternator',
  'Crane Wire Rope',
];

const MOCK_CATEGORIES = [
  'machinery',
  'spare_parts',
  'electronics',
  'hydraulics',
  'safety_equipment',
  'consumables',
  'tools',
  'materials',
];

const MOCK_COUNTRIES = ['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'];
const MOCK_CITIES = ['Riyadh', 'Jeddah', 'Dubai', 'Abu Dhabi', 'Kuwait City', 'Doha', 'Manama', 'Muscat'];

function generateMockRFQ(index: number): MarketplaceRFQ {
  const now = new Date();
  const createdDaysAgo = Math.floor(Math.random() * 7);
  const deadlineDaysFromNow = Math.floor(Math.random() * 14) - 2; // -2 to 12 days

  const createdAt = new Date(now);
  createdAt.setDate(createdAt.getDate() - createdDaysAgo);

  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + deadlineDaysFromNow);

  const deadlineInfo = getDeadlineUrgency(deadline.toISOString());

  const quantity = Math.floor(Math.random() * 500) + 10;
  const hasTargetPrice = Math.random() > 0.6;

  const badgeTypes: Array<'verified' | 'enterprise' | 'new' | 'standard'> = ['verified', 'enterprise', 'new', 'standard'];
  const badge = badgeTypes[Math.floor(Math.random() * badgeTypes.length)];

  const status = deadlineDaysFromNow < 0 ? 'closed' :
                 deadlineDaysFromNow <= 2 ? 'closing_soon' : 'open';

  return {
    id: `rfq-mkt-${index + 1}`,
    rfqNumber: `RFQ-MKT-${String(2024).slice(2)}${String(index + 1).padStart(4, '0')}`,
    partName: MOCK_PART_NAMES[index % MOCK_PART_NAMES.length],
    description: `High-quality ${MOCK_PART_NAMES[index % MOCK_PART_NAMES.length].toLowerCase()} required for industrial operations. Must meet ISO standards and include certification.`,
    category: MOCK_CATEGORIES[index % MOCK_CATEGORIES.length],
    quantity,
    unit: 'units',
    targetPrice: hasTargetPrice ? Math.floor(Math.random() * 5000) + 100 : undefined,
    targetCurrency: 'SAR',
    deliveryLocation: `${MOCK_CITIES[index % MOCK_CITIES.length]}, Industrial Zone`,
    deliveryCity: MOCK_CITIES[index % MOCK_CITIES.length],
    deliveryCountry: MOCK_COUNTRIES[index % MOCK_COUNTRIES.length],
    requiredDeliveryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    leadTimeRequired: Math.floor(Math.random() * 30) + 7,
    buyer: {
      id: `buyer-${index + 1}`,
      companyName: MOCK_COMPANY_NAMES[index % MOCK_COMPANY_NAMES.length],
      country: MOCK_COUNTRIES[index % MOCK_COUNTRIES.length],
      city: MOCK_CITIES[index % MOCK_CITIES.length],
      badge,
      isVerified: badge === 'verified' || badge === 'enterprise',
      reliabilityScore: Math.floor(Math.random() * 30) + 70,
      totalRFQs: Math.floor(Math.random() * 50) + 5,
      totalOrders: Math.floor(Math.random() * 30) + 3,
      memberSince: new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString(),
    },
    status: status as 'open' | 'closing_soon' | 'closed',
    deadline: deadline.toISOString(),
    deadlineUrgency: deadlineInfo.urgency,
    daysRemaining: deadlineInfo.daysRemaining,
    hoursRemaining: deadlineInfo.hoursRemaining,
    totalQuotes: Math.floor(Math.random() * 8),
    attachments: Math.random() > 0.5 ? [
      {
        id: `att-${index}-1`,
        name: 'Technical_Specifications.pdf',
        type: 'specification',
        url: '#',
        size: 1024 * 500,
      },
    ] : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    isSaved: Math.random() > 0.8,
    hasQuoted: Math.random() > 0.9,
  };
}

// Generate mock data
const MOCK_RFQS: MarketplaceRFQ[] = Array.from({ length: 25 }, (_, i) => generateMockRFQ(i));

// =============================================================================
// Service Methods
// =============================================================================

export const rfqMarketplaceService = {
  /**
   * Get marketplace RFQs with filters
   */
  async getMarketplaceRFQs(
    token: string,
    filters: MarketplaceFilters = {}
  ): Promise<MarketplaceResponse> {
    try {
      // Try real API first
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE}/rfq-marketplace?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Return empty result on API error (production mode)
      console.error('RFQ Marketplace API error:', response.status);
      return { rfqs: [], total: 0, stats: { total: 0, new: 0, closing: 0, saved: 0 } };
    } catch (error) {
      console.error('RFQ Marketplace fetch error:', error);
      return { rfqs: [], total: 0, stats: { total: 0, new: 0, closing: 0, saved: 0 } };
    }
  },

  /**
   * Get single RFQ details
   */
  async getRFQDetails(token: string, rfqId: string): Promise<MarketplaceRFQ | null> {
    try {
      const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Fall back to mock
      return MOCK_RFQS.find(r => r.id === rfqId) || null;
    } catch (error) {
      console.warn('Using mock RFQ details:', error);
      return MOCK_RFQS.find(r => r.id === rfqId) || null;
    }
  },

  /**
   * Save an RFQ for later
   */
  async saveRFQ(token: string, rfqId: string): Promise<SaveRFQResponse> {
    try {
      const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Mock response
      const rfq = MOCK_RFQS.find(r => r.id === rfqId);
      if (rfq) {
        rfq.isSaved = true;
      }
      return { rfqId, isSaved: true };
    } catch (error) {
      console.warn('Using mock save response:', error);
      return { rfqId, isSaved: true };
    }
  },

  /**
   * Unsave an RFQ
   */
  async unsaveRFQ(token: string, rfqId: string): Promise<SaveRFQResponse> {
    try {
      const response = await fetch(`${API_BASE}/rfq-marketplace/${rfqId}/save`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Mock response
      const rfq = MOCK_RFQS.find(r => r.id === rfqId);
      if (rfq) {
        rfq.isSaved = false;
      }
      return { rfqId, isSaved: false };
    } catch (error) {
      console.warn('Using mock unsave response:', error);
      return { rfqId, isSaved: false };
    }
  },

  /**
   * Submit a quote for an RFQ
   */
  async submitQuote(
    token: string,
    data: MarketplaceQuoteSubmission
  ): Promise<SubmittedMarketplaceQuote> {
    try {
      const response = await fetch(`${API_BASE}/rfq-marketplace/${data.rfqId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return response.json();
      }

      // Throw error on API failure (production mode)
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit quote');
    } catch (error) {
      console.error('Quote submission error:', error);
      throw error;
    }
  },

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(token: string): Promise<MarketplaceStats> {
    try {
      const response = await fetch(`${API_BASE}/rfq-marketplace/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Mock stats
      return {
        totalOpen: MOCK_RFQS.filter(r => r.status === 'open' || r.status === 'closing_soon').length,
        newToday: 3,
        expiringToday: 2,
        savedCount: MOCK_RFQS.filter(r => r.isSaved).length,
        quotedCount: MOCK_RFQS.filter(r => r.hasQuoted).length,
      };
    } catch (error) {
      console.warn('Using mock stats:', error);
      return {
        totalOpen: MOCK_RFQS.filter(r => r.status === 'open' || r.status === 'closing_soon').length,
        newToday: 3,
        expiringToday: 2,
        savedCount: MOCK_RFQS.filter(r => r.isSaved).length,
        quotedCount: MOCK_RFQS.filter(r => r.hasQuoted).length,
      };
    }
  },

  /**
   * Get seller's submitted quotes for marketplace RFQs
   */
  async getMySubmittedQuotes(
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ quotes: SubmittedMarketplaceQuote[]; total: number }> {
    try {
      const response = await fetch(
        `${API_BASE}/rfq-marketplace/my-quotes?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        return response.json();
      }

      // Mock response
      return { quotes: [], total: 0 };
    } catch (error) {
      console.warn('Using mock quotes list:', error);
      return { quotes: [], total: 0 };
    }
  },

  /**
   * Get saved RFQs
   */
  async getSavedRFQs(
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<MarketplaceResponse> {
    return this.getMarketplaceRFQs(token, { savedOnly: true, page, limit });
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getMockMarketplaceData(filters: MarketplaceFilters): MarketplaceResponse {
  let filtered = [...MOCK_RFQS];

  // Apply filters
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      r =>
        r.partName.toLowerCase().includes(search) ||
        r.buyer.companyName.toLowerCase().includes(search) ||
        r.rfqNumber.toLowerCase().includes(search) ||
        r.category.toLowerCase().includes(search)
    );
  }

  if (filters.category) {
    filtered = filtered.filter(r => r.category === filters.category);
  }

  if (filters.quantityMin !== undefined) {
    filtered = filtered.filter(r => r.quantity >= (filters.quantityMin || 0));
  }

  if (filters.quantityMax !== undefined) {
    filtered = filtered.filter(r => r.quantity <= (filters.quantityMax || Infinity));
  }

  if (filters.deliveryCountry) {
    filtered = filtered.filter(r => r.deliveryCountry === filters.deliveryCountry);
  }

  if (filters.buyerBadge) {
    filtered = filtered.filter(r => r.buyer.badge === filters.buyerBadge);
  }

  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  } else {
    // By default, exclude closed RFQs
    filtered = filtered.filter(r => r.status !== 'closed');
  }

  if (filters.deadline === 'urgent') {
    filtered = filtered.filter(r => r.deadlineUrgency === 'urgent' || r.deadlineUrgency === 'critical');
  } else if (filters.deadline === 'expiring_today') {
    filtered = filtered.filter(r => r.deadlineUrgency === 'critical');
  }

  if (filters.savedOnly) {
    filtered = filtered.filter(r => r.isSaved);
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'expiring_soon':
      filtered.sort((a, b) => a.daysRemaining - b.daysRemaining);
      break;
    case 'highest_quantity':
      filtered.sort((a, b) => b.quantity - a.quantity);
      break;
    case 'best_match':
      // Would be AI-based in production
      filtered.sort((a, b) => (b.buyer.reliabilityScore || 0) - (a.buyer.reliabilityScore || 0));
      break;
    case 'newest':
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  const paginatedRFQs = filtered.slice(start, start + limit);

  return {
    rfqs: paginatedRFQs,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
    stats: {
      totalOpen: MOCK_RFQS.filter(r => r.status === 'open' || r.status === 'closing_soon').length,
      newToday: 3,
      expiringToday: 2,
      savedCount: MOCK_RFQS.filter(r => r.isSaved).length,
      quotedCount: MOCK_RFQS.filter(r => r.hasQuoted).length,
    },
  };
}

function generateMockQuoteResponse(data: MarketplaceQuoteSubmission): SubmittedMarketplaceQuote {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + data.validityDays);

  return {
    id: `quote-mkt-${Date.now()}`,
    quoteNumber: `QT-MKT-${String(now.getFullYear()).slice(2)}${String(Date.now()).slice(-4)}`,
    rfqId: data.rfqId,
    unitPrice: data.unitPrice,
    quantity: data.quantity,
    totalPrice: data.unitPrice * data.quantity,
    currency: data.currency,
    leadTimeDays: data.leadTimeDays,
    validUntil: validUntil.toISOString(),
    notes: data.notes,
    status: 'sent',
    submittedAt: now.toISOString(),
  };
}

export default rfqMarketplaceService;
