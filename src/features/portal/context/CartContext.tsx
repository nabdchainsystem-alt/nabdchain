// =============================================================================
// Cart Context - Buyer Cart State Management
// =============================================================================
// Provides cart state with optimistic updates and localStorage sync
// Uses portalApiClient for auth (no token passing needed)
//
// Key design decisions:
// - Uses a requestGeneration counter to prevent stale fetches from overwriting
//   fresh data (race condition fix)
// - Separates isLoading (initial load) from pendingOperations (mutations)
//   so the cart badge stays visible during add/remove operations
// - Optimistic updates include placeholder items in the items[] array
//   so isItemInCart() works immediately after clicking "Add to Cart"
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
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
  // State
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Generation counter: incremented on every mutation so stale refreshCart
  // responses (started before the mutation) don't overwrite fresh data.
  const generationRef = useRef(0);

  // =============================================================================
  // Cart Fetching
  // =============================================================================

  const refreshCart = useCallback(async (showLoading = true) => {
    const myGeneration = ++generationRef.current;
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const fetchedCart = await cartService.getCart(true);
      // Only apply if no newer operation has occurred
      if (generationRef.current === myGeneration) {
        setCart(fetchedCart);
      }
    } catch (err) {
      console.error('[Cart] refreshCart failed:', err);
      if (generationRef.current === myGeneration) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cart');
      }
    } finally {
      // Always clear loading - even if generation changed, we don't want isLoading stuck
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshCart(true);
  }, [refreshCart]);

  // =============================================================================
  // Cart Operations with Optimistic Updates
  // =============================================================================

  const addToCart = useCallback(
    async (itemId: string, quantity = 1) => {
      const operationId = `add-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Bump generation so any in-flight refreshCart is ignored
      generationRef.current++;

      // Store previous state for rollback
      const previousCart = cart;

      // Optimistic update
      if (cart) {
        const existingItem = cart.items.find((i) => i.itemId === itemId);
        if (existingItem) {
          // Update existing item quantity
          setCart({
            ...cart,
            items: cart.items.map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i)),
            itemCount: cart.itemCount + quantity,
          });
        } else {
          // Add new item placeholder so isItemInCart() returns true immediately
          const placeholderItem: CartItem = {
            id: `pending-${itemId}`,
            itemId,
            sellerId: '',
            quantity,
            priceAtAdd: null,
            itemName: null,
            itemSku: null,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCart({
            ...cart,
            items: [...cart.items, placeholderItem],
            itemCount: cart.itemCount + quantity,
            sellerCount: cart.sellerCount,
          });
        }
      }

      try {
        setError(null);
        const updatedCart = await cartService.addToCart({ itemId, quantity });
        // Bump generation again — this is the authoritative state
        generationRef.current++;
        setCart(updatedCart);
        setIsLoading(false);
      } catch (err) {
        // Revert optimistic update to previous state
        generationRef.current++;
        if (previousCart) {
          setCart(previousCart);
        } else {
          // If we had no previous cart, fetch fresh
          await refreshCart(false);
        }
        const errMsg = err instanceof Error ? err.message : 'Failed to add to cart';
        console.error('[Cart] addToCart failed:', errMsg, err);
        setError(errMsg);
        setIsLoading(false);
        throw err;
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(operationId);
          return next;
        });
      }
    },
    [cart, refreshCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const operationId = `update-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      generationRef.current++;

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
              items: cart.items.map((i) => (i.itemId === itemId ? { ...i, quantity } : i)),
              itemCount: cart.itemCount + quantityDiff,
            });
          }
        }
      }

      try {
        setError(null);
        const updatedCart = await cartService.updateCartItem(itemId, { quantity });
        generationRef.current++;
        setCart(updatedCart);
      } catch (err) {
        // Revert optimistic update
        generationRef.current++;
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
    [cart],
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      const operationId = `remove-${itemId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      generationRef.current++;

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
        const updatedCart = await cartService.removeFromCart(itemId);
        generationRef.current++;
        setCart(updatedCart);
      } catch (err) {
        // Revert optimistic update
        generationRef.current++;
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
    [cart],
  );

  const clearCart = useCallback(async () => {
    const operationId = 'clear';
    setPendingOperations((prev) => new Set(prev).add(operationId));

    generationRef.current++;

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
      const updatedCart = await cartService.clearCart();
      generationRef.current++;
      setCart(updatedCart);
    } catch (err) {
      // Revert optimistic update
      generationRef.current++;
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
  }, [cart]);

  // =============================================================================
  // RFQ Creation
  // =============================================================================

  const createRFQForSeller = useCallback(
    async (sellerId: string): Promise<CreateRFQResult> => {
      const operationId = `rfq-seller-${sellerId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      try {
        setError(null);
        const result = await cartService.createRFQForSeller(sellerId);
        // Refresh cart after RFQ creation
        await refreshCart(false);
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
    [refreshCart],
  );

  const createRFQForAll = useCallback(async (): Promise<CreateRFQResult> => {
    const operationId = 'rfq-all';
    setPendingOperations((prev) => new Set(prev).add(operationId));

    try {
      setError(null);
      const result = await cartService.createRFQForAll();
      // Refresh cart after RFQ creation
      await refreshCart(false);
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
  }, [refreshCart]);

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const isItemInCart = useCallback(
    (itemId: string): boolean => {
      if (!cart) return cartService.isItemInLocalCart(itemId);
      return cart.items.some((i) => i.itemId === itemId);
    },
    [cart],
  );

  const getItemQuantity = useCallback(
    (itemId: string): number => {
      if (!cart) return cartService.getLocalItemQuantity(itemId);
      const item = cart.items.find((i) => i.itemId === itemId);
      return item?.quantity ?? 0;
    },
    [cart],
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
        items: cart.items.map((item) => (item.itemId === itemId ? { ...item, selectedMethod: method } : item)),
      });
    },
    [cart],
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
    async (sellerId: string, paymentMethod?: string): Promise<BuyNowResult> => {
      const operationId = `buy-now-seller-${sellerId}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      try {
        setError(null);
        const result = await cartService.buyNowForSeller(sellerId, paymentMethod);
        // Refresh cart after buy now
        await refreshCart(false);
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
    [refreshCart],
  );

  const buyNowAll = useCallback(
    async (paymentMethod?: string): Promise<BuyNowResult> => {
      const operationId = 'buy-now-all';
      setPendingOperations((prev) => new Set(prev).add(operationId));

      try {
        setError(null);
        const result = await cartService.buyNowAll(paymentMethod);
        // Refresh cart after buy now
        await refreshCart(false);
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
    [refreshCart],
  );

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
    ],
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
