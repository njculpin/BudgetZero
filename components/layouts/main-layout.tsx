"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { VPDisplay } from "@/components/victory-points/vp-display";

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function MainLayout({ children, user, breadcrumbs }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <BreadcrumbItem className="hidden md:block">
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          <div className="flex items-center gap-3 px-4">
            <VPDisplay />
            <NotificationsBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
