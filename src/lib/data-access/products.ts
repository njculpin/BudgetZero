import { dataClient, createAuthenticatedClient } from './client';
import type { Product, ProductVariant, ProductVariantPrice, ProductTag, ProductStatus, Asset } from '@/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CreateProductParams {
  title: string;
  description?: string;
  status?: ProductStatus;
  coverImageUrl?: string;
}

export interface UpdateProductParams {
  title?: string;
  description?: string;
  status?: ProductStatus;
  coverImageUrl?: string;
  handle?: string;
  tags?: string[];
}

export interface CreateVariantParams {
  name: string;
  description?: string;
  sku?: string;
  isDigital?: boolean;
  sortOrder?: number;
}

export interface CreatePriceParams {
  currency?: string;
  unitAmount: number;
  minQuantity?: number;
  maxQuantity?: number;
}

/**
 * Generate a unique handle from title
 */
const generateHandle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

/**
 * Generate a unique handle with collision handling
 */
const generateUniqueHandle = async (baseHandle: string): Promise<string> => {
  let handle = baseHandle;
  let counter = 1;
  let isAvailable = await checkHandleAvailability(handle);

  while (!isAvailable) {
    handle = `${baseHandle}-${counter}`;
    counter++;
    isAvailable = await checkHandleAvailability(handle);
  }

  return handle;
};

/**
 * Check if a handle is available for products
 */
export const checkHandleAvailability = async (
  handle: string,
  currentProductId?: string
): Promise<boolean> => {
  let query = dataClient
    .from('products')
    .select('id')
    .eq('handle', handle)
    .eq('deleted', false);

  if (currentProductId) {
    query = query.neq('id', currentProductId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking handle availability:', error);
    return false;
  }

  return !data || data.length === 0;
};

/**
 * Create a new product
 */
export const createProduct = async (
  userId: string,
  params: CreateProductParams,
  authTokens: AuthTokens
): Promise<Product | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const baseHandle = generateHandle(params.title);
  const handle = await generateUniqueHandle(baseHandle);

  const { data, error } = await client
    .from('products')
    .insert({
      user_id: userId,
      handle,
      title: params.title,
      description: params.description || '',
      status: params.status || 'draft',
      cover_image_url: params.coverImageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data as Product;
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  const { data, error } = await dataClient
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as Product;
};

/**
 * Get product by handle
 */
export const getProductByHandle = async (handle: string): Promise<Product | null> => {
  const { data, error } = await dataClient
    .from('products')
    .select('*')
    .eq('handle', handle)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as Product;
};

/**
 * Update a product
 */
export const updateProduct = async (
  productId: string,
  updates: UpdateProductParams,
  authTokens: AuthTokens
): Promise<boolean> => {
  if (updates.handle) {
    const isAvailable = await checkHandleAvailability(updates.handle, productId);
    if (!isAvailable) {
      throw new Error('Handle is already taken');
    }
  }

  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.coverImageUrl !== undefined) updateData.cover_image_url = updates.coverImageUrl;
  if (updates.handle !== undefined) updateData.handle = updates.handle;

  const { error } = await client
    .from('products')
    .update(updateData)
    .eq('id', productId);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }

  if (updates.tags !== undefined) {
    await client
      .from('product_tags')
      .delete()
      .eq('product_id', productId);

    if (updates.tags.length > 0) {
      for (const tag of updates.tags) {
        await createProductTag(productId, tag, authTokens);
      }
    }
  }

  return true;
};

/**
 * Soft delete a product
 */
export const deleteProduct = async (
  productId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('products')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
};

/**
 * Get published products with optional filters
 */
export const getPublishedProducts = async (
  searchQuery?: string,
  tags?: string[],
  limit: number = 50,
  offset: number = 0
): Promise<Product[]> => {
  let query = dataClient
    .from('products')
    .select('*')
    .eq('status', 'published')
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchQuery && searchQuery.trim()) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) return [];

  let products = data as Product[];

  if (tags && tags.length > 0) {
    const productIds = new Set<string>();
    for (const tag of tags) {
      const { data: tagData } = await dataClient
        .from('product_tags')
        .select('product_id')
        .eq('value', tag.toLowerCase())
        .eq('deleted', false);
      if (tagData) {
        tagData.forEach(t => productIds.add(t.product_id));
      }
    }
    products = products.filter(product => productIds.has(product.id));
  }

  return products;
};

/**
 * Get user's products
 */
export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await dataClient
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data as Product[];
};

// ===== Product Variants =====

/**
 * Create a product variant
 */
