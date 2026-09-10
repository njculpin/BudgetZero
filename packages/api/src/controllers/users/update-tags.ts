import type { Controller } from '../../context';
import { unauthorized } from '../../responses';
import {
  addUserTag,
  removeUserTag,
  getUserTags,
} from '@gameloopers/core/data-access/users';

export const usersUpdateTags: Controller = async ({ request, userId }) => {
  // Check authentication
  if (!userId) return unauthorized('Not authenticated');

  try {
    const formData = await request.formData();
    const tagsJson = formData.get('tags') as string;

    if (!tagsJson) {
      return new Response(JSON.stringify({ error: 'Missing tags data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newTags = JSON.parse(tagsJson) as string[];

    // Get current tags
    const currentTags = await getUserTags(userId);

    // Determine tags to add and remove
    const tagsToAdd = newTags.filter((tag) => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter((tag) => !newTags.includes(tag));

    // Add new tags
    for (const tag of tagsToAdd) {
      await addUserTag(userId, tag);
    }

    // Remove old tags
    for (const tag of tagsToRemove) {
      await removeUserTag(userId, tag);
    }

    // Get updated tags
    const updatedTags = await getUserTags(userId);

    return new Response(JSON.stringify({ success: true, tags: updatedTags }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update tags error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update tags',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
