import { LoadingLayout } from "@/components/layouts/loading-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function RequestsLoading() {
  return (
    <LoadingLayout>
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tab Content */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-20 w-20 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2 mt-3">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </LoadingLayout>
  );
}
