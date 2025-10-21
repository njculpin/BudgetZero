import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type DbClient = SupabaseClient<Database>;

export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type SortParams<T extends string = string> = {
  column: T;
  ascending?: boolean;
};

export type FilterParams<T = Record<string, unknown>> = {
  [K in keyof T]?: T[K];
};
