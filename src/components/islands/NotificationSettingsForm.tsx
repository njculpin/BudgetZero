import { createSignal, Show } from "solid-js";
import type { NotificationSettings } from "@/types";
import "./notification-settings-form.css";

interface NotificationSettingsFormProps {
  userId: string;
  settings: NotificationSettings | null;
}

export default function NotificationSettingsForm(
  props: NotificationSettingsFormProps
) {
  const [loading, setLoading] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Email settings
  const [emailAssetChanges, setEmailAssetChanges] = createSignal(
    props.settings?.email_asset_changes ?? true
  );
  const [emailProductConflicts, setEmailProductConflicts] = createSignal(
    props.settings?.email_product_conflicts ?? true
  );
  const [emailSales, setEmailSales] = createSignal(
    props.settings?.email_sales ?? true
  );
  const [emailRoyaltyPayments, setEmailRoyaltyPayments] = createSignal(
    props.settings?.email_royalty_payments ?? true
  );
  const [emailDocumentShares, setEmailDocumentShares] = createSignal(
    props.settings?.email_document_shares ?? true
  );
  const [emailJamUpdates, setEmailJamUpdates] = createSignal(
    props.settings?.email_jam_updates ?? false
  );
  const [emailMarketing, setEmailMarketing] = createSignal(
    props.settings?.email_marketing ?? false
  );

  // In-app settings
  const [inappAssetChanges, setInappAssetChanges] = createSignal(
    props.settings?.inapp_asset_changes ?? true
  );
  const [inappProductConflicts, setInappProductConflicts] = createSignal(
    props.settings?.inapp_product_conflicts ?? true
  );
  const [inappSales, setInappSales] = createSignal(
    props.settings?.inapp_sales ?? true
  );
  const [inappRoyaltyPayments, setInappRoyaltyPayments] = createSignal(
    props.settings?.inapp_royalty_payments ?? true
  );
  const [inappDocumentShares, setInappDocumentShares] = createSignal(
    props.settings?.inapp_document_shares ?? true
  );
  const [inappJamUpdates, setInappJamUpdates] = createSignal(
    props.settings?.inapp_jam_updates ?? true
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const settings = {
      email_asset_changes: emailAssetChanges(),
      email_product_conflicts: emailProductConflicts(),
      email_sales: emailSales(),
      email_royalty_payments: emailRoyaltyPayments(),
      email_document_shares: emailDocumentShares(),
      email_jam_updates: emailJamUpdates(),
      email_marketing: emailMarketing(),
      inapp_asset_changes: inappAssetChanges(),
      inapp_product_conflicts: inappProductConflicts(),
      inapp_sales: inappSales(),
      inapp_royalty_payments: inappRoyaltyPayments(),
      inapp_document_shares: inappDocumentShares(),
      inapp_jam_updates: inappJamUpdates(),
    };

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form class="notification-settings-form" onSubmit={handleSubmit}>
      {/* Email Notifications */}
      <div class="notification-settings-form__section">
        <h3 class="notification-settings-form__section-title">
          Email Notifications
        </h3>
        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailAssetChanges()}
              onInput={(e) => setEmailAssetChanges(e.currentTarget.checked)}
            />
            <span>Asset Changes</span>
          </label>
          <p class="notification-settings-form__help">
            Get notified when assets used in your products are updated
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailProductConflicts()}
              onInput={(e) =>
                setEmailProductConflicts(e.currentTarget.checked)
              }
            />
            <span>Product Conflicts</span>
          </label>
          <p class="notification-settings-form__help">
            Alert me when asset changes cause pricing conflicts
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailSales()}
              onInput={(e) => setEmailSales(e.currentTarget.checked)}
            />
            <span>Sales</span>
          </label>
          <p class="notification-settings-form__help">
            Get notified when someone purchases your products
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailRoyaltyPayments()}
              onInput={(e) => setEmailRoyaltyPayments(e.currentTarget.checked)}
            />
            <span>Royalty Payments</span>
          </label>
          <p class="notification-settings-form__help">
            Get notified when you receive royalty payments
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailDocumentShares()}
              onInput={(e) => setEmailDocumentShares(e.currentTarget.checked)}
            />
            <span>Document Shares</span>
          </label>
          <p class="notification-settings-form__help">
            Get notified when documents are shared with you
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailJamUpdates()}
              onInput={(e) => setEmailJamUpdates(e.currentTarget.checked)}
            />
            <span>Game Jam Updates</span>
          </label>
          <p class="notification-settings-form__help">
            Get notified about jam submissions, reviews, and announcements
          </p>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={emailMarketing()}
              onInput={(e) => setEmailMarketing(e.currentTarget.checked)}
            />
            <span>Marketing & Updates</span>
          </label>
          <p class="notification-settings-form__help">
            Receive occasional emails about new features and platform updates
          </p>
        </div>
      </div>

      {/* In-App Notifications */}
      <div class="notification-settings-form__section">
        <h3 class="notification-settings-form__section-title">
          In-App Notifications
        </h3>
        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappAssetChanges()}
              onInput={(e) => setInappAssetChanges(e.currentTarget.checked)}
            />
            <span>Asset Changes</span>
          </label>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappProductConflicts()}
              onInput={(e) =>
                setInappProductConflicts(e.currentTarget.checked)
              }
            />
            <span>Product Conflicts</span>
          </label>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappSales()}
              onInput={(e) => setInappSales(e.currentTarget.checked)}
            />
            <span>Sales</span>
          </label>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappRoyaltyPayments()}
              onInput={(e) => setInappRoyaltyPayments(e.currentTarget.checked)}
            />
            <span>Royalty Payments</span>
          </label>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappDocumentShares()}
              onInput={(e) => setInappDocumentShares(e.currentTarget.checked)}
            />
            <span>Document Shares</span>
          </label>
        </div>

        <div class="notification-settings-form__group">
          <label class="notification-settings-form__checkbox">
            <input
              type="checkbox"
              checked={inappJamUpdates()}
              onInput={(e) => setInappJamUpdates(e.currentTarget.checked)}
            />
            <span>Game Jam Updates</span>
          </label>
        </div>
      </div>

      {/* Messages */}
      <Show when={success()}>
        <div class="notification-settings-form__success">
          Settings saved successfully!
        </div>
      </Show>

      <Show when={error()}>
        <div class="notification-settings-form__error">{error()}</div>
      </Show>

      {/* Submit Button */}
      <button
        type="submit"
        class="notification-settings-form__submit"
        disabled={loading()}
      >
        {loading() ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
