"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  projectId: string;
  projectTitle: string;
  pricingTierId: string;
  pricingTierName: string;
  price: number;
  coverImageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (projectId: string, pricingTierId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "workshop_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // Check if item already exists
      const exists = prev.find(
        (i) =>
          i.projectId === item.projectId &&
          i.pricingTierId === item.pricingTierId,
      );

      if (exists) {
        // Item already in cart, don't add duplicate
        return prev;
      }

      return [...prev, item];
    });
  };

  const removeItem = (projectId: string, pricingTierId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.projectId === projectId && item.pricingTierId === pricingTierId
          ),
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
