import { useState } from "react";
import { useParams, Link } from "react-router";
import { Plus, AppWindow, Loader2, Trash2 } from "lucide-react";
import { useWorkspace } from "../api/workspaces";
import { useApplicationsByWorkspace, useCreateApplication, useDeleteApplication } from "../api/applications";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

export function WorkspacePage() {
  const { id } = useParams();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(id!);
  const { data: applications = [], isLoading: appsLoading } = useApplicationsByWorkspace(id!);
  const createApplication = useCreateApplication();
  const deleteApplication = useDeleteApplication();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !id) return;

    await createApplication.mutateAsync({
      workspaceId: id,
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
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Application
        </Button>
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
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My App" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this app do?" />
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
              <Link to={`/apps/${app.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/10 text-chart-2 group-hover:bg-chart-2/20 transition-colors">
                      <AppWindow className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                      {app.description && <CardDescription className="text-xs truncate">{app.description}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
              </Link>
              <div className="px-6 pb-4 flex justify-end">
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
