import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import {
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  Hash,
  Mail,
  Phone,
  Calendar,
  ToggleLeft,
  List,
  Type,
  Link as LinkIcon,
  FileText as FileIcon,
  AlignLeft,
} from "lucide-react";
import { formsApi, fieldsApi, type FormWithFields, type Field, type FieldType } from "../api/forms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { value: "textarea", label: "Long Text", icon: <AlignLeft className="h-4 w-4" /> },
  { value: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> },
  { value: "url", label: "URL", icon: <LinkIcon className="h-4 w-4" /> },
  { value: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { value: "datetime", label: "Date & Time", icon: <Calendar className="h-4 w-4" /> },
  { value: "boolean", label: "Yes/No", icon: <ToggleLeft className="h-4 w-4" /> },
  { value: "select", label: "Select", icon: <List className="h-4 w-4" /> },
  { value: "multiselect", label: "Multi Select", icon: <List className="h-4 w-4" /> },
  { value: "file", label: "File", icon: <FileIcon className="h-4 w-4" /> },
];

export function FormPage() {
  const { id } = useParams();
  const [form, setForm] = useState<FormWithFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    label: "",
    type: "text" as FieldType,
    required: false,
    unique: false,
  });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const res = await formsApi.get(id);
    if (res.success && res.data) {
      setForm(res.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.name.trim() || !newField.label.trim() || !id) return;

    setCreating(true);
    const res = await fieldsApi.create(id, newField);
    if (res.success && res.data && form) {
      setForm({
        ...form,
        fields: [...form.fields, res.data],
      });
      setNewField({
        name: "",
        label: "",
        type: "text",
        required: false,
        unique: false,
      });
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    const res = await fieldsApi.delete(fieldId);
    if (res.success && form) {
      setForm({
        ...form,
        fields: form.fields.filter((f) => f.id !== fieldId),
      });
    }
  };

  const getFieldIcon = (type: FieldType) => {
    const fieldType = FIELD_TYPES.find((f) => f.value === type);
    return fieldType?.icon || <Type className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold">{form?.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{form?.tableName}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {/* Create Field Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
            <DialogDescription>Add a new field to this form</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Full Name"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name</Label>
                  <Input
                    id="name"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="full_name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Field Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {FIELD_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewField({ ...newField, type: type.value })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        newField.type === type.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      {type.icon}
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField({ ...newField, required: checked === true })}
                  />
                  <Label htmlFor="required" className="cursor-pointer">
                    Required
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="unique"
                    checked={newField.unique}
                    onCheckedChange={(checked) => setNewField({ ...newField, unique: checked === true })}
                  />
                  <Label htmlFor="unique" className="cursor-pointer">
                    Unique
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newField.name.trim() || !newField.label.trim()}>
                {creating ? "Adding..." : "Add Field"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fields List */}
      {!form?.fields || form.fields.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No fields yet</h3>
            <p className="text-muted-foreground mb-4">Define the fields for your data</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {form.fields.map((field: Field) => (
            <Card key={field.id} className="hover:border-border transition-all">
              <div className="flex items-center gap-4 p-4">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">{getFieldIcon(field.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    {field.required && <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Required</span>}
                    {field.unique && <span className="text-xs px-1.5 py-0.5 rounded bg-chart-4/10 text-chart-4">Unique</span>}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {field.name} · {field.type}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(field.id)}>
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
