import type {
  Supplier,
  SupplierFilters,
  SupplierSortConfig,
  SuppliersResponse,
  SupplierSummary,
  SupplierEvaluationHistory,
  calculateReliabilityScore,
  determineRiskLevel,
} from '../types/supplier.types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Supplier Service
 * Handles all supplier-related API operations for buyers
 */
export const supplierService = {
  /**
   * Get paginated list of suppliers with filters
   */
  async getSuppliers(
    token: string,
    filters?: SupplierFilters,
    sort?: SupplierSortConfig,
    page = 1,
    pageSize = 20
  ): Promise<SuppliersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status?.length) params.append('status', filters.status.join(','))
    if (filters?.tier?.length) params.append('tier', filters.tier.join(','))
    if (filters?.riskLevel?.length) params.append('riskLevel', filters.riskLevel.join(','))
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','))
    if (filters?.minReliabilityScore !== undefined) {
      params.append('minReliabilityScore', filters.minReliabilityScore.toString())
    }
    if (filters?.maxDependency !== undefined) {
      params.append('maxDependency', filters.maxDependency.toString())
    }

    if (sort) {
      params.append('sortField', sort.field)
      params.append('sortDirection', sort.direction)
    }

    const response = await fetch(`${API_BASE}/api/buyer/suppliers?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Get a single supplier by ID with full details
   */
  async getSupplier(token: string, supplierId: string): Promise<Supplier | null> {
    const response = await fetch(`${API_BASE}/api/buyer/suppliers/${supplierId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Failed to fetch supplier: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Get supplier summary statistics
   */
  async getSupplierSummary(token: string): Promise<SupplierSummary> {
    const response = await fetch(`${API_BASE}/api/buyer/suppliers/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch supplier summary: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Get evaluation history for a supplier
   */
  async getEvaluationHistory(
    token: string,
    supplierId: string
  ): Promise<SupplierEvaluationHistory[]> {
    const response = await fetch(
      `${API_BASE}/api/buyer/suppliers/${supplierId}/evaluations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch evaluation history: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * Export suppliers to CSV
   */
  async exportSuppliers(token: string, filters?: SupplierFilters): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters?.status?.length) params.append('status', filters.status.join(','))
    if (filters?.tier?.length) params.append('tier', filters.tier.join(','))
    if (filters?.riskLevel?.length) params.append('riskLevel', filters.riskLevel.join(','))

    const response = await fetch(`${API_BASE}/api/buyer/suppliers/export?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to export suppliers: ${response.statusText}`)
    }

    return response.blob()
  },
}

// ============================================================================
// Mock Data Generator (for development/demo)
// ============================================================================

const MOCK_CATEGORIES = [
  'Raw Materials',
  'Packaging',
  'Electronics',
  'Machinery',
  'Chemicals',
  'Textiles',
  'Components',
  'Services',
]

const MOCK_COUNTRIES = [
  'United States',
  'Germany',
  'China',
  'Japan',
  'United Kingdom',
  'India',
  'South Korea',
  'Italy',
]

function generateMockMetrics() {
  const totalOrders = Math.floor(Math.random() * 200) + 20
  const onTimeRate = 0.6 + Math.random() * 0.35
  const onTimeDeliveries = Math.floor(totalOrders * onTimeRate)
  const lateDeliveries = Math.floor((totalOrders - onTimeDeliveries) * 0.7)
  const earlyDeliveries = totalOrders - onTimeDeliveries - lateDeliveries

  const totalUnitsReceived = totalOrders * (Math.floor(Math.random() * 50) + 10)
  const defectRate = Math.random() * 0.05
  const defectiveUnits = Math.floor(totalUnitsReceived * defectRate)

  const avgResponseTime = Math.random() * 48 + 2
  const rfqResponseRate = 0.7 + Math.random() * 0.3
  const issueResolutionTime = Math.random() * 72 + 12

  const totalSpend = Math.floor(Math.random() * 500000) + 50000
  const dependencyPercentage = Math.random() * 80 + 5

  return {
    totalOrders,
    onTimeDeliveries,
    lateDeliveries,
    earlyDeliveries,
    averageDeliveryDeviation: Math.round((Math.random() * 6 - 2) * 10) / 10,
    totalUnitsReceived,
    defectiveUnits,
    returnedOrders: Math.floor(totalOrders * Math.random() * 0.05),
    qualityScore: Math.round((1 - defectRate) * 100),
    averageResponseTimeHours: Math.round(avgResponseTime * 10) / 10,
    rfqResponseRate: Math.round(rfqResponseRate * 100) / 100,
    issueResolutionTimeHours: Math.round(issueResolutionTime),
    communicationScore: Math.round(
      (rfqResponseRate * 30) +
      (avgResponseTime <= 12 ? 40 : avgResponseTime <= 24 ? 30 : 20) +
      (issueResolutionTime <= 24 ? 20 : issueResolutionTime <= 48 ? 15 : 10)
    ),
    totalSpend,
    totalSpendYTD: Math.floor(totalSpend * (Math.random() * 0.3 + 0.1)),
    averageOrderValue: Math.floor(totalSpend / totalOrders),
    dependencyPercentage: Math.round(dependencyPercentage * 10) / 10,
    completeOrderRate: 0.85 + Math.random() * 0.15,
    partialShipmentRate: Math.random() * 0.15,
  }
}

