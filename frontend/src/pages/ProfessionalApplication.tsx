import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const PRIMARY_ROLES = [
  "technical_lead",
  "full_stack_developer",
  "frontend_developer",
  "backend_developer",
  "uiux_designer",
  "product_manager",
  "devops_engineer",
  "qa_engineer",
  "marketing_strategist",
  "content_writer",
  "data_analyst",
] as const;

const YEARS_EXPERIENCE = ["1_3", "3_5", "5_7", "7_10", "10_plus"] as const;

const INDUSTRY_EXPERIENCE = [
  "software_development",
  "fintech",
  "healthcare",
  "ecommerce",
  "edtech",
  "aiml",
  "marketplace",
  "b2b_software",
  "consumer_apps",
  "media_entertainment",
  "gaming",
  "real_estate",
  "cybersecurity",
  "legal_tech",
  "hr_tech",
  "prop_tech",
  "travel_hospitality",
  "logistics_supply_chain",
] as const;

const HOURLY_RATE_RANGE = ["50_75", "75_100", "100_150", "150_200", "200_plus"] as const;
const AVAILABILITY = ["full_time", "part_time", "limited", "project_based"] as const;

type FormState = {
  primary_role: string;
  years_experience: string;
  industry: string; // UI single; backend wants array
  professional_summary: string;
  hourly_rate_range: string;
  availability: string;

  linkedin: string;
  portfolio: string;
  phone: string;

  agree: boolean;
};

const defaultState: FormState = {
  primary_role: "",
  years_experience: "",
  industry: "",
  professional_summary: "",
  hourly_rate_range: "",
  availability: "",
  linkedin: "",
  portfolio: "",
  phone: "",
  agree: false,
};

function prettyLabel(v: string) {
  return v.replace(/_/g, " ").replace("aiml", "AI/ML").replace("b2b", "B2B").replace("hr", "HR");
}

function isValidUrl(s: string) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function formatRangeLabel(v: string) {
  return v.replace(/_/g, "-").replace("plus", "+");
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-destructive">{children}</p>;
}

