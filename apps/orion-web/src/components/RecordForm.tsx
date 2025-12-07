import { useState, useEffect } from "react";
import type { Field, FieldType } from "@/api/forms";
import type { FormRecord } from "@/api/records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: Field[];
  record?: FormRecord | null;
  onSubmit: (data: globalThis.Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}

export function RecordForm({ open, onOpenChange, fields, record, onSubmit, isLoading }: RecordFormProps) {
  const [formData, setFormData] = useState<globalThis.Record<string, unknown>>({});

  // Initialize form data when record changes
  useEffect(() => {
    if (record) {
      setFormData(record.data as globalThis.Record<string, unknown>);
    } else {
      // Set default values
      const defaults: globalThis.Record<string, unknown> = {};
      for (const field of fields) {
        if (field.defaultValue) {
          defaults[field.name] = field.defaultValue;
        } else if (field.type === "boolean") {
          defaults[field.name] = false;
        }
      }
      setFormData(defaults);
    }
  }, [record, fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({});
  };

  const updateField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderFieldInput = (field: Field) => {
    const value = formData[field.name];

    switch (field.type as FieldType) {
      case "text":
      case "email":
      case "url":
      case "phone":
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "phone" ? "tel" : "text"}
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder || ""}
            required={field.required}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => updateField(field.name, e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder || ""}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder || ""}
            required={field.required}
            rows={3}
          />
        );

      case "date":
        return (
          <Input type="date" value={(value as string) || ""} onChange={(e) => updateField(field.name, e.target.value)} required={field.required} />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={(value as string) || ""}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id={field.name}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => updateField(field.name, checked === true)}
            />
            <Label htmlFor={field.name} className="cursor-pointer font-normal">
              {field.placeholder || "Yes"}
            </Label>
          </div>
        );

      case "select": {
        const options = (field.options as { choices?: string[] })?.choices || [];
        return (
          <Select value={(value as string) || ""} onValueChange={(v) => updateField(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case "multiselect":
        // For now, render as a simple text input (comma-separated)
        return (
          <Input
            value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
            onChange={(e) =>
              updateField(
                field.name,
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder={field.placeholder || "Enter values, separated by commas"}
          />
        );

      case "file":
        return (
          <Input type="url" value={(value as string) || ""} onChange={(e) => updateField(field.name, e.target.value)} placeholder="File URL..." />
        );

      default:
        return (
          <Input value={(value as string) || ""} onChange={(e) => updateField(field.name, e.target.value)} placeholder={field.placeholder || ""} />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Record" : "Add Record"}</DialogTitle>
          <DialogDescription>{record ? "Update the record details" : "Fill in the details for the new record"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderFieldInput(field)}
                {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : record ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
