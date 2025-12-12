import { useState } from "react";
import { useParams } from "react-router";
import { UserPlus, Trash2, UserCog } from "lucide-react";
import { useWorkspace, useWorkspaceMembers, useAddMember, useRemoveMember, useUpdateMemberRole, type WorkspaceMember } from "@/api/workspaces";
import { useUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
};

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspace } = useWorkspace(workspaceId!);
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId!);
  const { data: usersData } = useUsers();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "member" | "viewer">("member");
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "member" | "viewer">("member");

  const availableUsers = usersData?.data.filter((user) => !members?.some((m) => m.userId === user.id)) || [];

  const handleAddMember = async () => {
    if (!selectedUserId || !workspaceId) return;

    try {
      await addMember.mutateAsync({
        workspaceId,
        userId: selectedUserId,
        role: selectedRole,
      });
      toast.success("Member added successfully");
      setAddDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !workspaceId) return;

    try {
      await removeMember.mutateAsync({
        workspaceId,
        userId: memberToRemove.userId,
      });
      toast.success("Member removed successfully");
      setMemberToRemove(null);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember || !workspaceId) return;

    try {
      await updateMemberRole.mutateAsync({
        workspaceId,
        userId: editingMember.userId,
        role: newRole,
      });
      toast.success("Role updated successfully");
      setEditingMember(null);
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace?.name} - Members</h1>
          <p className="text-muted-foreground">Manage workspace members and their roles</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-member-button">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="user-select">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "admin" | "member" | "viewer")}>
                  <SelectTrigger data-testid="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedUserId || addMember.isPending} data-testid="confirm-add-member">
                {addMember.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map((member) => (
            <TableRow key={member.userId} data-testid={`member-row-${member.userId}`}>
              <TableCell className="font-medium">{member.user.name}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {member.role !== "owner" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMember(member);
                        setNewRole(member.role as "admin" | "member" | "viewer");
                      }}
                      data-testid={`edit-role-${member.userId}`}
                    >
                      <UserCog className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setMemberToRemove(member)} data-testid={`remove-member-${member.userId}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>New Role for {editingMember?.user.name}</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "member" | "viewer")}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateMemberRole.isPending}>
              {updateMemberRole.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.name} from this workspace? They will lose access to all workspace resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
