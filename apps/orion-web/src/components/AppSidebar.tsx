import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaces } from "@/api/workspaces";
import { useApplicationsByWorkspace } from "@/api/applications";
import { AppWindow, Building2, ChevronRight, Home, LogOut, Plus, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";

function WorkspaceItem({
  workspace,
  isActive,
  isExpanded,
  onToggle,
}: {
  workspace: { id: string; name: string };
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (open: boolean) => void;
}) {
  const location = useLocation();
  const { data: apps = [] } = useApplicationsByWorkspace(workspace.id);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <SidebarMenuItem>
        <Link to={`/workspaces/${workspace.id}`}>
          <SidebarMenuButton isActive={isActive}>
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{workspace.name}</span>
          </SidebarMenuButton>
        </Link>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute right-1 top-1.5 h-6 w-6">
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {apps.map((app) => (
              <SidebarMenuSubItem key={app.id}>
                <Link to={`/workspaces/${workspace.id}/apps/${app.id}`}>
                  <SidebarMenuSubButton isActive={location.pathname.includes(`/apps/${app.id}`)}>
                    <AppWindow className="h-4 w-4 shrink-0" />
                    <span className="truncate">{app.name}</span>
                  </SidebarMenuSubButton>
                </Link>
              </SidebarMenuSubItem>
            ))}
            {apps.length === 0 && (
              <SidebarMenuSubItem>
                <span className="text-xs text-muted-foreground px-2 py-1">No applications</span>
              </SidebarMenuSubItem>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { data: workspaces = [] } = useWorkspaces();
  const location = useLocation();
  const params = useParams();
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(
    params.workspaceId && location.pathname.startsWith("/workspaces/") ? params.workspaceId : null
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/">
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">O</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Orion</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="overflow-x-hidden">
        {/* Dashboard Link */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/">
                <SidebarMenuButton isActive={location.pathname === "/"}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/users">
                <SidebarMenuButton isActive={location.pathname === "/users"}>
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Workspaces */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link to="/">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Workspace</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.map((workspace) => (
                <WorkspaceItem
                  key={workspace.id}
                  workspace={workspace}
                  isActive={location.pathname === `/workspaces/${workspace.id}`}
                  isExpanded={expandedWorkspace === workspace.id}
                  onToggle={(open) => setExpandedWorkspace(open ? workspace.id : null)}
                />
              ))}
              {workspaces.length === 0 && (
                <SidebarMenuItem>
                  <span className="text-sm text-muted-foreground px-2 py-1">No workspaces yet</span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name ? getInitials(user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none min-w-0 flex-1">
                    <span className="font-medium truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
