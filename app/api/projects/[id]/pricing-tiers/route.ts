import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const tierSchema = z.object({
  tier_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  price_cents: z.number().int().min(0),
  included_assets: z.array(z.string().uuid()).default([]),
  included_documents: z.array(z.string().uuid()).default([]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validation = tierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid tier data", details: validation.error.issues },
        { status: 400 },
      );
    }

    const {
      name,
      description,
      price_cents,
      included_assets,
      included_documents,
    } = validation.data;

    // Get highest display order
    const { data: existingTiers } = await supabase
      .from("pricing_tiers")
      .select("display_order")
      .eq("project_id", projectId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = existingTiers?.[0]?.display_order + 1 || 0;

    // Create tier
    const { data: tier, error: tierError } = await supabase
      .from("pricing_tiers")
      .insert({
        project_id: projectId,
        name,
        description,
        price_cents,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (tierError) {
      console.error("Error creating tier:", tierError);
      return NextResponse.json(
        { error: "Failed to create tier" },
        { status: 500 },
      );
    }

    // Add included assets
    if (included_assets.length > 0) {
      const assetInserts = included_assets.map((assetId) => ({
        tier_id: tier.id,
        asset_id: assetId,
      }));

      await supabase.from("pricing_tier_assets").insert(assetInserts);
    }

    // Add included documents
    if (included_documents.length > 0) {
      const docInserts = included_documents.map((documentId) => ({
        tier_id: tier.id,
        document_id: documentId,
      }));

      await supabase.from("pricing_tier_documents").insert(docInserts);
    }

    return NextResponse.json({
      ...tier,
      included_assets,
      included_documents,
    });
  } catch (error) {
    console.error("Error in pricing tier POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validation = tierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid tier data", details: validation.error.issues },
        { status: 400 },
      );
    }

    const {
      tier_id,
      name,
      description,
      price_cents,
      included_assets,
      included_documents,
    } = validation.data;

    if (!tier_id) {
      return NextResponse.json(
        { error: "tier_id is required for updates" },
        { status: 400 },
      );
    }

    // Update tier
    const { data: tier, error: tierError } = await supabase
      .from("pricing_tiers")
      .update({
        name,
        description,
        price_cents,
      })
      .eq("id", tier_id)
      .eq("project_id", projectId)
      .select()
      .single();

    if (tierError) {
      console.error("Error updating tier:", tierError);
      return NextResponse.json(
        { error: "Failed to update tier" },
        { status: 500 },
      );
    }

    // Update included assets - delete all and re-insert
    await supabase.from("pricing_tier_assets").delete().eq("tier_id", tier_id);

    if (included_assets.length > 0) {
      const assetInserts = included_assets.map((assetId) => ({
        tier_id: tier.id,
        asset_id: assetId,
      }));

      await supabase.from("pricing_tier_assets").insert(assetInserts);
    }

    // Update included documents - delete all and re-insert
    await supabase
      .from("pricing_tier_documents")
      .delete()
      .eq("tier_id", tier_id);

    if (included_documents.length > 0) {
      const docInserts = included_documents.map((documentId) => ({
        tier_id: tier.id,
        document_id: documentId,
      }));

      await supabase.from("pricing_tier_documents").insert(docInserts);
    }

    return NextResponse.json({
      ...tier,
      included_assets,
      included_documents,
    });
  } catch (error) {
    console.error("Error in pricing tier PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get tiers
    const { data: tiers, error } = await supabase
      .from("pricing_tiers")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching tiers:", error);
      return NextResponse.json(
        { error: "Failed to fetch tiers" },
        { status: 500 },
      );
    }

    // Get included assets and documents for each tier
    const enrichedTiers = await Promise.all(
      (tiers || []).map(async (tier) => {
        const [{ data: assets }, { data: documents }] = await Promise.all([
          supabase
            .from("pricing_tier_assets")
            .select("asset_id")
            .eq("tier_id", tier.id),
          supabase
            .from("pricing_tier_documents")
            .select("document_id")
            .eq("tier_id", tier.id),
        ]);

        return {
          ...tier,
          included_assets: assets?.map((a) => a.asset_id) || [],
          included_documents: documents?.map((d) => d.document_id) || [],
        };
      }),
    );

    return NextResponse.json(enrichedTiers);
  } catch (error) {
    console.error("Error in pricing tier GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
