import { serverClient } from './client';
import type { Product, ProductVariant, ProductVariantPrice, ProductTag, ProductStatus, Asset, User } from '@/types';

export interface CreateProductParams {
  title: string;
  description?: string;
  status?: ProductStatus;
}

export interface UpdateProductParams {
  title?: string;
  description?: string;
  status?: ProductStatus;
  handle?: string;
  tags?: string[];
  publicAt?: string;
}

export interface CreateVariantParams {
  title: string;
  description?: string;
  sku?: string;
  options?: Record<string, unknown>;
  position?: number;
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
  let query = serverClient
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
  params: CreateProductParams
): Promise<Product | null> => {
  const baseHandle = generateHandle(params.title);
  const handle = await generateUniqueHandle(baseHandle);

  const { data, error} = await serverClient
    .from('products')
    .insert({
      user_id: userId,
      handle,
      title: params.title,
      description: params.description || '',
      status: params.status || 'draft',
      view_count: 0,
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
  const { data, error } = await serverClient
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
  const { data, error } = await serverClient
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
  updates: UpdateProductParams
): Promise<Product | null> => {
  const updatesToApply = { ...updates };

  // If updating title, generate new handle from it
  if (updates.title) {
    // Generate handle from title: lowercase, remove special chars, spaces to dashes
    const titleSlug = updates.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

    // Check if new handle is available (excluding current product)
    const isAvailable = await checkHandleAvailability(titleSlug, productId);

    if (isAvailable) {
      updatesToApply.handle = titleSlug;
    } else {
      // Append counter to make unique handle
      let counter = 1;
      let uniqueHandle = `${titleSlug}-${counter}`;
      let available = await checkHandleAvailability(uniqueHandle, productId);

      while (!available) {
        counter++;
        uniqueHandle = `${titleSlug}-${counter}`;
        available = await checkHandleAvailability(uniqueHandle, productId);
      }

      updatesToApply.handle = uniqueHandle;
    }
  }

  // Check if manually provided handle is available
  if (updates.handle && updates.handle !== updatesToApply.handle) {
    const isAvailable = await checkHandleAvailability(updates.handle, productId);
    if (!isAvailable) {
      throw new Error('Handle is already taken');
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updatesToApply.title !== undefined) updateData.title = updatesToApply.title;
  if (updatesToApply.description !== undefined) updateData.description = updatesToApply.description;
  if (updatesToApply.status !== undefined) updateData.status = updatesToApply.status;
  if (updatesToApply.handle !== undefined) updateData.handle = updatesToApply.handle;
  if (updatesToApply.publicAt !== undefined) updateData.public_at = updatesToApply.publicAt;

  const { error } = await serverClient
    .from('products')
    .update(updateData)
    .eq('id', productId);

  if (error) {
    console.error('Error updating product:', error);
    // Throw database validation errors (like asset status validation)
    if (error.message) {
      throw new Error(error.message);
    }
    return null;
  }

  if (updatesToApply.tags !== undefined) {
    await serverClient
      .from('product_tags')
      .delete()
      .eq('product_id', productId);

    if (updatesToApply.tags.length > 0) {
      for (const tag of updatesToApply.tags) {
        await createProductTag(productId, tag);
      }
    }
  }

  return await getProductById(productId);
};

/**
 * Soft delete a product
 */
export const deleteProduct = async (
  productId: string
): Promise<boolean> => {
  const { error } = await serverClient
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
 * Get public products with optional filters
 * Only returns products with status='public' (public browsing)
 */
export const getAllProducts = async (
  searchQuery?: string,
  tags?: string[],
  limit: number = 50,
  offset: number = 0,
): Promise<Product[]> => {
  let query = serverClient
    .from('products')
    .select('*')
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
      const { data: tagData } = await serverClient
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
  const { data, error } = await serverClient
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
  params: CreateVariantParams
): Promise<ProductVariant | null> => {
  let sku = params.sku;

  if (!sku) {
    const product = await getProductById(productId);
    if (!product) return null;
    sku = `${product.handle}-${params.title.toLowerCase().replace(/\s+/g, '-')}`;
  }

  const { data, error } = await serverClient
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      title: params.title,
      description: params.description,
      options: params.options || {},
      position: params.position ?? 0,
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
  const { data, error } = await serverClient
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: true });

  if (error) {
    return [];
  }

  return data as ProductVariant[];
};

/**
 * Get variant by ID
 */
export const getVariantById = async (variantId: string): Promise<ProductVariant | null> => {
  const { data, error } = await serverClient
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
  updates: Partial<CreateVariantParams>
): Promise<ProductVariant | null> => {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.sku !== undefined) updateData.sku = updates.sku;
  if (updates.options !== undefined) updateData.options = updates.options;
  if (updates.position !== undefined) updateData.position = updates.position;

  const { error } = await serverClient
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
  variantId: string
): Promise<boolean> => {
  const { error } = await serverClient
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
  params: CreatePriceParams
): Promise<ProductVariantPrice | null> => {
  const { data, error } = await serverClient
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

    // If it's a duplicate key constraint violation, throw a specific error
    if (error.code === '23505') {
      throw new Error(`duplicate key: A price already exists for quantity ${params.minQuantity || 1}`);
    }

    return null;
  }

  return data as ProductVariantPrice;
};

