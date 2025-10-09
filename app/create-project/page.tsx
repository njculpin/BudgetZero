import { ProjectForm } from "@/components/blocks/projects/project-form";
import { MainLayout } from "@/components/layouts/main-layout";
import { useAdminGetMe } from "@/lib/sdk/server";

export default async function NewProjectPage() {
  const user = await useAdminGetMe();

  const breadcrumbs = [
    { label: "My Projects", href: "/projects" },
    { label: "New Project" },
  ];

  return (
    <MainLayout user={user} breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground mt-2">
            Start your tabletop project - add documents, models, and
            illustrations as you go
          </p>
        </div>

        <ProjectForm />
      </div>
    </MainLayout>
  );
}
