import Modal, { ModalHeader, ModalFooter } from "@/components/Modal";
import "./product-created-modal.css";

export interface ProductCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productHandle: string;
}

export default function ProductCreatedModal(props: ProductCreatedModalProps) {
  const handleGoToProduct = () => {
    window.location.href = `/products/${props.productHandle}/edit`;
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size="md"
      showCloseButton={false}
      closeOnEscape={false}
      closeOnOverlayClick={false}
    >
      <ModalHeader
        centered
        icon={
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
      >
        <h3 class="product-created__title">Product Created!</h3>
        <p class="product-created__description">
          "{props.productTitle}" has been created successfully.
        </p>
      </ModalHeader>

      <div class="product-created__body">
        <h4 class="product-created__checklist-title">Next Steps to Publish</h4>
        <p class="product-created__checklist-description">
          Complete these steps to make your product ready for sale:
        </p>

        <ul class="product-created__checklist">
          <li class="product-created__checklist-item">
            <div class="product-created__checklist-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div class="product-created__checklist-content">
              <h5 class="product-created__checklist-item-title">Upload cover image</h5>
              <p class="product-created__checklist-item-description">
                Add an eye-catching cover to attract buyers
              </p>
            </div>
          </li>

          <li class="product-created__checklist-item">
            <div class="product-created__checklist-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </div>
            <div class="product-created__checklist-content">
              <h5 class="product-created__checklist-item-title">Add product files</h5>
              <p class="product-created__checklist-item-description">
                Upload PDFs, STLs, or other downloadable content
              </p>
            </div>
          </li>

          <li class="product-created__checklist-item">
            <div class="product-created__checklist-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div class="product-created__checklist-content">
              <h5 class="product-created__checklist-item-title">Set pricing</h5>
              <p class="product-created__checklist-item-description">
                Price your files individually or offer them as a bundle
              </p>
            </div>
          </li>

          <li class="product-created__checklist-item">
            <div class="product-created__checklist-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div class="product-created__checklist-content">
              <h5 class="product-created__checklist-item-title">Add tags</h5>
              <p class="product-created__checklist-item-description">
                Help buyers discover your product through search
              </p>
            </div>
          </li>

          <li class="product-created__checklist-item">
            <div class="product-created__checklist-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="product-created__checklist-content">
              <h5 class="product-created__checklist-item-title">Publish when ready</h5>
              <p class="product-created__checklist-item-description">
                Change status to "Public" to list in the marketplace
              </p>
            </div>
          </li>
        </ul>

        <div class="product-created__tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p class="product-created__tip-text">
            <strong>Tip:</strong> You can save your product as a draft and come back to finish it later.
          </p>
        </div>
      </div>

      <ModalFooter justify="center">
        <button
          type="button"
          class="button button--primary button--lg"
          onClick={handleGoToProduct}
        >
          <span class="button__text">Go to Product</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </ModalFooter>
    </Modal>
  );
}
