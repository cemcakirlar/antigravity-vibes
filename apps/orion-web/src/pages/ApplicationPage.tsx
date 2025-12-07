import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { Plus, FileText, Loader2, Trash2 } from "lucide-react";
import { applicationsApi, type ApplicationWithForms, type Form } from "../api/applications";
import { formsApi } from "../api/forms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

export function ApplicationPage() {
  const { id } = useParams();
  const [app, setApp] = useState<ApplicationWithForms | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const res = await applicationsApi.get(id);
    if (res.success && res.data) {
      setApp(res.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !id) return;

    setCreating(true);
    const res = await formsApi.create(id, {
      name: newName,
      description: newDesc || undefined,
    });
    if (res.success && res.data && app) {
      setApp({
        ...app,
        forms: [...app.forms, res.data],
      });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    const res = await formsApi.delete(formId);
    if (res.success && app) {
      setApp({
        ...app,
        forms: app.forms.filter((f) => f.id !== formId),
      });
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">{app?.name}</h1>
          <p className="text-muted-foreground mt-1">{app?.description || "Forms in this application"}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Form
        </Button>
      </div>

      {/* Create Form Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Form</DialogTitle>
            <DialogDescription>Add a new data form to this application</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Customers" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Customer records" />
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

      {/* Forms Grid */}
      {!app?.forms || app.forms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">Create your first data form</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {app.forms.map((form: Form) => (
            <Card key={form.id} className="hover:border-primary/50 hover:bg-accent/50 transition-all group">
              <Link to={`/forms/${form.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-4/10 text-chart-4 group-hover:bg-chart-4/20 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      <CardDescription className="text-xs truncate font-mono">{form.tableName}</CardDescription>
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
                    handleDelete(form.id);
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
