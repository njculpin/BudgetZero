import type { RouteDefinition } from './router';
import { authCallback } from './controllers/auth/callback';
import { authResetPassword } from './controllers/auth/reset-password';
import { authSignIn } from './controllers/auth/sign-in';
import { authSignOutGet, authSignOutPost } from './controllers/auth/sign-out';
import { authSignUp } from './controllers/auth/sign-up';
import { authUpdatePassword } from './controllers/auth/update-password';
import { cartAddToCart } from './controllers/cart/add-to-cart';
import { cartClear } from './controllers/cart/clear';
import { cartRemove } from './controllers/cart/remove';
import { cartUpdate } from './controllers/cart/update';
import { checkoutCreateSession } from './controllers/checkout/create-session';
import { connectCreateAccount } from './controllers/connect/create-account';
import { connectCreateAccountLink } from './controllers/connect/create-account-link';
import { connectGetAccountStatus } from './controllers/connect/get-account-status';
import { connectRefreshStatus } from './controllers/connect/refresh-status';
import { documentsCreateDocument } from './controllers/documents/create-document';
import { documentsDeleteAttachment } from './controllers/documents/delete-attachment';
import { documentsDeleteDocument } from './controllers/documents/delete-document';
import { documentsUpdateContent } from './controllers/documents/update-content';
import { documentsUpdateDocument } from './controllers/documents/update-document';
import { documentsUploadAttachments } from './controllers/documents/upload-attachments';
import { documentsUserDocuments } from './controllers/documents/user-documents';
import { download } from './controllers/download';
import { notificationsId } from './controllers/notifications/by-id/index';
import { notificationsIdRead } from './controllers/notifications/by-id/read';
import { notificationsIdReadAndView } from './controllers/notifications/by-id/read-and-view';
import { notifications } from './controllers/notifications/index';
import { notificationsMarkAllRead } from './controllers/notifications/mark-all-read';
import { notificationsUnreadCount } from './controllers/notifications/unread-count';
import { payoutsExecute } from './controllers/payouts/execute';
import { payoutsGetBalance } from './controllers/payouts/get-balance';
import { payoutsRequestPayout } from './controllers/payouts/request-payout';
import { productsProductIdDocuments } from './controllers/products/by-id/documents';
import { productsProductIdEmbeddedProducts } from './controllers/products/by-id/embedded-products';
import { productsProductIdFiles } from './controllers/products/by-id/files';
import { productsProductId } from './controllers/products/by-id/index';
import { productsProductIdPriceBreakdown } from './controllers/products/by-id/price-breakdown';
import { productsProductIdResolveConflict } from './controllers/products/by-id/resolve-conflict';
import { productsProductIdRoyalties } from './controllers/products/by-id/royalties';
import { productsAddDocument } from './controllers/products/add-document';
import { productsCreateProduct } from './controllers/products/create-product';
import { productsDeleteFile } from './controllers/products/delete-file';
import { productsDeleteImage } from './controllers/products/delete-image';
import { productsDeleteProduct } from './controllers/products/delete-product';
import { productsEmbedProduct } from './controllers/products/embed-product';
import { productsEmbeddable } from './controllers/products/embeddable';
import { productsEmbeddedUsage } from './controllers/products/embedded-usage';
import { productsGenerateDocumentPdfs } from './controllers/products/generate-document-pdfs';
import { productsRemoveDocument } from './controllers/products/remove-document';
import { productsReorderFiles } from './controllers/products/reorder-files';
import { productsReorderImages } from './controllers/products/reorder-images';
import { productsSearchEmbeddable } from './controllers/products/search-embeddable';
import { productsSearchProducts } from './controllers/products/search-products';
import { productsUnembedProduct } from './controllers/products/unembed-product';
import { productsUpdateDocumentPrice } from './controllers/products/update-document-price';
import { productsUpdateFilePrice } from './controllers/products/update-file-price';
import {
  productsUpdateProductPost,
  productsUpdateProductPut,
} from './controllers/products/update-product';
import { productsUploadFiles } from './controllers/products/upload-files';
import { settingsNotifications } from './controllers/settings/notifications';
import { subscribe } from './controllers/subscribe';
import { tagsSuggestions } from './controllers/tags/suggestions';
import { upload } from './controllers/upload';
import { usersCompleteOnboarding } from './controllers/users/complete-onboarding';
import { usersMeRecentProducts } from './controllers/users/me/recent-products';
import { usersSearchUsers } from './controllers/users/search-users';
import { usersUpdateTags } from './controllers/users/update-tags';
import { usersUpdateUser } from './controllers/users/update-user';
import { webhooksStripe } from './controllers/webhooks/stripe';

