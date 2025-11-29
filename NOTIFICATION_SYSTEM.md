# Notification System Documentation

**Date:** 2025-11-28
**Status:** ✅ Implemented

---

## 🎯 Overview

The notification system provides real-time alerts to users when important events occur, with a focus on **asset change management** and **product conflict resolution**. The system automatically detects when asset changes affect products and takes appropriate action to prevent pricing conflicts.

---

## 🏗️ Architecture

### Database Schema

#### **notifications** table
Stores all user notifications with rich context data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Recipient user ID |
| `title` | TEXT | Notification title |
| `message` | TEXT | Full notification message |
| `entity_type` | TEXT | Type of entity (asset, product, sale, etc.) |
| `entity_id` | UUID | ID of related entity |
| `action_type` | TEXT | Type of action that triggered notification |
| `snapshot` | JSONB | Contextual data for the notification |
| `delivery_type` | TEXT | Delivery method (push, email, inapp) |
| `read` | BOOLEAN | Whether notification has been read |
| `read_at` | TIMESTAMPTZ | Timestamp when marked as read |
| `deleted` | BOOLEAN | Soft delete flag |

**Action Types:**
- `asset_price_changed` - Asset price was updated
- `asset_files_changed` - Asset files were modified
- `asset_royalties_changed` - Asset royalty splits changed
- `product_needs_review` - Product needs owner review
- `product_price_conflict` - Asset costs exceed product price
- `sale_completed` - Sale was completed
- `royalty_payment_received` - Royalty payment received
- `document_shared` - Document was shared
- `jam_submission_approved` - Jam submission approved
- `general` - General notification

#### **notification_settings** table
User preferences for notification delivery.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | User ID (unique) |
| `email_asset_changes` | BOOLEAN | Email for asset changes |
| `email_product_conflicts` | BOOLEAN | Email for product conflicts |
| `email_sales` | BOOLEAN | Email for sales |
| `email_royalty_payments` | BOOLEAN | Email for royalty payments |
| `email_document_shares` | BOOLEAN | Email for document shares |
| `email_jam_updates` | BOOLEAN | Email for jam updates |
| `email_marketing` | BOOLEAN | Email for marketing |
| `inapp_*` | BOOLEAN | In-app notification preferences |
| `push_*` | BOOLEAN | Push notification preferences (future) |

#### **asset_change_log** table
Audit log of asset changes that affect products.

| Column | Type | Description |
|--------|------|-------------|
| `asset_id` | UUID | Asset that was changed |
| `changed_by_user_id` | UUID | User who made the change |
| `change_type` | TEXT | Type of change (price, files, royalties, etc.) |
| `old_value` | JSONB | Previous value |
| `new_value` | JSONB | New value |
| `affected_products_count` | INTEGER | Number of products affected |
| `notifications_sent` | INTEGER | Number of notifications sent |

#### **products** table additions
New columns to track products needing attention:

| Column | Type | Description |
|--------|------|-------------|
| `needs_attention` | BOOLEAN | Product requires owner review |
| `attention_reason` | TEXT | Why product needs attention |
| `attention_since` | TIMESTAMPTZ | When product was flagged |

---

## 🔄 Asset Change Detection Workflow

### Trigger: Asset Price Change

When an asset's `royalty_fixed_total` changes, the system automatically:

1. **Detects the change** via database trigger on `assets` table
2. **Finds affected products** that use this asset
3. **Calculates total costs** for each product
4. **Checks for conflicts**:
   - If `total_asset_costs > product_price` → **CONFLICT**
   - If no conflict but price changed → **WARNING**

5. **Takes action**:
   - **CONFLICT**:
     - Mark product as `status = 'draft'` (takes offline)
     - Set `needs_attention = true`
     - Create `product_price_conflict` notification
     - Record change in `asset_change_log`
   - **WARNING**:
     - Set `needs_attention = true`
     - Create `asset_price_changed` notification
     - Keep product online

6. **Notifies product owner** with detailed context

### Example Scenario

**Before:**
- Asset "Fantasy Map Pack" costs $10
- Product "Complete Game Bundle" sells for $50
- Product includes 3 assets totaling $30

**Asset Owner Updates:**
- Increases "Fantasy Map Pack" to $25

**System Response:**
- New total asset cost: $45 (still under $50)
- **Action**: Creates warning notification
- **Product Status**: Remains published
- **Notification**: "Asset 'Fantasy Map Pack' price changed from $10 to $25. Please review your product pricing."

**If Price Increased to $30:**
- New total asset cost: $55 (exceeds $50)
- **Action**: Takes product offline
- **Product Status**: Changed to draft
- **Notification**: "Your product 'Complete Game Bundle' has been taken offline. Asset costs ($55) now exceed your product price ($50)."

---

## 🎨 UI Components

### NotificationCenter
**File**: `/src/components/islands/NotificationCenter.tsx`

A dropdown notification center with bell icon and unread badge.

**Features:**
- Real-time unread count badge
- Dropdown with scrollable notification list
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Click notification to navigate to related entity
- Link to notification settings

**Usage:**
```astro
import NotificationCenter from "@/components/islands/NotificationCenter";

<NotificationCenter
  client:load
  userId={currentUser.id}
  initialNotifications={notifications}
  initialUnreadCount={unreadCount}
/>
```

### ProductConflictBanner
**File**: `/src/components/islands/ProductConflictBanner.tsx`

Alert banner shown on product pages when a product needs attention.

**Features:**
- Displays attention reason with context
- Shows when product was flagged
- "Mark as Resolved" button
- "Edit Product" link

