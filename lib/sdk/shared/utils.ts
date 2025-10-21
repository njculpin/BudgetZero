import type { ApiResponse } from "./types";

export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  // Handle Supabase errors which have message, code, details, hint properties
  if (typeof error === "object" && error !== null) {
    const supabaseError = error as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    const errorMessage =
      supabaseError.message ||
      supabaseError.details ||
      supabaseError.hint ||
      "An unknown error occurred";
    console.error("[SDK ERROR] Supabase error:", supabaseError);
    return new Error(errorMessage);
  }
  return new Error("An unknown error occurred");
}

export function success<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function failure<T = null>(error: unknown): ApiResponse<T> {
  return { data: null, error: handleError(error) };
}

export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
