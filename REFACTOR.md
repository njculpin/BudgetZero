A user can create, read, update, delete Assets under /assets. This route allows full search, filter, grouping, of user uploaded files. An asset is described as a file. Contained in that ZIP file, can contain PDFs, STL files, PNG Files, etc... A user can upload 6 preview images that describes the asset. They can add a Title, a Description, and Tags. An asset will have a license agreement bound to it. Any user of the platform can inject the asset into their product but must agree with the license agreement. An asset can contain a royalty payment term. A royalty percentage is associated with the asset. This percentage is paid to the creator of the asset in the event a product is purchased containing the asset. The percentage is a percent of sale.

All users will use the platform license. This is limited to products created and sold on the platform. The licensing service within the platform should be flexible enough to be expanded in the future so that users can create their own agreements. This DIY license will not be part of the MVP.

A user can create a product. A product is a collection of assets. A product can have title, description, tags, prices, collections, a category. A product creator will be able to see a graph of payout distribution when they set their prices based on the assets they have selected for their products. Upon sale of a product, royalty payments are paid using stripe connected accounts. A minimum of $10 per month is required to make payment.

---------- START MODELS ----------

User
id: uuid
first_name: string
last_name: string
bio: string
email: string
phone: string
username: string
verified: bool
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

UserAddress
id: bigint
user_id: ref to User Cascades
address_type: string
is_primary: bool
full_name: string
address_line1: string
address_line2: string
city: string
state_province: string
postal_code: string
country_code: string
phone: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

Teams
id: uuid
name: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

UserPayouts
id: uuid
user_id: uuid ref to Users
stripe_transfer_id: string
total_cents: number
currency: string
status: string -- ('pending', 'paid', 'failed')
period_start: timestamptz
period_end: timestamptz
created_at: timestamptz
paid_at: timestamptz

UserStripeAccounts
id: uuid
user_id: uuid ref to Users
stripe_customer_id: string -- for buyers (used in checkout, saved cards, etc.)
stripe_account_id: string -- for creators (connected account for payouts)
created_at: timestamptz
updated_at: timestamptz
is_deleted: bool
deleted_at: timestamptz

UserStripeInvoices
id: bigint
user_id: uuid ref to Users
stripe_invoice_id: string
invoice_url: string
subtotal_cents: number
tax_cents: number
total_cents: number
currency: string
status: string -- ('draft', 'open', 'paid', 'void', 'uncollectible')
created_at: timestamptz
updated_at: timestamptz

StripePrices
id: uuid
lookup_name: string -- e.g., 'platform_fee_10_percent', 'platform_fee_500_cents'
price_cents: number -- flat amount in cents
currency: string
fee_type: string -- 'percentage' or 'fixed' enum
created_at: timestamptz
updated_at: timestamptz
is_deleted: bool
deleted_at: timestamptz

TeamUsers DTO
id: bigint
user_id: uuid ref to Users
team_id: uuid ref to Teams
credits: string -- a simple string to describe what the user worked on
created_at timestamptz

TeamChannels
id: bigint
team_id: uuid ref to Teams
title: string
description: string
created_at timestamptz
is_deleted: bool,
deleted_at timestamptz

TeamChatMessages
id: bigint
channel_id: uuid ref to TeamChannels
user_id: uuid ref to Users
message: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

TeamChatMessageAttachments
id: bigint
chat_message_id: uuid ref to TeamChatMessages
attachment_url: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

TeamChatMessageReactions
id: bigint
user_id: uuid ref to Users
chat_message_id: uuid ref to TeamChatMessages
reaction: string // emoji
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

Assets
id: uuid
user_id: uuid ref to Users
title string
description string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetTags
id: bigint
asset_id: uuid ref to Assets
namespace: string
value: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetImages
id: bigint
asset_id: uuid ref to Assets
caption: string
image_url: string
position: number
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetFiles
id: bigint
asset_id: uuid ref to Assets
caption: string
file_url: string
mime_type: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetRoyalties
id: bigint
asset_id: uuid ref to Assets
user_id: uuid ref to Users -- contributor/creator
royalty_type: enum('fixed', 'percentage')
royalty_value: number -- cents or percent
created_at: timestamptz
updated_at: timestamptz
is_deleted: bool
deleted_at: timestamptz