**Usage:**
```astro
import ProductConflictBanner from "@/components/islands/ProductConflictBanner";

{product.needs_attention && (
  <ProductConflictBanner
    client:load
    productId={product.id}
    productHandle={product.handle}
    attentionReason={product.attention_reason}
    attentionSince={product.attention_since}
  />
)}
```

### NotificationSettingsForm
**File**: `/src/components/islands/NotificationSettingsForm.tsx`

Form for managing notification preferences.

**Features:**
- Email notification toggles
- In-app notification toggles
- Save button with loading state
- Success/error messages

---

## 🛠️ API Endpoints

### GET `/api/notifications`
Fetch notifications for current user.

**Query Params:**
- `limit` (default: 50) - Number of notifications to fetch
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "notifications": [...],
  "count": 10
}
```

### GET `/api/notifications/unread-count`
Get unread notification count.

**Response:**
```json
{
  "count": 5
}
```

### POST `/api/notifications/mark-all-read`
Mark all notifications as read for current user.

**Response:**
```json
{
  "success": true
}
```

### POST `/api/notifications/[id]/read`
Mark specific notification as read.

**Response:**
```json
{
  "success": true
}
```

### DELETE `/api/notifications/[id]`
Delete a notification (soft delete).

**Response:**
```json
{
  "success": true
}
```

### POST `/api/settings/notifications`
Update notification settings.

**Request Body:**
```json
{
  "email_asset_changes": true,
  "email_product_conflicts": true,
  "inapp_sales": true,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "settings": {...}
}
```

### POST `/api/products/[id]/resolve-conflict`
Mark product conflict as resolved.

**Response:**
```json
{
  "success": true
}
```

---

## 📊 Data Access Layer

**File**: `/src/lib/data-access/notifications.ts`

Isolated functions for notification database operations:

- `getNotifications(userId, limit, offset)` - Fetch user's notifications
- `getUnreadNotifications(userId)` - Fetch unread notifications
- `getUnreadNotificationCount(userId)` - Count unread notifications
- `getNotificationById(id)` - Fetch single notification
- `markNotificationAsRead(id)` - Mark as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(id)` - Soft delete notification
- `getNotificationSettings(userId)` - Fetch user settings
- `updateNotificationSettings(userId, settings)` - Update settings
- `resolveProductConflict(productId, userId)` - Resolve conflict
- `getProductsNeedingAttention(userId)` - Fetch flagged products

---

## 🔐 Security & RLS Policies

**Notifications:**
- Users can only view their own notifications
- Users can only update/delete their own notifications
- Only service role can create notifications

**Notification Settings:**
- Users can only view/update their own settings
- Users can create settings on first login

**Asset Change Log:**
- Only service role can manage (admin-only audit log)

---

## 🚀 Future Enhancements

### Planned Features

1. **Email Delivery**
   - Integrate with Resend for email notifications
   - HTML email templates
   - Batch digest emails (daily/weekly summary)

2. **Push Notifications**
   - Browser push notifications (Web Push API)
   - Mobile push (if mobile app developed)

3. **Real-time Updates**
   - WebSocket connection for live notifications
   - Supabase Realtime for notification table

4. **Advanced Filtering**
   - Filter notifications by type
   - Search notifications
   - Archive notifications

5. **Notification Grouping**
   - Group similar notifications
   - "5 products need attention" summary

6. **Rich Notifications**
   - Inline action buttons
   - Preview of affected entities
   - Quick reply/resolve

---

## 🧪 Testing

### Manual Testing Checklist

1. **Asset Price Change (No Conflict)**
   - [ ] Update asset price within product budget
   - [ ] Verify notification created
   - [ ] Verify product stays published
   - [ ] Check `needs_attention = true`

2. **Asset Price Change (Conflict)**
   - [ ] Update asset price above product price
   - [ ] Verify product taken offline (draft)
   - [ ] Verify conflict notification created
   - [ ] Check attention reason populated

3. **Notification Center**
   - [ ] View unread count badge
   - [ ] Open notification dropdown
   - [ ] Click notification → navigate to entity
   - [ ] Mark notification as read
   - [ ] Mark all as read
   - [ ] Delete notification

4. **Notification Settings**
   - [ ] Navigate to `/settings/notifications`
   - [ ] Toggle email preferences
   - [ ] Toggle in-app preferences
   - [ ] Save settings
   - [ ] Verify settings persisted

5. **Product Conflict Resolution**
   - [ ] View ProductConflictBanner on product page
   - [ ] Click "Mark as Resolved"
   - [ ] Verify `needs_attention = false`
   - [ ] Verify banner dismissed

---

## 📝 Implementation Notes

### Database Functions

**`notify_products_of_asset_changes()`**
- Trigger function on `assets` table
- Fires on UPDATE operations
- Detects `royalty_fixed_total` changes
- Calculates product-level asset costs
- Creates notifications and logs changes

**`resolve_product_conflict(productId, userId)`**
- Verifies user owns product
- Clears attention flags
- Returns success/error status

**`create_default_notification_settings()`**
- Auto-creates settings for new users
- Trigger on user INSERT

### TypeScript Types

All types defined in `/src/types/system.types.ts`:
- `Notification`
- `NotificationSettings`
- `NotificationActionType`
- `AssetChangeLog`
- `AssetChangeType`

---

## 🎯 Success Metrics

**Target Metrics:**
- 100% of asset changes trigger notifications
- 0% false positives (incorrect conflict detection)
- <2s notification delivery latency
- >90% user satisfaction with notification relevance

**Current Status:**
- ✅ Database migration applied
- ✅ Trigger functions active
- ✅ UI components built
- ✅ API endpoints tested
- ⏳ Email delivery (pending Resend integration)
- ⏳ Real-time updates (pending WebSocket)

---

**Last Updated:** 2025-11-28
