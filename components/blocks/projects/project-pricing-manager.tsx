"use client";

import {
  Check,
  DollarSign,
  Edit,
  FileText,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PricingTier {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  display_order: number;
  is_active: boolean;
  included_assets: string[];
  included_documents: string[];
}

interface Asset {
  id: string;
  title: string;
  asset_type: string;
}

interface Document {
  id: string;
  title: string;
  document_type: string;
}

interface PricingTiersManagerProps {
  projectId: string;
  initialTiers: PricingTier[];
  assets: Asset[];
  documents: Document[];
  isOwner: boolean;
}

export function PricingTiersManager({
  projectId,
  initialTiers,
  assets,
  documents,
  isOwner,
}: PricingTiersManagerProps) {
  const [tiers, setTiers] = useState<PricingTier[]>(initialTiers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_dollars: "",
    included_assets: [] as string[],
    included_documents: [] as string[],
  });

  function openCreateDialog() {
    setEditingTier(null);
    setFormData({
      name: "",
      description: "",
      price_dollars: "",
      included_assets: [],
      included_documents: [],
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(tier: PricingTier) {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || "",
      price_dollars: (tier.price_cents / 100).toFixed(2),
      included_assets: tier.included_assets,
      included_documents: tier.included_documents,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      const priceCents = Math.round(parseFloat(formData.price_dollars) * 100);

      const response = await fetch(`/api/projects/${projectId}/pricing-tiers`, {
        method: editingTier ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingTier && { tier_id: editingTier.id }),
          name: formData.name,
          description: formData.description || null,
          price_cents: priceCents,
          included_assets: formData.included_assets,
          included_documents: formData.included_documents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save pricing tier");
      }

      const savedTier = await response.json();

      if (editingTier) {
        setTiers(tiers.map((t) => (t.id === editingTier.id ? savedTier : t)));
      } else {
        setTiers([...tiers, savedTier]);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving tier:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save pricing tier",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(tierId: string) {
    if (!confirm("Are you sure you want to delete this pricing tier?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/pricing-tiers/${tierId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete pricing tier");
      }

      setTiers(tiers.filter((t) => t.id !== tierId));
    } catch (error) {
      console.error("Error deleting tier:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete pricing tier",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAsset(assetId: string) {
    setFormData({
      ...formData,
      included_assets: formData.included_assets.includes(assetId)
        ? formData.included_assets.filter((id) => id !== assetId)
        : [...formData.included_assets, assetId],
    });
  }

  function toggleDocument(documentId: string) {
    setFormData({
      ...formData,
      included_documents: formData.included_documents.includes(documentId)
        ? formData.included_documents.filter((id) => id !== documentId)
        : [...formData.included_documents, documentId],
    });
  }

  function selectAllAssets() {
    setFormData({
      ...formData,
      included_assets: assets.map((a) => a.id),
    });
  }

  function deselectAllAssets() {
    setFormData({
      ...formData,
      included_assets: [],
    });
  }

  function selectAllDocuments() {
    setFormData({
      ...formData,
      included_documents: documents.map((d) => d.id),
    });
  }

  function deselectAllDocuments() {
    setFormData({
      ...formData,
      included_documents: [],
    });
  }

  const sortedTiers = [...tiers].sort(
    (a, b) => a.display_order - b.display_order,
  );

  if (!isOwner && tiers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tier List */}
      {tiers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No pricing tiers configured</p>
          {isOwner && (
            <p className="text-sm">
              Create tiers to offer different price points
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {sortedTiers.map((tier) => (
            <Card key={tier.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <CardDescription className="mt-1">
                      ${(tier.price_cents / 100).toFixed(2)}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(tier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(tier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tier.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tier.description}
                  </p>
                )}

                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    What's Included
                  </p>

                  {/* Documents */}
                  {tier.included_documents.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        Documents
                      </p>
                      <div className="flex flex-wrap gap-1 pl-5">
                        {tier.included_documents.slice(0, 3).map((docId) => {
                          const doc = documents.find((d) => d.id === docId);
                          return doc ? (
                            <Badge
                              key={docId}
                              variant="outline"
                              className="text-xs"
                            >
                              {doc.title}
                            </Badge>
                          ) : null;
                        })}
                        {tier.included_documents.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tier.included_documents.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assets */}
                  {tier.included_assets.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-purple-500" />
                        Assets
                      </p>
                      <div className="flex flex-wrap gap-1 pl-5">
                        {tier.included_assets.slice(0, 3).map((assetId) => {
                          const asset = assets.find((a) => a.id === assetId);
                          return asset ? (
                            <Badge
                              key={assetId}
                              variant="outline"
                              className="text-xs"
                            >
                              {asset.title}
                            </Badge>
                          ) : null;
                        })}
                        {tier.included_assets.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tier.included_assets.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {tier.included_documents.length === 0 &&
                    tier.included_assets.length === 0 && (
                      <div className="text-xs text-muted-foreground italic bg-muted/50 rounded p-2">
                        No content selected - license only
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Tier Button */}
      {isOwner && (
        <Button onClick={openCreateDialog} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing Tier
        </Button>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Edit Pricing Tier" : "Create Pricing Tier"}
            </DialogTitle>
            <DialogDescription>
              Set up a pricing tier with included content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tier Name */}
            <div className="space-y-2">
              <Label htmlFor="tier-name">
                Tier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tier-name"
                placeholder="e.g., Basic, Premium, Complete"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="tier-price">
                Price (USD) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tier-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-9"
                  value={formData.price_dollars}
                  onChange={(e) =>
                    setFormData({ ...formData, price_dollars: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="tier-description">Description</Label>
              <Textarea
                id="tier-description"
                placeholder="Describe what's included in this tier..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Included Documents */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Included Documents</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={selectAllDocuments}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={deselectAllDocuments}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`doc-${doc.id}`}
                        checked={formData.included_documents.includes(doc.id)}
                        onCheckedChange={() => toggleDocument(doc.id)}
                      />
                      <Label
                        htmlFor={`doc-${doc.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {doc.title}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({doc.document_type})
                        </span>
                      </Label>
                      {formData.included_documents.includes(doc.id) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.included_documents.length} of {documents.length}{" "}
                  selected
                </p>
              </div>
            )}

            {/* Included Assets */}
            {assets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Included Assets (Models & Illustrations)</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={selectAllAssets}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={deselectAllAssets}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`asset-${asset.id}`}
                        checked={formData.included_assets.includes(asset.id)}
                        onCheckedChange={() => toggleAsset(asset.id)}
                      />
                      <Label
                        htmlFor={`asset-${asset.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {asset.title}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({asset.asset_type})
                        </span>
                      </Label>
                      {formData.included_assets.includes(asset.id) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.included_assets.length} of {assets.length} selected
                </p>
              </div>
            )}

            {/* Selection Summary */}
            {(formData.included_documents.length > 0 ||
              formData.included_assets.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Selection Summary
                    </p>
                    <div className="text-sm text-blue-700 space-y-0.5">
                      {formData.included_documents.length > 0 && (
                        <p>
                          {formData.included_documents.length} document
                          {formData.included_documents.length !== 1 ? "s" : ""}{" "}
                          selected
                        </p>
                      )}
                      {formData.included_assets.length > 0 && (
                        <p>
                          {formData.included_assets.length} asset
                          {formData.included_assets.length !== 1 ? "s" : ""}{" "}
                          selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.name || !formData.price_dollars}
            >
              {isLoading
                ? "Saving..."
                : editingTier
                  ? "Save Changes"
                  : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
