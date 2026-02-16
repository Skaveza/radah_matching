import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Shield,
  LogOut,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

type AnyRow = Record<string, any>;

interface Application {
  id: string;
  name: string;
  email: string;

  primary_role?: string | null;
  years_experience?: string | null;
  industry_experience?: string[] | null;

  portfolio_url?: string | null;
  linkedin_url?: string | null;

  hourly_rate_range?: string | null;
  availability?: string | null;
  professional_summary?: string | null;

  approved?: boolean;
  rejected?: boolean;
  status?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  // optional AI fields
  ai_vetting_status?: string | null;
  ai_vetting_score?: number | null;
  ai_vetting_notes?: string | null;
  ai_flagged_as_fake?: boolean | null;

  rejection_reason?: string | null;
}

interface Professional {
  id: string;
  name: string;
  email: string;

  primary_role?: string | null;
  years_experience?: string | null;
  industry_experience?: string[] | null;

  hourly_rate_range?: string | null;
  availability?: string | null;

  status?: string | null;
  approved?: boolean;

  created_at?: string | null;
}

/**
 * ✅ UI-consumed structure (we normalize backend rows into this shape)
 */
interface PurchasedTeam {
  id: string; // project_id (or other id)
  team_name: string;
  customer_email: string;
  matched_status: string | null;
  created_at: string;
  professionals: any[];
}

function normalizeApplication(r: AnyRow): Application {
  return {
    id: String(r.id ?? r.uid ?? ""),
    name: String(r.name ?? r.full_name ?? ""),
    email: String(r.email ?? ""),

    primary_role: r.primary_role ?? null,
    years_experience: r.years_experience ?? null,
    industry_experience: Array.isArray(r.industry_experience) ? r.industry_experience : null,

    portfolio_url: r.portfolio_url ?? r.portfolio ?? null,
    linkedin_url: r.linkedin_url ?? r.linkedin ?? null,

    hourly_rate_range: r.hourly_rate_range ?? r.rate_range ?? null,
    availability: r.availability ?? null,
    professional_summary: r.professional_summary ?? r.summary ?? null,

    approved: typeof r.approved === "boolean" ? r.approved : undefined,
    rejected: typeof r.rejected === "boolean" ? r.rejected : undefined,
    status: r.status ?? null,

    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,

    ai_vetting_status: r.ai_vetting_status ?? null,
    ai_vetting_score: typeof r.ai_vetting_score === "number" ? r.ai_vetting_score : null,
    ai_vetting_notes: r.ai_vetting_notes ?? null,
    ai_flagged_as_fake: r.ai_flagged_as_fake ?? null,

    rejection_reason: r.rejection_reason ?? null,
  };
}

function normalizeProfessional(r: AnyRow): Professional {
  return {
    id: String(r.id ?? r.uid ?? ""),
    name: String(r.name ?? r.full_name ?? ""),
    email: String(r.email ?? ""),

    primary_role: r.primary_role ?? null,
    years_experience: r.years_experience ?? null,
    industry_experience: Array.isArray(r.industry_experience) ? r.industry_experience : null,

    hourly_rate_range: r.hourly_rate_range ?? null,
    availability: r.availability ?? null,

    status: r.status ?? null,
    approved: typeof r.approved === "boolean" ? r.approved : undefined,

    created_at: r.created_at ?? null,
  };
}

/**
 * ✅ Normalize whatever your backend returns into the UI expected PurchasedTeam shape.
 * Supports backend row shapes like:
 * - { project_id, project, entrepreneur, team, created_at/updated_at }
 * - or your older shape { id, team_name, customer_email, professionals }
 */
function normalizePurchasedTeam(r: AnyRow): PurchasedTeam {
  const projectId = String(r.project_id ?? r.id ?? "");
  const teamArr = Array.isArray(r.team)
    ? r.team
    : Array.isArray(r.professionals)
    ? r.professionals
    : [];

  const created =
    String(r.updated_at ?? r.created_at ?? new Date().toISOString());

  const customerEmail =
    String(r.customer_email ?? r?.entrepreneur?.email ?? r?.project?.entrepreneur_email ?? "");

  const teamName =
    String(
      r.team_name ??
        r?.project?.industry ??
        r?.project?.title ??
        r?.project?.name ??
        "Purchased Team"
    );

  const matchedStatus =
    typeof r.matched_status === "string"
      ? r.matched_status
      : teamArr.length > 0
      ? "matched"
      : "pending";

  return {
    id: projectId,
    team_name: teamName,
    customer_email: customerEmail,
    matched_status: matchedStatus,
    created_at: created,
    professionals: teamArr,
  };
}

