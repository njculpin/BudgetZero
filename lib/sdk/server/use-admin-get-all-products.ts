import { createClient } from "@/lib/supabase/server";

export async function useAdminGetAllProducts(options?: {
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
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  return { data, error, count };
}
