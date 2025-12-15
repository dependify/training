import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, LogOut, Search, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      fetchRegistrations();
    };

    checkAdminAndFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
      setFilteredRegistrations(data || []);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Registrations ({filteredRegistrations.length})
            </CardTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
