import { updatePasswordForUser } from '@gameloopers/core/auth/session';
import type { Controller } from '../../context';
import { json, badRequest, unauthorized, serverError } from '../../responses';

/** Matches the provider's own floor; anything shorter is rejected there anyway. */
const MIN_PASSWORD_LENGTH = 6;

export const authUpdatePassword: Controller = async ({
  request,
  userId,
  accessToken,
}) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString();

  if (!password) return badRequest('Password is required');
  if (password.length < MIN_PASSWORD_LENGTH) {
    return badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (!userId || !accessToken) return unauthorized('Not authenticated');

  try {
    const { error } = await updatePasswordForUser(accessToken, password);

    if (error) {
      console.error('Password update error:', error);
      return badRequest(error);
    }

    return json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return serverError(
      error instanceof Error ? error.message : 'Failed to update password'
    );
  }
};
