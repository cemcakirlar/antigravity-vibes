import { useState } from "react";
import { useParams, Link } from "react-router";
import { Plus, AppWindow, Loader2, Trash2, Users, Pencil } from "lucide-react";
import { useWorkspace } from "../api/workspaces";
import { useApplicationsByWorkspace, useCreateApplication, useDeleteApplication, useUpdateApplication, type Application } from "../api/applications";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

export function WorkspacePage() {
  const { workspaceId } = useParams();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId!);
  const { data: applications = [], isLoading: appsLoading } = useApplicationsByWorkspace(workspaceId!);
  const createApplication = useCreateApplication();
  const deleteApplication = useDeleteApplication();
  const updateApplication = useUpdateApplication();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Edit state
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !workspaceId) return;

    await createApplication.mutateAsync({
      workspaceId,
      name: newName,
      description: newDesc || undefined,
    });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleDelete = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    await deleteApplication.mutateAsync(appId);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setEditName(app.name);
    setEditDesc(app.description || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editName.trim()) return;

    try {
      await updateApplication.mutateAsync({
        id: editingApp.id,
        name: editName,
        description: editDesc || undefined,
      });
      toast.success("Application updated");
      setEditingApp(null);
    } catch {
      toast.error("Failed to update application");
    }
  };

  const isLoading = workspaceLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{workspace?.name}</h1>
          <p className="text-muted-foreground mt-1">Applications in this workspace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/workspaces/${workspaceId}/members`}>
              <Users className="h-4 w-4" />
              Manage Members
            </Link>
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>

      {/* Create Application Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Application</DialogTitle>
            <DialogDescription>Add a new application to this workspace</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Application" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this application for?" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createApplication.isPending || !newName.trim()}>
                {createApplication.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Application Modal */}
      <Dialog open={!!editingApp} onOpenChange={(open) => !open && setEditingApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>Update application settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingApp(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateApplication.isPending || !editName.trim()}>
                {updateApplication.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AppWindow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-4">Create your first application</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="hover:border-primary/50 hover:bg-accent/50 transition-all group">
              <Link to={`/workspaces/${workspaceId}/apps/${app.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/10 text-chart-2 group-hover:bg-chart-2/20 transition-colors">
                      <AppWindow className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono truncate">{app.slug}</p>
                    </div>
                  </div>
                </CardHeader>
                {app.description && (
                  <CardContent className="pt-0 pb-2">
                    <CardDescription className="text-sm line-clamp-2">{app.description}</CardDescription>
                  </CardContent>
                )}
              </Link>
              <div className="px-6 pb-4 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(app);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={deleteApplication.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(app.id);
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
