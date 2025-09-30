"use server";

import { AssetIntegrationService } from "@/lib/services/asset-integration";

export async function addAssetToProjectAction(
  projectId: string,
  assetId: string
) {
  return await AssetIntegrationService.addAssetToProject({
    projectId,
    assetId,
  });
}

export async function removeAssetFromProjectAction(
  projectId: string,
  assetId: string
) {
  return await AssetIntegrationService.removeAssetFromProject({
    projectId,
    assetId,
  });
}

export async function getProjectAssetsAction(projectId: string) {
  return await AssetIntegrationService.getProjectAssets(projectId);
}

export async function getAssetUsageAction(assetId: string) {
  return await AssetIntegrationService.getAssetUsage(assetId);
}