export const createVariant = async (
  productId: string,
  params: CreateVariantParams,
  authTokens: AuthTokens
): Promise<ProductVariant | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  let sku = params.sku;

  if (!sku) {
    const product = await getProductById(productId);
    if (!product) return null;
    sku = `${product.handle}-${params.name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  const { data, error } = await client
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      name: params.name,
      description: params.description,
      is_digital: params.isDigital ?? true,
      sort_order: params.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating variant:', error);
    return null;
  }

  return data as ProductVariant;
};

/**
 * Get variants for a product
 */
export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const { data, error } = await dataClient
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('sort_order', { ascending: true });

  if (error) {
    return [];
  }

  return data as ProductVariant[];
};

/**
 * Get variant by ID
 */
export const getVariantById = async (variantId: string): Promise<ProductVariant | null> => {
  const { data, error } = await dataClient
    .from('product_variants')
    .select('*')
    .eq('id', variantId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as ProductVariant;
};

/**
 * Update a variant
 */
export const updateVariant = async (
  variantId: string,
  updates: Partial<CreateVariantParams>,
  authTokens: AuthTokens
): Promise<ProductVariant | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isDigital !== undefined) updateData.is_digital = updates.isDigital;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

  const { error } = await client
    .from('product_variants')
    .update(updateData)
    .eq('id', variantId);

  if (error) {
    console.error('Error updating variant:', error);
    return null;
  }

  return await getVariantById(variantId);
};

/**
 * Delete a variant
 */
export const deleteVariant = async (
  variantId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('product_variants')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', variantId);

  if (error) {
    console.error('Error deleting variant:', error);
    return false;
  }

  return true;
};

// ===== Variant Prices =====

/**
 * Create a price for a variant
 */
export const createVariantPrice = async (
  variantId: string,
  params: CreatePriceParams,
  authTokens: AuthTokens
): Promise<ProductVariantPrice | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { data, error } = await client
    .from('product_variant_prices')
    .insert({
      variant_id: variantId,
      currency: params.currency || 'usd',
      unit_amount: params.unitAmount,
      min_quantity: params.minQuantity || 1,
      max_quantity: params.maxQuantity,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating variant price:', error);
    return null;
  }

  return data as ProductVariantPrice;
};

/**
 * Get prices for a variant
 */
export const getVariantPrices = async (variantId: string): Promise<ProductVariantPrice[]> => {
  const { data, error } = await dataClient
    .from('product_variant_prices')
    .select('*')
    .eq('variant_id', variantId)
    .order('min_quantity', { ascending: true });

  if (error) {
    return [];
  }

  return data as ProductVariantPrice[];
};

// ===== Product Assets =====

/**
 * Link an asset to a variant
 */
export const linkAssetToVariant = async (
  variantId: string,
  assetId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('product_assets')
    .insert({
      variant_id: variantId,
      asset_id: assetId,
    });

  if (error) {
    console.error('Error linking asset to variant:', error);
    return false;
  }

  return true;
};

/**
 * Get assets linked to a variant
 */
export const getVariantAssets = async (variantId: string): Promise<Asset[]> => {
  const { data, error } = await dataClient
    .from('product_assets')
    .select('asset_id')
    .eq('variant_id', variantId);

  if (error || !data) {
    return [];
  }

  const assetIds = data.map(pa => pa.asset_id);

  if (assetIds.length === 0) {
    return [];
  }

  const { data: assets, error: assetsError } = await dataClient
    .from('assets')
    .select('*')
    .in('id', assetIds)
    .eq('deleted', false);

  if (assetsError || !assets) {
    return [];
  }

  return assets as Asset[];
};

/**
 * Unlink an asset from a variant
 */
export const unlinkAssetFromVariant = async (
  variantId: string,
  assetId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('product_assets')
    .delete()
    .eq('variant_id', variantId)
    .eq('asset_id', assetId);

  if (error) {
    console.error('Error unlinking asset from variant:', error);
    return false;
  }

  return true;
};

// ===== Product Tags =====

/**
 * Create a product tag
 */
export const createProductTag = async (
  productId: string,
  tag: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('product_tags')
    .insert({
      product_id: productId,
      value: tag.toLowerCase().trim(),
    });

  if (error) {
    // Ignore duplicate tag errors
    if (error.code === '23505') return true;
    console.error('Error creating product tag:', error);
    return false;
  }

  return true;
};

/**
 * Get tags for a product
 */
export const getProductTags = async (productId: string): Promise<ProductTag[]> => {
  const { data, error } = await dataClient
    .from('product_tags')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false);

  if (error) {
    return [];
  }

  return data as ProductTag[];
};

/**
 * Get popular product tags
 */
export const getPopularProductTags = async (limit: number = 20): Promise<Array<{ value: string; count: number }>> => {
  const { data, error } = await dataClient
    .from('product_tags')
    .select('value')
    .eq('deleted', false);

  if (error || !data) {
    return [];
  }

  const tagCounts = data.reduce((acc, tag) => {
    acc[tag.value] = (acc[tag.value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(tagCounts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};
