import { AppSidebar } from "@/components/AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet, useParams, Link } from "react-router";

function useBreadcrumbs() {
  const params = useParams();
  const { workspaceId, appId, formId } = params as { workspaceId?: string; appId?: string; formId?: string };

  const breadcrumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/" }];

  if (workspaceId) {
    breadcrumbs.push({ label: "Workspace", href: `/workspaces/${workspaceId}` });
  }

  if (workspaceId && appId) {
    breadcrumbs.push({ label: "Application", href: `/workspaces/${workspaceId}/apps/${appId}` });
  }

  if (workspaceId && appId && formId) {
    breadcrumbs.push({ label: "Form", href: `/workspaces/${workspaceId}/apps/${appId}/forms/${formId}` });
  }

  return breadcrumbs;
}

export function AppLayout() {
  const breadcrumbs = useBreadcrumbs();
  // const location = useLocation();
  // const isHome = location.pathname === "/";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index}>
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href!}>{crumb.label}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
