import { createClient } from '@/lib/supabase/server';
import { GameProjectService } from '@/lib/services/game-projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layouts/main-layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Search,
  Filter,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  Package,
  Users,
  Download
} from 'lucide-react';

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const gameProjectService = new GameProjectService(supabase);
  const result = await gameProjectService.getPublicProjects();

  // Filter for published/paid projects (marketplace ready)
  const marketplaceProjects = result.data?.data.filter(project =>
    project.status === 'published' || project.price_cents > 0
  ) || [];

  return (
    <MainLayout user={user} breadcrumbs={[{ label: 'Marketplace' }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marketplace</h1>
            <p className="text-slate-600 mt-2">Buy and sell complete tabletop games</p>
          </div>
          <Button asChild>
            <Link href="/publish">
              <Package className="w-4 h-4 mr-2" />
              Sell Your Game
            </Link>
          </Button>
        </div>

        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Games</p>
                  <p className="text-2xl font-bold">{marketplaceProjects.length}</p>
                </div>
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Free Games</p>
                  <p className="text-2xl font-bold">
                    {marketplaceProjects.filter(p => p.price_cents === 0).length}
                  </p>
                </div>
                <Download className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Premium Games</p>
                  <p className="text-2xl font-bold">
                    {marketplaceProjects.filter(p => p.price_cents > 0).length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Creators</p>
                  <p className="text-2xl font-bold">
                    {new Set(marketplaceProjects.map(p => p.creator_id)).size}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search marketplace for games, genres, creators..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
        </Card>

        {/* Marketplace Grid */}
        {marketplaceProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Package className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">Marketplace Coming Soon</h3>
              <p className="text-slate-600">
                Games will appear here once creators publish them for sale. Be the first to list your game!
              </p>
              <Button asChild>
                <Link href="/">Create & Publish Game</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                {project.cover_image_url && (
                  <div className="aspect-video bg-slate-100 rounded-t-lg overflow-hidden">
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-slate-600">
                          by {project.creator.full_name || project.creator.email}
                        </span>
                      </div>
                    </div>
                    {project.price_cents === 0 ? (
                      <Badge variant="secondary" className="text-green-600">
                        FREE
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">
                        ${(project.price_cents / 100).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CardDescription className="line-clamp-2">
                      {project.description || 'Experience this amazing tabletop game'}
                    </CardDescription>

                    {/* Game Details */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {project.genre && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {project.genre}
                        </span>
                      )}
                      {(project.player_count_min || project.player_count_max) && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {project.player_count_min === project.player_count_max
                            ? `${project.player_count_min}p`
                            : `${project.player_count_min || '?'}–${project.player_count_max || '?'}p`
                          }
                        </span>
                      )}
                      {project.play_time_minutes && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {project.play_time_minutes}min
                        </span>
                      )}
                      {project.complexity_rating && (
                        <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {project.complexity_rating}/5
                        </span>
                      )}
                    </div>

                    {/* License */}
                    <div className="text-xs text-slate-500 capitalize">
                      {project.license_type} license
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {project.price_cents === 0 ? (
                        <Button asChild className="w-full" variant="outline">
                          <Link href={`/projects/${project.slug}`}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Free
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild className="w-full">
                          <Link href={`/projects/${project.slug}`}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Buy ${(project.price_cents / 100).toFixed(2)}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}