import { createSignal, Show, For } from "solid-js";
import type { Asset } from "@/types";
import "./asset-search-modal.css";

export interface AssetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSelect: (assetId: string) => void;
  variantTitle?: string;
}

export default function AssetSearchModal(props: AssetSearchModalProps) {
  const [activeTab, setActiveTab] = createSignal<'search' | 'upload'>('search');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [assets, setAssets] = createSignal<Asset[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [selectedAsset, setSelectedAsset] = createSignal<Asset | null>(null);

  // Upload state
  const [uploadFiles, setUploadFiles] = createSignal<File[]>([]);
  const [uploadTitle, setUploadTitle] = createSignal('');
  const [uploadDescription, setUploadDescription] = createSignal('');
  const [uploading, setUploading] = createSignal(false);

  // Fetch user's assets
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assets/user');
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search/filter assets
  const filteredAssets = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return assets();
    return assets().filter(asset =>
      asset.title.toLowerCase().includes(query) ||
      (asset.description && asset.description.toLowerCase().includes(query))
    );
  };

  // Handle file selection
  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      setUploadFiles([...uploadFiles(), ...filesArray]);

      // Auto-populate title from first filename if empty
      if (!uploadTitle() && filesArray.length > 0) {
        const firstFile = filesArray[0];
        const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  // Remove file from upload list
  const removeFile = (index: number) => {
    const files = uploadFiles();
    files.splice(index, 1);
    setUploadFiles([...files]);
  };

  // Handle quick upload
  const handleQuickUpload = async (e: Event) => {
    e.preventDefault();

    if (uploadFiles().length === 0) {
      alert('Please select at least one file');
      return;
    }

    if (!uploadTitle().trim()) {
      alert('Please provide a title');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload files to storage
      const formData = new FormData();
      uploadFiles().forEach(file => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadData = await uploadResponse.json();

      // 2. Create asset
      const assetResponse = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle(),
          description: uploadDescription(),
          files: uploadData.files,
        }),
      });

      if (!assetResponse.ok) {
        throw new Error('Asset creation failed');
      }

      const assetData = await assetResponse.json();

      // 3. Select the newly created asset
      props.onAssetSelect(assetData.asset.id);

      // Reset form
      setUploadFiles([]);
      setUploadTitle('');
      setUploadDescription('');

      props.onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle asset selection
  const handleSelectAsset = () => {
    const asset = selectedAsset();
    if (asset) {
      props.onAssetSelect(asset.id);
      props.onClose();
    }
  };

  // Fetch assets when modal opens
  const handleOpen = () => {
    if (props.isOpen && activeTab() === 'search') {
      fetchAssets();
    }
  };

  // Effect to trigger fetch on open
  handleOpen();

  // Close modal on Escape
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  return (
    <Show when={props.isOpen}>
      <div class="asset-modal-backdrop" onClick={props.onClose}>
        <div class="asset-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div class="asset-modal__header">
            <h2 class="asset-modal__title">
              Add Asset{props.variantTitle ? ` to ${props.variantTitle}` : ''}
            </h2>
            <button
              class="asset-modal__close"
              onClick={props.onClose}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div class="asset-modal__tabs" role="tablist">
            <button
              class={`asset-modal__tab ${activeTab() === 'search' ? 'asset-modal__tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab() === 'search'}
              onClick={() => {
                setActiveTab('search');
                fetchAssets();
              }}
            >
              My Assets
            </button>
            <button
              class={`asset-modal__tab ${activeTab() === 'upload' ? 'asset-modal__tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab() === 'upload'}
              onClick={() => setActiveTab('upload')}
            >
              Quick Upload
            </button>
          </div>

          {/* Tab Content */}
          <div class="asset-modal__body">
            <Show when={activeTab() === 'search'}>
              <div class="asset-search">
                {/* Search Bar */}
                <div class="asset-search__header">
                  <input
                    type="text"
                    class="asset-search__input"
                    placeholder="Search assets..."
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </div>

                {/* Assets Grid */}
                <Show
                  when={!loading()}
                  fallback={
                    <div class="asset-search__loading">
                      <p>Loading assets...</p>
                    </div>
                  }
                >
                  <Show
                    when={filteredAssets().length > 0}
                    fallback={
                      <div class="asset-search__empty">
                        <svg
                          class="asset-search__empty-icon"
                          xmlns="http://www.w3.org/2000/svg"
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <p class="asset-search__empty-title">No assets found</p>
                        <p class="asset-search__empty-text">
                          Try a different search or upload new files
                        </p>
                      </div>
                    }
                  >
                    <div class="asset-search__grid">
                      <For each={filteredAssets()}>
                        {(asset) => (
                          <button
                            class={`asset-card ${selectedAsset()?.id === asset.id ? 'asset-card--selected' : ''}`}
                            onClick={() => setSelectedAsset(asset)}
                          >
                            <div class="asset-card__thumbnail">
                              <div class="asset-card__placeholder">
                                {asset.title.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div class="asset-card__content">
                              <h3 class="asset-card__title">{asset.title}</h3>
                              <span class="asset-card__type">{asset.type}</span>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </Show>
              </div>
            </Show>

            <Show when={activeTab() === 'upload'}>
              <form class="asset-upload" onSubmit={handleQuickUpload}>
                {/* File Drop Zone */}
                <div class="asset-upload__dropzone">
                  <input
                    type="file"
                    id="asset-upload-input"
                    class="asset-upload__input"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <label for="asset-upload-input" class="asset-upload__label">
                    <svg
                      class="asset-upload__icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p class="asset-upload__text">Drop files here or click to browse</p>
                    <p class="asset-upload__hint">.stl, .pdf, .png, .jpg (max 100MB per file)</p>
                  </label>
                </div>

                {/* File List */}
                <Show when={uploadFiles().length > 0}>
                  <div class="asset-upload__files">
                    <For each={uploadFiles()}>
                      {(file, index) => (
                        <div class="file-item">
                          <span class="file-item__name">{file.name}</span>
                          <span class="file-item__size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            class="file-item__remove"
                            onClick={() => removeFile(index())}
                            aria-label="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Metadata Fields */}
                <div class="asset-upload__fields">
                  <div class="form-field">
                    <label class="form-field__label">
                      Asset Title <span class="form-field__required">*</span>
                    </label>
                    <input
                      type="text"
                      class="form-field__input"
                      value={uploadTitle()}
                      onInput={(e) => setUploadTitle(e.currentTarget.value)}
                      required
                    />
                  </div>

                  <div class="form-field">
                    <label class="form-field__label">Description (optional)</label>
                    <textarea
                      class="form-field__textarea"
                      rows="3"
                      value={uploadDescription()}
                      onInput={(e) => setUploadDescription(e.currentTarget.value)}
                    />
                  </div>
                </div>
              </form>
            </Show>
          </div>

          {/* Footer */}
          <div class="asset-modal__footer">
            <button
              class="asset-modal__button asset-modal__button--secondary"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <Show when={activeTab() === 'search'}>
              <button
                class="asset-modal__button asset-modal__button--primary"
                onClick={handleSelectAsset}
                disabled={!selectedAsset()}
              >
                Attach Asset
              </button>
            </Show>
            <Show when={activeTab() === 'upload'}>
              <button
                class="asset-modal__button asset-modal__button--primary"
                onClick={handleQuickUpload}
                disabled={uploading() || uploadFiles().length === 0 || !uploadTitle().trim()}
              >
                {uploading() ? 'Uploading...' : 'Upload & Attach'}
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