export default function ProfessionalApplication() {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  const [formData, setFormData] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  const welcomeName = user?.displayName || user?.email?.split("@")[0] || null;
  const subText = user?.email ? `Signed in as ${user.email}` : null;

  const onChange = (key: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Prefill from /api/professionals/me if exists
  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        setPrefilling(true);

        // if not logged in, allow view but block submission
        const u = auth.currentUser;
        if (!u) return;

        const token = await u.getIdToken();
        const res = await apiFetch<any>("/api/professionals/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const prof = res?.professional ?? null;
        const exists = Boolean(res?.exists);

        if (exists && prof) {
          const status = String(prof.status ?? "").toLowerCase();
          const approved = prof.approved === true || status === "approved";

          // already approved => go to dashboard
          if (approved) {
            navigate("/professional-dashboard", { replace: true });
            return;
          }

          // Prefill fields if pending/rejected
          setFormData((p) => ({
            ...p,
            primary_role: prof.primary_role ?? p.primary_role,
            years_experience: prof.years_experience ?? p.years_experience,
            industry: Array.isArray(prof.industry_experience)
              ? (prof.industry_experience[0] ?? p.industry)
              : p.industry,
            professional_summary: prof.professional_summary ?? p.professional_summary,
            hourly_rate_range: prof.hourly_rate_range ?? p.hourly_rate_range,
            availability: prof.availability ?? p.availability,
            linkedin: prof.linkedin ?? p.linkedin,
            portfolio: prof.portfolio ?? p.portfolio,
            phone: prof.phone ?? p.phone,
          }));
        }
      } catch {
        // ignore: if endpoint fails, user can still fill manually
      } finally {
        setPrefilling(false);
      }
    })();
  }, [loading, navigate]);

  const fieldErrors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};

    // account-level
    if (!auth.currentUser) e.agree = "You are signed out. Please sign in again.";
    if (role && role !== "professional") e.agree = "You must be signed in as a professional to apply.";

    if (!formData.primary_role) e.primary_role = "Primary role is required.";
    if (!formData.years_experience) e.years_experience = "Years of experience is required.";
    if (!formData.industry) e.industry = "Industry experience is required.";
    if (!formData.hourly_rate_range) e.hourly_rate_range = "Hourly rate range is required.";
    if (!formData.availability) e.availability = "Availability is required.";

    const summaryLen = formData.professional_summary.trim().length;
    if (summaryLen < 20) e.professional_summary = "Professional summary must be at least 20 characters.";

    const linkedin = formData.linkedin.trim();
    if (!linkedin) e.linkedin = "LinkedIn URL is required.";
    else if (!isValidUrl(linkedin)) e.linkedin = "LinkedIn must be a valid URL (include https://).";

    if (!formData.phone.trim()) e.phone = "Phone is required.";
    if (!formData.agree) e.agree = "You must agree before submitting.";

    return e;
  }, [formData, role]);

  const sanity = useMemo(() => {
    const errors: string[] = [];

    if (!auth.currentUser) errors.push("You are signed out. Please sign in again.");
    if (role && role !== "professional") errors.push("You must be signed in as a professional to apply.");

    if (!formData.primary_role) errors.push("Primary role is required.");
    if (!formData.years_experience) errors.push("Years of experience is required.");
    if (!formData.industry) errors.push("Industry experience is required.");
    if (!formData.hourly_rate_range) errors.push("Hourly rate range is required.");
    if (!formData.availability) errors.push("Availability is required.");
    if (formData.professional_summary.trim().length < 20)
      errors.push("Professional summary must be at least 20 characters.");

    const linkedin = formData.linkedin.trim();
    if (!linkedin) errors.push("LinkedIn URL is required.");
    else if (!isValidUrl(linkedin)) errors.push("LinkedIn must be a valid URL (include https://).");

    if (!formData.phone.trim()) errors.push("Phone is required.");
    if (!formData.agree) errors.push("You must agree before submitting.");

    const canSubmit = errors.length === 0 && !submitting && !prefilling;
    return { canSubmit, errors };
  }, [formData, submitting, prefilling, role]);

  const completion = useMemo(() => {
    const checks = [
      Boolean(formData.primary_role),
      Boolean(formData.years_experience),
      Boolean(formData.industry),
      Boolean(formData.professional_summary.trim().length >= 20),
      Boolean(formData.hourly_rate_range),
      Boolean(formData.availability),
      Boolean(formData.linkedin.trim() && isValidUrl(formData.linkedin.trim())),
      Boolean(formData.phone.trim()),
      Boolean(formData.agree),
    ];
    const done = checks.filter(Boolean).length;
    const total = checks.length;
    const pct = Math.round((done / total) * 100);
    return { done, total, pct };
  }, [formData]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sanity.canSubmit) {
      toast.error(sanity.errors[0] || "Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");

      const token = await user.getIdToken(true);
      if (!token) throw new Error("Missing auth token. Please sign in again.");

      const payload = {
        primary_role: formData.primary_role.trim(),
        years_experience: formData.years_experience.trim(),
        industry_experience: [formData.industry.trim()],
        hourly_rate_range: formData.hourly_rate_range.trim(),
        availability: formData.availability.trim(),
        professional_summary: formData.professional_summary.trim(),
        linkedin: formData.linkedin.trim(),
        phone: formData.phone.trim(),
        portfolio: formData.portfolio.trim() || null,
      };

      await apiFetch("/api/professionals/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      toast.success("Application submitted successfully!");
      navigate("/professional-dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || prefilling) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        mode={role === "professional" ? "professional" : "public"}
        welcomeName={welcomeName}
        subText={subText}
        showProfileButton={role === "professional"}
      />

      <main className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            {/* subtle frame */}
            <div className="rounded-3xl p-[1px] bg-gradient-to-r from-border/40 via-border to-border/40">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">Professional Application</CardTitle>
                      <CardDescription>Apply to join our professional network.</CardDescription>
                    </div>

                    {/* Completion */}
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Completion</div>
                      <div className="text-sm font-semibold">{completion.pct}%</div>
                    </div>
                  </div>

                  {/* progress bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${completion.pct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Step-by-step form (about 2–3 minutes)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Your data is used for matching and review
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Top summary errors */}
                  {sanity.errors.length > 0 && (
                    <div className="mb-5 rounded-2xl border p-4 text-sm bg-muted/20">
                      <p className="font-medium mb-2">Almost there — please review:</p>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {sanity.errors.slice(0, 5).map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-6">
                    {/* SECTION 1 */}
                    <SectionHeader
                      title="Role & Experience"
                      subtitle="Tell us how you want to be matched and your level of experience."
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Role *</Label>
                        <Select value={formData.primary_role} onValueChange={(v) => onChange("primary_role", v)}>
                          <SelectTrigger
                            className={fieldErrors.primary_role ? "border-destructive focus:ring-destructive" : ""}
                          >
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIMARY_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {prettyLabel(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHint>Pick the role you want entrepreneurs to see first.</FieldHint>
                        {fieldErrors.primary_role ? <FieldError>{fieldErrors.primary_role}</FieldError> : null}
                      </div>

                      <div className="space-y-2">
                        <Label>Years of Experience *</Label>
                        <Select value={formData.years_experience} onValueChange={(v) => onChange("years_experience", v)}>
                          <SelectTrigger
                            className={fieldErrors.years_experience ? "border-destructive focus:ring-destructive" : ""}
                          >
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS_EXPERIENCE.map((x) => (
                              <SelectItem key={x} value={x}>
                                {formatRangeLabel(x)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHint>This helps us match you with the right level of projects.</FieldHint>
                        {fieldErrors.years_experience ? <FieldError>{fieldErrors.years_experience}</FieldError> : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Industry Experience *</Label>
                      <Select value={formData.industry} onValueChange={(v) => onChange("industry", v)}>
                        <SelectTrigger className={fieldErrors.industry ? "border-destructive focus:ring-destructive" : ""}>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_EXPERIENCE.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {prettyLabel(ind)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldHint>Select the industry where you’ve done your most relevant work.</FieldHint>
                      {fieldErrors.industry ? <FieldError>{fieldErrors.industry}</FieldError> : null}
                    </div>

                    <Divider />

                    {/* SECTION 2 */}
                    <SectionHeader
                      title="What you offer"
                      subtitle="Write a short summary that shows your strengths (keep it clear and specific)."
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Professional Summary *</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.professional_summary.trim().length}/300
                        </span>
                      </div>
                      <Textarea
                        value={formData.professional_summary}
                        onChange={(e) => onChange("professional_summary", e.target.value)}
                        placeholder="Example: I build scalable web apps with React + Node.js, focusing on performance and clean architecture..."
                        rows={6}
                        maxLength={300}
                        className={fieldErrors.professional_summary ? "border-destructive focus:ring-destructive" : ""}
                      />
                      <FieldHint>Minimum 20 characters. Mention your stack + strongest outcomes.</FieldHint>
                      {fieldErrors.professional_summary ? (
                        <FieldError>{fieldErrors.professional_summary}</FieldError>
                      ) : null}
                    </div>

                    <Divider />

                    {/* SECTION 3 */}
                    <SectionHeader
                      title="Rates & availability"
                      subtitle="This helps entrepreneurs understand your expected commitment and pricing."
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hourly Rate Range *</Label>
                        <Select value={formData.hourly_rate_range} onValueChange={(v) => onChange("hourly_rate_range", v)}>
                          <SelectTrigger
                            className={fieldErrors.hourly_rate_range ? "border-destructive focus:ring-destructive" : ""}
                          >
                            <SelectValue placeholder="Select rate range" />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURLY_RATE_RANGE.map((r) => (
                              <SelectItem key={r} value={r}>
                                {formatRangeLabel(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHint>Choose the range that best matches your current expectations.</FieldHint>
                        {fieldErrors.hourly_rate_range ? <FieldError>{fieldErrors.hourly_rate_range}</FieldError> : null}
                      </div>

                      <div className="space-y-2">
                        <Label>Availability *</Label>
                        <Select value={formData.availability} onValueChange={(v) => onChange("availability", v)}>
                          <SelectTrigger className={fieldErrors.availability ? "border-destructive focus:ring-destructive" : ""}>
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABILITY.map((a) => (
                              <SelectItem key={a} value={a}>
                                {prettyLabel(a)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldHint>How much time can you realistically commit?</FieldHint>
                        {fieldErrors.availability ? <FieldError>{fieldErrors.availability}</FieldError> : null}
                      </div>
                    </div>

                    <Divider />

                    {/* SECTION 4 */}
                    <SectionHeader
                      title="Links & contact"
                      subtitle="Provide your professional link(s) so we can verify and contact you."
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>LinkedIn *</Label>
                        <Input
                          value={formData.linkedin}
                          onChange={(e) => onChange("linkedin", e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className={fieldErrors.linkedin ? "border-destructive focus:ring-destructive" : ""}
                        />
                        <FieldHint>Must include https://</FieldHint>
                        {fieldErrors.linkedin ? <FieldError>{fieldErrors.linkedin}</FieldError> : null}
                      </div>

                      <div className="space-y-2">
                        <Label>Portfolio (optional)</Label>
                        <Input
                          value={formData.portfolio}
                          onChange={(e) => onChange("portfolio", e.target.value)}
                          placeholder="https://yourportfolio.com"
                        />
                        <FieldHint>GitHub, website, Notion, Dribbble — anything that shows your work.</FieldHint>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        placeholder="+250..."
                        className={fieldErrors.phone ? "border-destructive focus:ring-destructive" : ""}
                      />
                      <FieldHint>Include country code (example: +250...).</FieldHint>
                      {fieldErrors.phone ? <FieldError>{fieldErrors.phone}</FieldError> : null}
                    </div>

                    <Divider />

                    {/* SECTION 5 */}
                    <SectionHeader
                      title="Consent"
                      subtitle="Confirm your information is correct so we can process your application."
                    />
                    <div className="flex items-start gap-3 pt-1">
                      <Checkbox
                        checked={formData.agree}
                        onCheckedChange={(v) => onChange("agree", Boolean(v))}
                        id="agree"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agree" className="leading-snug">
                          I confirm the information provided is accurate and I agree to be contacted.
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          You can update your profile later from your dashboard.
                        </p>
                        {fieldErrors.agree ? <FieldError>{fieldErrors.agree}</FieldError> : null}
                      </div>
                    </div>

                    <Button type="submit" className="w-full rounded-xl" disabled={!sanity.canSubmit}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Application
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Tip: A clear summary + valid LinkedIn increases approval speed.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
