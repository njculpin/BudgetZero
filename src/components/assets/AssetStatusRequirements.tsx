import { createSignal, createEffect, For } from "solid-js";
import "./asset-status-requirements.css";

interface Requirement {
  id: string;
  label: string;
  description: string;
  isMet: boolean;
  icon: string;
}

interface Props {
  assetId: string;
  hasImages: boolean;
  hasFiles: boolean;
  currentStatus: "draft" | "private" | "public" | "archived";
}

export default function AssetStatusRequirements(props: Props) {
  const [requirements, setRequirements] = createSignal<Requirement[]>([]);

  createEffect(() => {
    const reqs: Requirement[] = [
      {
        id: "images",
        label: "Add at least one image",
        description: "Assets need preview images so users can see what they're getting",
        isMet: props.hasImages,
        icon: "🖼️",
      },
      {
        id: "files",
        label: "Upload at least one file",
        description: "Assets must have downloadable files (STL, PDF, PNG, etc.)",
        isMet: props.hasFiles,
        icon: "📁",
      },
      {
        id: "title",
        label: "Add a descriptive title",
        description: "Give your asset a clear, searchable name",
        isMet: true, // Title is always required and set on creation
        icon: "✏️",
      },
    ];

    setRequirements(reqs);
  });

  const completionPercentage = () => {
    const total = requirements().length;
    const completed = requirements().filter((r) => r.isMet).length;
    return Math.round((completed / total) * 100);
  };

  const canPublish = () => {
    return requirements().every((r) => r.isMet);
  };

  const getStatusMessage = () => {
    if (canPublish()) {
      return "✅ Your asset is ready to publish!";
    }
    const remaining = requirements().filter((r) => !r.isMet).length;
    return `📋 ${remaining} requirement${remaining > 1 ? "s" : ""} remaining`;
  };

  return (
    <div class="asset-requirements">
      <div class="asset-requirements__header">
        <div class="asset-requirements__progress-bar">
          <div
            class="asset-requirements__progress-fill"
            style={{ width: `${completionPercentage()}%` }}
          />
        </div>
        <p class="asset-requirements__status">{getStatusMessage()}</p>
      </div>

      <div class="asset-requirements__list">
        <For each={requirements()}>
          {(req) => (
            <div
              class={`asset-requirements__item ${
                req.isMet ? "asset-requirements__item--completed" : ""
              }`}
            >
              <div class="asset-requirements__item-icon">
                {req.isMet ? "✓" : req.icon}
              </div>
              <div class="asset-requirements__item-content">
                <h4 class="asset-requirements__item-label">{req.label}</h4>
                <p class="asset-requirements__item-description">
                  {req.description}
                </p>
              </div>
            </div>
          )}
        </For>
      </div>

      {props.currentStatus === "draft" && !canPublish() && (
        <div class="asset-requirements__tip">
          <strong>💡 Tip:</strong> Complete all requirements above to publish your
          asset as Private (for your products only) or Public (earn royalties in
          the marketplace).
        </div>
      )}
    </div>
  );
}