/**
 * Every API route, in one place.
 *
 * This replaces 70 adapter files under `packages/web/src/pages/api/`
 * whose entire content was a path (implied by where the file sat) and a
 * controller reference. Declaring it here puts the routing table beside the
 * controllers, which is what makes mounting the same API under a different
 * runtime a matter of writing one adapter rather than recreating a directory
 * tree.
 *
 * `public: true` means anonymous callers are allowed. Anything without it
 * requires a session — the safe default, and enforced in one place rather than
 * by a route's absence from a list in another package.
 */
export const routes: readonly RouteDefinition[] = [
  // auth
  { method: 'GET', path: '/auth/callback', controller: authCallback, public: true },
  {
    method: 'POST',
    path: '/auth/reset-password',
    controller: authResetPassword,
    public: true,
  },
  { method: 'POST', path: '/auth/sign-in', controller: authSignIn, public: true },
  { method: 'GET', path: '/auth/sign-out', controller: authSignOutGet, public: true },
  { method: 'POST', path: '/auth/sign-out', controller: authSignOutPost, public: true },
  { method: 'POST', path: '/auth/sign-up', controller: authSignUp, public: true },
  {
    method: 'POST',
    path: '/auth/update-password',
    controller: authUpdatePassword,
    public: true,
  },

  // cart
  { method: 'POST', path: '/cart/add-to-cart', controller: cartAddToCart },
  { method: 'POST', path: '/cart/clear', controller: cartClear },
  { method: 'POST', path: '/cart/remove', controller: cartRemove },
  { method: 'POST', path: '/cart/update', controller: cartUpdate },

  // checkout
  { method: 'POST', path: '/checkout/create-session', controller: checkoutCreateSession },

  // connect
  { method: 'POST', path: '/connect/create-account', controller: connectCreateAccount },
  {
    method: 'POST',
    path: '/connect/create-account-link',
    controller: connectCreateAccountLink,
  },
  {
    method: 'GET',
    path: '/connect/get-account-status',
    controller: connectGetAccountStatus,
  },
  { method: 'POST', path: '/connect/refresh-status', controller: connectRefreshStatus },

  // documents
  {
    method: 'POST',
    path: '/documents/create-document',
    controller: documentsCreateDocument,
  },
  {
    method: 'POST',
    path: '/documents/delete-attachment',
    controller: documentsDeleteAttachment,
  },
  {
    method: 'POST',
    path: '/documents/delete-document',
    controller: documentsDeleteDocument,
  },
  {
    method: 'POST',
    path: '/documents/update-content',
    controller: documentsUpdateContent,
  },
  {
    method: 'POST',
    path: '/documents/update-document',
    controller: documentsUpdateDocument,
  },
  {
    method: 'POST',
    path: '/documents/upload-attachments',
    controller: documentsUploadAttachments,
  },
  {
    method: 'GET',
    path: '/documents/user-documents',
    controller: documentsUserDocuments,
  },

  // download
  { method: 'POST', path: '/download', controller: download },

  // notifications
  { method: 'GET', path: '/notifications', controller: notifications },
  { method: 'DELETE', path: '/notifications/:id', controller: notificationsId },
  { method: 'POST', path: '/notifications/:id/read', controller: notificationsIdRead },
  {
    method: 'POST',
    path: '/notifications/:id/read-and-view',
    controller: notificationsIdReadAndView,
  },
  {
    method: 'POST',
    path: '/notifications/mark-all-read',
    controller: notificationsMarkAllRead,
  },
  {
    method: 'GET',
    path: '/notifications/unread-count',
    controller: notificationsUnreadCount,
  },

  // payouts
  { method: 'POST', path: '/payouts/execute', controller: payoutsExecute },
  { method: 'GET', path: '/payouts/get-balance', controller: payoutsGetBalance },
  { method: 'POST', path: '/payouts/request-payout', controller: payoutsRequestPayout },

  // products
  { method: 'GET', path: '/products/:productId', controller: productsProductId },
  {
    method: 'GET',
    path: '/products/:productId/documents',
    controller: productsProductIdDocuments,
  },
  {
    method: 'GET',
    path: '/products/:productId/embedded-products',
    controller: productsProductIdEmbeddedProducts,
  },
  {
    method: 'GET',
    path: '/products/:productId/files',
    controller: productsProductIdFiles,
  },
  {
    method: 'GET',
    path: '/products/:productId/price-breakdown',
    controller: productsProductIdPriceBreakdown,
  },
  {
    method: 'POST',
    path: '/products/:productId/resolve-conflict',
    controller: productsProductIdResolveConflict,
  },
  {
    method: 'GET',
    path: '/products/:productId/royalties',
    controller: productsProductIdRoyalties,
  },
  { method: 'POST', path: '/products/add-document', controller: productsAddDocument },
  { method: 'POST', path: '/products/create-product', controller: productsCreateProduct },
  { method: 'POST', path: '/products/delete-file', controller: productsDeleteFile },
  { method: 'POST', path: '/products/delete-image', controller: productsDeleteImage },
  {
    method: 'DELETE',
    path: '/products/delete-product',
    controller: productsDeleteProduct,
  },
  { method: 'POST', path: '/products/embed-product', controller: productsEmbedProduct },
  { method: 'GET', path: '/products/embeddable', controller: productsEmbeddable },
  { method: 'GET', path: '/products/embedded-usage', controller: productsEmbeddedUsage },
  {
    method: 'POST',
    path: '/products/generate-document-pdfs',
    controller: productsGenerateDocumentPdfs,
  },
  {
    method: 'POST',
    path: '/products/remove-document',
    controller: productsRemoveDocument,
  },
  { method: 'POST', path: '/products/reorder-files', controller: productsReorderFiles },
  { method: 'POST', path: '/products/reorder-images', controller: productsReorderImages },
  {
    method: 'GET',
    path: '/products/search-embeddable',
    controller: productsSearchEmbeddable,
  },
  {
    method: 'GET',
    path: '/products/search-products',
    controller: productsSearchProducts,
  },
  {
    method: 'POST',
    path: '/products/unembed-product',
    controller: productsUnembedProduct,
  },
  {
    method: 'POST',
    path: '/products/update-document-price',
    controller: productsUpdateDocumentPrice,
  },
  {
    method: 'POST',
    path: '/products/update-file-price',
    controller: productsUpdateFilePrice,
  },
  {
    method: 'POST',
    path: '/products/update-product',
    controller: productsUpdateProductPost,
  },
  {
    method: 'PUT',
    path: '/products/update-product',
    controller: productsUpdateProductPut,
  },
  { method: 'POST', path: '/products/upload-files', controller: productsUploadFiles },

  // settings
  { method: 'POST', path: '/settings/notifications', controller: settingsNotifications },

  // subscribe
  { method: 'POST', path: '/subscribe', controller: subscribe, public: true },

  // tags
  { method: 'GET', path: '/tags/suggestions', controller: tagsSuggestions, public: true },

  // upload
  { method: 'POST', path: '/upload', controller: upload },

  // users
  {
    method: 'POST',
    path: '/users/complete-onboarding',
    controller: usersCompleteOnboarding,
  },
  { method: 'GET', path: '/users/me/recent-products', controller: usersMeRecentProducts },
  {
    method: 'GET',
    path: '/users/search-users',
    controller: usersSearchUsers,
    public: true,
  },
  { method: 'POST', path: '/users/update-tags', controller: usersUpdateTags },
  { method: 'POST', path: '/users/update-user', controller: usersUpdateUser },

  // webhooks
  { method: 'POST', path: '/webhooks/stripe', controller: webhooksStripe, public: true },
];