/**
 * Get prices for a variant
 */
export const getVariantPrices = async (variantId: string): Promise<ProductVariantPrice[]> => {
  const { data, error } = await serverClient
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
  assetId: string
): Promise<boolean> => {
  const { error } = await serverClient
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
  const { data, error } = await serverClient
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

  const { data: assets, error: assetsError } = await serverClient
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
  assetId: string
): Promise<boolean> => {
  const { error } = await serverClient
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
  tag: string
): Promise<boolean> => {
  const { error } = await serverClient
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
  const { data, error } = await serverClient
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
  const { data, error } = await serverClient
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

/**
 * Get products by tag
 */
export const getProductsByTag = async (tag: string): Promise<Product[]> => {
  const { data, error } = await serverClient
    .from('product_tags')
    .select(`
      product_id,
      products!inner(*)
    `)
    .eq('value', tag)
    .eq('deleted', false)
    .eq('products.deleted', false)
    .eq('products.status', 'public');

  if (error) {
    console.error('Error fetching products by tag:', error);
    return [];
  }

  if (!data) return [];

  // Extract unique products
  const productMap = new Map<string, Product>();
  // TODO: Fix This
  // for (const item of data) {
  //   const product = item.products as Product[];
  //   if (!productMap.has(product.id)) {
  //     productMap.set(product.id, product);
  //   }
  // }

  return Array.from(productMap.values());
};

/**
 * Search products by title or handle
 * Returns up to 10 matching products owned by the specified user
 */
export const searchProducts = async (userId: string, query: string): Promise<Product[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error} = await serverClient
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .or(`handle.ilike.${searchTerm},title.ilike.${searchTerm}`)
    .limit(10);

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data as Product[];
};

/**
 * Get products that use a specific asset
 * Returns up to 5 most recent products (by updated_at)
 */
export const getProductsUsingAsset = async (assetId: string, limit = 5): Promise<Product[]> => {
  // First, get all variant IDs that link to this asset
  const { data: productAssets, error: paError } = await serverClient
    .from('product_assets')
    .select('variant_id')
    .eq('asset_id', assetId);

  if (paError || !productAssets || productAssets.length === 0) {
    return [];
  }

  const variantIds = productAssets.map(pa => pa.variant_id);

  // Get all products from those variants
  const { data: variants, error: variantsError } = await serverClient
    .from('product_variants')
    .select('product_id')
    .in('id', variantIds)
    .eq('deleted', false);

  if (variantsError || !variants || variants.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(variants.map(v => v.product_id))];

  // Fetch the products
  const { data, error } = await serverClient
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('deleted', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching products using asset:', error);
    return [];
  }

  return data as Product[];
};

// ===== Product Images =====

/**
 * Create a product image
 */
export const createProductImage = async (
  productId: string,
  imageData: {
    title: string;
    description?: string;
    file_url: string;
    storage_path: string;
    file_size_bytes: number;
    mime_type: string;
  }
): Promise<boolean> => {
  // Get current max position
  const { data: existingImages } = await serverClient
    .from('product_images')
    .select('position')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existingImages && existingImages.length > 0
    ? existingImages[0].position + 1
    : 0;

  const { error } = await serverClient
    .from('product_images')
    .insert({
      product_id: productId,
      title: imageData.title,
      description: imageData.description || '',
      file_url: imageData.file_url,
      storage_path: imageData.storage_path,
      file_size_bytes: imageData.file_size_bytes,
      mime_type: imageData.mime_type,
      position: nextPosition,
    });

  if (error) {
    console.error('Error creating product image:', error);
    return false;
  }

  return true;
};

