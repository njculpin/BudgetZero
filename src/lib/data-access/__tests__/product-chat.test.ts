import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getProductChatMessages,
  createChatMessage,
} from '../product-chat';
import { createProduct } from '../products';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Product Chat Data Access Layer', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testProductId: string;
  let testMessageId: string;
  const testEmail1 = `test-prod-chat-1-${Date.now()}@example.com`;
  const testEmail2 = `test-prod-chat-2-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create two test users
    const { data: user1Data } = await supabase.auth.admin.createUser({
      email: testEmail1,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    const { data: user2Data } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (!user1Data?.user || !user2Data?.user) {
      throw new Error('Failed to create test users');
    }

    testUser1Id = user1Data.user.id;
    testUser2Id = user2Data.user.id;

    // Create a test product
    const product = await createProduct(testUser1Id, {
      title: 'Test Product for Chat',
      status: 'published',
    });

    if (!product) throw new Error('Failed to create test product');
    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up test users (cascades to products and chat messages)
    if (testUser1Id) {
      await supabase.auth.admin.deleteUser(testUser1Id);
    }
    if (testUser2Id) {
      await supabase.auth.admin.deleteUser(testUser2Id);
    }
  });

  describe('createChatMessage', () => {
    it('should create a chat message for a product', async () => {
      const message = await createChatMessage(
        testProductId,
        testUser1Id,
        'Hello! This is a test message.'
      );

      expect(message).toBeDefined();
      expect(message?.product_id).toBe(testProductId);
      expect(message?.user_id).toBe(testUser1Id);
      expect(message?.message).toBe('Hello! This is a test message.');
      expect(message?.created_at).toBeDefined();

      if (message) {
        testMessageId = message.id;
      }
    });

    it('should create messages from different users', async () => {
      const message = await createChatMessage(
        testProductId,
        testUser2Id,
        'Reply from User 2'
      );

      expect(message).toBeDefined();
      expect(message?.user_id).toBe(testUser2Id);
      expect(message?.message).toBe('Reply from User 2');
    });

    it('should handle empty messages', async () => {
      const message = await createChatMessage(
        testProductId,
        testUser1Id,
        ''
      );

      expect(message).toBeDefined();
      expect(message?.message).toBe('');
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      const message = await createChatMessage(
        testProductId,
        testUser1Id,
        longMessage
      );

      expect(message).toBeDefined();
      expect(message?.message.length).toBe(1000);
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = 'Hello! @user #hashtag $money & <html> "quotes"';
      const message = await createChatMessage(
        testProductId,
        testUser1Id,
        specialMessage
      );

      expect(message).toBeDefined();
      expect(message?.message).toBe(specialMessage);
    });
  });

  describe('getProductChatMessages', () => {
    it('should fetch all messages for a product', async () => {
      const messages = await getProductChatMessages(testProductId);

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(m => m.product_id === testProductId)).toBe(true);
    });

    it('should include user information with messages', async () => {
      const messages = await getProductChatMessages(testProductId);

      expect(messages.length).toBeGreaterThan(0);

      const firstMessage = messages[0];
      expect(firstMessage.user).toBeDefined();
      expect(firstMessage.user?.handle).toBeDefined();
    });

    it('should order messages by created_at ascending', async () => {
      const messages = await getProductChatMessages(testProductId);

      if (messages.length > 1) {
        for (let i = 0; i < messages.length - 1; i++) {
          const current = new Date(messages[i].created_at).getTime();
          const next = new Date(messages[i + 1].created_at).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    it('should return empty array for product with no messages', async () => {
      const product2 = await createProduct(testUser1Id, {
        title: 'Product Without Chat',
        status: 'published',
      });

      const messages = await getProductChatMessages(product2!.id);
      expect(messages).toEqual([]);
    });

    it('should handle multiple messages from same user', async () => {
      await createChatMessage(testProductId, testUser1Id, 'Message 1');
      await createChatMessage(testProductId, testUser1Id, 'Message 2');
      await createChatMessage(testProductId, testUser1Id, 'Message 3');

      const messages = await getProductChatMessages(testProductId);
      const user1Messages = messages.filter(m => m.user_id === testUser1Id);

      expect(user1Messages.length).toBeGreaterThanOrEqual(3);
    });

    it('should include messages from all users', async () => {
      const messages = await getProductChatMessages(testProductId);

      const hasUser1Messages = messages.some(m => m.user_id === testUser1Id);
      const hasUser2Messages = messages.some(m => m.user_id === testUser2Id);

      expect(hasUser1Messages).toBe(true);
      expect(hasUser2Messages).toBe(true);
    });
  });

  describe('Integration: Chat Conversation Flow', () => {
    it('should simulate a realistic chat conversation', async () => {
      // Create a new product for this test
      const product = await createProduct(testUser1Id, {
        title: 'Product for Conversation Test',
        status: 'published',
      });

      // User 1 starts conversation
      const msg1 = await createChatMessage(
        product!.id,
        testUser1Id,
        'Is this product still available?'
      );
      expect(msg1).toBeDefined();

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      // User 2 (owner) replies
      const msg2 = await createChatMessage(
        product!.id,
        testUser2Id,
        'Yes, it is! Would you like to purchase it?'
      );
      expect(msg2).toBeDefined();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // User 1 responds
      const msg3 = await createChatMessage(
        product!.id,
        testUser1Id,
        'Great! Adding to cart now.'
      );
      expect(msg3).toBeDefined();

      // Fetch all messages and verify conversation order
      const messages = await getProductChatMessages(product!.id);

      expect(messages.length).toBe(3);
      expect(messages[0].message).toBe('Is this product still available?');
      expect(messages[1].message).toBe('Yes, it is! Would you like to purchase it?');
      expect(messages[2].message).toBe('Great! Adding to cart now.');

      // Verify user alternation
      expect(messages[0].user_id).toBe(testUser1Id);
      expect(messages[1].user_id).toBe(testUser2Id);
      expect(messages[2].user_id).toBe(testUser1Id);
    });
  });

  describe('Performance: High Message Volume', () => {
    it('should handle multiple messages efficiently', async () => {
      const product = await createProduct(testUser1Id, {
        title: 'Product for Volume Test',
        status: 'published',
      });

      // Create 10 messages
      const messagePromises = [];
      for (let i = 0; i < 10; i++) {
        messagePromises.push(
          createChatMessage(
            product!.id,
            i % 2 === 0 ? testUser1Id : testUser2Id,
            `Message number ${i + 1}`
          )
        );
      }

      const messages = await Promise.all(messagePromises);
      expect(messages.every(m => m !== null)).toBe(true);

      // Verify all messages are retrieved
      const allMessages = await getProductChatMessages(product!.id);
      expect(allMessages.length).toBe(10);
    });
  });
});
