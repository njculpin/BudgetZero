import { Search, Filter, Star, Users, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddToCartButton } from "@/components/marketplace/add-to-cart-button";
import { MainLayout } from "@/components/layouts/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const searchQuery = params.search || "";
  const typeFilter = params.type || "all";
  const sortBy = params.sort || "newest";

  // Build query for published projects
  let query = supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      slug,
      status,
      tags,
      cover_image_url,
      published_at,
      created_at,
      creator_id,
      profiles!projects_creator_id_fkey(full_name, email)
    `,
    )
    .eq("status", "published");

  // Apply search filter
  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
    );
  }

  // Apply sorting
  if (sortBy === "newest") {
    query = query.order("published_at", { ascending: false });
  } else if (sortBy === "oldest") {
    query = query.order("published_at", { ascending: true });
  }

  const { data: projects } = await query;

  // Get pricing info for each project
  const projectsWithPricing = await Promise.all(
    (projects || []).map(async (project) => {
      const { data: pricingTiers } = await supabase
        .from("pricing_tiers")
        .select("id, name, price")
        .eq("project_id", project.id)
        .order("price", { ascending: true });

      const { data: reviews } = await supabase
        .from("playtest_reviews")
        .select("rating")
        .eq("project_id", project.id);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : 0;

      return {
        ...project,
        pricingTiers: pricingTiers || [],
        minPrice: pricingTiers?.[0]?.price || 0,
        reviewCount: reviews?.length || 0,
        avgRating,
      };
    }),
  );

  const breadcrumbs = [{ label: "Marketplace" }];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and purchase collaborative tabletop game projects
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  defaultValue={searchQuery}
                  className="pl-10"
                  name="search"
                />
              </div>

              {/* Type Filter */}
              <Select defaultValue={typeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="game">Games</SelectItem>
                  <SelectItem value="model">Models</SelectItem>
                  <SelectItem value="illustration">Illustrations</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select defaultValue={sortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {projectsWithPricing.length} project
              {projectsWithPricing.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {projectsWithPricing.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No published projects found.
                  {searchQuery && " Try a different search term."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithPricing.map((project) => (
                <Card
                  key={project.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  {/* Cover Image */}
                  <Link href={`/projects/${project.slug}`}>
                    {project.cover_image_url ? (
                      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                        <img
                          src={project.cover_image_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white opacity-50">
                          {project.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  <Link href={`/projects/${project.slug}`}>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                  </Link>

                  <CardContent className="space-y-3 flex-1">
                    {/* Creator */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {(() => {
                          const profile = Array.isArray(project.profiles)
                            ? project.profiles[0]
                            : project.profiles;
                          return (
                            profile?.full_name || profile?.email || "Unknown"
                          );
                        })()}
                      </span>
                    </div>

                    {/* Rating */}
                    {project.reviewCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">
                            {project.avgRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({project.reviewCount} review
                          {project.reviewCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 border-t pt-4">
                    <div className="w-full flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Starting at
                        </p>
                        <p className="text-2xl font-bold">
                          ${project.minPrice.toFixed(2)}
                        </p>
                      </div>
                      <Link href={`/projects/${project.slug}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                    <AddToCartButton
                      projectId={project.id}
                      projectTitle={project.title}
                      pricingTiers={project.pricingTiers}
                      coverImageUrl={project.cover_image_url}
                      size="lg"
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
