import { AppSidebar } from "@/components/AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet, useLocation, useParams } from "react-router";

function useBreadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const segments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/" }];

  if (segments[0] === "workspaces" && params.id) {
    breadcrumbs.push({ label: "Workspace", href: `/workspaces/${params.id}` });
  }

  if (segments[0] === "apps" && params.id) {
    breadcrumbs.push({ label: "Application", href: `/apps/${params.id}` });
  }

  if (segments[0] === "forms" && params.id) {
    breadcrumbs.push({ label: "Form", href: `/forms/${params.id}` });
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
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
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
