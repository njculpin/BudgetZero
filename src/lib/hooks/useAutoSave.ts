import { createSignal, createEffect, onCleanup, type Accessor } from "solid-js";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveConfig {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Function to call when saving */
  onSave: () => Promise<void>;
  /** Maximum retry attempts for network errors (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelayMs?: number;
}

export interface UseAutoSaveReturn {
  saveStatus: Accessor<SaveStatus>;
  triggerSave: () => void;
  forceSave: () => Promise<void>;
}

/**
 * Hook for auto-saving with debouncing
 * Provides save status and manual trigger capabilities
 */
export function useAutoSave(config: UseAutoSaveConfig): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = createSignal<SaveStatus>("idle");
  let debounceTimer: NodeJS.Timeout | null = null;
  let statusResetTimer: NodeJS.Timeout | null = null;
  let isSaving = false; // Guard against concurrent saves
  const debounceMs = config.debounceMs || 1000;
  const maxRetries = config.maxRetries ?? 3;
  const retryDelayMs = config.retryDelayMs || 1000;

  const clearTimer = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const clearStatusResetTimer = () => {
    if (statusResetTimer) {
      clearTimeout(statusResetTimer);
      statusResetTimer = null;
    }
  };

  /**
   * Determines if an error is a network error that should be retried
   * Returns false for validation/application errors (4xx except 408, 429)
   */
  const isNetworkError = (error: unknown): boolean => {
    // TypeError for fetch failures (network offline, DNS failures, etc.)
    if (error instanceof TypeError) {
      return true;
    }

    // Check for Response objects with retryable status codes
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      // Retry on: 408 (timeout), 429 (rate limit), 5xx (server errors)
      // Don't retry on: 4xx client errors (except 408, 429)
      if (status === 408 || status === 429 || status >= 500) {
        return true;
      }
    }

    return false;
  };

  /**
   * Sleep for exponential backoff delay
   */
  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const executeSave = async () => {
    // Prevent concurrent saves
    if (isSaving) {
      return;
    }

    try {
      isSaving = true;
      clearStatusResetTimer(); // Clear any pending status reset
      setSaveStatus("saving");

      // Retry logic with exponential backoff
      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await config.onSave();

          // Success - exit retry loop
          setSaveStatus("saved");

          // Reset to idle after showing "saved" for 2 seconds
          statusResetTimer = setTimeout(() => {
            // Only reset if still in "saved" state (prevents race condition)
            if (saveStatus() === "saved") {
              setSaveStatus("idle");
            }
          }, 2000);

          return; // Exit successfully
        } catch (error) {
          lastError = error;

          // If it's not a network error, or we've exhausted retries, throw immediately
          if (!isNetworkError(error) || attempt === maxRetries) {
            throw error;
          }

          // Calculate exponential backoff: retryDelayMs * 2^attempt
          const delay = retryDelayMs * Math.pow(2, attempt);
          console.warn(`Auto-save failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error);

          // Wait before retrying
          await sleep(delay);
        }
      }

      // This shouldn't be reached, but throw last error if it somehow is
      throw lastError;
    } catch (error) {
      setSaveStatus("error");
      console.error("Auto-save error:", error);

      // Reset error after 3 seconds
      statusResetTimer = setTimeout(() => {
        if (saveStatus() === "error") {
          setSaveStatus("idle");
        }
      }, 3000);
    } finally {
      isSaving = false;
    }
  };

  const triggerSave = () => {
    clearTimer();
    debounceTimer = setTimeout(executeSave, debounceMs);
  };

  const forceSave = async () => {
    clearTimer();
    await executeSave();
  };

  // Cleanup on unmount
  onCleanup(() => {
    clearTimer();
    clearStatusResetTimer();
  });

  return {
    saveStatus,
    triggerSave,
    forceSave,
  };
}
