import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, LogOut, Search, Users, CheckCircle, XCircle, Loader2, Key } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string | null;
  job_title: string | null;
  city: string | null;
  country: string | null;
  heard_about_us: string | null;
  verified: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { navigate("/admin/login"); return }
    try {
      const part = token.split(".")[1] || "";
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      setIsSuperAdmin(!!payload.super);
    } catch {
      setIsSuperAdmin(localStorage.getItem("is_superadmin") === "true");
    }
    fetchRegistrations()
  }, [navigate]);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch("/api/registrations", { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error("Failed to load registrations")
      const data = await r.json()
      setRegistrations(data || [])
      setFilteredRegistrations(data || [])
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load registrations", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  };

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

  const handleLogout = async () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("is_superadmin");
    navigate("/admin/login");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    try {
      setIsChangingPassword(true);
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to change password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      toast({ title: "Success", description: "Password changed successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to change password", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const grantAdmin = async () => {
    try {
      setIsGranting(true)
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch("/api/admin/grant", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }) })
      if (!r.ok) throw new Error("Failed to grant admin")
      setNewAdminEmail("")
      setNewAdminPassword("")
      toast({ title: "Admin granted", description: "New admin can now log in." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to grant admin", variant: "destructive" })
    } finally {
      setIsGranting(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Organization",
      "Job Title",
      "City",
      "Country",
      "How They Heard",
      "Verified",
      "Registration Date",
    ];

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

    toast({ title: "Export complete", description: `Exported ${filteredRegistrations.length} registrations` });
  };

  const stats = {
    total: registrations.length,
    verified: registrations.filter((r) => r.verified).length,
    pending: registrations.filter((r) => !r.verified).length,
  };

  const addRegistration = async () => {
    try {
      const full_name = window.prompt("Full name") || ""
      const email = window.prompt("Email") || ""
      const phone = window.prompt("Phone") || ""
      if (!full_name || !email || !phone) return
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ full_name, email, phone }) })
      if (!r.ok) throw new Error('Failed to add registration')
      await fetchRegistrations()
      toast({ title: 'Registration added', description: full_name })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add registration', variant: 'destructive' })
    }
  }

  const editRegistration = async (reg: Registration) => {
    try {
      const full_name = window.prompt("Full name", reg.full_name) || reg.full_name
      const email = window.prompt("Email", reg.email) || reg.email
      const phone = window.prompt("Phone", reg.phone) || reg.phone
      const organization = window.prompt("Organization", reg.organization || "") || reg.organization || null
      const job_title = window.prompt("Job Title", reg.job_title || "") || reg.job_title || null
      const city = window.prompt("City", reg.city || "") || reg.city || null
      const country = window.prompt("Country", reg.country || "") || reg.country || null
      const heard_about_us = window.prompt("How they heard", reg.heard_about_us || "") || reg.heard_about_us || null
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch(`/api/registrations/${reg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ full_name, email, phone, organization, job_title, city, country, heard_about_us, future_interests: [] }) })
      if (!r.ok) throw new Error('Failed to update registration')
      await fetchRegistrations()
      toast({ title: 'Registration updated', description: full_name })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update registration', variant: 'destructive' })
    }
  }

  const deleteRegistration = async (reg: Registration) => {
    try {
      if (!window.confirm(`Delete registration for ${reg.full_name}?`)) return
      const token = localStorage.getItem("admin_token") || "";
      const r = await fetch(`/api/registrations/${reg.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error('Failed to delete registration')
      await fetchRegistrations()
      toast({ title: 'Registration deleted', description: reg.full_name })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete registration', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.verified}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registrations</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-display">Approve Admin Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <Input placeholder="Admin email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
                <Input type="password" placeholder="Temporary password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
                <Button onClick={grantAdmin} disabled={isGranting || !newAdminEmail || !newAdminPassword}>
                  {isGranting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Approve Admin
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Only the designated super admin can approve admin registrations.</p>
            </CardContent>
          </Card>
        )}

        {/* Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Registrations ({filteredRegistrations.length})
            </CardTitle>
            {isSuperAdmin && (
              <div className="mt-2">
                <Button onClick={addRegistration}>Add Registration</Button>
              </div>
            )}
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
                        <TableCell>
                          {[reg.city, reg.country].filter(Boolean).join(", ") || "-"}
                        </TableCell>
                        <TableCell>
                          {reg.verified ? (
                            <Badge className="bg-success/10 text-success hover:bg-success/20">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning border-warning">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(reg.created_at), "MMM d, yyyy")}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => editRegistration(reg)}>Edit</Button>
                              <Button variant="destructive" onClick={() => deleteRegistration(reg)}>Delete</Button>
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

        {isSuperAdmin && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-display">Manage Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminsManager />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function AdminsManager() {
  const { toast } = useToast()
  const [admins, setAdmins] = useState<Array<{id:string,email:string,is_superadmin:boolean,created_at:string}>>([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem("admin_token") || ""

  const fetchAdmins = async () => {
    try {
      const r = await fetch('/api/admins', { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error('Failed to load admins')
      const j = await r.json()
      setAdmins(j || [])
    } catch (e:any) {
      toast({ title:'Error', description:e.message || 'Failed to load admins', variant:'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  const updateAdmin = async (a:{id:string,email:string}) => {
    try {
      const email = window.prompt('Admin email', a.email) || a.email
      const password = window.prompt('New password (leave blank to keep)') || ''
      const body:any = {}
      if (email) body.email = email
      if (password) body.password = password
      const r = await fetch(`/api/admin/${a.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error('Failed to update admin')
      await fetchAdmins()
      toast({ title:'Admin updated', description: email })
    } catch (e:any) {
      toast({ title:'Error', description:e.message || 'Failed to update admin', variant:'destructive' })
    }
  }

  const deleteAdmin = async (a:{id:string,email:string}) => {
    try {
      if (!window.confirm(`Delete admin ${a.email}?`)) return
      const r = await fetch(`/api/admin/${a.id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
      if (!r.ok) throw new Error('Failed to delete admin')
      await fetchAdmins()
      toast({ title:'Admin deleted', description:a.email })
    } catch (e:any) {
      toast({ title:'Error', description:e.message || 'Failed to delete admin', variant:'destructive' })
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading admins...</div>

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No admins found</TableCell>
            </TableRow>
          ) : (
            admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.is_superadmin ? 'Super Admin' : 'Admin'}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(a.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => updateAdmin(a)}>Edit</Button>
                    <Button variant="destructive" onClick={() => deleteAdmin(a)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