export default function Admin() {
  const { user, loading: authLoading, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [purchasedTeams, setPurchasedTeams] = useState<PurchasedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = useMemo(() => role === "admin", [role]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const unwrapList = (res: any): AnyRow[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.professionals)) return res.professionals;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  // ✅ FIX: support { items: [...] } from backend
  const unwrapTeams = (res: any): AnyRow[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items; // <-- backend format
    if (Array.isArray(res?.teams)) return res.teams;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const authHeaders = await getAuthHeaders();

      // Pending
      const pendingRes = await apiFetch<any>("/api/professionals/list-pending", {
        method: "GET",
        headers: authHeaders,
      });
      setApplications(unwrapList(pendingRes).map(normalizeApplication));

      // Approved
      const approvedRes = await apiFetch<any>("/api/professionals/list-approved", {
        method: "GET",
        headers: authHeaders,
      });
      setProfessionals(unwrapList(approvedRes).map(normalizeProfessional));

      // Purchased teams (optional)
      try {
        const teamsRes = await apiFetch<any>("/api/admin/purchased_teams_list", {
          method: "GET",
          headers: authHeaders,
        });

        const teamsList = unwrapTeams(teamsRes);
        setPurchasedTeams(teamsList.map(normalizePurchasedTeam));
      } catch {
        setPurchasedTeams([]);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication?.id) return;
    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      await apiFetch(`/api/professionals/approve?uid=${encodeURIComponent(selectedApplication.id)}`, {
        method: "POST",
        headers,
      });

      toast.success(`${selectedApplication.name} approved`);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to approve");
    } finally {
      setIsProcessing(false);
      setSelectedApplication(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication?.id) return;
    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();

      await apiFetch(`/api/professionals/reject?uid=${encodeURIComponent(selectedApplication.id)}`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejection_reason: rejectionReason || "" }),
      });

      toast.success("Application rejected");
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to reject");
    } finally {
      setIsProcessing(false);
      setSelectedApplication(null);
      setActionType(null);
      setRejectionReason("");
    }
  };

  const getStatusBadge = (app: Application) => {
    if (app.rejected || app.status === "rejected") {
      return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
    }
    if (app.approved || app.status === "approved") {
      return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
    }
    if (app.status === "pending_review") {
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending Review</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
  };

  const getAIVettingBadge = (app: Application) => {
    if (!app.ai_vetting_status || app.ai_vetting_status === "pending") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />—
            </Badge>
          </TooltipTrigger>
          <TooltipContent>No AI vetting data</TooltipContent>
        </Tooltip>
      );
    }

    if (app.ai_flagged_as_fake) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge className="bg-red-500/20 text-red-500 gap-1">
              <AlertTriangle className="w-3 h-3" />
              Fake
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold text-red-500">⚠ Flagged</p>
            <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge className="bg-green-500/20 text-green-500 gap-1">
            <CheckCircle className="w-3 h-3" />
            {app.ai_vetting_score ?? "—"}/100
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold text-green-500">AI: {app.ai_vetting_status}</p>
          <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getMatchStatusBadge = (status: string | null) => {
    switch (status) {
      case "matched":
        return <Badge className="bg-green-500/20 text-green-500">Matched</Badge>;
      case "partial_match":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Partial Match</Badge>;
      default:
        return <Badge className="bg-orange-500/20 text-orange-500">Pending</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don’t have permission to access the admin panel.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = applications.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
              <span className="text-accent-foreground font-bold">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Radah Works Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{professionals.length}</p>
                  <p className="text-sm text-muted-foreground">Approved Professionals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{purchasedTeams.length}</p>
                  <p className="text-sm text-muted-foreground">Purchased Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="mb-6">
            <TabsTrigger value="applications">Applications ({pendingCount})</TabsTrigger>
            <TabsTrigger value="professionals">Professionals ({professionals.length})</TabsTrigger>
            <TabsTrigger value="teams">Purchased Teams ({purchasedTeams.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Pending Professional Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending applications</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>AI Vetting</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id} className={app.ai_flagged_as_fake ? "bg-red-500/5" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.name}</p>
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{app.primary_role ?? "—"}</TableCell>
                          <TableCell>{app.years_experience ?? "—"}</TableCell>
                          <TableCell>{app.hourly_rate_range ?? "—"}</TableCell>
                          <TableCell>{getAIVettingBadge(app)}</TableCell>
                          <TableCell>{getStatusBadge(app)}</TableCell>
                          <TableCell>
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {app.linkedin_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}

                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setActionType("approve");
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setActionType("reject");
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professionals">
            <Card>
              <CardHeader>
                <CardTitle>Approved Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : professionals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No professionals found (check list-approved query vs approve fields).
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professionals.map((pro) => (
                        <TableRow key={pro.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pro.name}</p>
                              <p className="text-sm text-muted-foreground">{pro.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{pro.primary_role ?? "—"}</TableCell>
                          <TableCell>{pro.years_experience ?? "—"}</TableCell>
                          <TableCell>{pro.hourly_rate_range ?? "—"}</TableCell>
                          <TableCell>{pro.availability ?? "—"}</TableCell>
                          <TableCell>
                            {pro.created_at ? new Date(pro.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Purchased Teams</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : purchasedTeams.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No purchases yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Match Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasedTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.team_name}</TableCell>
                          <TableCell>{team.customer_email || "—"}</TableCell>
                          <TableCell>{Array.isArray(team.professionals) ? team.professionals.length : 0}</TableCell>
                          <TableCell>{getMatchStatusBadge(team.matched_status)}</TableCell>
                          <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Approve dialog */}
      <AlertDialog open={actionType === "approve"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Approve {selectedApplication?.name}? They will be added to the professionals pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Reject {selectedApplication?.name}?
              <br />
              <span className="text-xs text-muted-foreground">
                Reason is optional (stored only if your PHP saves it).
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
