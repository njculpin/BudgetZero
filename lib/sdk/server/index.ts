// Server-side SDK for Workshop Platform
// Use these functions in server components instead of direct Supabase calls

// Auth
export * from "./use-admin-get-me";

// Assets
export * from "./use-admin-get-asset-by-id";
export * from "./use-admin-get-all-assets";
export * from "./use-admin-get-user-assets";
export * from "./use-admin-get-asset-stats";
export * from "./use-admin-count-user-assets";
export * from "./use-admin-get-assets";
export * from "./use-admin-get-asset-references";
export * from "./use-admin-get-asset-royalties";

// Projects
export * from "./use-admin-get-project-by-slug";
export * from "./use-admin-get-all-projects";
export * from "./use-admin-get-project-assets";
export * from "./use-admin-get-project-collaborators";
export * from "./use-admin-get-project-asset-references";
export * from "./use-admin-count-user-projects";
export * from "./use-admin-get-projects";

// Products
export * from "./use-admin-get-all-products";
export * from "./use-admin-get-product-by-handle";
export * from "./use-admin-get-product-collections";

// Users
export * from "./use-admin-get-users";
