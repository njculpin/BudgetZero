import { dataClient, createAuthenticatedClient } from './client';
import type { Cart, CartItem } from '@/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Get or create a cart for a user
 */
export const getOrCreateCart = async (
  userId: string,
  authTokens: AuthTokens
): Promise<Cart | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  // Try to find existing cart
  const { data: existingCart } = await client
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingCart) {
    return existingCart as Cart;
  }

  // Create new cart if none exists
  const { data: newCart, error } = await client
    .from('carts')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating cart:', error);
    return null;
  }

  return newCart as Cart;
};

/**
 * Get cart by ID
 */
export const getCartById = async (cartId: string): Promise<Cart | null> => {
  const { data, error } = await dataClient
    .from('carts')
    .select('*')
    .eq('id', cartId)
    .single();

  if (error) {
    return null;
  }

  return data as Cart;
};

/**
 * Get all items in a cart
 */
export const getCartItems = async (cartId: string): Promise<CartItem[]> => {
  const { data, error } = await dataClient
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data as CartItem[];
};

/**
 * Add item to cart or update quantity if already exists
 */
export const addToCart = async (
  cartId: string,
  productId: string,
  variantId: string,
  quantity: number,
  authTokens: AuthTokens
): Promise<CartItem | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  // Check if item already exists in cart
  const { data: existingItem } = await client
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)
    .single();

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    const { data, error } = await client
      .from('cart_items')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cart item:', error);
      return null;
    }

    return data as CartItem;
  }

  // Add new item to cart
  const { data, error } = await client
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding to cart:', error);
    return null;
  }

  return data as CartItem;
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    return await removeFromCart(cartItemId, authTokens);
  }

  const { error } = await client
    .from('cart_items')
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cartItemId);

  if (error) {
    console.error('Error updating cart item quantity:', error);
    return false;
  }

  return true;
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (
  cartItemId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) {
    console.error('Error removing from cart:', error);
    return false;
  }

  return true;
};

/**
 * Clear all items from cart
 */
export const clearCart = async (
  cartId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  if (error) {
    console.error('Error clearing cart:', error);
    return false;
  }

  return true;
};

/**
 * Get cart item count for a user
 */
export const getCartItemCount = async (userId: string): Promise<number> => {
  // First get the cart
  const { data: cart } = await dataClient
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) {
    return 0;
  }

  // Get count of items
  const { count, error } = await dataClient
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('cart_id', cart.id);

  if (error) {
    return 0;
  }

  return count || 0;
};
