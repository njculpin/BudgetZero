import { serverClient } from './client';
import type {
  Product,
  ProductTag,
  ProductStatus,
  ProductFile,
  ProductDocument,
  ProductComponent,
  ProductRoyalty,
  Asset,
  User,
  Document
} from '@/types';

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
  isEmbeddable?: boolean;
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
  if (updatesToApply.isEmbeddable !== undefined) updateData.is_embeddable = updatesToApply.isEmbeddable;

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

/**
 * Get user's recent products for navigation dropdown
 * Returns most recent products ordered by updated_at
 */
export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  status: ProductStatus;
  updated_at: string;
  thumbnail_url: string | null;
}

export const getRecentProducts = async (
  userId: string,
  limit: number = 5
): Promise<ProductSummary[]> => {
  const { data, error } = await serverClient
    .from('products')
    .select('id, handle, title, status, updated_at')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent products:', error);
    return [];
  }

  // Fetch first image for each product
  const productsWithThumbnails = await Promise.all(
    (data || []).map(async (product) => {
      const images = await getProductImages(product.id);
      const thumbnailUrl = images.length > 0 ? images[0].file_url : null;

      return {
        ...product,
        thumbnail_url: thumbnailUrl,
      } as ProductSummary;
    })
  );

  return productsWithThumbnails;
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
 * Get all contributors for a product
 * Returns unique users who have royalties on the product
 */
export const getProductContributors = async (productId: string): Promise<User[]> => {
  // Get all royalties for this product
  const { data: royalties, error: royaltiesError } = await serverClient
    .from('product_royalties')
    .select('user_id')
    .eq('product_id', productId)
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

// ===== Product Files (replaces Asset Files) =====

/**
 * Create a product file
 */
export const createProductFile = async (
  productId: string,
  fileData: {
    title: string;
    description?: string;
    file_url: string;
    storage_path: string;
    file_size_bytes: number;
    mime_type: string;
  }
): Promise<ProductFile | null> => {
  // Get current max position
  const { data: existingFiles } = await serverClient
    .from('product_files')
    .select('position')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existingFiles && existingFiles.length > 0
    ? existingFiles[0].position + 1
    : 0;

  const { data, error } = await serverClient
    .from('product_files')
    .insert({
      product_id: productId,
      title: fileData.title,
      description: fileData.description || '',
      file_url: fileData.file_url,
      storage_path: fileData.storage_path,
      file_size_bytes: fileData.file_size_bytes,
      mime_type: fileData.mime_type,
      position: nextPosition,
      price_cents: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product file:', error);
    return null;
  }

  return data as ProductFile;
};

/**
 * Get files for a product
 */
export const getProductFiles = async (productId: string): Promise<ProductFile[]> => {
  const { data, error } = await serverClient
    .from('product_files')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching product files:', error);
    return [];
  }

  return data as ProductFile[];
};

/**
 * Get product file by ID
 */
export const getProductFileById = async (fileId: string): Promise<ProductFile | null> => {
  const { data, error } = await serverClient
    .from('product_files')
    .select('*')
    .eq('id', fileId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as ProductFile;
};

/**
 * Delete product file (soft delete)
 */
export const deleteProductFile = async (fileId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_files')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error deleting product file:', error);
    return false;
  }

  return true;
};

/**
 * Update product file price
 */
export const updateProductFilePrice = async (
  fileId: string,
  priceCents: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_files')
    .update({
      price_cents: priceCents,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error updating product file price:', error);
    return false;
  }

  return true;
};

/**
 * Reorder product files
 */
export const reorderProductFiles = async (
  fileOrders: Array<{ id: string; position: number }>
): Promise<boolean> => {
  try {
    for (const { id, position } of fileOrders) {
      const { error } = await serverClient
        .from('product_files')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error reordering file:', error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error reordering files:', error);
    return false;
  }
};

// ===== Product Components (Product-in-Product) =====
// Note: Product-level embedding functions are in the API layer

/**
 * Get all products that are embeddable (for component selection)
 */
export const getEmbeddableProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await serverClient
    .from('products')
    .select('*')
    .eq('is_embeddable', true)
    .eq('deleted', false)
    .or(`user_id.eq.${userId},status.eq.public`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching embeddable products:', error);
    return [];
  }

  return data as Product[];
};

// ===== Product Royalties =====

/**
 * Get all royalties for a product
 */
export const getProductRoyalties = async (productId: string): Promise<ProductRoyalty[]> => {
  const { data, error } = await serverClient
    .from('product_royalties')
    .select('*')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching product royalties:', error);
    return [];
  }

  return data as ProductRoyalty[];
};

/**
 * Create a new royalty for a product
 */
export const createProductRoyalty = async (
  productId: string,
  userId: string,
  royaltyType: 'fixed' | 'percentage',
  royaltyValue: number
): Promise<ProductRoyalty | null> => {
  const { data, error } = await serverClient
    .from('product_royalties')
    .insert({
      product_id: productId,
      user_id: userId,
      royalty_type: royaltyType,
      royalty_value: royaltyValue,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product royalty:', error);
    return null;
  }

  return data as ProductRoyalty;
};

/**
 * Update an existing royalty
 */
export const updateProductRoyalty = async (
  royaltyId: string,
  royaltyValue: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_royalties')
    .update({
      royalty_value: royaltyValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error updating product royalty:', error);
    return false;
  }

  return true;
};

/**
 * Delete a royalty (soft delete)
 */
export const deleteProductRoyalty = async (royaltyId: string): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_royalties')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error deleting product royalty:', error);
    return false;
  }

  return true;
};

