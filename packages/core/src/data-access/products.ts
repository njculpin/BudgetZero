import { serverClient } from './client';
import type {
  Product,
  ProductTag,
  ProductStatus,
  ProductFile,
  ProductDocument,
  ProductComponent,
  User,
  Document
} from '../types';

/** One `product_components` row with its to-one embeds resolved. */
interface ComponentWithDetailsRow {
  child_product_id: string;
  inherited_price_cents: number;
  child_product: {
    id: string;
    title: string;
    handle: string;
    user_id: string;
    creator: { id: string; name: string | null; handle: string } | null;
  } | null;
}



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
  embeddingRoyaltyCents?: number;
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
  if (updates.title && !updates.handle) {
    // Auto-generate handle from title only if no custom handle is provided
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

  // If manually providing a custom handle, verify it's available
  if (updates.handle) {
    const isAvailable = await checkHandleAvailability(updates.handle, productId);
    if (!isAvailable) {
      throw new Error('Handle is already taken');
    }
    updatesToApply.handle = updates.handle;
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
  if (updatesToApply.embeddingRoyaltyCents !== undefined) updateData.embedding_royalty_cents = updatesToApply.embeddingRoyaltyCents;

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
  sortBy: string = 'newest'
): Promise<Product[]> => {
  let query = serverClient
    .from('products')
    .select('*')
    .eq('deleted', false)
    .eq('status', 'public');

  // Apply sorting based on sortBy parameter
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    case 'title-az':
      query = query.order('title', { ascending: true });
      break;
    case 'title-za':
      query = query.order('title', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

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

  // Extract unique products from the joined results. PostgREST types an embedded
  // relation as an array even when the foreign key yields a single row.
  const productMap = new Map<string, Product>();
  for (const item of data as unknown as Array<{ products: Product | Product[] | null }>) {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    if (product && !productMap.has(product.id)) {
      productMap.set(product.id, product);
    }
  }

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

/**
 * Enhanced contributor information with role context
 */
export interface ProductContributorWithRole {
  user: User;
  contributedVia: string; // The embedded product title
  role: string; // Inferred from embedded product or tags
}

/**
 * Get contributors with role information based on embedded products
 * Returns contributors with context about what they contributed
 */
export const getProductContributorsWithRoles = async (
  productId: string
): Promise<ProductContributorWithRole[]> => {
  // Get all royalties with user info
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

  // Get embedded products for this parent product
  const { data: components, error: componentsError } = await serverClient
    .from('product_components')
    .select('child_product_id, inherited_price_cents')
    .eq('parent_product_id', productId)
    .eq('deleted', false);

  // Map contributors to their embedded products
  const contributorsWithRoles: ProductContributorWithRole[] = [];

  for (const user of users) {
    // Find which embedded product this user owns
    let contributedVia = '';
    let role = 'Contributor';

    if (components && components.length > 0) {
      for (const component of components) {
        const childProduct = await getProductById(component.child_product_id);
        if (childProduct && childProduct.user_id === user.id) {
          contributedVia = childProduct.title;

          // Infer role from product title or tags
          const title = childProduct.title.toLowerCase();
          const tags = await getProductTags(childProduct.id);
          const tagValues = tags.map(t => t.value.toLowerCase());

          if (
            title.includes('stl') ||
            title.includes('3d') ||
            title.includes('model') ||
            tagValues.some(t => t.includes('stl') || t.includes('3d'))
          ) {
            role = '3D Modeler';
          } else if (
            title.includes('art') ||
            title.includes('illustration') ||
            title.includes('character') ||
            tagValues.some(t =>
              t.includes('art') || t.includes('illustration')
            )
          ) {
            role = 'Illustrator';
          } else if (
            title.includes('map') ||
            tagValues.some(t => t.includes('map'))
          ) {
            role = 'Map Designer';
          } else if (
            title.includes('music') ||
            title.includes('sound') ||
            tagValues.some(t => t.includes('music') || t.includes('audio'))
          ) {
            role = 'Sound Designer';
          } else if (
            title.includes('document') ||
            title.includes('rule') ||
            title.includes('guide')
          ) {
            role = 'Writer';
          }

          break;
        }
      }
    }

    contributorsWithRoles.push({
      user,
      contributedVia,
      role,
    });
  }

  return contributorsWithRoles;
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
    price_cents?: number;
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
      price_cents: fileData.price_cents ?? 0,
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

// Product royalty read/write helpers live in ./royalties.ts.
// A duplicate set previously lived here with a DIFFERENT createProductRoyalty
// signature and no production callers, so whoever implements the royalty write
// path had a coin-flip chance of calling the wrong one. Removed deliberately.

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

/**
 * Get embedded products with full product and creator details
 * Optimized to avoid N+1 queries by using a single join query
 */
export const getProductComponentsWithDetails = async (productId: string): Promise<Array<{
  id: string;
  title: string;
  handle: string;
  inherited_price_cents: number;
  creator_name: string;
}>> => {
  const { data, error } = await serverClient
    .from('product_components')
    .select(`
      child_product_id,
      inherited_price_cents,
      child_product:products!product_components_child_product_id_fkey (
        id,
        title,
        handle,
        user_id,
        creator:users!products_user_id_fkey (
          id,
          name,
          handle
        )
      )
    `)
    .eq('parent_product_id', productId)
    .eq('deleted', false);

  if (error) {
    console.error('Error fetching product components with details:', error);
    return [];
  }

  if (!data) return [];

  // Both embeds above follow a foreign key to a single row, so PostgREST returns
  // each as an object. The generated types describe them as arrays because
  // cardinality is not recoverable from the select string, so the shape is
  // asserted here. This was previously `component: any`, which hid the mismatch
  // rather than resolving it.
  const components = data as unknown as ComponentWithDetailsRow[];

  return components.map((component) => ({
    id: component.child_product?.id ?? '',
    title: component.child_product?.title ?? 'Unknown Product',
    handle: component.child_product?.handle ?? '',
    inherited_price_cents: component.inherited_price_cents,
    creator_name:
      component.child_product?.creator?.name ||
      component.child_product?.creator?.handle ||
      'Unknown',
  }));
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

  /**
   * Platform fee calculation with rounding strategy:
   * - Calculation: subtotal * 10% (PLATFORM_FEE_PERCENTAGE)
   * - Rounding: Math.round() rounds to nearest integer (0.5 rounds up)
   * - Rationale: Avoids fractional cents in pricing
   *
   * Examples:
   * - $10.00 (1000¢) → fee: 100¢ ($1.00) ✓ exact
   * - $10.01 (1001¢) → fee: 100¢ ($1.00) ✓ rounds down
   * - $10.05 (1005¢) → fee: 101¢ ($1.01) ✓ rounds up
   * - $10.99 (1099¢) → fee: 110¢ ($1.10) ✓ rounds up
   *
   * Impact: Platform fee may vary by ±0.5¢ from exact percentage
   * Maximum variance: $0.005 (negligible at typical price points)
   */
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
    .select(`
      *,
      document:documents(*)
    `)
    .single();

  if (error) {
    console.error('Error adding document to product:', error);
    return null;
  }

  return data as ProductDocument;
};

/**
 * Ensure all documents attached to a product have PDFs generated
 * Called when a product is purchased to make documents downloadable
 * Only generates PDFs for documents that don't already have them
 */
export const ensureProductDocumentPDFs = async (
  productId: string
): Promise<void> => {
  const productDocuments = await getProductDocuments(productId);

  for (const productDoc of productDocuments) {
    // Skip if PDF already exists
    if (productDoc.pdf_url && productDoc.pdf_storage_path) {
      continue;
    }

    // Generate mock PDF URL for now
    // TODO: Implement actual PDF generation using Puppeteer/Playwright
    // This would:
    // 1. Fetch document content (TipTap JSON)
    // 2. Convert to HTML
    // 3. Render HTML to PDF
    // 4. Upload to Supabase Storage
    // 5. Update product_documents with real PDF URL

    const storagePath = `products/${productId}/documents/${productDoc.document_id}.pdf`;
    const mockPdfUrl = `https://placeholder-pdf-url/${productId}/${productDoc.document_id}.pdf`;

    const { error } = await serverClient
      .from('product_documents')
      .update({
        pdf_url: mockPdfUrl,
        pdf_storage_path: storagePath,
      })
      .eq('id', productDoc.id);

    if (error) {
      console.error(`Failed to update PDF for product_document ${productDoc.id}:`, error);
    }
  }
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

export interface EmbeddedUsageEntry {
  /** The parent product that embeds one of this user's components. */
  id: string;
  title: string;
  handle: string;
  cover_image_url: string | null;
  owner_name: string;
  owner_handle: string;
  /** Price inherited by the parent when the component was embedded, in cents. */
  inherited_price_cents: number;
  /** Royalties this user has earned from sales of that parent product, in cents. */
  total_earnings_cents: number;
  /** Number of royalty transactions contributing to `total_earnings_cents`. */
  sales_count: number;
}

/**
 * Find every product that embeds one of this user's components, along with what the
 * user has earned from each.
 *
 * Earnings are attributed by walking royalty transactions back to the sale item that
 * produced them: `sale_items.product_id` is the parent product the customer actually
 * bought, which is the product a creator wants to see their component credited
 * against.
 */
export const getEmbeddedUsageForUser = async (
  userId: string
): Promise<EmbeddedUsageEntry[]> => {
  // The user's own embeddable products
  const { data: userProducts, error: userProductsError } = await serverClient
    .from('products')
    .select('id')
    .eq('user_id', userId)
    .eq('is_embeddable', true)
    .eq('deleted', false);

  if (userProductsError) {
    console.error('Error fetching user products:', userProductsError);
    return [];
  }

  if (!userProducts || userProducts.length === 0) {
    return [];
  }

  const userProductIds = userProducts.map((p: { id: string }) => p.id);

  // Parent products embedding any of them
  const { data: components, error: componentsError } = await serverClient
    .from('product_components')
    .select(`
      parent_product_id,
      child_product_id,
      inherited_price_cents,
      products!product_components_parent_product_id_fkey (
        id,
        title,
        handle,
        cover_image_url,
        user_id,
        users!products_user_id_fkey (
          name,
          handle
        )
      )
    `)
    .in('child_product_id', userProductIds)
    .eq('deleted', false);

  if (componentsError) {
    console.error('Error fetching embedded usage:', componentsError);
    return [];
  }

  if (!components || components.length === 0) {
    return [];
  }

  // PostgREST types embedded relations as arrays even for many-to-one, so narrow to
  // the single related row each foreign key actually yields.
  type JoinedUser = { name: string; handle: string };
  type JoinedProduct = {
    id: string;
    title: string;
    handle: string;
    cover_image_url: string | null;
    user_id: string;
    users: JoinedUser | JoinedUser[] | null;
  };

  const firstOf = <T>(value: T | T[] | null): T | null =>
    Array.isArray(value) ? value[0] ?? null : value;

  const byParentId = new Map<string, EmbeddedUsageEntry>();

  for (const component of components) {
    const product = firstOf(
      component.products as unknown as JoinedProduct | JoinedProduct[] | null
    );
    const owner = product ? firstOf(product.users) : null;

    if (!product || !owner) continue;

    const parentId = component.parent_product_id as string;

    if (!byParentId.has(parentId)) {
      byParentId.set(parentId, {
        id: product.id,
        title: product.title,
        handle: product.handle,
        cover_image_url: product.cover_image_url,
        owner_name: owner.name,
        owner_handle: owner.handle,
        inherited_price_cents: component.inherited_price_cents as number,
        total_earnings_cents: 0,
        sales_count: 0,
      });
    }
  }

  const parentIds = Array.from(byParentId.keys());

  if (parentIds.length === 0) {
    return [];
  }

  // Attribute this user's royalties to the parent product that was sold.
  const { data: royalties, error: royaltiesError } = await serverClient
    .from('sale_royalty_transactions')
    .select('calculated_cents, sale_items!inner(product_id)')
    .eq('recipient_user_id', userId)
    .eq('deleted', false)
    .in('status', ['ready_to_pay', 'reserved', 'paid']);

  if (royaltiesError) {
    console.error('Error fetching royalties for embedded usage:', royaltiesError);
    return Array.from(byParentId.values());
  }

  for (const royalty of royalties || []) {
    const saleItem = firstOf(
      royalty.sale_items as unknown as { product_id: string } | { product_id: string }[] | null
    );

    if (!saleItem) continue;

    const entry = byParentId.get(saleItem.product_id);

    if (entry) {
      entry.total_earnings_cents += royalty.calculated_cents as number;
      entry.sales_count += 1;
    }
  }

  return Array.from(byParentId.values());
};

export interface EmbedProductResult {
  componentId: string;
  inheritedPriceCents: number;
}

/**
 * Embed a product as a component of another.
 *
 * Price comes from the CHILD creator's configured `embedding_royalty_cents`, not
 * from the caller. It used to be taken from the request body, which let the party
 * doing the embedding set the price of someone else's work — and set it to zero.
 *
 * All validation lives in the Postgres function so it shares one transaction with
 * the insert: ownership, embeddability, visibility, self-embedding, duplicates,
 * and the A-embeds-B-embeds-A cycle the API never checked for.
 */
export const embedProduct = async (
  parentProductId: string,
  childProductId: string,
  actorUserId: string
): Promise<EmbedProductResult> => {
  const { data, error } = await serverClient.rpc('embed_product', {
    p_parent_product_id: parentProductId,
    p_child_product_id: childProductId,
    p_actor_user_id: actorUserId,
  });

  if (error) {
    // Keep the SQLSTATE: embed_product distinguishes "invalid" from "not found"
    // from "not permitted", and the route maps those to different statuses.
    const wrapped = new Error(error.message) as Error & { code?: string };
    wrapped.code = error.code;
    throw wrapped;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error('Embed returned no result');
  }

  return {
    componentId: row.component_id as string,
    inheritedPriceCents: row.inherited_price_cents as number,
  };
};
