import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  Bot,
  AlertTriangle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Application {
  id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  industry: string;
  portfolio: string | null;
  linkedin: string | null;
  rate_range: string;
  availability: string;
  summary: string;
  status: string;
  created_at: string;
  ai_vetting_status: string | null;
  ai_vetting_score: number | null;
  ai_vetting_notes: string | null;
  ai_flagged_as_fake: boolean | null;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  industry: string;
  is_available: boolean;
  created_at: string;
}

interface PurchasedTeam {
  id: string;
  team_name: string;
  customer_email: string;
  matched_status: string | null;
  created_at: string;
  professionals: any[];
}

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [purchasedTeams, setPurchasedTeams] = useState<PurchasedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // Fetch data when admin is confirmed
  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch applications
      const { data: appData, error: appError } = await supabase
        .from("professional_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appError) throw appError;
      setApplications((appData as Application[]) || []);

      // Fetch professionals
      const { data: proData, error: proError } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });

      if (proError) throw proError;
      setProfessionals((proData as Professional[]) || []);

      // Fetch purchased teams
      const { data: teamData, error: teamError } = await supabase
        .from("purchased_teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (teamError) throw teamError;
      setPurchasedTeams((teamData as PurchasedTeam[]) || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    setIsProcessing(true);

    try {
      // First, check if there's a user account with this email in profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", selectedApplication.email)
        .maybeSingle();

      const userId = profileData?.id || null;

      // Insert into professionals table with user_id if found
      const { error: insertError } = await supabase
        .from("professionals")
        .insert({
          application_id: selectedApplication.id,
          name: selectedApplication.name,
          email: selectedApplication.email,
          role: selectedApplication.role,
          experience: selectedApplication.experience,
          industry: selectedApplication.industry,
          portfolio: selectedApplication.portfolio,
          linkedin: selectedApplication.linkedin,
          rate_range: selectedApplication.rate_range,
          availability: selectedApplication.availability,
          summary: selectedApplication.summary,
          is_available: true,
          user_id: userId,
        });

      if (insertError) throw insertError;

      // Update application status
      const { error: updateError } = await supabase
        .from("professional_applications")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id);

      if (updateError) throw updateError;

      if (userId) {
        toast.success(`${selectedApplication.name} has been approved and linked to their account!`);
      } else {
        toast.success(`${selectedApplication.name} has been approved! They'll be linked when they create an account.`);
      }
      fetchData();
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    } finally {
      setIsProcessing(false);
      setSelectedApplication(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("professional_applications")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      toast.success(`Application rejected`);
      fetchData();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    } finally {
      setIsProcessing(false);
      setSelectedApplication(null);
      setActionType(null);
      setRejectionReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    }
  };

  const getAIVettingBadge = (app: Application) => {
    if (!app.ai_vetting_status || app.ai_vetting_status === "pending") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1">
              <Bot className="w-3 h-3" />
              Analyzing...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>AI vetting in progress</TooltipContent>
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
            <p className="font-semibold text-red-500">⚠️ Flagged as potentially fake</p>
            <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    switch (app.ai_vetting_status) {
      case "approved":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-green-500/20 text-green-500 gap-1">
                <Bot className="w-3 h-3" />
                {app.ai_vetting_score}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-green-500">✓ AI Approved</p>
              <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
            </TooltipContent>
          </Tooltip>
        );
      case "flagged":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-yellow-500/20 text-yellow-500 gap-1">
                <Bot className="w-3 h-3" />
                {app.ai_vetting_score}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-yellow-500">⚠ Needs Review</p>
              <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
            </TooltipContent>
          </Tooltip>
        );
      case "rejected":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-red-500/20 text-red-500 gap-1">
                <Bot className="w-3 h-3" />
                {app.ai_vetting_score}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-red-500">✗ AI Rejected</p>
              <p className="text-sm mt-1">{app.ai_vetting_notes}</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return null;
    }
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

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access the admin panel.
            </p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter(a => a.status === "pending").length}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Active Professionals</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {purchasedTeams.filter(t => t.matched_status === "matched").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Fully Matched</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications">
          <TabsList className="mb-6">
            <TabsTrigger value="applications">
              Applications ({applications.filter(a => a.status === "pending").length} pending)
            </TabsTrigger>
            <TabsTrigger value="professionals">
              Professionals ({professionals.length})
            </TabsTrigger>
            <TabsTrigger value="teams">
              Purchased Teams ({purchasedTeams.length})
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Professional Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No applications yet
                  </p>
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
                          <TableCell>{app.role}</TableCell>
                          <TableCell>{app.experience}</TableCell>
                          <TableCell>${app.rate_range}/hr</TableCell>
                          <TableCell>{getAIVettingBadge(app)}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            {new Date(app.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {app.linkedin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a href={app.linkedin} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              {app.status === "pending" && (
                                <>
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
                                </>
                              )}
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

          {/* Professionals Tab */}
          <TabsContent value="professionals">
            <Card>
              <CardHeader>
                <CardTitle>Active Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : professionals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No professionals approved yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Available</TableHead>
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
                          <TableCell>{pro.role}</TableCell>
                          <TableCell>{pro.experience}</TableCell>
                          <TableCell>{pro.industry}</TableCell>
                          <TableCell>
                            {pro.is_available ? (
                              <Badge className="bg-green-500/20 text-green-500">Available</Badge>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-500">Unavailable</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(pro.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchased Teams Tab */}
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
                  <p className="text-center text-muted-foreground py-8">
                    No purchases yet
                  </p>
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
                          <TableCell>{team.customer_email}</TableCell>
                          <TableCell>
                            {Array.isArray(team.professionals) 
                              ? team.professionals.length 
                              : 0} roles
                          </TableCell>
                          <TableCell>{getMatchStatusBadge(team.matched_status)}</TableCell>
                          <TableCell>
                            {new Date(team.created_at).toLocaleDateString()}
                          </TableCell>
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

      {/* Approve Dialog */}
      <AlertDialog open={actionType === "approve"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedApplication?.name}'s application? 
              They will be added to the professionals pool and can be matched with founders.
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

      {/* Reject Dialog */}
      <AlertDialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedApplication?.name}'s application?
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
};

export default Admin;
