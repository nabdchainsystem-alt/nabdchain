import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { Item } from '../../types/item.types';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Plus,
  MagnifyingGlass,
  Cube,
  PencilSimple,
  Trash,
  CaretDown,
  CaretUp,
  Eye,
  EyeSlash,
  ShoppingCart,
  Archive,
  Lightning,
  X,
  Funnel,
  SortAscending,
  FileText,
  CaretRight,
  CheckSquare,
  Warning,
  Copy,
  Pause,
  Play,
  ClockCounterClockwise,
  Fire,
  TrendUp,
  Bed,
  WarningCircle,
  ChartLine,
  Clock,
  Percent,
  Info,
  DotsThreeVertical,
} from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState, Select } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { AddProductPanel, ProductFormData } from '../components/AddProductPanel';

const PRODUCTS_STORAGE_KEY = 'portal-seller-products-v2';

type Visibility = 'public' | 'hidden' | 'rfq_only';
type Status = 'active' | 'draft' | 'out_of_stock';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortOption = 'updated' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name';

interface Product {
  id: string;
  name: string;
  sku: string;
  partNumber: string;
  description: string;
  price: string;
  currency: string;
  stock: number;
  minOrderQty: number;
  category: string;
  manufacturer: string;
  brand: string;
  weight: string;
  weightUnit: string;
  dimensions: string;
  material: string;
  status: Status;
  visibility: Visibility;
  image: string | null;
  views: number;
  orders: number;
  rfqs: number;
  updatedAt: string;
  // Enhanced Intelligence Fields
  rfqsLast30Days?: number;
  avgResponseTimeHours?: number;
  conversionRate?: number;
  isPaused?: boolean;
}

// Performance Signal Types
type PerformanceSignal = 'dormant' | 'active' | 'hot';

// Calculate performance signal based on activity
const getPerformanceSignal = (product: Product): PerformanceSignal => {
  const rfqs30d = product.rfqsLast30Days ?? product.rfqs;
  const orders = product.orders;
  const views = product.views;

  // Hot: High RFQ activity (>5 RFQs in 30 days) or recent orders
  if (rfqs30d > 5 || (orders > 0 && rfqs30d > 2)) return 'hot';

  // Active: Some activity (any RFQs in 30 days or good views with RFQs)
  if (rfqs30d > 0 || (views > 100 && product.rfqs > 0)) return 'active';

  // Dormant: No activity
  return 'dormant';
};

// Demand gap detection - products that need attention
interface DemandGap {
  type: 'rfq_no_order' | 'high_views_low_rfq' | 'low_stock_active' | 'slow_response';
  severity: 'warning' | 'critical';
  message: string;
}

const detectDemandGaps = (product: Product): DemandGap[] => {
  const gaps: DemandGap[] = [];

  // RFQs received but zero orders (conversion issue)
  if (product.rfqs > 3 && product.orders === 0) {
    gaps.push({
      type: 'rfq_no_order',
      severity: 'warning',
      message: `${product.rfqs} RFQs but no orders - review pricing or response`
    });
  }

  // High views but low RFQ ratio (listing quality issue)
  if (product.views > 100 && product.rfqs < 2) {
    gaps.push({
      type: 'high_views_low_rfq',
      severity: 'warning',
      message: `${product.views} views but only ${product.rfqs} RFQs - improve listing details`
    });
  }

  // Low stock with active RFQs
  const rfqs30d = product.rfqsLast30Days ?? product.rfqs;
  if (product.stock <= STOCK_LEVELS.LOW && product.stock > 0 && rfqs30d > 0) {
    gaps.push({
      type: 'low_stock_active',
      severity: 'critical',
      message: `Only ${product.stock} units left with active interest`
    });
  }

  // Slow response time
  const avgResponse = product.avgResponseTimeHours ?? 24;
  if (avgResponse > 12 && rfqs30d > 2) {
    gaps.push({
      type: 'slow_response',
      severity: 'warning',
      message: `Avg response time ${avgResponse}h - faster responses win more orders`
    });
  }

  return gaps;
};

// Check if row should be highlighted for urgency
const getRowUrgency = (product: Product): 'high' | 'medium' | null => {
  const gaps = detectDemandGaps(product);
  const hasCritical = gaps.some(g => g.severity === 'critical');
  const hasMultipleWarnings = gaps.filter(g => g.severity === 'warning').length >= 2;

  if (hasCritical) return 'high';
  if (hasMultipleWarnings) return 'medium';
  return null;
};

interface ListingsProps {
  onNavigate: (page: string) => void;
}

const STOCK_LEVELS = { LOW: 10, MEDIUM: 50 };

