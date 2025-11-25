import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getAssetChatMessages,
  createChatMessage,
} from '../asset-chat';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Asset Chat Data Access Layer', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testAssetId: string;
  let testMessageId: string;
  const testEmail1 = `test-asset-chat-1-${Date.now()}@example.com`;
  const testEmail2 = `test-asset-chat-2-${Date.now()}@example.com`;

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

    // Create a test asset
    const { data: asset } = await supabase
      .from('assets')
      .insert({
        user_id: testUser1Id,
        handle: 'test-asset-for-chat',
        title: 'Test Asset for Chat',
        description: 'Test asset',
        status: 'published',
      })
      .select()
      .single();

    if (!asset) throw new Error('Failed to create test asset');
    testAssetId = asset.id;
  });

  afterAll(async () => {
    // Clean up test users (cascades to assets and chat messages)
    if (testUser1Id) {
      await supabase.auth.admin.deleteUser(testUser1Id);
    }
    if (testUser2Id) {
      await supabase.auth.admin.deleteUser(testUser2Id);
    }
  });

  describe('createChatMessage', () => {
    it('should create a chat message for an asset', async () => {
      const message = await createChatMessage(
        testAssetId,
        testUser1Id,
        'Can I use this asset in my project?'
      );

      expect(message).toBeDefined();
      expect(message?.asset_id).toBe(testAssetId);
      expect(message?.user_id).toBe(testUser1Id);
      expect(message?.message).toBe('Can I use this asset in my project?');
      expect(message?.created_at).toBeDefined();

      if (message) {
        testMessageId = message.id;
      }
    });

    it('should create messages from different users', async () => {
      const message = await createChatMessage(
        testAssetId,
        testUser2Id,
        'Yes, it is available for commercial use.'
      );

      expect(message).toBeDefined();
      expect(message?.user_id).toBe(testUser2Id);
      expect(message?.message).toBe('Yes, it is available for commercial use.');
    });

    it('should handle markdown-style messages', async () => {
      const markdownMessage = '# Heading\n\n**Bold text** and *italic*\n\n- List item 1\n- List item 2';
      const message = await createChatMessage(
        testAssetId,
        testUser1Id,
        markdownMessage
      );

      expect(message).toBeDefined();
      expect(message?.message).toBe(markdownMessage);
    });

    it('should handle URLs in messages', async () => {
      const urlMessage = 'Check out https://example.com for more info';
      const message = await createChatMessage(
        testAssetId,
        testUser1Id,
        urlMessage
      );

      expect(message).toBeDefined();
      expect(message?.message).toBe(urlMessage);
    });

    it('should handle emoji in messages', async () => {
      const emojiMessage = 'Great asset! 👍 🎉 ❤️';
      const message = await createChatMessage(
        testAssetId,
        testUser1Id,
        emojiMessage
      );

      expect(message).toBeDefined();
      expect(message?.message).toBe(emojiMessage);
    });
  });

  describe('getAssetChatMessages', () => {
    it('should fetch all messages for an asset', async () => {
      const messages = await getAssetChatMessages(testAssetId);

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(m => m.asset_id === testAssetId)).toBe(true);
    });

    it('should include user information with messages', async () => {
      const messages = await getAssetChatMessages(testAssetId);

      expect(messages.length).toBeGreaterThan(0);

      const firstMessage = messages[0];
      expect(firstMessage.user).toBeDefined();
      expect(firstMessage.user?.handle).toBeDefined();
      expect(firstMessage.user?.name !== undefined).toBe(true);
      expect(firstMessage.user?.avatar_url !== undefined).toBe(true);
    });

    it('should order messages by created_at ascending', async () => {
      const messages = await getAssetChatMessages(testAssetId);

      if (messages.length > 1) {
        for (let i = 0; i < messages.length - 1; i++) {
          const current = new Date(messages[i].created_at).getTime();
          const next = new Date(messages[i + 1].created_at).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    it('should return empty array for asset with no messages', async () => {
      const { data: asset2 } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-no-chat',
          title: 'Asset Without Chat',
          status: 'published',
        })
        .select()
        .single();

      const messages = await getAssetChatMessages(asset2!.id);
      expect(messages).toEqual([]);
    });

    it('should not return messages from other assets', async () => {
      const { data: asset3 } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-isolation-test',
          title: 'Asset Isolation Test',
          status: 'published',
        })
        .select()
        .single();

      await createChatMessage(asset3!.id, testUser1Id, 'Message in asset 3');

      const asset1Messages = await getAssetChatMessages(testAssetId);
      const asset3Messages = await getAssetChatMessages(asset3!.id);

      const hasOverlap = asset1Messages.some(m1 =>
        asset3Messages.some(m3 => m1.id === m3.id)
      );

      expect(hasOverlap).toBe(false);
    });
  });

  describe('Integration: Licensing Discussion Flow', () => {
    it('should simulate a realistic licensing discussion', async () => {
      // Create a new asset for this test
      const { data: asset } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-licensing-discussion',
          title: 'Asset for Licensing Discussion',
          status: 'published',
        })
        .select()
        .single();

      // User 2 asks about licensing
      const msg1 = await createChatMessage(
        asset!.id,
        testUser2Id,
        'What are the licensing terms for this asset?'
      );
      expect(msg1).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 100));

      // User 1 (owner) provides details
      const msg2 = await createChatMessage(
        asset!.id,
        testUser1Id,
        'This asset is available under CC BY 4.0. You can use it commercially with attribution.'
      );
      expect(msg2).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 100));

      // User 2 asks follow-up
      const msg3 = await createChatMessage(
        asset!.id,
        testUser2Id,
        'Perfect! Can I modify it for my game?'
      );
      expect(msg3).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 100));

      // User 1 confirms
      const msg4 = await createChatMessage(
        asset!.id,
        testUser1Id,
        'Yes, modifications are allowed. Just credit the original work.'
      );
      expect(msg4).toBeDefined();

      // Fetch and verify conversation
      const messages = await getAssetChatMessages(asset!.id);

      expect(messages.length).toBe(4);
      expect(messages[0].user_id).toBe(testUser2Id);
      expect(messages[1].user_id).toBe(testUser1Id);
      expect(messages[2].user_id).toBe(testUser2Id);
      expect(messages[3].user_id).toBe(testUser1Id);

      // Verify content
      expect(messages[0].message).toContain('licensing terms');
      expect(messages[1].message).toContain('CC BY 4.0');
      expect(messages[2].message).toContain('modify');
      expect(messages[3].message).toContain('credit');
    });
  });

  describe('Integration: Collaboration Discussion', () => {
    it('should simulate a collaboration request conversation', async () => {
      const { data: asset } = await supabase
        .from('assets')
        .insert({
          user_id: testUser1Id,
          handle: 'asset-collaboration-test',
          title: 'Asset for Collaboration',
          status: 'published',
        })
        .select()
        .single();

      // User 2 expresses interest
      await createChatMessage(
        asset!.id,
        testUser2Id,
        'Love this asset! Would you be interested in collaborating on a game project?'
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Owner responds positively
      await createChatMessage(
        asset!.id,
        testUser1Id,
        'Thank you! I would be interested. What kind of project do you have in mind?'
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // User 2 explains
      await createChatMessage(
        asset!.id,
        testUser2Id,
        'A sci-fi board game. Your 3D models would be perfect for the miniatures.'
      );

      const messages = await getAssetChatMessages(asset!.id);

      expect(messages.length).toBe(3);
      expect(messages[0].message).toContain('collaborating');
      expect(messages[1].message).toContain('interested');
      expect(messages[2].message).toContain('sci-fi');
    });
  });

  describe('P2: Chat Message Quality', () => {
    it('should preserve whitespace in messages', async () => {
      const whitespaceMessage = 'Line 1\n\nLine 3 (with blank line above)';
      const msg = await createChatMessage(testAssetId, testUser1Id, whitespaceMessage);

      expect(msg?.message).toBe(whitespaceMessage);
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000);
      const msg = await createChatMessage(testAssetId, testUser1Id, longMessage);

      expect(msg?.message.length).toBe(5000);
    });

    it('should handle code snippets in messages', async () => {
      const codeMessage = '```javascript\nconst x = 10;\nconsole.log(x);\n```';
      const msg = await createChatMessage(testAssetId, testUser1Id, codeMessage);

      expect(msg?.message).toBe(codeMessage);
    });
  });
});
