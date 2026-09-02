import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { ProjectExplorer } from "@/components/ProjectExplorer";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { isValidObjectId } from "@/lib/api";
import { getProject } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  // Only the public shell is server-rendered. Everything behind the password
  // is fetched by the client after the password is verified, so nothing
  // sensitive ships in the HTML.
  const project = await getProject(id, { publicOnly: true });
  if (!project) notFound();

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Crumbs items={[{ label: "Projects", href: "/" }, { label: project.name }]} />
        <ProjectExplorer
          projectId={id}
          projectName={project.name}
          clientName={project.client}
        />
      </main>

      <SiteFooter />
    </>
  );
}
