import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import type {
  ApiResponse,
  DbClient,
  PaginatedResponse,
  PaginationParams,
} from "../shared/types";
import { calculatePagination, failure, success } from "../shared/utils";

// Sales CRUD
export async function createSale(
  client: DbClient,
  data: TablesInsert<"sales">,
): Promise<ApiResponse<Tables<"sales">>> {
  try {
    const { data: sale, error } = await client
      .from("sales")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(sale);
  } catch (error) {
    return failure(error);
  }
}

export async function getSaleById(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"sales">>> {
  try {
    const { data, error } = await client
      .from("sales")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserSales(
  client: DbClient,
  userId: string,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<Tables<"sales">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from("sales")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateSale(
  client: DbClient,
  id: number,
  data: TablesUpdate<"sales">,
): Promise<ApiResponse<Tables<"sales">>> {
  try {
    const { data: sale, error } = await client
      .from("sales")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(sale);
  } catch (error) {
    return failure(error);
  }
}

// Sale Items CRUD
export async function createSaleItem(
  client: DbClient,
  data: TablesInsert<"sale_items">,
): Promise<ApiResponse<Tables<"sale_items">>> {
  try {
    const { data: saleItem, error } = await client
      .from("sale_items")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(saleItem);
  } catch (error) {
    return failure(error);
  }
}

export async function getSaleItems(
  client: DbClient,
  saleId: number,
): Promise<ApiResponse<Tables<"sale_items">[]>> {
  try {
    const { data, error } = await client
      .from("sale_items")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

// Sale Item Assets CRUD
export async function createSaleItemAsset(
  client: DbClient,
  data: TablesInsert<"sale_item_assets">,
): Promise<ApiResponse<Tables<"sale_item_assets">>> {
  try {
    const { data: saleItemAsset, error } = await client
      .from("sale_item_assets")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(saleItemAsset);
  } catch (error) {
    return failure(error);
  }
}

export async function getSaleItemAssets(
  client: DbClient,
  saleItemId: number,
): Promise<ApiResponse<Tables<"sale_item_assets">[]>> {
  try {
    const { data, error } = await client
      .from("sale_item_assets")
      .select("*")
      .eq("sale_item_id", saleItemId);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

// Sale Royalty Transactions CRUD
export async function createSaleRoyaltyTransaction(
  client: DbClient,
  data: TablesInsert<"sale_royalty_transactions">,
): Promise<ApiResponse<Tables<"sale_royalty_transactions">>> {
  try {
    const { data: transaction, error } = await client
      .from("sale_royalty_transactions")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(transaction);
  } catch (error) {
    return failure(error);
  }
}

export async function getSaleRoyaltyTransactions(
  client: DbClient,
  saleId: number,
): Promise<ApiResponse<Tables<"sale_royalty_transactions">[]>> {
  try {
    const { data, error } = await client
      .from("sale_royalty_transactions")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserRoyaltyTransactions(
  client: DbClient,
  userId: string,
  params?: PaginationParams,
): Promise<
  ApiResponse<PaginatedResponse<Tables<"sale_royalty_transactions">>>
> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from("sale_royalty_transactions")
      .select("*", { count: "exact" })
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateSaleRoyaltyTransaction(
  client: DbClient,
  id: number,
  data: TablesUpdate<"sale_royalty_transactions">,
): Promise<ApiResponse<Tables<"sale_royalty_transactions">>> {
  try {
    const { data: transaction, error } = await client
      .from("sale_royalty_transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(transaction);
  } catch (error) {
    return failure(error);
  }
}

// Sale License Transactions CRUD
export async function createSaleLicenseTransaction(
  client: DbClient,
  data: TablesInsert<"sale_license_transactions">,
): Promise<ApiResponse<Tables<"sale_license_transactions">>> {
  try {
    const { data: transaction, error } = await client
      .from("sale_license_transactions")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(transaction);
  } catch (error) {
    return failure(error);
  }
}

export async function getSaleLicenseTransactions(
  client: DbClient,
  saleId: number,
): Promise<ApiResponse<Tables<"sale_license_transactions">[]>> {
  try {
    const { data, error } = await client
      .from("sale_license_transactions")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateSaleLicenseTransaction(
  client: DbClient,
  id: number,
  data: TablesUpdate<"sale_license_transactions">,
): Promise<ApiResponse<Tables<"sale_license_transactions">>> {
  try {
    const { data: transaction, error } = await client
      .from("sale_license_transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(transaction);
  } catch (error) {
    return failure(error);
  }
}

// Stripe Prices CRUD
export async function createStripePrice(
  client: DbClient,
  data: TablesInsert<"stripe_prices">,
): Promise<ApiResponse<Tables<"stripe_prices">>> {
  try {
    const { data: price, error } = await client
      .from("stripe_prices")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(price);
  } catch (error) {
    return failure(error);
  }
}

export async function getStripePriceByLookupName(
  client: DbClient,
  lookupName: string,
): Promise<ApiResponse<Tables<"stripe_prices">>> {
  try {
    const { data, error } = await client
      .from("stripe_prices")
      .select("*")
      .eq("lookup_name", lookupName)
      .eq("is_deleted", false)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function listStripePrices(
  client: DbClient,
): Promise<ApiResponse<Tables<"stripe_prices">[]>> {
  try {
    const { data, error } = await client
      .from("stripe_prices")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateStripePrice(
  client: DbClient,
  id: string,
  data: TablesUpdate<"stripe_prices">,
): Promise<ApiResponse<Tables<"stripe_prices">>> {
  try {
    const { data: price, error } = await client
      .from("stripe_prices")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(price);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteStripePrice(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"stripe_prices">>> {
  try {
    const { data, error } = await client
      .from("stripe_prices")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Audit Logs CRUD
export async function createAuditLog(
  client: DbClient,
  data: TablesInsert<"audit_logs">,
): Promise<ApiResponse<Tables<"audit_logs">>> {
  try {
    const { data: log, error } = await client
      .from("audit_logs")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(log);
  } catch (error) {
    return failure(error);
  }
}

export async function getAuditLogs(
  client: DbClient,
  params?: PaginationParams & {
    entityType?: Tables<"audit_logs">["entity_type"];
    entityId?: string;
    userId?: string;
  },
): Promise<ApiResponse<PaginatedResponse<Tables<"audit_logs">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = client.from("audit_logs").select("*", { count: "exact" });

    if (params?.entityType) {
      query = query.eq("entity_type", params.entityType);
    }
    if (params?.entityId) {
      query = query.eq("entity_id", params.entityId);
    }
    if (params?.userId) {
      query = query.eq("user_id", params.userId);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}
