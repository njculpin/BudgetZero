import { stripe } from './client';
import type Stripe from 'stripe';

export interface CreateConnectAccountParams {
  email: string;
  country?: string;
}

export interface ConnectAccountStatus {
  accountId: string;
  onboarded: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

/**
 * Create a Stripe Connect Express account for a contributor
 */
export async function createConnectAccount(
  params: CreateConnectAccountParams
): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: 'express',
    email: params.email,
    country: params.country || 'US',
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink;
}

/**
 * Retrieve Connect account details
 */
export async function getConnectAccount(
  accountId: string
): Promise<Stripe.Account> {
  return await stripe.accounts.retrieve(accountId);
}

/**
 * Get Connect account status
 */
export async function getConnectAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus> {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    accountId: account.id,
    onboarded: account.details_submitted || false,
    detailsSubmitted: account.details_submitted || false,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
  };
}

/**
 * Create a transfer to a Connect account
 */
export async function createTransfer(
  accountId: string,
  amountCents: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.Transfer> {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency,
    destination: accountId,
    metadata,
  });

  return transfer;
}

/**
 * Create a login link for Connect account dashboard
 */
export async function createLoginLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  return await stripe.accounts.createLoginLink(accountId);
}
