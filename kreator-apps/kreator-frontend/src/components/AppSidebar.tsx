import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { FolderKanban, Home, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/">
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">K</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Kreator</span>
                  <span className="text-xs text-muted-foreground">Dashboard</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link to={item.href}>
                    <SidebarMenuButton isActive={location.pathname === item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