AssetLicenses DTO
id: bigint
asset_id: uuid ref to Assets
license_id: uuid ref Licenses
is_active: bool
granted_at: timestamptz
expires_at: timestamptz
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetLicenseAcceptances
id: bigint
user_id: uuid ref to Users
asset_id: uuid ref to Assets
asset_license_id: bigint ref to AssetLicenses
asset_license_version: string
asset_license_title: string
asset_license_version: string
asset_license_agreement: string
accepted_at: timestamptz
created_at timestamptz
is_deleted: bool,
deleted_at timestamptz

AssetToProducts DTO // just to map "this asset is used in these products"
id: bigint
asset_id: uuid ref to Assets
product_id: uuid ref to Products
created_at timestamptz

Licenses
id: uuid
title: string,
version: string,
agreement: string,
tags: string,
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

Products
id: uuid
handle: string
title: string
description: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductTeams DTO
id: uuid
product_id: string
team_id: string
created_at timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductVariants
id: bigint
product_id: uuid ref to Products
title: string
sku: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductVariantAssets DTO
id: bigint
variant_id: bigint ref to ProductVariants
asset_id: uuid ref to Assets
created_at timestamptz

ProductVariantImages
id: bigint
variant_id: bigint ref to ProductVariants
caption: string
image_url: string
position: number
visible: bool
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductPrices
id: bigint
variant_id: bigint ref to ProductVariants
price_cents: number
currency: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductRatings
id: bigint
product_id: uuid ref to Products
user_id: uuid ref to Users
score: number (1 to 5)
comment: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductCategories
id: bigint
title: string
description: string
tags: string
created_at timestamptz
updated_at: timestamptz
is_deleted: bool,
deleted_at timestamptz

ProductToProductCategories DTO
id: uuid
product_id: uuid ref to Products
category_id: bigint ref to ProductCategories
created_at timestamptz
updated_at: timestamptz

Sales
id: bigint
user_id: uuid ref to Users
price_cents: number
currency: string
stripe_charge_id: string
status: string -- ('pending', 'paid', 'failed', 'refunded')
created_at timestamptz

SaleItems
id: bigint
sale_id: uuid ref to Sales
product_id: uuid ref to Products
variant_id: uuid ref to ProductVariants
price_cents: number
currency: string
quantity: number
snapshot: jsonb -- includes all relevant data at time of sale, all foriegn relationships and its data
created_at timestamptz

SaleItemAssets DTO
id: bigint
sale_item_id: uuid ref to SaleItems
asset_id: uuid ref to Assets
created_at timestamptz

SaleRoyaltyTransactions
id: bigint
sale_id: uuid ref to Sales
sale_item_id: bigint ref to SaleItems
sale_item_asset_id: bigint ref to SaleItemAssets
asset_royalty_id: bigint ref to AssetRoyalties
recipient_user_id: uuid ref to Users
royalty_type: enum('fixed','percentage')
royalty_value: number -- cents or percent
calculated_cents: number -- final amount to pay
status: enum('pending','ready_to_pay','paid','failed','refunded')
stripe_transfer_id: string
created_at: timestamptz
paid_at: timestamptz

SaleLicenseTransactions
id: bigint
sale_id: uuid ref to Sales
sale_item_id: uuid ref to SaleItems
sale_item_asset_id: uuid ref to SaleItemAssets
asset_license_id: uuid ref to AssetLicenses
asset_license_title: string
asset_license_version: string
asset_license_agreement: string
status: string
created_at timestamptz

AuditLogs
id: ulid
request_id: uuid
entity_type: string
entity_id: uuid
action: string
user_id: uuid ref to Users
ip_address: string
user_agent: string
snapshot: jsonb -- includes all relevant data about this transaction, a snapshot of all foriegn keys and its relationships, even if the objects are deleted, we keep record of the transaction
created_at timestamptz

---------- END MODELS ----------

---------- LOGICAL NOTES ----------

- soft deletes propogate down to foriegn relationships
- SaleItem & AuditLogs snapshot - includes all relevant information about the transaction
- SaleRoyaltyTransactions as enums - 'pending', 'ready_to_pay', 'paid', 'failed', 'refunded'
- royalty_type as enums - 'fixed','percentage'
- entity_type as enums - 'user ','asset', 'product', 'sale', 'sale_item', etc
- tables should have logical index definitions
- Indexing: You will want indexes on foreign keys, frequently queried fields (like user_id, asset_id, product_id), and maybe is_deleted for soft-delete filters.
- Enum enforcement on status and royalty_type ensures data integrity.
- AuditLogs captures both request context (request_id, user_agent, ip_address) and snapshot for traceability.
