import { createClient } from "@/lib/supabase/server";

export async function getAllProducts(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (
        *,
        product_variant_prices (*)
      ),
      product_projects (
        project:project_id (id, title, slug)
      )
    `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order("published_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(
      options.offset,
      options.offset + options.limit - 1,
    );
  }

  const { data, error, count } = await query;

  return { data, error, count };
}

export async function getProductByHandle(handle: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_tags (tag),
      product_variants (
        *,
        product_variant_prices (*),
        product_variant_options (*),
        product_digital_files (*)
      ),
      product_projects (
        project:project_id (
          id,
          title,
          slug,
          description,
          creator:creator_id (id, full_name, username)
        )
      ),
      product_seo (*)
    `,
    )
    .eq("handle", handle)
    .eq("status", "active")
    .single();

  return { data, error };
}

export async function getProductCollections() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_collections")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");

  return { data, error };
}
