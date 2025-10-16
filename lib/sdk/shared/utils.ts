import type { ApiResponse } from './types';

export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('An unknown error occurred');
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

export function calculatePagination(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
