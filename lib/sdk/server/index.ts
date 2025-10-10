// Server-side SDK for Workshop Platform
// Use these functions in server components instead of direct Supabase calls

// Orders & Webhooks
export * from "./use-admin-check-webhook-event";
export * from "./use-admin-count-user-assets";
export * from "./use-admin-count-user-projects";
export * from "./use-admin-create-connected-account";
export * from "./use-admin-create-notification";
export * from "./use-admin-get-all-assets";
// Licenses
export * from "./use-admin-get-all-licenses";
// Products
export * from "./use-admin-get-all-products";
export * from "./use-admin-get-all-projects";
export * from "./use-admin-get-approved-references";
// Assets
export * from "./use-admin-get-asset-by-id";
export * from "./use-admin-get-asset-references";
export * from "./use-admin-get-asset-royalties";
export * from "./use-admin-get-asset-stats";
export * from "./use-admin-get-assets";
export * from "./use-admin-get-assets-by-ids";
export * from "./use-admin-get-assets-by-project";
// Stripe Connect
export * from "./use-admin-get-connected-account";
// Auth
export * from "./use-admin-get-me";
export * from "./use-admin-get-order-by-payment-intent";
export * from "./use-admin-get-order-details";
export * from "./use-admin-get-order-items";
export * from "./use-admin-get-product-by-handle";
export * from "./use-admin-get-product-collections";
export * from "./use-admin-get-project-asset-references";
export * from "./use-admin-get-project-assets";
// Projects
export * from "./use-admin-get-project-by-slug";
export * from "./use-admin-get-project-collaborators";
export * from "./use-admin-get-project-collaborators-with-users";
export * from "./use-admin-get-project-with-details";
export * from "./use-admin-get-projects";
export * from "./use-admin-get-revenue-splits-by-items";
export * from "./use-admin-get-royalties-by-ids";
export * from "./use-admin-get-user-assets";
// Users
export * from "./use-admin-get-users";
export * from "./use-admin-get-users-by-ids";
export * from "./use-admin-record-webhook-event";
export * from "./use-admin-update-connected-account";
export * from "./use-admin-update-order";
export * from "./use-admin-update-revenue-splits";
