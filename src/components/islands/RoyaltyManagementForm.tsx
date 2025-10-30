import { createSignal, Show, For } from "solid-js";
import {
  FormField,
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";

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
  initialRoyalties: RoyaltyWithUser[];
  onUpdate: () => void;
}

export default function RoyaltyManagementForm(props: RoyaltyManagementFormProps) {
  const [contributorUserId, setContributorUserId] = createSignal("");
  const [royaltyType, setRoyaltyType] = createSignal<"fixed" | "percentage">("percentage");
  const [royaltyValue, setRoyaltyValue] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [showAddForm, setShowAddForm] = createSignal(false);

  const calculateTotalPercentage = () => {
    return props.initialRoyalties
      .filter(r => r.royalty_type === "percentage")
      .reduce((sum, r) => sum + r.royalty_value, 0);
  };

  const handleAddRoyalty = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!contributorUserId() || !royaltyValue()) {
      setError("User ID and royalty value are required");
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
            {(royalty) => (
              <div class="royalty-item">
                <div class="royalty-item__info">
                  <div class="royalty-item__user">
                    {royalty.user ? (
                      <span>{royalty.user.name || royalty.user.handle || 'Unknown User'}</span>
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
            )}
          </For>

          <div class="royalty-management__total">
            <span class="royalty-management__total-label">Total Percentage:</span>
            <span class="royalty-management__total-value">
              {calculateTotalPercentage()}%
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
            <FormField
              label="Contributor User ID"
              name="contributorUserId"
              type="text"
              value={contributorUserId()}
              onInput={(e) => setContributorUserId(e.currentTarget.value)}
              placeholder="Enter user ID"
              required
              disabled={isAdding()}
              helpText="You'll need the contributor's user ID. They can find it in their profile."
            />

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
