import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  User as UserIcon,
  FileText,
  History,
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  industry: string;
  summary: string;
  rate_range: string;
  availability: string;
  is_available: boolean;
  linkedin: string | null;
  portfolio: string | null;
  phone: string | null;
}

interface Application {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

type AnyRow = Record<string, any>;

function normalizeApp(row: AnyRow): Application {
  return {
    id: String(row.id ?? row.application_id ?? row.app_id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? row.primary_role ?? ""),
    status: String(row.status ?? "pending"),
    rejection_reason: row.rejection_reason ?? row.reason ?? null,
    created_at: String(row.created_at ?? row.submitted_at ?? new Date().toISOString()),
  };
}

function normalizeProfessional(row: AnyRow): Professional {
  return {
    id: String(row.id ?? row.professional_id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? ""),
    experience: String(row.experience ?? row.years_experience ?? ""),
    industry: String(row.industry ?? ""),
    summary: String(row.summary ?? ""),
    rate_range: String(row.rate_range ?? ""),
    availability: String(row.availability ?? ""),
    is_available: Boolean(row.is_available ?? row.available ?? false),
    linkedin: row.linkedin ?? null,
    portfolio: row.portfolio ?? null,
    phone: row.phone ?? null,
  };
}

export default function ProfessionalDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    summary: "",
    rate_range: "",
    availability: "",
    linkedin: "",
    portfolio: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/professional-login");
    }
  }, [user, authLoading, navigate]);

  const userEmail = user?.email || "";

  const fetchProfessionalData = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);

      const token = await auth.currentUser?.getIdToken().catch(() => null);

      // 1) Try to find approved professional by email
      let prof: Professional | null = null;
      try {
        const res = await apiFetch<any>("/api/professionals/professionals_list_approved", {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.professionals) ? res.professionals : [];
        const found = list.find((r: AnyRow) => String(r.email || "").toLowerCase() === userEmail.toLowerCase());
        if (found) prof = normalizeProfessional(found);
      } catch {
        // ignore, fallback below
      }

      // 2) Applications: try professionals_list (assumed includes applications)
      let apps: Application[] = [];
      try {
        const res = await apiFetch<any>("/api/professionals/professionals_list", {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.applications) ? res.applications : [];
        apps = list
          .map((r: AnyRow) => normalizeApp(r))
          .filter((a: Application) => (a.email || "").toLowerCase() === userEmail.toLowerCase())
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      } catch {
        // Fallback: pending list only
        try {
          const res = await apiFetch<any>("/api/professionals/professionals_list_pending", {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.applications) ? res.applications : [];
          apps = list
            .map((r: AnyRow) => normalizeApp(r))
            .filter((a: Application) => (a.email || "").toLowerCase() === userEmail.toLowerCase())
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        } catch {
          apps = [];
        }
      }

      setProfessional(prof);
      setApplications(apps);

      if (prof) {
        setFormData({
          summary: prof.summary || "",
          rate_range: prof.rate_range || "",
          availability: prof.availability || "",
          linkedin: prof.linkedin || "",
          portfolio: prof.portfolio || "",
          phone: prof.phone || "",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) fetchProfessionalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!professional) return;

    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);

      await apiFetch("/api/professionals/professional_update", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: professional.id,
          is_available: checked ? 1 : 0,
        }),
      });

      setProfessional({ ...professional, is_available: checked });
      toast.success(checked ? "You are now available for matches" : "You are now unavailable for matches");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update availability");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;

    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken().catch(() => null);

      await apiFetch("/api/professionals/professional_update", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: professional.id,
          summary: formData.summary,
          rate_range: formData.rate_range,
          availability: formData.availability,
          linkedin: formData.linkedin || null,
          portfolio: formData.portfolio || null,
          phone: formData.phone || null,
        }),
      });

      setProfessional({
        ...professional,
        summary: formData.summary,
        rate_range: formData.rate_range,
        availability: formData.availability,
        linkedin: formData.linkedin || null,
        portfolio: formData.portfolio || null,
        phone: formData.phone || null,
      });

      toast.success("Profile updated successfully");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/professional-login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
    }
  };

  const defaultTab = useMemo(() => (professional ? "profile" : "applications"), [professional]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Professional Dashboard</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!professional && applications.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Profile Found</CardTitle>
              <CardDescription>
                You don’t have a professional profile yet. Apply to become a Radah professional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/professional-apply")}>Apply Now</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" disabled={!professional}>
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="applications">
                <FileText className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="matches" disabled>
                <History className="w-4 h-4 mr-2" />
                Matches
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={!professional}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              {professional && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your professional details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={professional.name} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={professional.email} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input value={professional.role} disabled className="bg-muted" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="summary">Professional Summary</Label>
                          <Textarea
                            id="summary"
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rate_range">Rate Range</Label>
                          <Select
                            value={formData.rate_range}
                            onValueChange={(value) => setFormData({ ...formData, rate_range: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rate range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="$50-75/hr">$50-75/hr</SelectItem>
                              <SelectItem value="$75-100/hr">$75-100/hr</SelectItem>
                              <SelectItem value="$100-150/hr">$100-150/hr</SelectItem>
                              <SelectItem value="$150-200/hr">$150-200/hr</SelectItem>
                              <SelectItem value="$200+/hr">$200+/hr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button type="submit" disabled={saving}>
                          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contact & Links</CardTitle>
                      <CardDescription>Your public contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">Portfolio URL</Label>
                        <Input
                          id="portfolio"
                          value={formData.portfolio}
                          onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="availability">Availability</Label>
                        <Select
                          value={formData.availability}
                          onValueChange={(value) => setFormData({ ...formData, availability: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="10-20 hrs/week">10-20 hrs/week</SelectItem>
                            <SelectItem value="20-30 hrs/week">20-30 hrs/week</SelectItem>
                            <SelectItem value="Flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Your Applications</CardTitle>
                  <CardDescription>Track the status of your professional applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No applications found</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/professional-apply")}>
                        Submit Application
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{app.role}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(app.created_at).toLocaleDateString()}
                            </p>
                            {app.rejection_reason && (
                              <p className="text-sm text-red-500 mt-1">Reason: {app.rejection_reason}</p>
                            )}
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>Match History</CardTitle>
                  <CardDescription>Not wired yet (no PHP endpoint provided)</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Once you add an endpoint like <code>/api/professionals/matches</code>, we’ll plug it in here.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              {professional && (
                <Card>
                  <CardHeader>
                    <CardTitle>Availability Settings</CardTitle>
                    <CardDescription>Control your matching preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base">Available for Matches</Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, you can be matched with new projects
                        </p>
                      </div>
                      <Switch checked={professional.is_available} onCheckedChange={handleAvailabilityToggle} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
