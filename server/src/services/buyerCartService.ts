// =============================================================================
// Buyer Cart Service - RFQ Aggregation Cart
// =============================================================================
// NOT a traditional checkout cart - this is an RFQ aggregation tool
// Buyers collect items from multiple sellers and request quotes in bulk
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export interface CartItem {
  id: string;
  itemId: string;
  sellerId: string;
  quantity: number;
  priceAtAdd: number | null;
  itemName: string | null;
  itemSku: string | null;
  addedAt: Date;
  updatedAt: Date;
  // Enriched from Item lookup
  item?: {
    id: string;
    name: string;
    nameAr: string | null;
    sku: string;
    price: number;
    currency: string;
    stock: number;
    minOrderQty: number;
    maxOrderQty: number | null;
    images: string | null;
    status: string;
    // Buy Now eligibility fields
    allowDirectPurchase: boolean;
    isFixedPrice: boolean;
  };
  seller?: {
    id: string;
    companyName: string | null;
    name: string | null;
  };
}

export interface CartWithItems {
  id: string;
  buyerId: string;
  isLocked: boolean;
  lockedAt: Date | null;
  lockedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
  // Computed
  itemCount: number;
  sellerCount: number;
  estimatedTotal: number;
  currency: string;
}

export interface AddToCartInput {
  itemId: string;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartItemsBySellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// =============================================================================
// Cart CRUD Operations
// =============================================================================

/**
 * Get or create cart for a buyer
 */
export async function getOrCreateCart(buyerId: string): Promise<CartWithItems> {
  let cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.buyerCart.create({
      data: { buyerId },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });
  }

  return enrichCartWithDetails(cart);
}

/**
 * Get cart for a buyer (returns null if not exists)
 */
export async function getCart(buyerId: string): Promise<CartWithItems | null> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!cart) return null;
  return enrichCartWithDetails(cart);
}

/**
 * Add item to cart
 */
export async function addToCart(
  buyerId: string,
  input: AddToCartInput
): Promise<CartWithItems> {
  const { itemId, quantity = 1 } = input;

  // Get or create cart
  let cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    cart = await prisma.buyerCart.create({
      data: { buyerId },
    });
  }

  // Check if cart is locked
  if (cart.isLocked) {
    throw new Error('Cart is locked. Clear the cart to add new items.');
  }

  // Get item details for snapshot
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      userId: true,
      name: true,
      sku: true,
      price: true,
      status: true,
      minOrderQty: true,
    },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  if (item.status !== 'active') {
    throw new Error('Item is not available');
  }

  // Validate quantity
  const finalQuantity = Math.max(quantity, item.minOrderQty);

  // Check if item already in cart
  const existingItem = await prisma.buyerCartItem.findUnique({
    where: {
      cartId_itemId: {
        cartId: cart.id,
        itemId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.buyerCartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + finalQuantity,
        updatedAt: new Date(),
      },
    });
  } else {
    // Add new item
    await prisma.buyerCartItem.create({
      data: {
        cartId: cart.id,
        itemId,
        sellerId: item.userId,
        quantity: finalQuantity,
        priceAtAdd: item.price,
        itemName: item.name,
        itemSku: item.sku,
      },
    });
  }

  // Update cart timestamp
  await prisma.buyerCart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
  });

  return getOrCreateCart(buyerId);
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  buyerId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<CartWithItems> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  if (cart.isLocked) {
    throw new Error('Cart is locked');
  }

  const cartItem = await prisma.buyerCartItem.findFirst({
    where: {
      cartId: cart.id,
      itemId,
    },
  });

  if (!cartItem) {
    throw new Error('Item not in cart');
  }

  // Get item details for min/max validation
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { minOrderQty: true, maxOrderQty: true },
  });

  let finalQuantity = input.quantity;
  if (item) {
    finalQuantity = Math.max(finalQuantity, item.minOrderQty);
    if (item.maxOrderQty) {
      finalQuantity = Math.min(finalQuantity, item.maxOrderQty);
    }
  }

  if (finalQuantity <= 0) {
    // Remove item if quantity is 0 or less
    await prisma.buyerCartItem.delete({
      where: { id: cartItem.id },
    });
  } else {
    await prisma.buyerCartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: finalQuantity,
        updatedAt: new Date(),
      },
    });
  }

  return getOrCreateCart(buyerId);
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  buyerId: string,
  itemId: string
): Promise<CartWithItems> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  if (cart.isLocked) {
    throw new Error('Cart is locked');
  }

  await prisma.buyerCartItem.deleteMany({
    where: {
      cartId: cart.id,
      itemId,
    },
  });

  return getOrCreateCart(buyerId);
}