function generateMockSupplier(index: number): Supplier {
  const metrics = generateMockMetrics()

  const deliveryScore =
    (metrics.onTimeDeliveries / metrics.totalOrders) * 85 +
    (metrics.earlyDeliveries / metrics.totalOrders) * 10

  const reliabilityScore = Math.round(
    deliveryScore * 0.4 +
    metrics.qualityScore * 0.3 +
    metrics.communicationScore * 0.2 +
    metrics.completeOrderRate * 100 * 0.1
  )

  const tiers: Array<'strategic' | 'preferred' | 'approved' | 'conditional'> = [
    'strategic',
    'preferred',
    'approved',
    'conditional',
  ]
  const statuses: Array<'active' | 'inactive' | 'on_hold'> = ['active', 'active', 'active', 'inactive', 'on_hold']

  const tier = reliabilityScore >= 85 ? 'strategic' :
               reliabilityScore >= 70 ? 'preferred' :
               reliabilityScore >= 55 ? 'approved' : 'conditional'

  const riskLevel =
    metrics.dependencyPercentage > 60 && reliabilityScore < 50 ? 'critical' :
    metrics.dependencyPercentage > 60 || reliabilityScore < 40 ? 'high' :
    metrics.dependencyPercentage > 30 || reliabilityScore < 60 ? 'medium' : 'low'

  const companyNames = [
    'Apex Manufacturing Co.',
    'Global Components Ltd.',
    'Sterling Materials Inc.',
    'Pacific Supply Chain',
    'Meridian Industries',
    'Nordic Precision Parts',
    'Atlas Raw Materials',
    'Quantum Electronics',
    'Summit Packaging Solutions',
    'Titan Industrial Supply',
    'Vertex Chemical Corp.',
    'Prime Logistics Partners',
    'Echo Textiles International',
    'Horizon Machinery Group',
    'Delta Components LLC',
  ]

  const partnerYears = Math.floor(Math.random() * 8) + 1
  const partnerDate = new Date()
  partnerDate.setFullYear(partnerDate.getFullYear() - partnerYears)

  const lastOrderDate = new Date()
  lastOrderDate.setDate(lastOrderDate.getDate() - Math.floor(Math.random() * 60))

  return {
    id: `supplier-${index + 1}`,
    name: companyNames[index % companyNames.length],
    code: `SUP-${String(index + 1).padStart(4, '0')}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    tier,
    contactName: ['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 'Ahmed Hassan'][index % 5],
    contactEmail: `contact@supplier${index + 1}.com`,
    contactPhone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    country: MOCK_COUNTRIES[index % MOCK_COUNTRIES.length],
    city: ['New York', 'Berlin', 'Shanghai', 'Tokyo', 'London', 'Mumbai', 'Seoul', 'Milan'][index % 8],
    categories: [MOCK_CATEGORIES[index % MOCK_CATEGORIES.length]].concat(
      Math.random() > 0.5 ? [MOCK_CATEGORIES[(index + 3) % MOCK_CATEGORIES.length]] : []
    ),
    paymentTerms: ['Net 30', 'Net 45', 'Net 60', '2/10 Net 30'][Math.floor(Math.random() * 4)],
    leadTimeDays: Math.floor(Math.random() * 21) + 7,
    minimumOrderValue: Math.floor(Math.random() * 5000) + 500,
    partnerSince: partnerDate.toISOString().split('T')[0],
    lastOrderDate: lastOrderDate.toISOString().split('T')[0],
    lastEvaluationDate: new Date().toISOString().split('T')[0],
    metrics,
    reliabilityScore,
    riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical',
  }
}

/**
 * Generate mock suppliers for development
 */
export function generateMockSuppliers(count = 15): Supplier[] {
  return Array.from({ length: count }, (_, i) => generateMockSupplier(i))
}

/**
 * Generate mock summary for development
 */
export function generateMockSummary(suppliers: Supplier[]): SupplierSummary {
  const activeSuppliers = suppliers.filter(s => s.status === 'active')
  const avgScore = suppliers.reduce((sum, s) => sum + s.reliabilityScore, 0) / suppliers.length

  const categoryCount: Record<string, number> = {}
  suppliers.forEach(s => {
    s.categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
  })

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: activeSuppliers.length,
    averageReliabilityScore: Math.round(avgScore),
    highRiskCount: suppliers.filter(s => s.riskLevel === 'high').length,
    criticalRiskCount: suppliers.filter(s => s.riskLevel === 'critical').length,
    topCategories,
  }
}
