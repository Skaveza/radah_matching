import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, User, FileText, History, Settings, LogOut, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

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

interface Match {
  id: string;
  role_matched: string;
  created_at: string;
  notification_sent: boolean;
  professional_responded: boolean;
  purchased_team_id: string;
}

const ProfessionalDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [saving, setSaving] = useState(false);

  // Profile form state
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

  useEffect(() => {
    if (user) {
      fetchProfessionalData();
    }
  }, [user]);

  const fetchProfessionalData = async () => {
    try {
      setLoading(true);

      // Fetch professional profile by user_id first
      let { data: profData, error: profError } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profError) throw profError;

      // If no profile found by user_id, check if there's one by email that needs linking
      if (!profData && user?.email) {
        const { data: unlinkedProf, error: unlinkError } = await supabase
          .from("professionals")
          .select("*")
          .eq("email", user.email)
          .is("user_id", null)
          .maybeSingle();

        if (unlinkError) throw unlinkError;

        // If found, link it to this user
        if (unlinkedProf) {
          const { error: linkError } = await supabase
            .from("professionals")
            .update({ user_id: user.id })
            .eq("id", unlinkedProf.id);

          if (linkError) throw linkError;

          profData = { ...unlinkedProf, user_id: user.id };
        }
      }

      if (profData) {
        setProfessional(profData);
        setFormData({
          summary: profData.summary || "",
          rate_range: profData.rate_range || "",
          availability: profData.availability || "",
          linkedin: profData.linkedin || "",
          portfolio: profData.portfolio || "",
          phone: profData.phone || "",
        });
      }

      // Fetch applications by email
      const { data: appData, error: appError } = await supabase
        .from("professional_applications")
        .select("*")
        .eq("email", user?.email)
        .order("created_at", { ascending: false });

      if (appError) throw appError;
      setApplications(appData || []);

      // Fetch matches if professional exists
      if (profData) {
        const { data: matchData, error: matchError } = await supabase
          .from("professional_matches")
          .select("*")
          .eq("professional_id", profData.id)
          .order("created_at", { ascending: false });

        if (matchError) throw matchError;
        setMatches(matchData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!professional) return;

    try {
      const { error } = await supabase
        .from("professionals")
        .update({ is_available: checked })
        .eq("id", professional.id);

      if (error) throw error;

      setProfessional({ ...professional, is_available: checked });
      toast.success(checked ? "You are now available for matches" : "You are now unavailable for matches");
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("professionals")
        .update({
          summary: formData.summary,
          rate_range: formData.rate_range,
          availability: formData.availability,
          linkedin: formData.linkedin || null,
          portfolio: formData.portfolio || null,
          phone: formData.phone || null,
        })
        .eq("id", professional.id);

      if (error) throw error;

      setProfessional({ ...professional, ...formData });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Professional Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                You don't have a professional profile yet. Apply to become a Radah professional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/apply")}>
                Apply Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={professional ? "profile" : "applications"} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" disabled={!professional}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="applications">
                <FileText className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="matches" disabled={!professional}>
                <History className="w-4 h-4 mr-2" />
                Matches
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={!professional}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
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

            {/* Applications Tab */}
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
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/apply")}>
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
                              <p className="text-sm text-red-500 mt-1">
                                Reason: {app.rejection_reason}
                              </p>
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

            {/* Matches Tab */}
            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>Match History</CardTitle>
                  <CardDescription>View your project matches and opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No matches yet</p>
                      <p className="text-sm mt-2">You'll see your project matches here when founders select you</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{match.role_matched}</p>
                            <p className="text-sm text-muted-foreground">
                              Matched {new Date(match.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {match.notification_sent ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" /> Notified
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
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
                      <Switch
                        checked={professional.is_available}
                        onCheckedChange={handleAvailabilityToggle}
                      />
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Current Status</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Role:</span>
                          <span>{professional.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Industry:</span>
                          <span>{professional.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experience:</span>
                          <span>{professional.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Matches:</span>
                          <span>{matches.length}</span>
                        </div>
                      </div>
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
};

export default ProfessionalDashboard;
