import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface DownloadItem {
  id: string;
  type: "asset" | "document";
  title: string;
  url: string;
  asset_type?: string;
  document_type?: string;
}

// GET /api/orders/[order_id]/downloads - Get downloadable content for an order
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  try {
    const { order_id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify order belongs to user and is completed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, buyer_id")
      .eq("id", order_id)
      .eq("buyer_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Order not completed yet" },
        { status: 400 },
      );
    }

    // Get order items with pricing tier details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        project_id,
        pricing_tier_id,
        project_title,
        pricing_tier_name
      `,
      )
      .eq("order_id", order_id);

    if (itemsError || !orderItems) {
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 },
      );
    }

    const downloads: DownloadItem[] = [];

    // For each order item, get included assets and documents based on pricing tier
    for (const item of orderItems) {
      // Get included assets for this tier
      const { data: tierAssets } = await supabase
        .from("pricing_tier_assets")
        .select(
          `
          asset_id,
          assets (
            id,
            title,
            file_url,
            asset_type
          )
        `,
        )
        .eq("pricing_tier_id", item.pricing_tier_id);

      if (tierAssets) {
        for (const ta of tierAssets) {
          const asset = Array.isArray(ta.assets) ? ta.assets[0] : ta.assets;
          if (asset?.file_url) {
            downloads.push({
              id: asset.id,
              type: "asset",
              title: asset.title,
              url: asset.file_url,
              asset_type: asset.asset_type,
            });

            // Track download
            await supabase.from("downloaded_items").insert({
              order_item_id: item.id,
              user_id: user.id,
              asset_id: asset.id,
              download_url: asset.file_url,
            });
          }
        }
      }

      // Get included documents for this tier
      const { data: tierDocuments } = await supabase
        .from("pricing_tier_documents")
        .select(
          `
          document_id,
          documents (
            id,
            title,
            document_type,
            file_url
          )
        `,
        )
        .eq("pricing_tier_id", item.pricing_tier_id);

      if (tierDocuments) {
        for (const td of tierDocuments) {
          const doc = Array.isArray(td.documents)
            ? td.documents[0]
            : td.documents;
          if (doc && doc.file_url) {
            downloads.push({
              id: doc.id,
              type: "document",
              title: doc.title,
              url: doc.file_url,
              document_type: doc.document_type,
            });

            // Track download
            await supabase.from("downloaded_items").insert({
              order_item_id: item.id,
              user_id: user.id,
              document_id: doc.id,
              download_url: doc.file_url,
            });
          }
        }
      }
    }

    return NextResponse.json({ downloads });
  } catch (error) {
    console.error("Error fetching downloads:", error);
    return NextResponse.json(
      { error: "Failed to fetch downloads" },
      { status: 500 },
    );
  }
}
