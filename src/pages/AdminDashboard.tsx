import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  LogOut,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Key,
  Mail,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string | null;
  job_title: string | null;
  street_address: string | null;
  city: string | null;
  country: string | null;
  heard_about_us: string | null;
  future_interests: string[];
  verified: boolean;
  created_at: string;
}

interface Admin {
  id: string;
  email: string;
  is_superadmin: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Dialog states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [editRegOpen, setEditRegOpen] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [addRegOpen, setAddRegOpen] = useState(false);
  const [grantAdminOpen, setGrantAdminOpen] = useState(false);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    job_title: "",
    city: "",
    country: "",
    heard_about_us: "",
  });
  const [adminFormData, setAdminFormData] = useState({ email: "", password: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchRegistrations = useCallback(async () => {
    try {
      const r = await fetch("/api/registrations", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!r.ok) throw new Error("Failed to load");
      const data = await r.json();
      setRegistrations(data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load registrations", variant: "destructive" });
    }
  }, [toast]);

  const fetchAdmins = useCallback(async () => {
    try {
      const r = await fetch("/api/admins", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.ok) {
        const data = await r.json();
        setAdmins(data || []);
      }
    } catch {
      // Non-super admins can't fetch admins
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }
    try {
      const part = token.split(".")[1] || "";
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      setIsSuperAdmin(!!payload.super);
    } catch {
      setIsSuperAdmin(false);
    }
    fetchRegistrations().finally(() => setIsLoading(false));
  }, [navigate, fetchRegistrations]);

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin, fetchAdmins]);

  useEffect(() => {
    let filtered = registrations;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.full_name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.phone.includes(term) ||
          r.organization?.toLowerCase().includes(term) ||
          r.city?.toLowerCase().includes(term) ||
          r.country?.toLowerCase().includes(term)
      );
    }
    if (verifiedFilter !== "all") {
      filtered = filtered.filter((r) =>
        verifiedFilter === "verified" ? r.verified : !r.verified
      );
    }
    setFilteredRegistrations(filtered);
  }, [searchTerm, verifiedFilter, registrations]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const r = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed");
      }
      toast({ title: "Success", description: "Password changed" });
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditReg = (reg: Registration) => {
    setSelectedReg(reg);
    setFormData({
      full_name: reg.full_name,
      email: reg.email,
      phone: reg.phone,
      organization: reg.organization || "",
      job_title: reg.job_title || "",
      city: reg.city || "",
      country: reg.country || "",
      heard_about_us: reg.heard_about_us || "",
    });
    setEditRegOpen(true);
  };

  const handleEditReg = async () => {
    if (!selectedReg) return;
    setIsSubmitting(true);
    try {
      const r = await fetch(`/api/registrations/${selectedReg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...formData, future_interests: selectedReg.future_interests || [] }),
      });
      if (!r.ok) throw new Error("Failed to update");
      toast({ title: "Success", description: "Registration updated" });
      setEditRegOpen(false);
      fetchRegistrations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReg = async (reg: Registration) => {
    if (!confirm(`Delete registration for ${reg.full_name}?`)) return;
    try {
      const r = await fetch(`/api/registrations/${reg.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!r.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: reg.full_name });
      fetchRegistrations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSendVerification = async (reg: Registration) => {
    try {
      const r = await fetch("/api/admin/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: reg.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      toast({
        title: data.emailSent ? "Email sent" : "Link generated",
        description: data.emailSent ? `Sent to ${reg.email}` : data.verificationLink,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openAddReg = () => {
    setFormData({ full_name: "", email: "", phone: "", organization: "", job_title: "", city: "", country: "", heard_about_us: "" });
    setAddRegOpen(true);
  };

  const handleAddReg = async () => {
    setIsSubmitting(true);
    try {
      const r = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...formData, future_interests: [] }),
      });
      if (!r.ok) throw new Error("Failed to add");
      toast({ title: "Success", description: "Registration added" });
      setAddRegOpen(false);
      fetchRegistrations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGrantAdmin = () => {
    setAdminFormData({ email: "", password: "" });
    setGrantAdminOpen(true);
  };

  const handleGrantAdmin = async () => {
    setIsSubmitting(true);
    try {
      const r = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(adminFormData),
      });
      if (!r.ok) throw new Error("Failed to grant admin");
      toast({ title: "Success", description: "Admin created" });
      setGrantAdminOpen(false);
      fetchAdmins();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setAdminFormData({ email: admin.email, password: "" });
    setEditAdminOpen(true);
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);
    try {
      const body: any = {};
      if (adminFormData.email && adminFormData.email !== selectedAdmin.email) body.email = adminFormData.email;
      if (adminFormData.password) body.password = adminFormData.password;
      if (!body.email && !body.password) {
        toast({ title: "No changes", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const r = await fetch(`/api/admin/${selectedAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to update");
      toast({ title: "Success", description: "Admin updated" });
      setEditAdminOpen(false);
      fetchAdmins();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(`Delete admin ${admin.email}?`)) return;
    try {
      const r = await fetch(`/api/admin/${admin.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      toast({ title: "Deleted", description: admin.email });
      fetchAdmins();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Phone", "Organization", "Job Title", "City", "Country", "How They Heard", "Verified", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map((r) =>
        [
          `"${r.full_name}"`,
          `"${r.email}"`,
          `"${r.phone}"`,
          `"${r.organization || ""}"`,
          `"${r.job_title || ""}"`,
          `"${r.city || ""}"`,
          `"${r.country || ""}"`,
          `"${r.heard_about_us || ""}"`,
          r.verified ? "Yes" : "No",
          format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filteredRegistrations.length} registrations` });
  };

  const stats = {
    total: registrations.length,
    verified: registrations.filter((r) => r.verified).length,
    pending: registrations.filter((r) => !r.verified).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-3xl font-bold">{stats.verified}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {isSuperAdmin && (
              <Button onClick={openAddReg}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registrations ({filteredRegistrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    {isSuperAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        No registrations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.full_name}</TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>{reg.phone}</TableCell>
                        <TableCell>{reg.organization || "-"}</TableCell>
                        <TableCell>{[reg.city, reg.country].filter(Boolean).join(", ") || "-"}</TableCell>
                        <TableCell>
                          {reg.verified ? (
                            <Badge className="bg-green-500/10 text-green-600">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-500">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(reg.created_at), "MMM d, yyyy")}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              {!reg.verified && (
                                <Button variant="ghost" size="icon" onClick={() => handleSendVerification(reg)} title="Send verification">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => openEditReg(reg)} title="Edit">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteReg(reg)} title="Delete">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Admin Management - Super Admin Only */}
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Admins</CardTitle>
              <Button onClick={openGrantAdmin}>
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No admins found
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant={admin.is_superadmin ? "default" : "secondary"}>
                              {admin.is_superadmin ? "Super Admin" : "Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(admin.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditAdmin(admin)} title="Edit">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {!admin.is_superadmin && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(admin)} title="Delete">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Registration Dialog */}
      <Dialog open={editRegOpen} onOpenChange={setEditRegOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Input placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            <Input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input placeholder="Organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
            <Input placeholder="Job Title" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
            <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            <Input placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRegOpen(false)}>Cancel</Button>
            <Button onClick={handleEditReg} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Registration Dialog */}
      <Dialog open={addRegOpen} onOpenChange={setAddRegOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Registration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Input placeholder="Full Name *" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            <Input placeholder="Email *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input placeholder="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input placeholder="Organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
            <Input placeholder="Job Title" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
            <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            <Input placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRegOpen(false)}>Cancel</Button>
            <Button onClick={handleAddReg} disabled={isSubmitting || !formData.full_name || !formData.email || !formData.phone}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Admin Dialog */}
      <Dialog open={grantAdminOpen} onOpenChange={setGrantAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Email"
              value={adminFormData.email}
              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={adminFormData.password}
              onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantAdmin} disabled={isSubmitting || !adminFormData.email || !adminFormData.password}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Email"
              value={adminFormData.email}
              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="New password (leave blank to keep)"
              value={adminFormData.password}
              onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleEditAdmin} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
