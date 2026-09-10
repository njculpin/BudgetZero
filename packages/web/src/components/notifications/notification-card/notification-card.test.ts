// @vitest-environment node
//
// Astro components render on the server; see feature-item.test.ts for why the
// suite-wide jsdom environment does not work here.

import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NotificationCard from './notification-card.astro';
import type { Notification } from '@gameloopers/core/types';

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    title: 'New Sale',
    message: 'Someone bought Dungeon Kit',
    entity_type: 'product',
    entity_id: 'product-1',
    action_type: 'sale_completed',
    snapshot: { handle: 'dungeon-kit' },
    delivery_type: 'inapp',
    read: false,
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted: false,
    deleted_at: null,
    ...overrides,
  } as Notification;
}

async function render(overrides: Partial<Notification> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(NotificationCard, {
    props: { notification: notification(overrides) },
  });
}

describe('NotificationCard', () => {
  it('renders the title and message', async () => {
    const html = await render();

    expect(html).toContain('New Sale');
    expect(html).toContain('Someone bought Dungeon Kit');
  });

  describe('appearance', () => {
    it('gives money events the success tone', async () => {
      const sale = await render({ action_type: 'sale_completed' });
      const royalty = await render({ action_type: 'royalty_payment_received' });

      expect(sale).toContain('notification--success');
      expect(royalty).toContain('notification--success');
    });

    it('gives things needing attention the warning tone', async () => {
      const html = await render({ action_type: 'product_needs_review' });

      expect(html).toContain('notification--warning');
    });

    it('falls back to the default tone for an action it does not know', async () => {
      // The column is a plain string in Postgres, so a row written by a newer
      // deployment can arrive with a value this build has never heard of. The
      // cast is the point of the test: it must not render `notification--
      // undefined`.
      const html = await render({
        action_type: 'something_new_entirely' as Notification['action_type'],
      });

      expect(html).toContain('notification--default');
      expect(html).not.toContain('undefined');
    });

    it('hides the icon from assistive technology', async () => {
      const html = await render();

      const icon = html.match(/<span class="notification__icon"[^>]*>/)?.[0] ?? '';
      expect(icon).toContain('aria-hidden="true"');
    });
  });

  describe('link', () => {
    it('links a product notification to the product', async () => {
      const html = await render({
        entity_type: 'product',
        snapshot: { handle: 'dungeon-kit' },
      });

      expect(html).toContain('/products/dungeon-kit');
    });

    it('links a document notification to the document', async () => {
      const html = await render({
        entity_type: 'document',
        snapshot: { handle: 'rulebook' },
      });

      expect(html).toContain('/documents/rulebook');
    });

    it('links a sale to the purchases list, which needs no handle', async () => {
      // Sale snapshots are `{}`. The previous implementation checked for a
      // handle before reaching its `case 'sale'`, so the link never rendered.
      const html = await render({
        entity_type: 'sale',
        entity_id: 'sale-1',
        snapshot: {},
      });

      expect(html).toContain('/purchases');
    });

    it('renders no link when the snapshot carries no handle', async () => {
      const html = await render({ entity_type: 'product', snapshot: {} });

      expect(html).not.toContain('notification__actions');
    });

    it('renders no link for an entity type with no page of its own', async () => {
      // A `user` notification is about you; there is nowhere to send you.
      const html = await render({
        entity_type: 'user',
        snapshot: { handle: 'ada' },
      });

      expect(html).not.toContain('notification__actions');
    });

    it('posts before following the link while unread', async () => {
      // Following the link marks it read in the same request, so coming back
      // does not still show it as unread.
      const html = await render({ read: false });

      expect(html).toContain('/api/notifications/notif-1/read-and-view');
      expect(html).toMatch(/<button type="submit"/);
    });

    it('is a plain link once read', async () => {
      const html = await render({ read: true });

      expect(html).not.toContain('read-and-view');
      expect(html).toMatch(/<a href="\/products\/dungeon-kit"/);
    });
  });

  describe('unread state', () => {
    it('offers a mark-as-read control with an accessible name', async () => {
      const html = await render({ read: false });

      expect(html).toContain('/api/notifications/notif-1/read');
      expect(html).toContain('aria-label="Mark as read"');
    });

    it('marks the card unread for the eye and for the machine', async () => {
      const html = await render({ read: false });

      expect(html).toContain('notification-card--unread');
      expect(html).toContain('notification__unread');
    });

    it('offers neither once the notification is read', async () => {
      const html = await render({ read: true });

      expect(html).not.toContain('Mark as read');
      expect(html).not.toContain('notification__unread');
      expect(html).not.toContain('notification-card--unread');
    });
  });

  describe('relative time', () => {
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

    it('says "just now" under a minute', async () => {
      const html = await render({ created_at: ago(30 * 1000) });

      expect(html).toContain('just now');
    });

    it('counts in minutes, then hours, then days', async () => {
      expect(await render({ created_at: ago(5 * 60_000) })).toContain('5m ago');
      expect(await render({ created_at: ago(3 * 3_600_000) })).toContain('3h ago');
      expect(await render({ created_at: ago(2 * 86_400_000) })).toContain('2d ago');
    });

    it('coarsens to months and years rather than counting days forever', async () => {
      expect(await render({ created_at: ago(60 * 86_400_000) })).toContain('2mo ago');
      expect(await render({ created_at: ago(400 * 86_400_000) })).toContain('1y ago');
    });
  });
});