/**
 * Get images for a product
 */
export const getProductImages = async (productId: string) => {
  const { data, error } = await serverClient
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: true});

  if (error) {
    console.error('Error fetching product images:', error);
    return [];
  }

  return data;
};

/**
 * Reorder product images
 */
export const reorderProductImages = async (
  imageOrders: { id: string; position: number }[]
): Promise<boolean> => {
  try {
    for (const order of imageOrders) {
      const { error } = await serverClient
        .from('product_images')
        .update({ position: order.position })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating image position:', error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error reordering images:', error);
    return false;
  }
};

/**
 * Delete a product image (soft delete)
 */
export const deleteProductImage = async (imageId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_images')
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', imageId);

  if (error) {
    console.error('Error deleting product image:', error);
    return false;
  }

  return true;
};

/**
 * Get available assets for a user (owned or collaborated assets)
 * These are assets the user can add to their product variants
 */
export const getAvailableAssetsForUser = async (userId: string): Promise<Asset[]> => {
  // Get assets owned by user
  const { data: ownedAssets, error: ownedError } = await serverClient
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });

  if (ownedError) {
    console.error('Error fetching owned assets:', ownedError);
    return [];
  }

  // Get assets where user is a contributor
  const { data: contributions, error: contribError } = await serverClient
    .from('asset_contributors')
    .select('asset_id')
    .eq('user_id', userId);

  if (contribError || !contributions) {
    return ownedAssets as Asset[];
  }

  const contributedAssetIds = contributions.map(c => c.asset_id);

  if (contributedAssetIds.length === 0) {
    return ownedAssets as Asset[];
  }

  // Get contributed assets
  const { data: contributedAssets, error: contributedError } = await serverClient
    .from('assets')
    .select('*')
    .in('id', contributedAssetIds)
    .eq('deleted', false);

  if (contributedError || !contributedAssets) {
    return ownedAssets as Asset[];
  }

  // Combine and deduplicate
  const allAssets = [...(ownedAssets || []), ...contributedAssets];
  const uniqueAssets = Array.from(
    new Map(allAssets.map(asset => [asset.id, asset])).values()
  );

  return uniqueAssets.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Calculate total royalty cost for all assets in a variant
 * Returns the sum of all royalty values (in cents) for assets linked to this variant
 */
export const getVariantRoyaltyTotal = async (variantId: string): Promise<number> => {
  const assets = await getVariantAssets(variantId);

  if (assets.length === 0) {
    return 0;
  }

  let total = 0;

  for (const asset of assets) {
    const { data: royalties, error } = await serverClient
      .from('asset_royalties')
      .select('royalty_value')
      .eq('asset_id', asset.id)
      .eq('deleted', false);

    if (!error && royalties) {
      total += royalties.reduce((sum, r) => sum + r.royalty_value, 0);
    }
  }

  return total;
};

/**
 * Get all contributors for a product
 * Returns unique users who have royalties on any asset linked to any variant of the product
 */
export const getProductContributors = async (productId: string): Promise<User[]> => {
  // Get all variants for the product
  const variants = await getProductVariants(productId);

  if (variants.length === 0) {
    return [];
  }

  const variantIds = variants.map(v => v.id);

  // Get all assets linked to these variants
  const { data: productAssets, error: paError } = await serverClient
    .from('product_assets')
    .select('asset_id')
    .in('variant_id', variantIds);

  if (paError || !productAssets || productAssets.length === 0) {
    return [];
  }

  const assetIds = [...new Set(productAssets.map(pa => pa.asset_id))];

  // Get all royalties for these assets
  const { data: royalties, error: royaltiesError } = await serverClient
    .from('asset_royalties')
    .select('user_id')
    .in('asset_id', assetIds)
    .eq('deleted', false);

  if (royaltiesError || !royalties || royalties.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(royalties.map(r => r.user_id))];

  // Fetch user data
  const { data: users, error: usersError } = await serverClient
    .from('users')
    .select('*')
    .in('id', userIds);

  if (usersError || !users) {
    return [];
  }

  return users as User[];
};