/**
 * Clear entire cart
 */
export async function clearCart(buyerId: string): Promise<CartWithItems> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  // Delete all items and unlock
  await prisma.buyerCartItem.deleteMany({
    where: { cartId: cart.id },
  });

  await prisma.buyerCart.update({
    where: { id: cart.id },
    data: {
      isLocked: false,
      lockedAt: null,
      lockedReason: null,
      updatedAt: new Date(),
    },
  });

  return getOrCreateCart(buyerId);
}

/**
 * Get cart items grouped by seller
 */
export async function getCartGroupedBySeller(
  buyerId: string
): Promise<CartItemsBySellerGroup[]> {
  const cart = await getOrCreateCart(buyerId);

  const groups: Map<string, CartItemsBySellerGroup> = new Map();

  for (const item of cart.items) {
    const sellerId = item.sellerId;
    const sellerName = item.seller?.companyName || item.seller?.name || 'Unknown Seller';

    if (!groups.has(sellerId)) {
      groups.set(sellerId, {
        sellerId,
        sellerName,
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const group = groups.get(sellerId)!;
    group.items.push(item);
    group.itemCount += item.quantity;

    // Use current item price if available, otherwise use snapshot
    const price = item.item?.price ?? item.priceAtAdd ?? 0;
    group.subtotal += price * item.quantity;
  }

  return Array.from(groups.values());
}

/**
 * Lock cart (used when RFQ is sent)
 */
export async function lockCart(
  buyerId: string,
  reason: string = 'rfq_sent'
): Promise<CartWithItems> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  await prisma.buyerCart.update({
    where: { id: cart.id },
    data: {
      isLocked: true,
      lockedAt: new Date(),
      lockedReason: reason,
    },
  });

  return getOrCreateCart(buyerId);
}

/**
 * Unlock cart
 */
export async function unlockCart(buyerId: string): Promise<CartWithItems> {
  const cart = await prisma.buyerCart.findUnique({
    where: { buyerId },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  await prisma.buyerCart.update({
    where: { id: cart.id },
    data: {
      isLocked: false,
      lockedAt: null,
      lockedReason: null,
    },
  });

  return getOrCreateCart(buyerId);
}

// =============================================================================
// RFQ Creation from Cart
// =============================================================================

export interface CreateRFQFromCartResult {
  rfqIds: string[];
  itemCount: number;
  sellerCount: number;
}

export interface BuyNowFromCartResult {
  orderIds: string[];
  itemCount: number;
  sellerCount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Create ItemRFQ records from cart items (for a specific seller)
 */
export async function createRFQFromCartForSeller(
  buyerId: string,
  sellerId: string
): Promise<CreateRFQFromCartResult> {
  const cart = await getOrCreateCart(buyerId);

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const sellerItems = cart.items.filter((item) => item.sellerId === sellerId);

  if (sellerItems.length === 0) {
    throw new Error('No items from this seller in cart');
  }

  // Create ItemRFQ records for each item
  const rfqIds: string[] = [];

  for (const cartItem of sellerItems) {
    const rfq = await prisma.itemRFQ.create({
      data: {
        buyerId,
        sellerId,
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        status: 'pending',
        message: `Added from cart`,
        source: 'item',
      },
    });
    rfqIds.push(rfq.id);
  }

  // Remove items from cart after RFQ creation
  await prisma.buyerCartItem.deleteMany({
    where: {
      cartId: cart.id,
      sellerId,
    },
  });

  return {
    rfqIds,
    itemCount: sellerItems.length,
    sellerCount: 1,
  };
}

/**
 * Create ItemRFQ records from all cart items (grouped by seller)
 */
export async function createRFQFromAllCart(
  buyerId: string
): Promise<CreateRFQFromCartResult> {
  const cart = await getOrCreateCart(buyerId);

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const sellerIds = [...new Set(cart.items.map((item) => item.sellerId))];
  const rfqIds: string[] = [];

  for (const sellerId of sellerIds) {
    const sellerItems = cart.items.filter((item) => item.sellerId === sellerId);

    for (const cartItem of sellerItems) {
      const rfq = await prisma.itemRFQ.create({
        data: {
          buyerId,
          sellerId,
          itemId: cartItem.itemId,
          quantity: cartItem.quantity,
          status: 'pending',
          message: `Added from cart`,
          source: 'item',
        },
      });
      rfqIds.push(rfq.id);
    }
  }

  // Lock and clear cart after all RFQs created
  await prisma.buyerCartItem.deleteMany({
    where: { cartId: cart.id },
  });

  await prisma.buyerCart.update({
    where: { id: cart.id },
    data: {
      isLocked: true,
      lockedAt: new Date(),
      lockedReason: 'rfq_sent',
    },
  });

  return {
    rfqIds,
    itemCount: cart.items.length,
    sellerCount: sellerIds.length,
  };
}

// =============================================================================
// Buy Now from Cart (Direct Purchase without RFQ)
// =============================================================================

/**
 * Check if a cart item is eligible for Buy Now
 */
function isBuyNowEligible(
  cartItem: CartItem,
  item: { stock: number; status: string; allowDirectPurchase: boolean; isFixedPrice: boolean } | undefined
): { eligible: boolean; reason?: string } {
  if (!item) {
    return { eligible: false, reason: 'Item not found' };
  }

  if (item.status !== 'active') {
    return { eligible: false, reason: 'Item not available' };
  }

  if (item.stock === 0) {
    return { eligible: false, reason: 'Out of stock' };
  }

  if (item.stock < cartItem.quantity) {
    return { eligible: false, reason: `Only ${item.stock} in stock` };
  }

  if (!item.allowDirectPurchase) {
    return { eligible: false, reason: 'Quote only item' };
  }

  if (!item.isFixedPrice) {
    return { eligible: false, reason: 'Price requires quote' };
  }

  return { eligible: true };
}

/**
 * Buy Now from cart for a specific seller
 * Creates a MarketplaceOrder for each item directly without going through RFQ flow
 */
export async function buyNowFromCartForSeller(
  buyerId: string,
  sellerId: string
): Promise<BuyNowFromCartResult> {
  const cart = await getOrCreateCart(buyerId);

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  if (cart.isLocked) {
    throw new Error('Cart is locked');
  }

  // Filter items for this seller
  const sellerItems = cart.items.filter((item) => item.sellerId === sellerId);

  if (sellerItems.length === 0) {
    throw new Error('No items from this seller in cart');
  }

  // Filter for Buy Now eligible items
  const eligibleItems = sellerItems.filter((item) => {
    const eligibility = isBuyNowEligible(item, item.item);
    return eligibility.eligible;
  });

  if (eligibleItems.length === 0) {
    throw new Error('No Buy Now eligible items from this seller');
  }

  // Calculate totals and create orders
  let totalAmount = 0;
  let currency = 'SAR';
  const orderIds: string[] = [];

  for (const item of eligibleItems) {
    const price = item.item?.price ?? item.priceAtAdd ?? 0;
    const itemTotal = price * item.quantity;
    totalAmount += itemTotal;

    if (item.item?.currency) {
      currency = item.item.currency;
    }

    // Generate unique order number for each item
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Parse images to get first image
    let itemImage: string | null = null;
    try {
      const images = item.item?.images ? JSON.parse(item.item.images) : [];
      itemImage = images[0] || null;
    } catch {
      itemImage = null;
    }

    // Create marketplace order for this item
    const order = await prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        buyerId,
        sellerId,
        itemId: item.itemId,
        itemName: item.item?.name || item.itemName || 'Unknown Item',
        itemSku: item.item?.sku || item.itemSku || '',
        itemImage,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
        currency,
        status: 'pending_confirmation',
        source: 'direct_buy',
      },
    });

    orderIds.push(order.id);

    // Update item stock
    await prisma.item.update({
      where: { id: item.itemId },
      data: {
        stock: { decrement: item.quantity },
        successfulOrders: { increment: 1 },
      },
    });
  }

  // Remove purchased items from cart
  await prisma.buyerCartItem.deleteMany({
    where: {
      cartId: cart.id,
      itemId: { in: eligibleItems.map((i) => i.itemId) },
    },
  });

  return {
    orderIds,
    itemCount: eligibleItems.reduce((sum, item) => sum + item.quantity, 0),
    sellerCount: 1,
    totalAmount,
    currency,
  };
}

/**
 * Buy Now from all cart items
 * Creates a MarketplaceOrder for each eligible item
 */
export async function buyNowFromAllCart(
  buyerId: string
): Promise<BuyNowFromCartResult> {
  const cart = await getOrCreateCart(buyerId);

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  if (cart.isLocked) {
    throw new Error('Cart is locked');
  }

  // Filter for Buy Now eligible items
  const eligibleItems = cart.items.filter((item) => {
    const eligibility = isBuyNowEligible(item, item.item);
    return eligibility.eligible;
  });

  if (eligibleItems.length === 0) {
    throw new Error('No Buy Now eligible items in cart');
  }

  // Track unique sellers for counting
  const sellerIds = new Set<string>();
  const orderIds: string[] = [];
  let totalAmount = 0;
  let totalItemCount = 0;
  let currency = 'SAR';

  // Create order for each item
  for (const item of eligibleItems) {
    const price = item.item?.price ?? item.priceAtAdd ?? 0;
    const itemTotal = price * item.quantity;

    sellerIds.add(item.sellerId);
    totalAmount += itemTotal;
    totalItemCount += item.quantity;

    if (item.item?.currency) {
      currency = item.item.currency;
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Parse images to get first image
    let itemImage: string | null = null;
    try {
      const images = item.item?.images ? JSON.parse(item.item.images) : [];
      itemImage = images[0] || null;
    } catch {
      itemImage = null;
    }

    // Create marketplace order for this item
    const order = await prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        buyerId,
        sellerId: item.sellerId,
        itemId: item.itemId,
        itemName: item.item?.name || item.itemName || 'Unknown Item',
        itemSku: item.item?.sku || item.itemSku || '',
        itemImage,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
        currency,
        status: 'pending_confirmation',
        source: 'direct_buy',
      },
    });

    orderIds.push(order.id);

    // Update item stock
    await prisma.item.update({
      where: { id: item.itemId },
      data: {
        stock: { decrement: item.quantity },
        successfulOrders: { increment: 1 },
      },
    });
  }

  // Remove all purchased items from cart
  await prisma.buyerCartItem.deleteMany({
    where: {
      cartId: cart.id,
      itemId: { in: eligibleItems.map((i) => i.itemId) },
    },
  });

  return {
    orderIds,
    itemCount: totalItemCount,
    sellerCount: sellerIds.size,
    totalAmount,
    currency,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Enrich cart with item and seller details
 */
async function enrichCartWithDetails(
  cart: {
    id: string;
    buyerId: string;
    isLocked: boolean;
    lockedAt: Date | null;
    lockedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: {
      id: string;
      cartId: string;
      itemId: string;
      sellerId: string;
      quantity: number;
      priceAtAdd: number | null;
      itemName: string | null;
      itemSku: string | null;
      addedAt: Date;
      updatedAt: Date;
    }[];
  }
): Promise<CartWithItems> {
  // Get all item IDs and seller IDs
  const itemIds = cart.items.map((item) => item.itemId);
  const sellerIds = [...new Set(cart.items.map((item) => item.sellerId))];

  // Batch fetch items
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      sku: true,
      price: true,
      currency: true,
      stock: true,
      minOrderQty: true,
      maxOrderQty: true,
      images: true,
      status: true,
      // Buy Now eligibility fields
      allowDirectPurchase: true,
      isFixedPrice: true,
    },
  });

  // Batch fetch sellers
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: {
      id: true,
      companyName: true,
      name: true,
    },
  });

  // Create lookup maps
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const sellerMap = new Map(sellers.map((seller) => [seller.id, seller]));

  // Enrich cart items
  const enrichedItems: CartItem[] = cart.items.map((item) => ({
    ...item,
    item: itemMap.get(item.itemId),
    seller: sellerMap.get(item.sellerId),
  }));

  // Calculate totals
  let estimatedTotal = 0;
  let currency = 'SAR';

  for (const item of enrichedItems) {
    const price = item.item?.price ?? item.priceAtAdd ?? 0;
    estimatedTotal += price * item.quantity;
    if (item.item?.currency) {
      currency = item.item.currency;
    }
  }

  return {
    id: cart.id,
    buyerId: cart.buyerId,
    isLocked: cart.isLocked,
    lockedAt: cart.lockedAt,
    lockedReason: cart.lockedReason,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: enrichedItems,
    itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
    sellerCount: sellerIds.length,
    estimatedTotal,
    currency,
  };
}

// =============================================================================
// Exports
// =============================================================================

export default {
  getOrCreateCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartGroupedBySeller,
  lockCart,
  unlockCart,
  createRFQFromCartForSeller,
  createRFQFromAllCart,
  // Buy Now (Direct Purchase)
  buyNowFromCartForSeller,
  buyNowFromAllCart,
};
