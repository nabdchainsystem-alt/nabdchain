// =============================================================================
// Cart Context - Buyer Cart State Management
// =============================================================================
// Provides cart state with optimistic updates and localStorage sync
// =============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from '../../../auth-adapter';
import { cartService } from '../services/cartService';
import {
  Cart,
  CartItem,
  CartContextValue,
  CartItemEligibility,
  CreateRFQResult,
  BuyNowResult,
  PurchaseMethod,
} from '../types/cart.types';

// =============================================================================
// Context Creation
// =============================================================================

const CartContext = createContext<CartContextValue | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { getToken } = useAuth();

  // State
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // =============================================================================
  // Cart Fetching
  // =============================================================================

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setCart(null);
        return;
      }
      const fetchedCart = await cartService.getCart(token, true);
      setCart(fetchedCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Initial fetch
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // =============================================================================
  // Cart Operations with Optimistic Updates
  // =============================================================================

  const addToCart = useCallback(
    async (itemId: string, quantity = 1) => {
      const operationId = `add-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Optimistic update
      if (cart) {
        const existingItem = cart.items.find((i) => i.itemId === itemId);
        if (existingItem) {
          // Update existing item quantity
          setCart({
            ...cart,
            items: cart.items.map((i) =>
              i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i
            ),
            itemCount: cart.itemCount + quantity,
          });
        } else {
          // Add new item (placeholder)
          setCart({
            ...cart,
            itemCount: cart.itemCount + quantity,
            sellerCount: cart.sellerCount, // May change, but we'll correct on refresh
          });
        }
      }

      try {
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const updatedCart = await cartService.addToCart(token, { itemId, quantity });
        setCart(updatedCart);
      } catch (err) {
        // Revert optimistic update
        await refreshCart();
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [cart, getToken, refreshCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const operationId = `update-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Store previous state for rollback
      const previousCart = cart;

      // Optimistic update
      if (cart) {
        const item = cart.items.find((i) => i.itemId === itemId);
        if (item) {
          const quantityDiff = quantity - item.quantity;
          if (quantity <= 0) {
            // Remove item
            setCart({
              ...cart,
              items: cart.items.filter((i) => i.itemId !== itemId),
              itemCount: cart.itemCount - item.quantity,
            });
          } else {
            setCart({
              ...cart,
              items: cart.items.map((i) =>
                i.itemId === itemId ? { ...i, quantity } : i
              ),
              itemCount: cart.itemCount + quantityDiff,
            });
          }
        }
      }

      try {
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const updatedCart = await cartService.updateCartItem(token, itemId, { quantity });
        setCart(updatedCart);
      } catch (err) {
        // Revert optimistic update
        setCart(previousCart);
        setError(err instanceof Error ? err.message : 'Failed to update quantity');
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [cart, getToken]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      const operationId = `remove-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Store previous state for rollback
      const previousCart = cart;

      // Optimistic update
      if (cart) {
        const item = cart.items.find((i) => i.itemId === itemId);
        if (item) {
          const remainingItems = cart.items.filter((i) => i.itemId !== itemId);
          const remainingSellers = new Set(remainingItems.map((i) => i.sellerId));
          setCart({
            ...cart,
            items: remainingItems,
            itemCount: cart.itemCount - item.quantity,
            sellerCount: remainingSellers.size,
          });
        }
      }

      try {
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const updatedCart = await cartService.removeFromCart(token, itemId);
        setCart(updatedCart);
      } catch (err) {
        // Revert optimistic update
        setCart(previousCart);
        setError(err instanceof Error ? err.message : 'Failed to remove item');
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [cart, getToken]
  );

  const clearCart = useCallback(async () => {
    const operationId = 'clear';
    setPendingOperations((prev) => new Set(prev).add(operationId));

    // Store previous state for rollback
    const previousCart = cart;

    // Optimistic update
    if (cart) {
      setCart({
        ...cart,
        items: [],
        itemCount: 0,
        sellerCount: 0,
        estimatedTotal: 0,
        isLocked: false,
        lockedAt: null,
        lockedReason: null,
      });
    }

    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const updatedCart = await cartService.clearCart(token);
      setCart(updatedCart);
    } catch (err) {
      // Revert optimistic update
      setCart(previousCart);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  }, [cart, getToken]);

  // =============================================================================
  // RFQ Creation
  // =============================================================================

  const createRFQForSeller = useCallback(
    async (sellerId: string): Promise<CreateRFQResult> => {
      const operationId = `rfq-seller-${sellerId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      try {
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const result = await cartService.createRFQForSeller(token, sellerId);
        // Refresh cart after RFQ creation
        await refreshCart();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create RFQ');
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [getToken, refreshCart]
  );

  const createRFQForAll = useCallback(async (): Promise<CreateRFQResult> => {
    const operationId = 'rfq-all';
    setPendingOperations((prev) => new Set(prev).add(operationId));

    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const result = await cartService.createRFQForAll(token);
      // Refresh cart after RFQ creation
      await refreshCart();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RFQ');
      throw err;
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  }, [getToken, refreshCart]);

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const isItemInCart = useCallback(
    (itemId: string): boolean => {
      if (!cart) return cartService.isItemInLocalCart(itemId);
      return cart.items.some((i) => i.itemId === itemId);
    },
    [cart]
  );

  const getItemQuantity = useCallback(
    (itemId: string): number => {
      if (!cart) return cartService.getLocalItemQuantity(itemId);
      const item = cart.items.find((i) => i.itemId === itemId);
      return item?.quantity ?? 0;
    },
    [cart]
  );

  // =============================================================================
  // Purchase Method Selection
  // =============================================================================

  const setItemPurchaseMethod = useCallback(
    (itemId: string, method: PurchaseMethod) => {
      if (!cart) return;

      // Update local cart state with the selected method
      setCart({
        ...cart,
        items: cart.items.map((item) =>
          item.itemId === itemId ? { ...item, selectedMethod: method } : item
        ),
      });
    },
    [cart]
  );

  // =============================================================================
  // Buy Now Operations
  // =============================================================================

  const getItemEligibility = useCallback((item: CartItem): CartItemEligibility => {
    const stock = item.item?.stock ?? 0;
    const status = item.item?.status;
    const allowDirectPurchase = item.item?.allowDirectPurchase ?? true;
    const isFixedPrice = item.item?.isFixedPrice ?? true;

    if (status !== 'active') {
      return {
        buyNow: { eligible: false, reason: 'Item not available' },
        recommendedMethod: 'request_quote',
      };
    }

    if (stock === 0) {
      return {
        buyNow: { eligible: false, reason: 'Out of stock' },
        recommendedMethod: 'request_quote',
      };
    }

    if (stock < item.quantity) {
      return {
        buyNow: { eligible: false, reason: `Only ${stock} in stock` },
        recommendedMethod: 'request_quote',
      };
    }

    if (!allowDirectPurchase) {
      return {
        buyNow: { eligible: false, reason: 'Quote only item' },
        recommendedMethod: 'request_quote',
      };
    }

    if (!isFixedPrice) {
      return {
        buyNow: { eligible: false, reason: 'Price requires quote' },
        recommendedMethod: 'request_quote',
      };
    }

    return {
      buyNow: { eligible: true },
      recommendedMethod: 'buy_now',
    };
  }, []);

  const buyNowForSeller = useCallback(
    async (sellerId: string): Promise<BuyNowResult> => {
      const operationId = `buy-now-seller-${sellerId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      try {
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const result = await cartService.buyNowForSeller(token, sellerId);
        // Refresh cart after buy now
        await refreshCart();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process purchase');
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [getToken, refreshCart]
  );

  const buyNowAll = useCallback(async (): Promise<BuyNowResult> => {
    const operationId = 'buy-now-all';
    setPendingOperations((prev) => new Set(prev).add(operationId));

    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const result = await cartService.buyNowAll(token);
      // Refresh cart after buy now
      await refreshCart();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process purchase');
      throw err;
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  }, [getToken, refreshCart]);

  // =============================================================================
  // Context Value
  // =============================================================================

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      error,
      pendingOperations,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      createRFQForSeller,
      createRFQForAll,
      isItemInCart,
      getItemQuantity,
      // Dual purchase flow
      setItemPurchaseMethod,
      buyNowForSeller,
      buyNowAll,
      getItemEligibility,
    }),
    [
      cart,
      isLoading,
      error,
      pendingOperations,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      createRFQForSeller,
      createRFQForAll,
      isItemInCart,
      getItemQuantity,
      setItemPurchaseMethod,
      buyNowForSeller,
      buyNowAll,
      getItemEligibility,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// =============================================================================
// Hook
// =============================================================================

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
