import { Show } from "solid-js";
import type { Product, ProductFile, ProductDocument } from "@/types";
import "./product-requirements-checklist.css";

export interface ProductRequirementsChecklistProps {
  product: Product;
  fileCount: number;
  imageCount: number;
  documentCount: number;
  embeddedProductCount: number;
}

export default function ProductRequirementsChecklist(props: ProductRequirementsChecklistProps) {
  const hasTitle = () => props.product.title && props.product.title.length > 0;
  const hasDescription = () => props.product.description && props.product.description.length > 0;
  const hasImages = () => props.imageCount > 0;
  const hasContent = () => props.fileCount > 0 || props.embeddedProductCount > 0 || props.documentCount > 0;

  const allRequirementsMet = () => hasTitle() && hasDescription() && hasImages() && hasContent();
  const canPublish = () => allRequirementsMet();

  return (
    <div class="requirements-checklist">
      <div class="requirements-checklist__header">
        <h4 class="requirements-checklist__title">Publishing Requirements</h4>
        <Show when={allRequirementsMet()}>
          <span class="requirements-checklist__badge requirements-checklist__badge--ready">
            ✓ Ready to Publish
          </span>
        </Show>
        <Show when={!allRequirementsMet()}>
          <span class="requirements-checklist__badge requirements-checklist__badge--incomplete">
            Incomplete
          </span>
        </Show>
      </div>

      <ul class="requirements-checklist__list">
        <li
          class="requirements-checklist__item"
          classList={{
            "requirements-checklist__item--complete": hasTitle(),
            "requirements-checklist__item--incomplete": !hasTitle()
          }}
        >
          <span class="requirements-checklist__checkbox">
            {hasTitle() ? "✓" : "○"}
          </span>
          <span class="requirements-checklist__text">
            Add product title
          </span>
        </li>

        <li
          class="requirements-checklist__item"
          classList={{
            "requirements-checklist__item--complete": hasDescription(),
            "requirements-checklist__item--incomplete": !hasDescription()
          }}
        >
          <span class="requirements-checklist__checkbox">
            {hasDescription() ? "✓" : "○"}
          </span>
          <span class="requirements-checklist__text">
            Add product description
          </span>
        </li>

        <li
          class="requirements-checklist__item"
          classList={{
            "requirements-checklist__item--complete": hasImages(),
            "requirements-checklist__item--incomplete": !hasImages()
          }}
        >
          <span class="requirements-checklist__checkbox">
            {hasImages() ? "✓" : "○"}
          </span>
          <span class="requirements-checklist__text">
            Add at least 1 image ({props.imageCount} added)
          </span>
        </li>

        <li
          class="requirements-checklist__item"
          classList={{
            "requirements-checklist__item--complete": hasContent(),
            "requirements-checklist__item--incomplete": !hasContent()
          }}
        >
          <span class="requirements-checklist__checkbox">
            {hasContent() ? "✓" : "○"}
          </span>
          <span class="requirements-checklist__text">
            Add at least 1 file, document, or embedded product
            <span class="requirements-checklist__details">
              ({props.fileCount} files, {props.documentCount} documents, {props.embeddedProductCount} embedded)
            </span>
          </span>
        </li>
      </ul>

      <Show when={!canPublish()}>
        <div class="requirements-checklist__help">
          <p class="requirements-checklist__help-text">
            💡 Complete all requirements above before changing status to "Public"
          </p>
        </div>
      </Show>

      <Show when={canPublish()}>
        <div class="requirements-checklist__success">
          <p class="requirements-checklist__success-text">
            ✨ Your product is ready to publish! Change the status to "Public" when you're ready to list it for sale.
          </p>
        </div>
      </Show>
    </div>
  );
}
