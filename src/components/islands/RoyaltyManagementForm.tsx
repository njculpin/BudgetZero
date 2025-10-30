import { createSignal, Show, For, createEffect } from "solid-js";
import {
  FormField,
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface RoyaltyWithUser {
  id: string;
  user_id: string;
  royalty_type: "fixed" | "percentage";
  royalty_value: number;
  user: {
    name: string | null;
    handle: string | null;
  } | null;
}

export interface RoyaltyManagementFormProps {
  assetId: string;
  ownerId: string;
  initialRoyalties: RoyaltyWithUser[];
  onUpdate: () => void;
}

interface SearchUser {
  id: string;
  handle: string;
  name: string | null;
  avatar_url: string | null;
}

export default function RoyaltyManagementForm(props: RoyaltyManagementFormProps) {
  const [contributorUserId, setContributorUserId] = createSignal("");
  const [contributorHandle, setContributorHandle] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<SearchUser[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [showSearchResults, setShowSearchResults] = createSignal(false);
  const [royaltyType, setRoyaltyType] = createSignal<"fixed" | "percentage">("percentage");
  const [royaltyValue, setRoyaltyValue] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [showAddForm, setShowAddForm] = createSignal(false);

  // Debounced search effect
  let searchTimeout: number;
  createEffect(() => {
    const query = searchQuery();

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    clearTimeout(searchTimeout);
    setIsSearching(true);

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search-users?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  });

  const calculateTotalPercentage = () => {
    return props.initialRoyalties
      .filter(r => r.royalty_type === "percentage")
      .reduce((sum, r) => sum + r.royalty_value, 0);
  };

  const totalPercentage = () => calculateTotalPercentage();
  const isOverAllocated = () => totalPercentage() > 100;

  const handleSelectUser = (user: SearchUser) => {
    setContributorUserId(user.id);
    setContributorHandle(user.handle || user.name || "Unknown");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleClearSelection = () => {
    setContributorUserId("");
    setContributorHandle("");
    setSearchQuery("");
  };

  const handleAddRoyalty = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!contributorUserId() || !royaltyValue()) {
      setError("Please select a user and enter a royalty value");
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/assets/royalties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: props.assetId,
          contributorUserId: contributorUserId(),
          royaltyType: royaltyType(),
          royaltyValue: parseFloat(royaltyValue()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add royalty");
        setIsAdding(false);
        return;
      }

      setSuccess("Royalty added successfully!");
      setIsAdding(false);

      // Reset form
      setContributorUserId("");
      setContributorHandle("");
      setSearchQuery("");
      setRoyaltyValue("");
      setRoyaltyType("percentage");
      setShowAddForm(false);

      // Trigger callback after short delay
      setTimeout(() => {
        if (props.onUpdate) {
          props.onUpdate();
        }
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsAdding(false);
    }
  };

  const handleDeleteRoyalty = async (royaltyId: string) => {
    setError("");
    setSuccess("");
    setDeletingId(royaltyId);

    try {
      const response = await fetch("/api/assets/royalties/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          royaltyId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete royalty");
        setDeletingId(null);
        return;
      }

      setSuccess("Royalty deleted successfully!");
      setDeletingId(null);

      // Trigger callback after short delay
      setTimeout(() => {
        if (props.onUpdate) {
          props.onUpdate();
        }
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setDeletingId(null);
    }
  };

  return (
    <div class="royalty-management">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <Show when={isOverAllocated()}>
        <div class="royalty-management__warning">
          <span class="royalty-management__warning-icon">⚠️</span>
          <div class="royalty-management__warning-content">
            <strong>Total exceeds 100%</strong>
            <p>You have allocated {totalPercentage()}% in royalties. Please adjust the percentages so the total equals 100% or less.</p>
          </div>
        </div>
      </Show>

      <Show
        when={props.initialRoyalties.length > 0}
        fallback={
          <p class="royalty-management__empty">
            No royalties set. Add contributors below to split revenue.
          </p>
        }
      >
        <div class="royalty-management__list">
          <For each={props.initialRoyalties}>
            {(royalty) => {
              const isOwner = royalty.user_id === props.ownerId;
              return (
                <div class={`royalty-item ${isOwner ? 'royalty-item--owner' : ''}`}>
                  <div class="royalty-item__info">
                    <div class="royalty-item__user">
                      {royalty.user ? (
                        <span>
                          {royalty.user.name || royalty.user.handle || 'Unknown User'}
                          {isOwner && <span class="royalty-item__badge">You (Creator)</span>}
                        </span>
                      ) : (
                        <span>User ID: {royalty.user_id}</span>
                      )}
                    </div>
                    <div class="royalty-item__value">
                      {royalty.royalty_type === 'percentage' ? (
                        <span>{royalty.royalty_value}%</span>
                      ) : (
                        <span>${(royalty.royalty_value / 100).toFixed(2)}</span>
                      )}
                      <span class="royalty-item__type">
                        ({royalty.royalty_type})
                      </span>
                    </div>
                  </div>
                  <LoadingButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoyalty(royalty.id)}
                    isLoading={deletingId() === royalty.id}
                    loadingText="Removing..."
                  >
                    Remove
                  </LoadingButton>
                </div>
              );
            }}
          </For>

          <div class={`royalty-management__total ${isOverAllocated() ? 'royalty-management__total--warning' : ''}`}>
            <span class="royalty-management__total-label">Total Percentage:</span>
            <span class={`royalty-management__total-value ${isOverAllocated() ? 'royalty-management__total-value--warning' : ''}`}>
              {totalPercentage()}%
            </span>
          </div>
        </div>
      </Show>

      <div class="royalty-management__add">
        <Show when={!showAddForm()}>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            class="royalty-management__toggle-button"
          >
            Add Royalty
          </button>
        </Show>

        <Show when={showAddForm()}>
          <form onSubmit={handleAddRoyalty} class="royalty-management__form">
            <div class="form-field">
              <label class="form-field__label">Search Contributor</label>
              <Show
                when={!contributorUserId()}
                fallback={
                  <div class="user-search__selected">
                    <div class="user-search__selected-info">
                      <span class="user-search__selected-name">{contributorHandle()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      class="user-search__clear-button"
                      disabled={isAdding()}
                    >
                      Change
                    </button>
                  </div>
                }
              >
                <div class="user-search">
                  <input
                    type="text"
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    placeholder="Search by handle or name..."
                    class="user-search__input"
                    disabled={isAdding()}
                  />
                  <Show when={isSearching()}>
                    <div class="user-search__loading">Searching...</div>
                  </Show>
                  <Show when={showSearchResults() && searchResults().length > 0}>
                    <div class="user-search__results">
                      <For each={searchResults()}>
                        {(user) => (
                          <button
                            type="button"
                            class="user-search__result-item"
                            onClick={() => handleSelectUser(user)}
                          >
                            <div class="user-search__result-info">
                              <span class="user-search__result-name">
                                {user.name || user.handle}
                              </span>
                              <span class="user-search__result-handle">@{user.handle}</span>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                  <Show when={showSearchResults() && searchResults().length === 0 && !isSearching()}>
                    <div class="user-search__no-results">No users found</div>
                  </Show>
                </div>
              </Show>
              <p class="form-field__help-text">
                Search for a user by their handle or name to add them as a contributor
              </p>
            </div>

            <SelectField
              label="Royalty Type"
              name="royaltyType"
              value={royaltyType()}
              onChange={(e) => setRoyaltyType(e.currentTarget.value as "fixed" | "percentage")}
              options={[
                { value: "percentage", label: "Percentage (%)" },
                { value: "fixed", label: "Fixed Amount ($)" },
              ]}
              disabled={isAdding()}
            />

            <FormField
              label="Royalty Value"
              name="royaltyValue"
              type="number"
              value={royaltyValue()}
              onInput={(e) => setRoyaltyValue(e.currentTarget.value)}
              placeholder="Enter value"
              step="0.01"
              min="0"
              required
              disabled={isAdding()}
              helpText="For percentage: enter 10 for 10%. For fixed: enter dollars (e.g., 5.00 for $5)"
            />

            <div class="royalty-management__form-actions">
              <LoadingButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAdding()}
                loadingText="Adding..."
              >
                Add Royalty
              </LoadingButton>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                class="button button--ghost button--md"
                disabled={isAdding()}
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>
      </div>
    </div>
  );
}
