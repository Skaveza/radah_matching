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
import {
  Loader2,
  User as UserIcon,
  FileText,
  History,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

type AnyRow = Record<string, any>;

type ProfessionalDoc = {
  id: string;
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
  id: string;
  project_id?: string;
  entrepreneur_id?: string;
  team?: any[];
  status?: string;
  locked?: boolean;
  updated_at?: string;
};

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "approved":
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>
      );
    case "pending":
    case "pending_review":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" /> Pending Review
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <AlertCircle className="w-3 h-3 mr-1" /> {status || "not_applied"}
        </Badge>
      );
  }
}

const RATE_OPTIONS = ["50_75", "75_100", "100_150", "150_200", "200_plus"] as const;
const AVAIL_OPTIONS = ["full_time", "part_time", "limited", "project_based"] as const;

function prettyLabel(v: string) {
  const fixedMap: Record<string, string> = {
    aiml: "AI/ML",
    b2b: "B2B",
    hr: "HR",
    qa: "QA",
    uiux: "UI/UX",
    devops: "DevOps",
    ecommerce: "E-commerce",
    edtech: "EdTech",
    fintech: "FinTech",
    cybersecurity: "Cybersecurity",
    full: "Full",
    stack: "Stack",
    frontend: "Frontend",
    backend: "Backend",
    technical: "Technical",
    lead: "Lead",
    developer: "Developer",
    designer: "Designer",
    manager: "Manager",
    engineer: "Engineer",
    analyst: "Analyst",
    strategist: "Strategist",
    writer: "Writer",
    content: "Content",
    data: "Data",
    marketing: "Marketing",
    product: "Product",
    time: "Time",
    part: "Part",
    full_time: "Full Time",
    part_time: "Part Time",
    limited: "Limited",
    project: "Project",
    based: "Based",
  };

  return v
    .split("_")
    .filter(Boolean)
    .map((w) => fixedMap[w] ?? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatRangeLabel(v: string) {
  return "$" + v.replace(/_/g, "-").replace("plus", "+") + "/hr";
}

function initials(name?: string | null) {
  const raw = (name || "").trim();
  if (!raw) return "PR";
  const parts = raw.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "PR";
}

export default function ProfessionalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<ProfessionalDoc | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [saving, setSaving] = useState(false);

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

      const matchRes = await apiFetch<any>("/api/professionals/matches", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(Array.isArray(matchRes?.matches) ? matchRes.matches : []);
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

      await apiFetch("/api/professionals/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_summary: formData.professional_summary.trim(),
          hourly_rate_range: formData.hourly_rate_range,
          availability: formData.availability,
          linkedin: formData.linkedin.trim(),
          phone: formData.phone.trim(),
          portfolio: formData.portfolio.trim() || null,
          is_available: Boolean(formData.is_available),
        }),
      });

      toast.success("Profile updated");
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const defaultTab = useMemo(() => (!isApproved ? "application" : "profile"), [isApproved]);

  const profileStrength = useMemo(() => {
    const checks = [
      Boolean(professional?.professional_summary?.trim()),
      Boolean(professional?.hourly_rate_range),
      Boolean(professional?.availability),
      Boolean(professional?.linkedin),
      Boolean(professional?.phone),
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [professional]);

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
        <div className="rounded-3xl p-[1px] bg-gradient-to-r from-border/40 via-border to-border/40 mb-6">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Professional Dashboard</CardTitle>
                <CardDescription>
                  {professional
                    ? "Manage your public profile, availability, and your matched teams."
                    : "You don't have a professional profile yet. Apply to join the network."}
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
              {!isApproved && professional && (
                <Button onClick={() => navigate("/professional-apply")} variant="premium" className="rounded-xl">
                  Update Application
                </Button>
              )}
              {!professional && (
                <Button onClick={() => navigate("/professional-apply")} variant="premium" className="rounded-xl">
                  Apply Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="rounded-2xl">
            <CardContent className="pt-6 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-semibold capitalize">{(professional?.status || "not_applied").replace(/_/g, " ")}</div>
              </div>
              <div className="shrink-0">{getStatusBadge(String(professional?.status ?? "not_applied"))}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Availability</div>
                <div className="font-semibold">{formData.is_available ? "Available" : "Not available"}</div>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                Matches use this
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Matches</div>
                <div className="font-semibold">{matches.length}</div>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-4 h-4" />
                Team placements
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 rounded-2xl p-2 h-auto lg:w-auto lg:inline-grid">
            <TabsTrigger
              value="profile"
              disabled={!isApproved}
              className="py-2 text-xs md:text-sm"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Public Profile
            </TabsTrigger>
            <TabsTrigger value="matches" disabled={!isApproved} className="py-2 text-xs md:text-sm">
              <History className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="application" className="py-2 text-xs md:text-sm">
              <FileText className="w-4 h-4 mr-2" />
              Application
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {!isApproved ? (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Profile not available</CardTitle>
                  <CardDescription>Your profile becomes public after your application is approved.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/professional-apply")} variant="premium" className="rounded-xl">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Public preview */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      How you appear to entrepreneurs
                    </CardTitle>
                    <CardDescription>This is what entrepreneurs will see when browsing professionals.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-semibold">
                        {initials(professional?.name || user?.displayName || null)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{professional?.name || "—"}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {professional?.primary_role ? prettyLabel(professional.primary_role) : "—"}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {professional?.availability && (
                            <Badge variant="outline">{prettyLabel(professional.availability)}</Badge>
                          )}
                          {professional?.hourly_rate_range && (
                            <Badge variant="outline">{formatRangeLabel(professional.hourly_rate_range)}</Badge>
                          )}
                          {professional?.is_available ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Available</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Not available</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border p-4 bg-muted/10">
                      <div className="text-xs text-muted-foreground mb-1">Summary</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {professional?.professional_summary || "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {professional?.linkedin && (
                        <Button type="button" variant="outline" className="rounded-xl"
                          onClick={() => window.open(String(professional.linkedin), "_blank")}>
                          LinkedIn <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      {professional?.portfolio && (
                        <Button type="button" variant="outline" className="rounded-xl"
                          onClick={() => window.open(String(professional.portfolio), "_blank")}>
                          Portfolio <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Profile strength: <span className="font-medium text-foreground">{profileStrength.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${profileStrength.pct}%` }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Edit form */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Edit your profile</CardTitle>
                    <CardDescription>Update information visible to entrepreneurs.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={onSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Professional Summary</Label>
                          <span className="text-xs text-muted-foreground">
                            {formData.professional_summary.trim().length}/300
                          </span>
                        </div>
                        <Textarea
                          value={formData.professional_summary}
                          onChange={(e) => setFormData((p) => ({ ...p, professional_summary: e.target.value }))}
                          rows={6}
                          maxLength={300}
                          placeholder="Your skills, tools, and what you deliver."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hourly Rate Range</Label>
                          <Select value={formData.hourly_rate_range}
                            onValueChange={(v) => setFormData((p) => ({ ...p, hourly_rate_range: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger>
                            <SelectContent>
                              {RATE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>{formatRangeLabel(r)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Availability</Label>
                          <Select value={formData.availability}
                            onValueChange={(v) => setFormData((p) => ({ ...p, availability: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                            <SelectContent>
                              {AVAIL_OPTIONS.map((a) => (
                                <SelectItem key={a} value={a}>{prettyLabel(a)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input value={formData.linkedin}
                          onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))}
                          placeholder="https://linkedin.com/in/..." />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={formData.phone}
                            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+254..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Portfolio (optional)</Label>
                          <Input value={formData.portfolio}
                            onChange={(e) => setFormData((p) => ({ ...p, portfolio: e.target.value }))}
                            placeholder="https://yourportfolio.com" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                        <div className="space-y-1">
                          <Label className="text-base">Available for matches</Label>
                          <p className="text-sm text-muted-foreground">If off, you won't appear in new team suggestions.</p>
                        </div>
                        <Switch checked={formData.is_available}
                          onCheckedChange={(v) => setFormData((p) => ({ ...p, is_available: v }))} />
                      </div>

                      <Button type="submit" disabled={saving} variant="premium" className="w-full rounded-xl">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Your matched teams</CardTitle>
                <CardDescription>Teams where you were included after an entrepreneur saved a team.</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No matches yet. Once an entrepreneur saves a team that includes you, it will appear here.
                    </p>
                    <div className="rounded-xl border p-4 bg-muted/10 text-sm text-muted-foreground">
                      Tip: Turn on <span className="font-medium text-foreground">Availability</span> and keep your summary strong to increase matching.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((m) => (
                      <div key={m.id} className="border rounded-2xl p-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">Project: {m.project_id || m.id}</div>
                            <div className="text-sm text-muted-foreground">
                              Updated: {m.updated_at ? new Date(m.updated_at).toLocaleString() : "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Status: <span className="text-foreground">{m.status || "—"}</span>
                              {m.locked && <span className="text-muted-foreground"> • Locked</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge variant="outline" className="rounded-xl">
                              <Users className="w-3 h-3 mr-1" />{m.team?.length ?? 0} members
                            </Badge>
                            {m.locked ? (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 rounded-xl">Locked</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground rounded-xl">Open</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="application">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Application status</CardTitle>
                <CardDescription>
                  {professional ? "Track your current review status." : "You haven't submitted an application yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional ? (
                  <>
                    <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/10">
                      <div>
                        <div className="text-sm text-muted-foreground">Current status</div>
                        <div className="font-medium capitalize">{(professional.status || "—").replace(/_/g, " ")}</div>
                      </div>
                      {getStatusBadge(String(professional.status || "pending"))}
                    </div>

                    <div className="border rounded-xl p-4">
                      <div className="text-sm font-medium mb-3">Review flow</div>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" /> Submitted
                        </li>
                        <li className="flex items-center gap-2">
                          {isApproved
                            ? <CheckCircle className="w-4 h-4 text-primary" />
                            : <Clock className="w-4 h-4" />}
                          Under review
                        </li>
                        <li className="flex items-center gap-2">
                          {isApproved
                            ? <CheckCircle className="w-4 h-4 text-primary" />
                            : <CheckCircle className="w-4 h-4 text-muted-foreground" />}
                          Approved — profile becomes public
                        </li>
                      </ol>
                    </div>

                    {isApproved ? (
                      <div className="border rounded-xl p-4 text-sm bg-green-500/5 text-green-700">
                        You're approved 🎉 Your public profile is active and visible to entrepreneurs.
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/10">
                        <div>
                          <div className="font-medium">Want to update your application?</div>
                          <div className="text-sm text-muted-foreground">
                            Resubmitting with a stronger summary may speed up approval.
                          </div>
                        </div>
                        <Button variant="premium" className="rounded-xl" onClick={() => navigate("/professional-apply")}>
                          Update Application
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You haven't applied yet. A complete profile improves approval speed and matching quality.
                    </p>
                    <Button variant="premium" className="rounded-xl" onClick={() => navigate("/professional-apply")}>
                      Apply Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}