/**
 * Calculate total royalty cost for a product
 * Returns the sum of all fixed royalties (in cents)
 */
export const calculateProductRoyaltyTotal = async (productId: string): Promise<number> => {
  const royalties = await getProductRoyalties(productId);
  return royalties
    .filter(r => r.royalty_type === 'fixed')
    .reduce((total, royalty) => total + royalty.royalty_value, 0);
};

/**
 * Calculate total product price (file prices + embedded product prices)
 * Returns total price in cents
 */
export const calculateProductTotalPrice = async (productId: string): Promise<number> => {
  // Get file prices
  const { data: files } = await serverClient
    .from('product_files')
    .select('price_cents')
    .eq('product_id', productId)
    .eq('deleted', false);

  const filePriceTotal = (files || []).reduce(
    (sum, file) => sum + (file.price_cents || 0),
    0
  );

  // Get embedded product prices
  const { data: components } = await serverClient
    .from('product_components')
    .select('inherited_price_cents')
    .eq('parent_product_id', productId)
    .eq('deleted', false);

  const embeddedPriceTotal = (components || []).reduce(
    (sum, comp) => sum + (comp.inherited_price_cents || 0),
    0
  );

  return filePriceTotal + embeddedPriceTotal;
};

/**
 * Get product price breakdown
 * Returns detailed breakdown of file prices and embedded product prices
 */
/**
 * Get embedded products (product components) for a product
 */
export const getProductComponents = async (productId: string): Promise<ProductComponent[]> => {
  const { data, error } = await serverClient
    .from('product_components')
    .select('*')
    .eq('parent_product_id', productId)
    .eq('deleted', false);

  if (error) {
    console.error('Error fetching product components:', error);
    return [];
  }

  return data as ProductComponent[];
};

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10;

export const getProductPriceBreakdown = async (productId: string): Promise<{
  filePriceTotal: number;
  documentPriceTotal: number;
  embeddedPriceTotal: number;
  subtotal: number;
  platformFee: number;
  totalPrice: number;
}> => {
  // Get file prices
  const { data: files } = await serverClient
    .from('product_files')
    .select('price_cents')
    .eq('product_id', productId)
    .eq('deleted', false);

  const filePriceTotal = (files || []).reduce(
    (sum, file) => sum + (file.price_cents || 0),
    0
  );

  // Get document prices
  const { data: documents } = await serverClient
    .from('product_documents')
    .select('price_cents')
    .eq('product_id', productId)
    .eq('deleted', false);

  const documentPriceTotal = (documents || []).reduce(
    (sum, doc) => sum + (doc.price_cents || 0),
    0
  );

  // Get embedded product prices
  const { data: components } = await serverClient
    .from('product_components')
    .select('inherited_price_cents')
    .eq('parent_product_id', productId)
    .eq('deleted', false);

  const embeddedPriceTotal = (components || []).reduce(
    (sum, comp) => sum + (comp.inherited_price_cents || 0),
    0
  );

  const subtotal = filePriceTotal + documentPriceTotal + embeddedPriceTotal;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENTAGE);
  const totalPrice = subtotal + platformFee;

  return {
    filePriceTotal,
    documentPriceTotal,
    embeddedPriceTotal,
    subtotal,
    platformFee,
    totalPrice,
  };
};

/**
 * Get documents attached to a product with full document details
 */
export const getProductDocuments = async (
  productId: string
): Promise<(ProductDocument & { document: Document })[]> => {
  const { data, error } = await serverClient
    .from('product_documents')
    .select(`
      *,
      document:documents(*)
    `)
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching product documents:', error);
    return [];
  }

  return data as (ProductDocument & { document: Document })[];
};

/**
 * Add a document to a product
 */
export const addDocumentToProduct = async (
  productId: string,
  documentId: string,
  priceCents: number = 0
): Promise<ProductDocument | null> => {
  // Get current max position
  const { data: existingDocs } = await serverClient
    .from('product_documents')
    .select('position')
    .eq('product_id', productId)
    .eq('deleted', false)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existingDocs && existingDocs.length > 0
    ? existingDocs[0].position + 1
    : 0;

  const { data, error } = await serverClient
    .from('product_documents')
    .insert({
      product_id: productId,
      document_id: documentId,
      price_cents: priceCents,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding document to product:', error);
    return null;
  }

  return data as ProductDocument;
};

/**
 * Remove a document from a product (soft delete)
 */
export const removeDocumentFromProduct = async (
  productDocumentId: string
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_documents')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', productDocumentId);

  if (error) {
    console.error('Error removing document from product:', error);
    return false;
  }

  return true;
};

/**
 * Update product document price
 */
export const updateProductDocumentPrice = async (
  productDocumentId: string,
  priceCents: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('product_documents')
    .update({
      price_cents: priceCents,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productDocumentId);

  if (error) {
    console.error('Error updating product document price:', error);
    return false;
  }

  return true;
};
