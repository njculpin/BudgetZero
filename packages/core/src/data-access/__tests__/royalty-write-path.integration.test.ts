/**
 * Royalty Write Path Integration Tests
 *
 * `product_royalties` is what every royalty feature reads, and until migration
 * 00013 nothing in the application ever wrote to it — so no royalty was ever paid
 * to anyone and the platform's differentiator was inert.
 *
 * Two things had to be true and neither was:
 *   1. `products.embedding_royalty_cents` did not exist as a column, so the rate a
 *      creator set was never stored. The type declared it as optional, so
 *      TypeScript never objected.
 *   2. Embedding wrote only a `product_components` row, with the price taken from
 *      the client — so the embedder set the price of someone else's work.
 *
 * These drive the real trigger and function rather than mocking them.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { embedProduct } from '../products';
import { getProductRoyalties } from '../royalties';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  (import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const suffix = crypto.randomUUID().slice(0, 8);

describe('Royalty write path', () => {
  let modellerId: string;
  let designerId: string;

  beforeAll(async () => {
    const { data: modeller } = await supabase.auth.admin.createUser({
      email: `modeller-${suffix}@test.local`,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    const { data: designer } = await supabase.auth.admin.createUser({
      email: `designer-${suffix}@test.local`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    modellerId = modeller!.user!.id;
    designerId = designer!.user!.id;
  });

  afterAll(async () => {
    if (modellerId) await supabase.auth.admin.deleteUser(modellerId);
    if (designerId) await supabase.auth.admin.deleteUser(designerId);
  });

  let counter = 0;

  async function makeProduct(opts: {
    ownerId: string;
    embeddable?: boolean;
    royaltyCents?: number;
    status?: string;
  }): Promise<string> {
    counter += 1;
    const { data, error } = await supabase
      .from('products')
      .insert({
        handle: `rwp-${suffix}-${counter}`,
        user_id: opts.ownerId,
        title: `Fixture ${counter}`,
        status: opts.status ?? 'public',
        is_embeddable: opts.embeddable ?? false,
        embedding_royalty_cents: opts.royaltyCents ?? 0,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create product: ${error?.message}`);
    }

    return data.id as string;
  }

  describe('a royalty exists for every embeddable product', () => {
    it('creates one when a product is published as embeddable', async () => {
      const productId = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });

      const royalties = await getProductRoyalties(productId);

      // Without this row, createRoyaltyTransactionsForProduct returns [] and the
      // creator earns nothing no matter how many times their work is sold.
      expect(royalties.length).toBe(1);
      expect(royalties[0].user_id).toBe(modellerId);
      expect(royalties[0].royalty_value).toBe(500);
      expect(royalties[0].royalty_type).toBe('fixed');
    });

    it('creates none for a product that is not embeddable', async () => {
      const productId = await makeProduct({
        ownerId: modellerId,
        embeddable: false,
        royaltyCents: 500,
      });

      expect((await getProductRoyalties(productId)).length).toBe(0);
    });

    it('creates none when the rate is zero', async () => {
      const productId = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 0,
      });

      expect((await getProductRoyalties(productId)).length).toBe(0);
    });

    it('follows the rate when the creator changes it', async () => {
      const productId = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });

      await supabase
        .from('products')
        .update({ embedding_royalty_cents: 900 })
        .eq('id', productId);

      const royalties = await getProductRoyalties(productId);
      expect(royalties.length).toBe(1);
      expect(royalties[0].royalty_value).toBe(900);
    });

    it('removes it when the creator withdraws the product from embedding', async () => {
      const productId = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });

      await supabase
        .from('products')
        .update({ is_embeddable: false })
        .eq('id', productId);

      // No new royalty accrues, but existing components keep their snapshotted
      // price — they were agreed at embed time.
      expect((await getProductRoyalties(productId)).length).toBe(0);
    });
  });

  describe('embedding prices from the child creator, not the embedder', () => {
    it('derives the price from the child product', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 750,
      });
      const parent = await makeProduct({ ownerId: designerId });

      const result = await embedProduct(parent, child, designerId);

      // The embedder cannot set this. It used to come from the request body,
      // where they could set it to zero.
      expect(result.inheritedPriceCents).toBe(750);
    });

    it('snapshots the price so a later rate change does not reprice it', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 400,
      });
      const parent = await makeProduct({ ownerId: designerId });

      await embedProduct(parent, child, designerId);

      await supabase
        .from('products')
        .update({ embedding_royalty_cents: 1200 })
        .eq('id', child);

      const { data } = await supabase
        .from('product_components')
        .select('inherited_price_cents')
        .eq('parent_product_id', parent)
        .eq('child_product_id', child)
        .single();

      // Products already built on this component must not silently reprice.
      expect(data!.inherited_price_cents).toBe(400);
    });

    it('refuses a product that is not marked embeddable', async () => {
      const child = await makeProduct({ ownerId: modellerId, embeddable: false });
      const parent = await makeProduct({ ownerId: designerId });

      await expect(embedProduct(parent, child, designerId)).rejects.toThrow(
        /not available for embedding/i
      );
    });

    it('refuses a parent the caller does not own', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });
      const parent = await makeProduct({ ownerId: designerId });

      await expect(embedProduct(parent, child, modellerId)).rejects.toThrow(
        /do not own the parent/i
      );
    });

    it('refuses self-embedding', async () => {
      const product = await makeProduct({
        ownerId: designerId,
        embeddable: true,
        royaltyCents: 500,
      });

      await expect(embedProduct(product, product, designerId)).rejects.toThrow(
        /cannot embed itself/i
      );
    });

    it('refuses a duplicate embed', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });
      const parent = await makeProduct({ ownerId: designerId });

      await embedProduct(parent, child, designerId);

      await expect(embedProduct(parent, child, designerId)).rejects.toThrow(
        /already embedded/i
      );
    });

    it('refuses a cycle', async () => {
      // A embeds B, then B tries to embed A. Price and royalty calculation would
      // recurse without terminating.
      const a = await makeProduct({
        ownerId: designerId,
        embeddable: true,
        royaltyCents: 300,
      });
      const b = await makeProduct({
        ownerId: designerId,
        embeddable: true,
        royaltyCents: 300,
      });

      await embedProduct(a, b, designerId);

      await expect(embedProduct(b, a, designerId)).rejects.toThrow(
        /already embeds this one/i
      );
    });

    it('refuses to embed a private product owned by someone else', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
        status: 'draft',
      });
      const parent = await makeProduct({ ownerId: designerId });

      await expect(embedProduct(parent, child, designerId)).rejects.toThrow(
        /do not have access/i
      );
    });
  });

  describe('the full earning chain', () => {
    it('leaves the child creator owed money after the parent sells', async () => {
      const child = await makeProduct({
        ownerId: modellerId,
        embeddable: true,
        royaltyCents: 500,
      });
      const parent = await makeProduct({ ownerId: designerId });

      await embedProduct(parent, child, designerId);

      // What the webhook does for each component of a sold product.
      const { data: sale } = await supabase
        .from('sales')
        .insert({
          user_id: designerId,
          user_email: `buyer-${suffix}@test.local`,
          price_cents: 2000,
          currency: 'usd',
          stripe_charge_id: `pi_chain_${suffix}`,
          status: 'paid',
        })
        .select('id')
        .single();

      const { data: saleItem } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale!.id,
          product_id: parent,
          price_cents: 2000,
          currency: 'usd',
          quantity: 1,
          snapshot: {},
        })
        .select('id')
        .single();

      const childRoyalties = await getProductRoyalties(child);
      expect(childRoyalties.length).toBe(1);

      await supabase.from('sale_royalty_transactions').insert({
        sale_id: sale!.id,
        sale_item_id: saleItem!.id,
        product_royalty_id: childRoyalties[0].id,
        recipient_user_id: childRoyalties[0].user_id,
        royalty_type: childRoyalties[0].royalty_type,
        royalty_value: childRoyalties[0].royalty_value,
        calculated_cents: childRoyalties[0].royalty_value,
        status: 'ready_to_pay',
      });

      const { data: owed } = await supabase
        .from('sale_royalty_transactions')
        .select('calculated_cents')
        .eq('recipient_user_id', modellerId)
        .eq('status', 'ready_to_pay');

      const total = (owed ?? []).reduce(
        (sum, row) => sum + (row.calculated_cents as number),
        0
      );

      // The whole point of the platform: the modeller earns from someone else's
      // sale, without being involved in it.
      expect(total).toBeGreaterThanOrEqual(500);
    });
  });
});
