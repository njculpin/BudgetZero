import { MainLayout } from "@/components/layouts/main-layout";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await useAdminGetMe();

  return (
    <MainLayout user={user} breadcrumbs={[{ label: "Settings" }]}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-2">
              Manage your account preferences and security
            </p>
          </div>
        </div>

        <div>{children}</div>
      </div>
    </MainLayout>
  );
}
