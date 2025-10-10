"use client";

import { NotificationsBell } from "@/components/blocks/notifications-bell";
import { VPDisplay } from "@/components/blocks/vp-display";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

interface LoadingLayoutProps {
  children: React.ReactNode;
}

export function LoadingLayout({ children }: LoadingLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <div className="flex items-center gap-2">
                  <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-[120px] truncate md:max-w-none">
                      -
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </div>
              </BreadcrumbList>
            </Breadcrumb>
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
