import { completeOnboarding } from '@gameloopers/core/data-access/users';
import type { Controller } from '../../context';
import { json, unauthorized, serverError } from '../../responses';

export const usersCompleteOnboarding: Controller = async ({ userId }) => {
  if (!userId) return unauthorized();

  try {
    const updatedUser = await completeOnboarding(userId);
    if (!updatedUser) return serverError('Failed to complete onboarding');

    return json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error in complete-onboarding:', error);
    return serverError();
  }
};
