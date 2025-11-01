import { serverClient } from './client';
import type { AssetRoyalty } from '@/types';

export interface CreateRoyaltyParams {
  assetId: string;
  userId: string;
  royaltyValue: number; // Flat rate in cents
}

/**
 * Get all royalties for an asset
 */
export const getAssetRoyalties = async (assetId: string): Promise<AssetRoyalty[]> => {
  const { data, error } = await serverClient
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
 * Get a specific royalty by ID
 */
export const getRoyaltyById = async (royaltyId: string): Promise<AssetRoyalty | null> => {
  const { data, error } = await serverClient
    .from('asset_royalties')
    .select('*')
    .eq('id', royaltyId)
    .eq('deleted', false)
    .single();

  if (error) {
    return null;
  }

  return data as AssetRoyalty;
};

/**
 * Create a new royalty for an asset
 */
export const createAssetRoyalty = async (
  params: CreateRoyaltyParams
): Promise<AssetRoyalty | null> => {
  const { data, error } = await serverClient
    .from('asset_royalties')
    .insert({
      asset_id: params.assetId,
      user_id: params.userId,
      royalty_type: 'fixed',
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
  royaltyValue: number
): Promise<boolean> => {
  const { error } = await serverClient
    .from('asset_royalties')
    .update({
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
  royaltyId: string
): Promise<boolean> => {
  const { error } = await serverClient
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
 * Calculate total flat rate cost for an asset
 * Returns the sum of all royalty flat rates in cents
 */
export const calculateTotalAssetCost = async (
  assetId: string
): Promise<number> => {
  const royalties = await getAssetRoyalties(assetId);
  return royalties.reduce((total, royalty) => total + royalty.royalty_value, 0);
};
