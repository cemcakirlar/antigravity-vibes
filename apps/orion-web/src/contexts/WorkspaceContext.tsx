import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import { workspacesApi, type Workspace } from "@/api/workspaces";
import { useAuth } from "@/contexts/AuthContext";

interface WorkspaceContextType {
  workspaces: Workspace[];
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaces must be used within a WorkspaceProvider");
  }
  return context;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await workspacesApi.list();
    if (res.success && res.data) {
      setWorkspaces(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshWorkspaces();
    }
  }, [token, refreshWorkspaces]);

  const addWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaces((prev) => [...prev, workspace]);
  }, []);

  const removeWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspaces, loading, refreshWorkspaces, addWorkspace, removeWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
