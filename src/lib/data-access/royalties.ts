import { dataClient, createAuthenticatedClient } from './client';
import type { AssetRoyalty, RoyaltyType } from '@/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CreateRoyaltyParams {
  assetId: string;
  userId: string;
  royaltyType: RoyaltyType;
  royaltyValue: number;
}

/**
 * Get all royalties for an asset
 */
export const getAssetRoyalties = async (assetId: string): Promise<AssetRoyalty[]> => {
  const { data, error } = await dataClient
    .from('asset_royalties')
    .select('*')
    .eq('asset_id', assetId)
    .eq('deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching asset royalties:', error);
    return [];
  }

  return data as AssetRoyalty[];
};

/**
 * Create a new royalty for an asset
 */
export const createAssetRoyalty = async (
  params: CreateRoyaltyParams,
  authTokens: AuthTokens
): Promise<AssetRoyalty | null> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { data, error } = await client
    .from('asset_royalties')
    .insert({
      asset_id: params.assetId,
      user_id: params.userId,
      royalty_type: params.royaltyType,
      royalty_value: params.royaltyValue,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset royalty:', error);
    return null;
  }

  return data as AssetRoyalty;
};

/**
 * Update an existing royalty
 */
export const updateAssetRoyalty = async (
  royaltyId: string,
  royaltyType: RoyaltyType,
  royaltyValue: number,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('asset_royalties')
    .update({
      royalty_type: royaltyType,
      royalty_value: royaltyValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error updating asset royalty:', error);
    return false;
  }

  return true;
};

/**
 * Delete a royalty (soft delete)
 */
export const deleteAssetRoyalty = async (
  royaltyId: string,
  authTokens: AuthTokens
): Promise<boolean> => {
  const client = await createAuthenticatedClient(authTokens.accessToken, authTokens.refreshToken);

  const { error } = await client
    .from('asset_royalties')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', royaltyId);

  if (error) {
    console.error('Error deleting asset royalty:', error);
    return false;
  }

  return true;
};

/**
 * Calculate total royalty percentage for an asset
 * Used for validation - total should not exceed 100%
 */
export const calculateTotalRoyaltyPercentage = async (
  assetId: string,
  excludeRoyaltyId?: string
): Promise<number> => {
  const royalties = await getAssetRoyalties(assetId);

  const percentageRoyalties = royalties.filter(
    (r) => r.royalty_type === 'percentage' && (!excludeRoyaltyId || r.id !== excludeRoyaltyId)
  );

  return percentageRoyalties.reduce((total, royalty) => total + royalty.royalty_value, 0);
};

/**
 * Validate royalty split doesn't exceed 100%
 */
export const validateRoyaltySplit = async (
  assetId: string,
  newRoyaltyValue: number,
  excludeRoyaltyId?: string
): Promise<{ valid: boolean; currentTotal: number; newTotal: number }> => {
  const currentTotal = await calculateTotalRoyaltyPercentage(assetId, excludeRoyaltyId);
  const newTotal = currentTotal + newRoyaltyValue;

  return {
    valid: newTotal <= 100,
    currentTotal,
    newTotal,
  };
};
