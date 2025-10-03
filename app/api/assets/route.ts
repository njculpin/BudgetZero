import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      asset_type,
      file_url,
      file_size_bytes,
      file_format,
      thumbnail_url,
      preview_url,
      dimensions,
      tags,
      license_type,
      license_terms,
      price_cents,
      is_public,
      seeking_collaborators,
      royalty_percentage,
      project_id,
    } = body;

    // Validate required fields
    if (!title || !asset_type || !file_url) {
      return NextResponse.json(
        { error: "Missing required fields: title, asset_type, file_url" },
        { status: 400 }
      );
    }

    // Create asset
    const { data: newAsset, error: createError } = await supabase
      .from("assets")
      .insert({
        creator_id: user.id,
        title,
        description,
        asset_type,
        file_url,
        file_size_bytes,
        file_format,
        thumbnail_url,
        preview_url,
        dimensions,
        tags: tags || [],
        license_type: license_type || "attribution",
        license_terms,
        price_cents: price_cents || 0,
        is_public: is_public !== undefined ? is_public : true,
        seeking_collaborators: seeking_collaborators || false,
        royalty_percentage: royalty_percentage || 0,
        project_id,
        status: "draft",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating asset:", createError);
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      );
    }

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/assets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const asset_type = searchParams.get("asset_type");
    const is_public = searchParams.get("is_public");
    const creator_id = searchParams.get("creator_id");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("assets")
      .select(
        `
        *,
        creator:profiles!creator_id(id, full_name, username, avatar_url)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (asset_type) {
      query = query.eq("asset_type", asset_type);
    }

    if (is_public !== null) {
      query = query.eq("is_public", is_public === "true");
    }

    if (creator_id) {
      query = query.eq("creator_id", creator_id);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: assets, error, count } = await query;

    if (error) {
      console.error("Error fetching assets:", error);
      return NextResponse.json(
        { error: "Failed to fetch assets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assets,
      count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in GET /api/assets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
