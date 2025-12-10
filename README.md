# Game Loopers

Game loopers is a social commerce service which allows tabletop game designers, 3d modelers, illustrators, 3d printers, etc... to collaborate and publish digital download game projects. Game Loopers provides a solution to communicate, assemble, license, and issue royalties.

## Language & Framework
Astro
SolidJS / Signal Islands

## Auth
Supabase

## Database
Supabase Postgres (with SDK, isolated in data-access layer)

## Storage
Supabase Storage (with SDK, isolated in storage layer)

## Host
Vercel

## UI
BEM CSS (Block Element Modifier)
Component examples in `/src/components/` demonstrate the BEM pattern

## Form Validation
Zod

## Data Model
Users {
    id: uuid
    handle: string // unique and global
    email: string // unique and global
    name: string
    bio: string
    avatar_url: string
    stripe_account_id: string
    stripe_customer_id: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

UserTags {
    id: uuid
    user_id: uuid ref to Users
    value: string
    created_at: timestamp
    updated_at: timestamp 
    deleted: boolean
    deleted_at: timestamp 
}

UserReviews {
    id: uuid
    user_id: uuid ref to Users // user being reviewed
    reviewer_id: uuid ref to Users // user writing the review
    review_rating: number // 0 to 5
    review_text: string // max 120 chars
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}


Documents {
    id: uuid
    handle: string // unique and global
    title: string
    description: string
    user_id: uuid ref to Users // owner id
    current_version: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

DocumentVersions {
    id: uuid
    document_id: uuid ref to Documents
    version_number: number
    title: string
    description: string
    blocks_snapshot: jsonb
    created_by: uuid ref to Users
    created_at: timestamp
    change_notes: string
    UNIQUE(document_id, version_number)
}

DocumentBlocks {
    id: uuid
    document_id: uuid ref to Documents
    parent_id: uuid ref to DocumentBlocks
    block_type: 'paragraph' | 'heading' | 'list_item' | 'image' | 'code' | 'table' | 'quote' | 'callout'
    content: jsonb // {"text": "Hello world", "style": {"bold": true}}
    position: number // order within the parent block
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

DocumentAttachments {
    id: uuid
    document_id: uuid ref to Documents
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp 
}

DocumentCollaborators {
    id: uuid
    document_id: uuid ref to Documents
    user_id: uuid ref to Users
    role: 'owner' | 'editor' | 'viewer'
    can_edit: boolean
    can_delete: boolean
    can_invite: boolean
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

Licenses {
    id: uuid
    title: string
    current_version: number
    agreement: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

LicenseVersions {
    id: uuid
    license_id: uuid ref to Licenses
    version_number: number
    title: string
    agreement: string
    created_by: uuid ref to Users
    created_at: timestamp
    change_notes: string
    UNIQUE(license_id, version_number)
}

Products {
    id: uuid
    handle: string // unique and global
    title: string
    user_id: uuid ref to Users // owner
    description: string
    status: 'draft' | 'public'
    current_version: number
    view_count: number
    public_at: timestamp
    is_embeddable: boolean // can be embedded in other products
    direct_sale_price_cents: number // price when sold directly
    embedding_royalty_cents: number // royalty when embedded in another product
    download_count: number
    total_size_bytes: number
    file_count: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductVersions {
    id: uuid
    product_id: uuid ref to Products
    version_number: number
    title: string
    description: string
    status: 'draft' | 'public'
    variants_snapshot: jsonb
    files_snapshot: jsonb
    components_snapshot: jsonb
    created_by: uuid ref to Users
    created_at: timestamp
    change_notes: string
    UNIQUE(product_id, version_number)
}

ProductCollaborators {
    id: uuid
    product_id: uuid ref to Products
    user_id: uuid ref to Users
    role: 'owner' | 'editor' | 'viewer'
    can_edit: boolean
    can_delete: boolean
    can_invite: boolean
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductImages {
    id: uuid
    product_id: uuid ref to Products
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    position: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp 
}

ProductVariants {
    id: uuid
    product_id: uuid ref to Products
    title: string
    description: string
    sku: string
    options: jsonb
    position: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductVariantPrices {
    id: uuid
    variant_id: uuid ref to ProductVariants
    default_amount_cents: number
    default_currency: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductPriceBreaks {
    id: uuid
    price_id: uuid ref to ProductVariantPrices
    min_quantity: number
    max_quantity: number
    amount_cents: number
    currency: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductVariantImages {
    id: uuid
    product_id: uuid ref to Products
    variant_id: uuid ref to ProductVariants
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    position: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductFiles {
    id: uuid
    product_id: uuid ref to Products
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    position: number
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductComponents {
    id: uuid
    parent_variant_id: uuid ref to ProductVariants // variant that contains component
    child_product_id: uuid ref to Products // product being embedded
    royalty_amount_cents: number // royalty captured at link time
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductRoyalties {
    id: uuid
    product_id: uuid ref to Products
    user_id: uuid ref to Users
    royalty_type: 'fixed' | 'percentage'
    royalty_value: number // fixed: cents | percentage: 0-100
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductReview {
    id: uuid
    user_id: uuid ref to Users
    product_id: uuid ref to Products
    review_rating: number // 0 to 5
    review_text: string // max 120 chars
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductChatMessage {
    id: uuid
    product_id: uuid ref to Products
    user_id: uuid ref to Users
    message: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductChatMessageReaction {
    id: uuid
    message_id: uuid ref to ProductChatMessage
    user_id: uuid ref to Users
    emoji: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductChatMessageAttachments {
    id: uuid
    message_id: uuid ref to ProductChatMessage
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ProductTags {
    id: uuid
    product_id: uuid ref to Products
    value: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

Cart {
    id: uuid
    user_id: uuid ref to Users
    created_at: timestamp
    updated_at: timestamp
}

CartItems {
    id: uuid
    cart_id: uuid ref to Cart
    product_id: uuid ref to Products
    variant_id: uuid ref to ProductVariants
    quantity: number
    created_at: timestamp
    updated_at: timestamp
}

Sales {
  id: uuid
  user_id: uuid ref to Users // who bought it
  user_email: string // who bought it
  price_cents: number
  tax_cents: number
  currency: string
  stripe_charge_id: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  refund_reason: string
  created_at: timestamp
  updated_at: timestamp
  completed_at: timestamp
  deleted: boolean
  deleted_at: timestamp
}

SaleItems {
  id: uuid
  sale_id: uuid ref to Sales
  product_id: uuid ref to Products
  variant_id: uuid ref to ProductVariants
  price_cents: number
  currency: string
  quantity: number
  snapshot: jsonb
  created_at: timestamp
  updated_at: timestamp
  deleted: boolean
  deleted_at: timestamp
}

SaleRoyaltyTransactions {
  id: uuid
  sale_id: uuid ref to Sales
  sale_item_id: uuid ref to SaleItems
  product_royalty_id: uuid ref to ProductRoyalties
  recipient_user_id: uuid ref to Users
  royalty_type: 'fixed' | 'percentage'
  royalty_value: number
  calculated_cents: number
  status: 'pending' | 'ready_to_pay' | 'paid' | 'failed' | 'refunded'
  stripe_transfer_id: string
  created_at: timestamp
  updated_at: timestamp
  paid_at: timestamp
  deleted: boolean
  deleted_at: timestamp
}

Jams {
    id: uuid
    handle: string // unique and global
    title: string
    description: string
    rules: string
    user_id: uuid ref to Users // creator of the jam
    status: 'upcoming' | 'active' | 'ended'
    start_date: timestamp
    end_date: timestamp
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

JamAttachments {
    id: uuid
    jam_id: uuid ref to Jams
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp 
}

JamPrizes {
    id: uuid
    jam_id: uuid ref to Jams
    title: string
    description: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp 
}

JamPrizeAttachments {
    id: uuid
    prize_id: uuid ref to JamPrizes
    title: string
    description: string
    file_url: string
    storage_path: string
    file_size_bytes: number
    mime_type: string
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp 
}

JamProducts {
    id: uuid
    jam_id: uuid ref to Jams
    product_id: uuid ref to Products
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

JamProductReviews {
    id: uuid
    jam_id: uuid ref to Jams
    user_id: uuid ref to Users
    product_id: uuid ref to Products
    review_rating: number // 0 to 5
    review_text: string // max 120 chars
    created_at: timestamp
    updated_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

Notifications {
    id: uuid
    user_id: uuid ref to Users // who receives it
    title: string
    message: string
    entity_type: 'user' | 'document' | 'product' | 'sale'
    entity_id: uuid
    snapshot: jsonb
    delivery_type: 'push' | 'email' | 'inapp'
    created_at: timestamp
    updated_at: timestamp
    read: boolean
    read_at: timestamp
    deleted: boolean
    deleted_at: timestamp
}

ActivityFeed {
    id: uuid
    user_id: uuid ref to Users // who performed the action
    entity_type: 'user' | 'document' | 'product' | 'sale' | 'jam'
    entity_id: uuid
    action_type: 'created' | 'updated' | 'deleted' | 'public' | 'purchased' | 'reviewed'
    snapshot: jsonb
    created_at: timestamp
}

Sessions {
    id: uuid
    user_id: uuid ref to Users
    token: string
    expires_at: timestamp
    created_at: timestamp
    updated_at: timestamp
}

VerificationTokens {
    id: uuid
    user_id: uuid ref to Users
    token: string
    type: 'email_verification' | 'password_reset'
    expires_at: timestamp
    created_at: timestamp
}

StripeWebhookEvents {
    id: uuid
    stripe_event_id: string // unique from Stripe
    event_type: string
    payload: jsonb
    processed: boolean
    processed_at: timestamp
    created_at: timestamp
}

UserFollows {
    id: uuid
    follower_id: uuid ref to Users // who is following
    following_id: uuid ref to Users // who is being followed
    created_at: timestamp
}

Wishlists {
    id: uuid
    user_id: uuid ref to Users
    product_id: uuid ref to Products
    created_at: timestamp
}

// general audit logging with snapshots of the event
LogEvents {
    id: uuid
    title: string
    message: string
    entity_type: 'user' | 'document' | 'product' | 'sale'
    snapshot: jsonb
    created_at: timestamp
}

## Views
"/" - landing page, featured products, etc...
"/feed" - allows a user to view global activity for the entire platform
"/login" - allows a user to login

"/users" - allows a user to view and search for users
"/users/[handle]" - allows a user to manage details about their own profile. If not the current user, you view the public user profile.
"/users/[handle]/feed" - allows viewing user activity on a particular user account

"/documents" - allows a user to view and search for their own documents and those they are collaborating on.
"/documents/[handle]" - allows a user to manage details about their own documents. Documents are private collaboration tools.
"/documents/[handle]/feed" - allows viewing document activity on a particular document

"/products" - allows a user to view and search for products.
"/products/[handle]" - allows a user to manage details about their own products. If not the owner or a collaborator, you view the public product as a customer.
"/products/[handle]/feed" - allows viewing product activity on a particular product

"/tags" - allows a user to view and search for tags of products
"/tags/[handle]" - allows a user to view products within a particular tag
"/tags/[handle]/feed" - allows viewing tag activity on a particular tag

"/jams" - allows a user to view and search for game jams
"/jams/[handle]" - allows a user to view game jams
"/jams/[handle]/feed" - allows viewing jam activity on a particular jam

"/cart" - view your current cart and checkout

## APIs
Astro API Routes + Supabase Direct:
- Static pages rendered at build time where possible
- SolidJS islands for interactive components (auth forms, file uploads, cart, etc.)
- Astro API routes (`/src/pages/api/`) for server-side operations
- Supabase SDK via isolated data-access layer (all Supabase calls in dedicated modules)
- Supabase Auth for session management (cookies handled by Supabase SDK)
- Signals for reactive state within islands
- Nanostores for cross-island state if needed

## Architecture Layers
**Data Access Layer** (`/src/lib/data-access/`)
- All Supabase DB SDK calls isolated here
- Export service functions (e.g., `getUserById`, `createProduct`)
- No direct Supabase imports outside this layer
- Enables easy migration to different backend

**Storage Layer** (`/src/lib/storage/`)
- All Supabase Storage SDK calls isolated here
- Export storage functions (e.g., `uploadProductFile`, `uploadProductImage`, `createSignedUrl`)
- No direct Storage SDK imports outside this layer

**Auth Layer** (`/src/lib/auth/`)
- Supabase Auth configuration and utilities
- Session helpers for server/client
- Auth middleware for Astro API routes

**Island Components** (`/src/components/islands/`)
- SolidJS components with client-side interactivity
- Use Signals for local state
- Call Astro API routes or Supabase client directly
- Examples: SignUpForm, ProductFileUploader, CartCheckout

## Deployment
Vercel deploys automatically on git push to main branch

## Guard Rails
- Never use "Any" Types
- Never have unused imports
- Components should be DRY as possible
- BEM CSS naming convention for all components (see examples in `/src/components/`)
- **CRITICAL: All 3rd party service SDKs MUST be isolated in dedicated layers**
  - Supabase SDK only in `/src/lib/data-access/` and `/src/lib/storage/` and `/src/lib/auth/`
  - Stripe SDK only in `/src/lib/payments/`
  - No direct imports of these SDKs anywhere else
  - This enables quick migration if we decide to switch providers
  - Island components should only import from our abstraction layers
  - Astro pages can import from abstraction layers for server-side rendering
- **Form Patterns:**
  - Use SolidJS native forms with Signals for simple forms (login, signup)
  - Use Signals + Zod for complex forms with validation (product file uploads, checkout)
  - Keep form state local to islands

  ## User Personas and Journey

  ### (Consumer) Game Buyer
  - Someone who enjoys miniatures games
  - Someone who enjoys painting miniatures
  - Someone who enjoys print and play games
  - This person will be able to follow Game Designers, 3D Modelers, Artists, etc... on the platform.
  - This person will be able to make purchases for games and products
  - This person will have confidence in the idea that they are helping to support the livelihood of contributors to the games they purchase

  ### (Contributor)  Illustrator
  - Someone who creates embeddable illustration products (character designs, maps, tokens, etc.)
  - Someone who can offer services to other members, ex: a game designer hires an illustrator to do work on their game.
  - Someone who can sell digital art products
  - Someone who earns royalties when their products are embedded in other products

  ### (Contributor)  3D modeler
  - Someone who creates embeddable 3D model products (STL files, OBJs, etc.)
  - Someone who can offer services to other members, ex: a game designer hires an 3d Modeler to do work on their game.
  - Someone who can sell STL files as digital download products
  - Someone who earns royalties when their products are embedded in other products

  ### (Contributor)  3D printer
  - Someone who can accept 3d print orders from sales as an upgrade to the sale. ex: A buyer makes a game purchase and as an upsell during checkout we compare with available local printers who can take the job then send them the order.

  ### (Contributor) Game Designer
  - Someone who can design, develop, and sell game products on the platform
  - Someone who designs tabletop games and miniatures games
  - Someone who assembles products from multiple creators (embeds products within products)
  - Someone looking for a way to streamline this process of licensing, royalty payments, sales channels, etc...

  #### Contributor
  - Someone who creates embeddable products to be used in other products
  - Someone who wants to earn revenue from these sales passively through royalties
  - Someone who wants to collaborate with others to make games.