const getStockLevel = (stock: number): 'good' | 'medium' | 'low' | 'out' => {
  if (stock === 0) return 'out';
  if (stock <= STOCK_LEVELS.LOW) return 'low';
  if (stock <= STOCK_LEVELS.MEDIUM) return 'medium';
  return 'good';
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Categories for filter
const CATEGORIES = [
  { key: 'category.machinery', label: 'Machinery' },
  { key: 'category.spareParts', label: 'Spare Parts' },
  { key: 'category.electronics', label: 'Electronics' },
  { key: 'category.hydraulics', label: 'Hydraulics' },
  { key: 'category.bearings', label: 'Bearings' },
  { key: 'category.motors', label: 'Motors' },
  { key: 'category.pumps', label: 'Pumps' },
  { key: 'category.valves', label: 'Valves' },
];

const columnHelper = createColumnHelper<Product>();

export const Listings: React.FC<ListingsProps> = ({ onNavigate }) => {
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('updated');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Convert Item API type to local Product type
  const itemToProduct = (item: Item): Product => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    partNumber: item.partNumber || '-',
    description: item.description || '',
    price: item.price.toString(),
    currency: item.currency,
    stock: item.stock,
    minOrderQty: item.minOrderQty,
    category: `category.${item.category}`,
    manufacturer: item.manufacturer || '-',
    brand: item.brand || '-',
    weight: item.specifications?.weight?.toString() || '-',
    weightUnit: 'kg',
    dimensions: item.specifications?.dimensions || '-',
    material: item.specifications?.material || '-',
    status: item.status as Status,
    visibility: item.visibility as Visibility,
    image: item.images?.[0] || null,
    views: 0,
    orders: item.successfulOrders || 0,
    rfqs: item.totalQuotes || 0,
    updatedAt: item.updatedAt,
  });

  // Convert local Product type to Item API data
  const productToItemData = (product: Partial<Product>): Partial<Item> => ({
    name: product.name,
    sku: product.sku,
    partNumber: product.partNumber === '-' ? undefined : product.partNumber,
    description: product.description,
    price: product.price ? parseFloat(product.price) : undefined,
    currency: product.currency,
    stock: product.stock,
    minOrderQty: product.minOrderQty,
    category: product.category?.replace('category.', ''),
    manufacturer: product.manufacturer === '-' ? undefined : product.manufacturer,
    brand: product.brand === '-' ? undefined : product.brand,
    status: product.status as 'active' | 'draft' | 'out_of_stock' | 'archived' | undefined,
    visibility: product.visibility as 'public' | 'rfq_only' | 'hidden' | undefined,
    images: product.image ? [product.image] : undefined,
    specifications: {
      weight: product.weight,
      dimensions: product.dimensions,
      material: product.material,
    },
  });

  // Mock data for demo
  const MOCK_PRODUCTS: Product[] = [
    {
      id: 'prod-001',
      name: 'Industrial Hydraulic Pump HX-500',
      sku: 'HYD-PMP-500',
      partNumber: 'HP-2024-001',
      description: 'High-pressure hydraulic pump for industrial applications',
      price: '2450.00',
      currency: 'SAR',
      stock: 45,
      minOrderQty: 1,
      category: 'category.pumps',
      manufacturer: 'HydroTech Industries',
      brand: 'HydroMax',
      weight: '25',
      weightUnit: 'kg',
      dimensions: '40x30x25 cm',
      material: 'Cast Iron / Steel',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=200&fit=crop',
      views: 324,
      orders: 18,
      rfqs: 7,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      rfqsLast30Days: 6,
      avgResponseTimeHours: 3.2,
      conversionRate: 42.8,
    },
    {
      id: 'prod-002',
      name: 'Ball Bearing 6205-2RS',
      sku: 'BRG-6205-2RS',
      partNumber: 'BB-6205',
      description: 'Deep groove ball bearing, sealed, for high-speed applications',
      price: '45.00',
      currency: 'SAR',
      stock: 500,
      minOrderQty: 10,
      category: 'category.bearings',
      manufacturer: 'SKF',
      brand: 'SKF',
      weight: '0.15',
      weightUnit: 'kg',
      dimensions: '52x25x15 mm',
      material: 'Chrome Steel',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      views: 892,
      orders: 156,
      rfqs: 23,
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      rfqsLast30Days: 12,
      avgResponseTimeHours: 2.1,
      conversionRate: 67.8,
    },
    {
      id: 'prod-003',
      name: 'Three-Phase Electric Motor 5HP',
      sku: 'MTR-3PH-5HP',
      partNumber: 'EM-5000-3P',
      description: '5 HP three-phase induction motor, IE3 efficiency class',
      price: '1850.00',
      currency: 'SAR',
      stock: 12,
      minOrderQty: 1,
      category: 'category.motors',
      manufacturer: 'Siemens',
      brand: 'SIMOTICS',
      weight: '35',
      weightUnit: 'kg',
      dimensions: '45x28x28 cm',
      material: 'Aluminum / Copper',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=200&fit=crop',
      views: 456,
      orders: 8,
      rfqs: 12,
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      rfqsLast30Days: 4,
      avgResponseTimeHours: 4.5,
      conversionRate: 33.3,
    },
    {
      id: 'prod-004',
      name: 'Pneumatic Control Valve DN50',
      sku: 'VLV-PNU-DN50',
      partNumber: 'PCV-50-SS',
      description: 'Stainless steel pneumatic control valve for process control',
      price: '3200.00',
      currency: 'SAR',
      stock: 8,
      minOrderQty: 1,
      category: 'category.valves',
      manufacturer: 'Emerson',
      brand: 'Fisher',
      weight: '12',
      weightUnit: 'kg',
      dimensions: '30x20x15 cm',
      material: 'Stainless Steel 316',
      status: 'active',
      visibility: 'rfq_only',
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop',
      views: 234,
      orders: 0, // RFQs but no orders - demand gap!
      rfqs: 15,
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      rfqsLast30Days: 8,
      avgResponseTimeHours: 14.5, // Slow response - another demand gap
      conversionRate: 0,
    },
    {
      id: 'prod-005',
      name: 'Industrial PLC Controller S7-1200',
      sku: 'PLC-S7-1200',
      partNumber: '6ES7214-1AG40',
      description: 'Compact PLC for automation and control systems',
      price: '4500.00',
      currency: 'SAR',
      stock: 0,
      minOrderQty: 1,
      category: 'category.electronics',
      manufacturer: 'Siemens',
      brand: 'SIMATIC',
      weight: '0.5',
      weightUnit: 'kg',
      dimensions: '15x10x8 cm',
      material: 'Plastic / Electronic',
      status: 'out_of_stock',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
      views: 567,
      orders: 24,
      rfqs: 31,
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'prod-006',
      name: 'Gear Reducer RV-063',
      sku: 'GBX-RV063',
      partNumber: 'RV-063-50',
      description: 'Worm gear reducer, ratio 50:1, for conveyor systems',
      price: '890.00',
      currency: 'SAR',
      stock: 25,
      minOrderQty: 1,
      category: 'category.machinery',
      manufacturer: 'Bonfiglioli',
      brand: 'Bonfiglioli',
      weight: '8',
      weightUnit: 'kg',
      dimensions: '20x18x15 cm',
      material: 'Aluminum / Steel',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=200&h=200&fit=crop',
      views: 189,
      orders: 11,
      rfqs: 5,
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'prod-007',
      name: 'Hydraulic Cylinder 100mm Bore',
      sku: 'HYD-CYL-100',
      partNumber: 'HC-100-500',
      description: 'Double acting hydraulic cylinder, 500mm stroke',
      price: '1650.00',
      currency: 'SAR',
      stock: 6, // Low stock with active RFQs - demand gap!
      minOrderQty: 1,
      category: 'category.hydraulics',
      manufacturer: 'Parker',
      brand: 'Parker Hannifin',
      weight: '18',
      weightUnit: 'kg',
      dimensions: '60x15x15 cm',
      material: 'Steel / Chrome',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&h=200&fit=crop',
      views: 278,
      orders: 5,
      rfqs: 9,
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      rfqsLast30Days: 5,
      avgResponseTimeHours: 2.8,
      conversionRate: 55.5,
    },
    {
      id: 'prod-008',
      name: 'Spare Parts Kit - Pump Seals',
      sku: 'SPK-SEAL-001',
      partNumber: 'SK-PS-2024',
      description: 'Complete seal kit for HX series hydraulic pumps',
      price: '320.00',
      currency: 'SAR',
      stock: 85,
      minOrderQty: 5,
      category: 'category.spareParts',
      manufacturer: 'HydroTech Industries',
      brand: 'HydroMax',
      weight: '0.3',
      weightUnit: 'kg',
      dimensions: '15x10x5 cm',
      material: 'Viton / NBR',
      status: 'active',
      visibility: 'hidden',
      image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=200&h=200&fit=crop',
      views: 145,
      orders: 42,
      rfqs: 3,
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'prod-009',
      name: 'Industrial Conveyor Belt 500mm',
      sku: 'CNV-BLT-500',
      partNumber: 'CB-500-EP200',
      description: 'EP200 rubber conveyor belt, 500mm width, per meter',
      price: '185.00',
      currency: 'SAR',
      stock: 200,
      minOrderQty: 10,
      category: 'category.machinery',
      manufacturer: 'Continental',
      brand: 'ContiTech',
      weight: '12',
      weightUnit: 'kg',
      dimensions: '500mm x 1m',
      material: 'Rubber / Polyester',
      status: 'draft',
      visibility: 'hidden',
      image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=200&h=200&fit=crop',
      views: 67,
      orders: 0,
      rfqs: 2,
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'prod-010',
      name: 'Pressure Transmitter 0-100 Bar',
      sku: 'SNS-PRS-100',
      partNumber: 'PT-100-4-20',
      description: 'Industrial pressure transmitter, 4-20mA output',
      price: '750.00',
      currency: 'SAR',
      stock: 35,
      minOrderQty: 1,
      category: 'category.electronics',
      manufacturer: 'Endress+Hauser',
      brand: 'Cerabar',
      weight: '0.4',
      weightUnit: 'kg',
      dimensions: '10x5x5 cm',
      material: 'Stainless Steel',
      status: 'active',
      visibility: 'public',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&h=200&fit=crop',
      views: 412,
      orders: 28,
      rfqs: 1, // High views but low RFQ - demand gap!
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      rfqsLast30Days: 0,
      avgResponseTimeHours: 5.2,
      conversionRate: 100,
    },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setProducts(MOCK_PRODUCTS);
        setIsLoading(false);
        return;
      }
      const items = await itemService.getSellerItems(token);
      setProducts(items.map(itemToProduct));
    } catch (err) {
      console.error('Failed to fetch items:', err);
      // Fall back to mock data
      setProducts(MOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async (productData: ProductFormData) => {
    const stock = parseInt(productData.stock) || 0;
    const visibility = productData.visibility === 'publish' ? 'public' : 'hidden';
    const status = stock === 0 ? 'out_of_stock' : productData.status === 'active' ? 'active' : 'draft';

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      const item = await itemService.createItem(token, {
        name: productData.name,
        sku: productData.sku,
        partNumber: productData.partNumber,
        description: productData.description,
        price: parseFloat(productData.price),
        currency: productData.currency,
        stock,
        minOrderQty: parseInt(productData.minOrderQty) || 1,
        category: productData.category.replace('category.', ''),
        manufacturer: productData.manufacturer,
        brand: productData.brand,
        visibility: visibility as 'public' | 'rfq_only' | 'hidden',
        status: status as 'draft' | 'active' | 'out_of_stock',
        images: productData.image ? [productData.image] : undefined,
        specifications: {
          weight: productData.weight,
          dimensions: productData.dimensions,
          material: productData.material,
        },
      });
      setProducts((prev) => [itemToProduct(item), ...prev]);
    } catch (err) {
      console.error('Failed to create item:', err);
      // Optimistic fallback
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: productData.name,
        sku: productData.sku,
        partNumber: productData.partNumber || '-',
        description: productData.description || '',
        price: productData.price,
        currency: productData.currency,
        stock,
        minOrderQty: parseInt(productData.minOrderQty) || 1,
        category: productData.category,
        manufacturer: productData.manufacturer || '-',
        brand: productData.brand || '-',
        weight: productData.weight || '-',
        weightUnit: productData.weightUnit,
        dimensions: productData.dimensions || '-',
        material: productData.material || '-',
        status,
        visibility,
        image: productData.image,
        views: 0,
        orders: 0,
        rfqs: 0,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    // Optimistic update first
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        if (updates.stock !== undefined) {
          updated.status = updates.stock === 0 ? 'out_of_stock' : updated.status === 'out_of_stock' ? 'active' : updated.status;
        }
        return updated;
      })
    );

    try {
      const token = await getToken();
      if (!token) return;
      await itemService.updateItem(token, id, productToItemData(updates) as Partial<Item>);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);

    try {
      const token = await getToken();
      if (!token) return;
      await itemService.deleteItem(token, id);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddPanelOpen(true);
  };

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      result = result.filter((p) => {
        if (stockFilter === 'in_stock') return p.stock > STOCK_LEVELS.MEDIUM;
        if (stockFilter === 'low_stock') return p.stock > 0 && p.stock <= STOCK_LEVELS.MEDIUM;
        if (stockFilter === 'out_of_stock') return p.stock === 0;
        return true;
      });
    }

    // Visibility filter
    if (visibilityFilter && visibilityFilter !== 'all') {
      result = result.filter((p) => p.visibility === visibilityFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'price_asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'stock_asc':
          return a.stock - b.stock;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter, visibilityFilter, sortOption]);

  // Stats for quick filters
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    draft: products.filter((p) => p.status === 'draft').length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= STOCK_LEVELS.MEDIUM).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  }), [products]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all' || visibilityFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setStockFilter('all');
    setVisibilityFilter('all');
  };

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      meta: { align: 'center' as const },
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
          style={{ borderColor: styles.border }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-2 cursor-pointer accent-blue-600"
          style={{ borderColor: styles.border }}
        />
      ),
      size: 44,
    }),
    columnHelper.accessor('name', {
      meta: { align: 'start' as const },
      header: t('seller.listings.product'),
      cell: ({ row }) => {
        const product = row.original;
        const categoryLabel = product.category.startsWith('category.')
          ? t(product.category)
          : product.category;
        const demandGaps = detectDemandGaps(product);
        const [showGapTooltip, setShowGapTooltip] = React.useState(false);
        const hasCritical = demandGaps.some(g => g.severity === 'critical');

        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border relative"
              style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
            >
              {product.image ? (
                <img src={product.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Cube size={18} style={{ color: styles.textMuted }} />
                </div>
              )}
              {product.isPaused && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <Pause size={14} weight="fill" style={{ color: '#fff' }} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-medium truncate leading-tight" style={{ color: styles.textPrimary, fontSize: '0.79rem' }}>
                  {product.name}
                </p>
                {/* Demand Gap Badge */}
                {demandGaps.length > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setShowGapTooltip(true)}
                    onMouseLeave={() => setShowGapTooltip(false)}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: hasCritical ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                      }}
                    >
                      <WarningCircle
                        size={12}
                        weight="fill"
                        style={{ color: hasCritical ? styles.error : '#EAB308' }}
                      />
                    </div>
                    {/* Gap Tooltip */}
                    {showGapTooltip && (
                      <div
                        className="absolute z-50 top-full mt-1 w-64 p-3 rounded-lg shadow-lg text-xs"
                        style={{
                          backgroundColor: styles.bgCard,
                          border: `1px solid ${styles.border}`,
                          left: 0,
                        }}
                      >
                        <div className="font-semibold mb-2 flex items-center gap-1.5" style={{ color: styles.textPrimary }}>
                          <ChartLine size={12} /> Demand Insights
                        </div>
                        <div className="space-y-2">
                          {demandGaps.map((gap, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 rounded"
                              style={{
                                backgroundColor: gap.severity === 'critical'
                                  ? 'rgba(239,68,68,0.1)'
                                  : 'rgba(234,179,8,0.1)',
                              }}
                            >
                              <Info
                                size={12}
                                style={{
                                  color: gap.severity === 'critical' ? styles.error : '#EAB308',
                                  marginTop: 1,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ color: styles.textSecondary }}>{gap.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="truncate" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                {product.sku}
              </p>
            </div>
          </div>
        );
      },
      size: 280,
    }),
    columnHelper.accessor('category', {
      meta: { align: 'start' as const },
      header: t('seller.listings.category'),
      cell: ({ row }) => {
        const cat = row.original.category;
        const label = cat.startsWith('category.') ? t(cat) : cat;
        return (
          <span style={{ color: styles.textSecondary, fontSize: '0.79rem' }}>
            {label || '-'}
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('price', {
      meta: { align: 'center' as const },
      header: t('seller.listings.price'),
      cell: ({ row }) => {
        const product = row.original;
        const isEditing = editingCell?.id === product.id && editingCell?.field === 'price';

        if (isEditing) {
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                if (editValue && editValue !== product.price) {
                  handleUpdateProduct(product.id, { price: editValue });
                }
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editValue && editValue !== product.price) {
                    handleUpdateProduct(product.id, { price: editValue });
                  }
                  setEditingCell(null);
                }
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-24 px-2 py-1 text-sm rounded border outline-none"
              style={{ borderColor: styles.info, backgroundColor: styles.bgCard, color: styles.textPrimary }}
              autoFocus
            />
          );
        }

        return (
          <button
            onClick={() => {
              setEditingCell({ id: product.id, field: 'price' });
              setEditValue(product.price);
            }}
            className="font-medium hover:underline cursor-pointer"
            style={{ color: styles.textPrimary, fontSize: '0.79rem' }}
          >
            {product.currency} {parseFloat(product.price).toLocaleString()}
          </button>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('stock', {
      meta: { align: 'center' as const },
      header: t('seller.listings.stock'),
      cell: ({ row }) => {
        const product = row.original;
        const level = getStockLevel(product.stock);
        const colors = {
          good: styles.success,
          medium: '#F59E0B',
          low: styles.error,
          out: styles.error,
        };

        return (
          <div className="flex items-center justify-center gap-1.5">
            {level === 'low' && <Warning size={12} style={{ color: colors[level] }} />}
            <span className="font-medium" style={{ color: colors[level], fontSize: '0.79rem' }}>
              {product.stock}
            </span>
          </div>
        );
      },
      size: 70,
    }),
    columnHelper.accessor('status', {
      meta: { align: 'center' as const },
      header: t('seller.listings.status'),
      cell: ({ row }) => {
        const status = row.original.status;
        const config: Record<string, { bg: string; color: string; label: string }> = {
          active: { bg: 'rgba(34,197,94,0.1)', color: styles.success, label: 'Active' },
          draft: { bg: styles.bgSecondary, color: styles.textMuted, label: 'Draft' },
          out_of_stock: { bg: 'rgba(239,68,68,0.1)', color: styles.error, label: 'Out' },
          archived: { bg: styles.bgSecondary, color: styles.textMuted, label: 'Archived' },
        };
        const c = config[status] || config.draft;
        return (
          <span
            className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: c.bg, color: c.color }}
          >
            {c.label}
          </span>
        );
      },
      size: 75,
    }),
    columnHelper.accessor('visibility', {
      meta: { align: 'center' as const },
      header: t('seller.listings.visibility'),
      cell: ({ row }) => {
        const visibility = row.original.visibility || 'hidden';
        const config: Record<Visibility, { Icon: React.ElementType; color: string; label: string }> = {
          public: { Icon: Eye, color: styles.success, label: 'Public' },
          hidden: { Icon: EyeSlash, color: styles.textMuted, label: 'Hidden' },
          rfq_only: { Icon: FileText, color: '#8B5CF6', label: 'RFQ Only' },
        };
        const c = config[visibility] || config.hidden;
        return (
          <div className="flex items-center justify-center gap-1.5" title={c.label}>
            <c.Icon size={14} style={{ color: c.color }} />
            <span className="text-xs" style={{ color: c.color }}>{c.label}</span>
          </div>
        );
      },
      size: 90,
    }),
    columnHelper.display({
      id: 'performance',
      meta: { align: 'center' as const },
      header: t('seller.listings.performance'),
      cell: ({ row }) => {
        const product = row.original;
        const signal = getPerformanceSignal(product);
        const [showTooltip, setShowTooltip] = React.useState(false);

        const signalConfig = {
          hot: { icon: Fire, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Hot' },
          active: { icon: TrendUp, color: styles.success, bg: 'rgba(34,197,94,0.1)', label: 'Active' },
          dormant: { icon: Bed, color: styles.textMuted, bg: styles.bgSecondary, label: 'Dormant' },
        };

        const config = signalConfig[signal];
        const Icon = config.icon;
        const rfqs30d = product.rfqsLast30Days ?? product.rfqs;
        const avgResponse = product.avgResponseTimeHours ?? 24;
        const conversion = product.conversionRate ?? (product.rfqs > 0 ? (product.orders / product.rfqs * 100) : 0);

        return (
          <div className="relative flex items-center justify-center">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {/* Signal Badge */}
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <Icon size={10} weight="fill" />
                {config.label}
              </span>

              {/* Quick Stats */}
              <div className="flex items-center gap-2" style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
                <span className="flex items-center gap-0.5">
                  <ShoppingCart size={10} /> {product.orders}
                </span>
                <span className="flex items-center gap-0.5">
                  <FileText size={10} /> {product.rfqs}
                </span>
              </div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div
                className="absolute z-50 top-full mt-2 w-56 p-3 rounded-lg shadow-lg text-xs"
                style={{
                  backgroundColor: styles.bgCard,
                  border: `1px solid ${styles.border}`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-semibold mb-2 pb-2 border-b" style={{ color: styles.textPrimary, borderColor: styles.border }}>
                  Performance Insights
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: styles.textMuted }}>
                      <FileText size={12} /> RFQs (30 days)
                    </span>
                    <span className="font-medium" style={{ color: styles.textPrimary }}>{rfqs30d}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: styles.textMuted }}>
                      <ShoppingCart size={12} /> Orders Converted
                    </span>
                    <span className="font-medium" style={{ color: styles.textPrimary }}>{product.orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: styles.textMuted }}>
                      <Percent size={12} /> Conversion Rate
                    </span>
                    <span className="font-medium" style={{ color: conversion > 30 ? styles.success : styles.textPrimary }}>
                      {conversion.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: styles.textMuted }}>
                      <Clock size={12} /> Avg Response
                    </span>
                    <span className="font-medium" style={{ color: avgResponse < 6 ? styles.success : avgResponse > 12 ? styles.error : styles.textPrimary }}>
                      {avgResponse.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
      size: 150,
    }),
    columnHelper.accessor('updatedAt', {
      meta: { align: 'center' as const },
      header: t('seller.listings.updated'),
      cell: ({ row }) => (
        <span style={{ color: styles.textMuted, fontSize: '0.675rem' }}>
          {formatRelativeTime(row.original.updatedAt)}
        </span>
      ),
      size: 80,
    }),
    columnHelper.display({
      id: 'actions',
      meta: { align: 'center' as const },
      header: t('common.actions'),
      cell: ({ row }) => {
        const product = row.original;
        const [showMenu, setShowMenu] = React.useState(false);

        const handleDuplicate = () => {
          const duplicatedProduct: Product = {
            ...product,
            id: `prod-${Date.now()}`,
            name: `${product.name} (Copy)`,
            sku: `${product.sku}-COPY`,
            status: 'draft',
            visibility: 'hidden',
            views: 0,
            orders: 0,
            rfqs: 0,
            rfqsLast30Days: 0,
            updatedAt: new Date().toISOString(),
          };
          setProducts((prev) => [duplicatedProduct, ...prev]);
          setShowMenu(false);
        };

        const handleToggleVisibility = () => {
          const newVisibility: Visibility = product.visibility === 'public' ? 'hidden' : 'public';
          handleUpdateProduct(product.id, { visibility: newVisibility });
          setShowMenu(false);
        };

        const handleTogglePause = () => {
          handleUpdateProduct(product.id, { isPaused: !product.isPaused } as any);
          setShowMenu(false);
        };

        const handleViewRFQHistory = () => {
          // Navigate to RFQs page filtered by this item
          onNavigate(`rfqs?itemId=${product.id}`);
          setShowMenu(false);
        };

        return (
          <div className="flex items-center justify-center gap-1 relative">
            {/* Quick Edit */}
            <button
              onClick={() => handleEditProduct(product)}
              className="p-1.5 rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.bgHover;
                e.currentTarget.style.color = styles.info;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = styles.textMuted;
              }}
              title={t('common.edit')}
            >
              <PencilSimple size={16} />
            </button>

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgHover;
                  e.currentTarget.style.color = styles.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = styles.textMuted;
                }}
                title="More actions"
              >
                <DotsThreeVertical size={16} weight="bold" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className={`absolute top-full mt-1 z-20 py-1 rounded-lg shadow-lg min-w-[180px] ${isRtl ? 'left-0' : 'right-0'}`}
                    style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                  >
                    {/* Duplicate with Price Adjustment */}
                    <MenuButton
                      icon={Copy}
                      label={t('seller.listings.duplicate') || 'Duplicate'}
                      styles={styles}
                      onClick={handleDuplicate}
                    />

                    {/* Toggle Visibility */}
                    <MenuButton
                      icon={product.visibility === 'public' ? EyeSlash : Eye}
                      label={product.visibility === 'public'
                        ? (t('seller.listings.makeHidden') || 'Hide from Marketplace')
                        : (t('seller.listings.makePublic') || 'Show on Marketplace')
                      }
                      styles={styles}
                      onClick={handleToggleVisibility}
                    />

                    {/* Pause/Resume Availability */}
                    <MenuButton
                      icon={product.isPaused ? Play : Pause}
                      label={product.isPaused
                        ? (t('seller.listings.resume') || 'Resume Availability')
                        : (t('seller.listings.pause') || 'Pause Availability')
                      }
                      styles={styles}
                      onClick={handleTogglePause}
                    />

                    {/* View RFQ History */}
                    <MenuButton
                      icon={ClockCounterClockwise}
                      label={t('seller.listings.viewRFQHistory') || 'View RFQ History'}
                      styles={styles}
                      onClick={handleViewRFQHistory}
                    />

                    <div className="h-px my-1" style={{ backgroundColor: styles.border }} />

                    {/* Delete */}
                    <MenuButton
                      icon={Trash}
                      label={t('common.delete')}
                      styles={styles}
                      onClick={() => {
                        setDeleteConfirm({ id: product.id, name: product.name });
                        setShowMenu(false);
                      }}
                      danger
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
      size: 100,
    }),
  ], [styles, t, editingCell, editValue, isRtl]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (row: Product) => row.id,
  });

  const selectedCount = Object.keys(rowSelection).length;

  // Bulk actions
  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection);
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    setRowSelection({});
    setShowBulkActions(false);
  };

  const handleBulkStatusChange = (status: Status) => {
    const selectedIds = Object.keys(rowSelection);
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p
      )
    );
    setRowSelection({});
    setShowBulkActions(false);
  };

  const handleBulkVisibilityChange = (visibility: Visibility) => {
    const selectedIds = Object.keys(rowSelection);
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, visibility, updatedAt: new Date().toISOString() } : p
      )
    );
    setRowSelection({});
    setShowBulkActions(false);
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {t('seller.listings.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
              {t('seller.listings.subtitle')}
            </p>
          </div>
          <Button onClick={() => setIsAddPanelOpen(true)}>
            <Plus size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
            {t('seller.listings.addProduct')}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className={`flex items-center gap-6 mb-6 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
          <QuickStat label={t('seller.listings.total')} value={stats.total} styles={styles} />
          <QuickStat label={t('seller.listings.active')} value={stats.active} color={styles.success} styles={styles} />
          <QuickStat label={t('seller.listings.draft')} value={stats.draft} styles={styles} />
          {stats.lowStock > 0 && (
            <QuickStat label={t('seller.listings.lowStock')} value={stats.lowStock} color="#F59E0B" styles={styles} warning />
          )}
          {stats.outOfStock > 0 && (
            <QuickStat label={t('seller.listings.outOfStock')} value={stats.outOfStock} color={styles.error} styles={styles} warning />
          )}
        </div>

        {/* Filter Bar */}
        <div
          className="rounded-xl border mb-4"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          {/* Filter Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: styles.border }}>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: styles.textPrimary }}
            >
              <Funnel size={16} />
              {t('seller.listings.filters')}
              <CaretRight
                size={14}
                className={`transition-transform ${filtersExpanded ? 'rotate-90' : ''}`}
                style={{ color: styles.textMuted }}
              />
              {hasActiveFilters && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  Active
                </span>
              )}
            </button>
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <Select
                value={sortOption}
                onChange={(v) => setSortOption(v as SortOption)}
                options={[
                  { value: 'updated', label: t('seller.listings.lastUpdated') },
                  { value: 'name', label: t('seller.listings.nameAZ') },
                  { value: 'price_asc', label: t('seller.listings.priceLowHigh') },
                  { value: 'price_desc', label: t('seller.listings.priceHighLow') },
                  { value: 'stock_asc', label: t('seller.listings.stockLowHigh') },
                  { value: 'stock_desc', label: t('seller.listings.stockHighLow') },
                ]}
              />

              {/* Bulk Actions */}
              {selectedCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{ borderColor: styles.border, color: styles.textPrimary }}
                  >
                    <CheckSquare size={14} />
                    {selectedCount} {t('seller.listings.selected')}
                    <CaretDown size={12} />
                  </button>
                  {showBulkActions && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBulkActions(false)} />
                      <div
                        className="absolute right-0 top-full mt-1 z-20 py-1 rounded-lg shadow-lg min-w-[160px]"
                        style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                      >
                        <MenuButton icon={Lightning} label={t('seller.listings.setActive')} styles={styles} onClick={() => handleBulkStatusChange('active')} />
                        <MenuButton icon={Archive} label={t('seller.listings.setDraft')} styles={styles} onClick={() => handleBulkStatusChange('draft')} />
                        <MenuButton icon={Eye} label={t('seller.listings.makePublic')} styles={styles} onClick={() => handleBulkVisibilityChange('public')} />
                        <MenuButton icon={EyeSlash} label={t('seller.listings.makeHidden')} styles={styles} onClick={() => handleBulkVisibilityChange('hidden')} />
                        <div className="h-px my-1" style={{ backgroundColor: styles.border }} />
                        <MenuButton icon={Trash} label={t('common.delete')} styles={styles} onClick={handleBulkDelete} danger />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          {filtersExpanded && (
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg border flex-1 min-w-[200px] max-w-[300px]"
                style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
              >
                <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
                <input
                  type="text"
                  placeholder={t('seller.listings.searchBySku')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outline-none text-sm bg-transparent flex-1"
                  style={{ color: styles.textPrimary }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: styles.textMuted }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category */}
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder={t('seller.listings.category')}
                options={[
                  { value: 'all', label: t('seller.listings.allCategories') },
                  ...CATEGORIES.map((c) => ({ value: c.key, label: t(c.key) })),
                ]}
              />

              {/* Status */}
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as Status | 'all')}
                placeholder={t('seller.listings.status')}
                options={[
                  { value: 'all', label: t('seller.listings.allStatus') },
                  { value: 'active', label: t('seller.listings.active') },
                  { value: 'draft', label: t('seller.listings.draft') },
                  { value: 'out_of_stock', label: t('seller.listings.outOfStock') },
                ]}
              />

              {/* Stock Level */}
              <Select
                value={stockFilter}
                onChange={(v) => setStockFilter(v as StockFilter)}
                placeholder={t('seller.listings.stock')}
                options={[
                  { value: 'all', label: t('seller.listings.allStock') },
                  { value: 'in_stock', label: t('seller.listings.inStock') },
                  { value: 'low_stock', label: t('seller.listings.lowStock') },
                  { value: 'out_of_stock', label: t('seller.listings.outOfStock') },
                ]}
              />

              {/* Visibility */}
              <Select
                value={visibilityFilter}
                onChange={(v) => setVisibilityFilter(v as Visibility | 'all')}
                placeholder={t('seller.listings.visibility')}
                options={[
                  { value: 'all', label: t('seller.listings.allVisibility') },
                  { value: 'public', label: t('seller.listings.public') },
                  { value: 'hidden', label: t('seller.listings.hidden') },
                  { value: 'rfq_only', label: t('seller.listings.rfqOnly') },
                ]}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                  style={{ color: styles.error }}
                >
                  <X size={12} /> {t('seller.listings.clearAll')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {products.length === 0 ? (
          <div
            className="rounded-xl border py-16"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <EmptyState
              icon={Cube}
              title={t('seller.listings.noProductsYet')}
              description={t('seller.listings.startBuilding')}
              action={
                <Button onClick={() => setIsAddPanelOpen(true)}>
                  <Plus size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
                  {t('seller.listings.addFirstProduct')}
                </Button>
              }
            />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
          >
            <MagnifyingGlass size={40} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>{t('seller.listings.noProductsMatch')}</p>
            <p className="text-xs mt-1" style={{ color: styles.textMuted }}>{t('seller.listings.tryAdjusting')}</p>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm font-medium"
              style={{ color: styles.info }}
            >
              {t('seller.listings.clearAll')}
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      style={{
                        backgroundColor: styles.tableHeader,
                        borderBottom: `1px solid ${styles.tableBorder}`,
                      }}
                    >
                      {headerGroup.headers.map((header) => {
                        const align = (header.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                        return (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: styles.textMuted,
                            width: header.getSize(),
                            textAlign: align,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 ${
                                align === 'center' ? 'justify-center' : ''
                              } ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="flex flex-col -space-y-1 ml-0.5">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <CaretUp size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <CaretDown size={12} weight="bold" style={{ color: styles.textPrimary }} />
                                  ) : (
                                    <>
                                      <CaretUp size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                      <CaretDown size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, index) => {
                    const urgency = getRowUrgency(row.original);
                    const urgencyBg = urgency === 'high'
                      ? (styles.isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')
                      : urgency === 'medium'
                        ? (styles.isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.05)')
                        : 'transparent';
                    const selectedBg = styles.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)';

                    return (
                    <tr
                      key={row.id}
                      className="group transition-colors"
                      style={{
                        borderBottom: index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.tableBorder}`,
                        backgroundColor: row.getIsSelected() ? selectedBg : urgencyBg,
                        borderLeft: urgency === 'high'
                          ? `3px solid ${styles.error}`
                          : urgency === 'medium'
                            ? `3px solid #EAB308`
                            : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!row.getIsSelected()) {
                          e.currentTarget.style.backgroundColor = styles.tableRowHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!row.getIsSelected()) {
                          e.currentTarget.style.backgroundColor = urgencyBg;
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align = (cell.column.columnDef.meta as { align?: 'start' | 'center' })?.align || 'start';
                        return (
                        <td
                          key={cell.id}
                          className="px-4 py-3"
                          style={{ width: cell.column.getSize(), verticalAlign: 'middle', textAlign: align }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                        );
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={{
                borderTop: `1px solid ${styles.tableBorder}`,
                backgroundColor: styles.tableHeader,
                color: styles.textMuted,
              }}
            >
              <span>
                {t('seller.listings.showing')} {filteredProducts.length} {t('seller.listings.of')} {products.length} {t('seller.listings.products')}
              </span>
              {selectedCount > 0 && (
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {selectedCount} {t('seller.listings.selected')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <AddProductPanel
        isOpen={isAddPanelOpen}
        onClose={() => {
          setIsAddPanelOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleAddProduct}
        editProduct={editingProduct}
        onUpdate={(id, data) => {
          handleUpdateProduct(id, data);
          setIsAddPanelOpen(false);
          setEditingProduct(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setDeleteConfirm(null)}
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-xl shadow-xl p-6"
            style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
              >
                <Trash size={20} style={{ color: styles.error }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
                  {t('common.delete')}
                </h3>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {t('seller.listings.confirmDelete')}
                </p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: styles.textSecondary }}>
              {t('seller.listings.deleteWarning')} <strong>"{deleteConfirm.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm.id)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: styles.error }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Stat Component
const QuickStat: React.FC<{
  label: string;
  value: number;
  color?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  warning?: boolean;
}> = ({ label, value, color, styles, warning }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm" style={{ color: styles.textMuted }}>{label}:</span>
    <span
      className={`text-sm font-semibold ${warning ? 'flex items-center gap-1' : ''}`}
      style={{ color: color || styles.textPrimary }}
    >
      {warning && <Warning size={12} />}
      {value}
    </span>
  </div>
);

// Menu Button Component
const MenuButton: React.FC<{
  icon: React.ElementType;
  label: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
    style={{ color: danger ? styles.error : styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
    {label}
  </button>
);

export default Listings;
