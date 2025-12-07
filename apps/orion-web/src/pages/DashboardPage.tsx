import { useState } from "react";
import { Link } from "react-router";
import { Plus, Building2, Loader2, Trash2 } from "lucide-react";
import { workspacesApi } from "../api/workspaces";
import { useWorkspaces } from "../contexts/WorkspaceContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

export function DashboardPage() {
  const { workspaces, loading, addWorkspace, removeWorkspace } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    const res = await workspacesApi.create({ name: newName });
    if (res.success && res.data) {
      addWorkspace(res.data);
      setNewName("");
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleDelete = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to delete this workspace? This will delete all applications and forms within it.")) return;

    const res = await workspacesApi.delete(workspaceId);
    if (res.success) {
      removeWorkspace(workspaceId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Manage your workspaces and applications</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>Enter a name for your new workspace</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Workspace" autoFocus />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-4">Create your first workspace to get started</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:border-primary/50 hover:bg-accent/50 transition-all group h-full">
              <Link to={`/workspaces/${workspace.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{workspace.name}</CardTitle>
                      <CardDescription className="text-xs truncate">{workspace.slug}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
              <div className="px-6 pb-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(workspace.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
