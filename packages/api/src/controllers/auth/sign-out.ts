import { signOut } from '@gameloopers/core/auth';
import type { Controller } from '../../context';
import { redirect } from '../../responses';
import { clearSessionCookies } from '../../gateway';

/**
 * Sign out.
 *
 * GET is kept alongside POST for links that still point here. It is not ideal —
 * a GET that changes state can be triggered by any page that can make the
 * browser navigate — but the only state it changes is destroying the caller's
 * own session, so the worst outcome is an unwanted sign-out.
 */
async function endSession(ctx: Parameters<Controller>[0]): Promise<Response> {
  await signOut();
  clearSessionCookies(ctx.cookies);
  return redirect('/');
}

// Two bindings rather than one aliased twice: a function's `name` is how the
// route table is checked against the paths it serves, and an alias reports the
// name of whatever it points at.
export const authSignOutPost: Controller = (ctx) => endSession(ctx);
export const authSignOutGet: Controller = (ctx) => endSession(ctx);
