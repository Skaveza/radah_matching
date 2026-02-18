import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
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
import { Loader2, User as UserIcon, FileText, History, Settings, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

type AnyRow = Record<string, any>;

type ProfessionalDoc = {
  id: string; // uid
  name?: string | null;
  email?: string | null;
  region?: string | null;

  primary_role?: string;
  years_experience?: string;
  industry_experience?: string[];

  hourly_rate_range?: string;
  availability?: string;
  professional_summary?: string;

  linkedin?: string | null;
  portfolio?: string | null;
  phone?: string | null;

  status?: "pending" | "approved" | "rejected" | "pending_review" | string;
  approved?: boolean;
  rejected?: boolean;
  is_available?: boolean;

  updated_at?: string;
};

type MatchRow = {
  id: string; // projectId
  project_id?: string;
  entrepreneur_id?: string;
  team?: any[];
  status?: string;
  locked?: boolean;
  updated_at?: string;
};

function getStatusBadge(status: string) {
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
}

const RATE_OPTIONS = ["50_75", "75_100", "100_150", "150_200", "200_plus"] as const;
const AVAIL_OPTIONS = ["full_time", "part_time", "limited", "project_based"] as const;

function prettyLabel(v: string) {
  return v.replace(/_/g, " ").replace("aiml", "AI/ML").replace("b2b", "B2B").replace("hr", "HR");
}

export default function ProfessionalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [professional, setProfessional] = useState<ProfessionalDoc | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [saving, setSaving] = useState(false);

  // editable form mirrors firestore keys (consistent with professionals_apply.php)
  const [formData, setFormData] = useState({
    professional_summary: "",
    hourly_rate_range: "",
    availability: "",
    linkedin: "",
    portfolio: "",
    phone: "",
    is_available: false,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const welcomeName = user?.displayName || user?.email?.split("@")[0] || null;
  const subText = user?.email ? `Signed in as ${user.email}` : null;

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = await auth.currentUser?.getIdToken().catch(() => null);
      if (!token) throw new Error("Missing auth token. Please sign in again.");

      // 1) my professional profile
      const meRes = await apiFetch<any>("/api/professionals/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const prof = (meRes?.professional ?? null) as AnyRow | null;
      const exists = Boolean(meRes?.exists);

      if (exists && prof) {
        const normalized: ProfessionalDoc = {
          id: String(prof.id ?? prof.uid ?? auth.currentUser?.uid ?? ""),
          ...prof,
        };

        setProfessional(normalized);

        setFormData({
          professional_summary: String(normalized.professional_summary ?? ""),
          hourly_rate_range: String(normalized.hourly_rate_range ?? ""),
          availability: String(normalized.availability ?? ""),
          linkedin: String(normalized.linkedin ?? ""),
          portfolio: String(normalized.portfolio ?? ""),
          phone: String(normalized.phone ?? ""),
          is_available: Boolean(normalized.is_available ?? false),
        });
      } else {
        setProfessional(null);
      }

      // 2) my matches
      const matchRes = await apiFetch<any>("/api/professionals/matches", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = Array.isArray(matchRes?.matches) ? matchRes.matches : [];
      setMatches(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const isApproved = useMemo(() => {
    if (!professional) return false;
    if (professional.approved === true) return true;
    if ((professional.status || "").toLowerCase() === "approved") return true;
    return false;
  }, [professional]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;

    try {
      setSaving(true);

      const token = await auth.currentUser?.getIdToken(true).catch(() => null);
      if (!token) throw new Error("Missing auth token. Please sign in again.");

      const payload = {
        professional_summary: formData.professional_summary.trim(),
        hourly_rate_range: formData.hourly_rate_range,
        availability: formData.availability,
        linkedin: formData.linkedin.trim(),
        phone: formData.phone.trim(),
        portfolio: formData.portfolio.trim() || null,
        is_available: Boolean(formData.is_available),
      };

      await apiFetch("/api/professionals/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      toast.success("Profile updated");
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (checked: boolean) => {
    setFormData((p) => ({ ...p, is_available: checked }));
    // optional: auto-save availability immediately
    // (kept simple: user hits save)
  };

  const defaultTab = useMemo(() => {
    // If they’re not approved, focus “Application / Status”
    if (!isApproved) return "application";
    return "profile";
  }, [isApproved]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header mode="professional" welcomeName={welcomeName} subText={subText} showProfileButton />

      <main className="container mx-auto px-4 pt-28 pb-10">
        {/* Top status card */}
        <Card className="rounded-2xl mb-6">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Professional Dashboard</CardTitle>
              <CardDescription>
                {professional
                  ? "Manage your public profile, availability, and your matched teams."
                  : "You don’t have a professional profile yet. Apply to join the network."}
              </CardDescription>
            </div>
            <div className="shrink-0">{getStatusBadge(String(professional?.status ?? "not_applied"))}</div>
          </CardHeader>

          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {professional ? (
                <>
                  <div>
                    <span className="font-medium text-foreground">Public name:</span>{" "}
                    {professional.name || user?.displayName || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Primary role:</span>{" "}
                    {professional.primary_role ? prettyLabel(professional.primary_role) : "—"}
                  </div>
                </>
              ) : (
                <div>No application found for your account.</div>
              )}
            </div>

            {/* ✅ Apply button only if NOT approved */}
            {!isApproved ? (
              <Button onClick={() => navigate("/professional-apply")} variant="premium">
                Apply Now
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" disabled={!professional || !isApproved}>
              <UserIcon className="w-4 h-4 mr-2" />
              Public Profile
            </TabsTrigger>

            <TabsTrigger value="matches" disabled={!isApproved}>
              <History className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>

            <TabsTrigger value="application">
              <FileText className="w-4 h-4 mr-2" />
              Application / Status
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile">
            {!professional || !isApproved ? (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Profile not available</CardTitle>
                  <CardDescription>
                    Your profile becomes public after your application is approved.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/professional-apply")} variant="premium">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Public preview */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>How you appear to the public</CardTitle>
                    <CardDescription>This is what entrepreneurs will see.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-medium">{professional.name || "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Primary Role</div>
                      <div className="font-medium">
                        {professional.primary_role ? prettyLabel(professional.primary_role) : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Summary</div>
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {professional.professional_summary || "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {professional.availability ? (
                        <Badge variant="outline">{prettyLabel(professional.availability)}</Badge>
                      ) : null}
                      {professional.hourly_rate_range ? (
                        <Badge variant="outline">{professional.hourly_rate_range.replace(/_/g, "-").replace("plus", "+")}</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                {/* Editable form */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Edit your profile</CardTitle>
                    <CardDescription>Update the information you provided in your application.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={onSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Professional Summary</Label>
                        <Textarea
                          value={formData.professional_summary}
                          onChange={(e) => setFormData((p) => ({ ...p, professional_summary: e.target.value }))}
                          rows={5}
                          placeholder="Describe your expertise and what you can offer."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hourly Rate Range</Label>
                          <Select
                            value={formData.hourly_rate_range}
                            onValueChange={(v) => setFormData((p) => ({ ...p, hourly_rate_range: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rate range" />
                            </SelectTrigger>
                            <SelectContent>
                              {RATE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r.replace(/_/g, "-").replace("plus", "+")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Availability</Label>
                          <Select
                            value={formData.availability}
                            onValueChange={(v) => setFormData((p) => ({ ...p, availability: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAIL_OPTIONS.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {prettyLabel(a)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input
                          value={formData.linkedin}
                          onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+250..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Portfolio (optional)</Label>
                          <Input
                            value={formData.portfolio}
                            onChange={(e) => setFormData((p) => ({ ...p, portfolio: e.target.value }))}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-xl">
                        <div>
                          <Label className="text-base">Available for matches</Label>
                          <p className="text-sm text-muted-foreground">Toggle whether you can be matched to teams.</p>
                        </div>
                        <Switch checked={formData.is_available} onCheckedChange={toggleAvailability} />
                      </div>

                      <Button type="submit" disabled={saving} variant="premium" className="w-full">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Matches */}
          <TabsContent value="matches">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Your matched teams</CardTitle>
                <CardDescription>Teams where you were included after a team was saved.</CardDescription>
              </CardHeader>

              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No matches yet. Once an entrepreneur saves a team that includes you, it will show here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((m) => (
                      <div key={m.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">Project: {m.project_id || m.id}</div>
                            <div className="text-sm text-muted-foreground">
                              Updated: {m.updated_at ? new Date(m.updated_at).toLocaleString() : "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Status: {m.status || "—"} {m.locked ? "• Locked" : ""}
                            </div>
                          </div>
                          <Badge variant="outline">{(m.team?.length ?? 0)} members</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application / Status */}
          <TabsContent value="application">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Application status</CardTitle>
                <CardDescription>
                  {professional
                    ? "Track your current review status."
                    : "You haven’t submitted an application yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional ? (
                  <>
                    <div className="flex items-center justify-between border rounded-xl p-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current status</div>
                        <div className="font-medium">{professional.status || "—"}</div>
                      </div>
                      {getStatusBadge(String(professional.status || "pending"))}
                    </div>

                    {!isApproved ? (
                      <div className="flex items-center justify-between border rounded-xl p-4">
                        <div>
                          <div className="font-medium">Want to update your application?</div>
                          <div className="text-sm text-muted-foreground">
                            You can submit your application now or update details after approval.
                          </div>
                        </div>
                        <Button variant="premium" onClick={() => navigate("/professional-apply")}>
                          Go to Application
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-xl p-4 text-sm text-muted-foreground">
                        You’re approved 🎉 Your public profile is active.
                      </div>
                    )}
                  </>
                ) : (
                  <Button variant="premium" onClick={() => navigate("/professional-apply")}>
                    Apply Now
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
