import { createClient } from "@/lib/supabase/server";

export async function useAdminGetProductByHandle(handle: string) {
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
