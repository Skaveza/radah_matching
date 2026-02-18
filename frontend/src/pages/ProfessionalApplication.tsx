import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Search,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// ✅ Shadcn popover/command (Combobox pattern)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

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

// ✅ Professional title casing + acronyms map
function prettyLabel(v: string) {
  const raw = String(v || "").trim();

  const fixedMap: Record<string, string> = {
    aiml: "AI/ML",
    b2b: "B2B",
    hr: "HR",
    qa: "QA",
    uiux: "UI/UX",
    devops: "DevOps",
    ecommerce: "E-commerce",
    legal: "Legal",
    tech: "Tech",
    edtech: "EdTech",
    fintech: "FinTech",
    cybersecurity: "Cybersecurity",
    marketplace: "Marketplace",
    software: "Software",
    development: "Development",
    supply: "Supply",
    chain: "Chain",
    logistics: "Logistics",
    travel: "Travel",
    hospitality: "Hospitality",
    real: "Real",
    estate: "Estate",
    media: "Media",
    entertainment: "Entertainment",
    consumer: "Consumer",
    apps: "Apps",
    product: "Product",
    manager: "Manager",
    engineer: "Engineer",
    designer: "Designer",
    analyst: "Analyst",
    strategist: "Strategist",
    writer: "Writer",
    full: "Full",
    stack: "Stack",
    frontend: "Frontend",
    backend: "Backend",
    technical: "Technical",
    lead: "Lead",
    content: "Content",
    data: "Data",
    healthcare: "Healthcare",
  };

  if (fixedMap[raw]) return fixedMap[raw];

  const words = raw
    .split("_")
    .filter(Boolean)
    .map((w) => fixedMap[w] ?? w);

  const titled = words
    .map((w) => {
      if (/[A-Z]{2,}|\/|-/g.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return titled;
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

// ✅ small UI helpers
function SectionPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-5 space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
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

  // ✅ show top error panel only after submit attempt
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // ✅ combobox state
  const [industryOpen, setIndustryOpen] = useState(false);

  // ✅ refs for jump-to-field
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const welcomeName = user?.displayName || user?.email?.split("@")[0] || null;
  const subText = user?.email ? `Signed in as ${user.email}` : null;

  const onChange = (key: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setFieldRef = (key: keyof FormState) => (el: HTMLElement | null) => {
    refs.current[key] = el;
  };

  const jumpToField = (key: keyof FormState) => {
    const el = refs.current[key];
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // focus if it supports
    // @ts-ignore
    if (typeof el.focus === "function") el.focus();
  };

  // Prefill from /api/professionals/me if exists
  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        setPrefilling(true);

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

          if (approved) {
            navigate("/professional-dashboard", { replace: true });
            return;
          }

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
        // ignore
      } finally {
        setPrefilling(false);
      }
    })();
  }, [loading, navigate]);

  // ✅ field-level errors (for inline validation + jump list)
  const fieldErrors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};

    // account-level
    if (!auth.currentUser) e.agree = "You are signed out. Please sign in again to submit.";
    if (role && role !== "professional") e.agree = "You must be signed in as a professional to apply.";

    if (!formData.primary_role) e.primary_role = "Primary role is required.";
    if (!formData.years_experience) e.years_experience = "Years of experience is required.";
    if (!formData.industry) e.industry = "Industry experience is required.";
    if (!formData.hourly_rate_range) e.hourly_rate_range = "Hourly rate range is required.";
    if (!formData.availability) e.availability = "Availability is required.";

    const summaryLen = formData.professional_summary.trim().length;
    if (summaryLen < 20) e.professional_summary = "Summary must be at least 20 characters.";

    const linkedin = formData.linkedin.trim();
    if (!linkedin) e.linkedin = "LinkedIn URL is required.";
    else if (!isValidUrl(linkedin)) e.linkedin = "LinkedIn must be a valid URL (include https://).";

    if (!formData.phone.trim()) e.phone = "Phone is required.";
    if (!formData.agree) e.agree = e.agree || "You must agree before submitting.";

    return e;
  }, [formData, role]);

  const errorList = useMemo(() => {
    const items: { key: keyof FormState; label: string; message: string }[] = [];

    const push = (key: keyof FormState, label: string) => {
      const msg = fieldErrors[key];
      if (msg) items.push({ key, label, message: msg });
    };

    push("primary_role", "Primary Role");
    push("years_experience", "Years of Experience");
    push("industry", "Industry Experience");
    push("professional_summary", "Professional Summary");
    push("hourly_rate_range", "Hourly Rate Range");
    push("availability", "Availability");
    push("linkedin", "LinkedIn");
    push("phone", "Phone");
    push("agree", "Consent");

    return items;
  }, [fieldErrors]);

  const sanity = useMemo(() => {
    const errors = errorList.map((x) => x.message);
    const canSubmit = errors.length === 0 && !submitting && !prefilling;
    return { canSubmit, errors };
  }, [errorList, submitting, prefilling]);

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
    setAttemptedSubmit(true);

    if (!sanity.canSubmit) {
      const first = errorList[0];
      toast.error(first?.message || "Please complete all required fields.");
      if (first?.key) jumpToField(first.key);
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

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            {/* Premium frame */}
            <div className="rounded-[28px] p-[1px] bg-gradient-to-r from-border/40 via-border to-border/40">
              <Card className="rounded-[28px] shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">Professional Application</CardTitle>
                      <CardDescription>
                        Apply to join our professional network. Your profile becomes visible after approval.
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Completion</div>
                      <div className="text-sm font-semibold">{completion.pct}%</div>
                    </div>
                  </div>

                  {/* progress */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${completion.pct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Takes ~2–3 minutes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Used for matching & review
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* ✅ Improved "Almost there" panel: only after submit attempt */}
                  {attemptedSubmit && errorList.length > 0 && (
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">Please review a few fields</div>
                          <div className="text-sm text-muted-foreground">
                            Click an item to jump directly to it.
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {errorList.slice(0, 6).map((e) => (
                              <button
                                type="button"
                                key={`${e.key}-${e.message}`}
                                onClick={() => jumpToField(e.key)}
                                className="text-left rounded-xl border bg-background/60 hover:bg-background transition-colors px-3 py-2"
                              >
                                <div className="text-xs font-semibold text-foreground">{e.label}</div>
                                <div className="text-xs text-muted-foreground">{e.message}</div>
                              </button>
                            ))}
                          </div>

                          {errorList.length > 6 ? (
                            <div className="text-xs text-muted-foreground">
                              + {errorList.length - 6} more…
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-6">
                    {/* Section 1 */}
                    <SectionPanel
                      title="Role & Experience"
                      subtitle="Select how you want to be matched and your experience level."
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Primary Role *</Label>
                          <select
                            ref={setFieldRef("primary_role")}
                            value={formData.primary_role}
                            onChange={(e) => onChange("primary_role", e.target.value)}
                            className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${
                              fieldErrors.primary_role ? "border-destructive focus:outline-none" : ""
                            }`}
                          >
                            <option value="" className="text-muted-foreground">
                              Select role
                            </option>
                            {PRIMARY_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {prettyLabel(r)}
                              </option>
                            ))}
                          </select>
                          <FieldHint>Choose the role you want entrepreneurs to see first.</FieldHint>
                          {attemptedSubmit && fieldErrors.primary_role ? (
                            <FieldError>{fieldErrors.primary_role}</FieldError>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Years of Experience *</Label>
                          <select
                            ref={setFieldRef("years_experience")}
                            value={formData.years_experience}
                            onChange={(e) => onChange("years_experience", e.target.value)}
                            className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${
                              fieldErrors.years_experience ? "border-destructive focus:outline-none" : ""
                            }`}
                          >
                            <option value="" className="text-muted-foreground">
                              Select experience
                            </option>
                            {YEARS_EXPERIENCE.map((x) => (
                              <option key={x} value={x}>
                                {formatRangeLabel(x)}
                              </option>
                            ))}
                          </select>
                          <FieldHint>This helps us match you with the right level of projects.</FieldHint>
                          {attemptedSubmit && fieldErrors.years_experience ? (
                            <FieldError>{fieldErrors.years_experience}</FieldError>
                          ) : null}
                        </div>
                      </div>

                      {/* ✅ Searchable Industry Combobox */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Industry Experience *</Label>

                        <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              ref={setFieldRef("industry") as any}
                              type="button"
                              variant="outline"
                              className={`w-full justify-between rounded-md ${
                                fieldErrors.industry ? "border-destructive" : ""
                              }`}
                            >
                              <span className={formData.industry ? "" : "text-muted-foreground"}>
                                {formData.industry ? prettyLabel(formData.industry) : "Select industry"}
                              </span>
                              <ChevronDown className="w-4 h-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search industry..." />
                              <CommandEmpty>No results found.</CommandEmpty>
                              <CommandGroup>
                                {INDUSTRY_EXPERIENCE.map((ind) => (
                                  <CommandItem
                                    key={ind}
                                    value={prettyLabel(ind)}
                                    onSelect={() => {
                                      onChange("industry", ind);
                                      setIndustryOpen(false);
                                    }}
                                  >
                                    <Search className="w-4 h-4 mr-2 opacity-60" />
                                    {prettyLabel(ind)}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <FieldHint>Pick the industry where you’ve done your most relevant work.</FieldHint>
                        {attemptedSubmit && fieldErrors.industry ? (
                          <FieldError>{fieldErrors.industry}</FieldError>
                        ) : null}
                      </div>
                    </SectionPanel>

                    {/* Section 2 */}
                    <SectionPanel
                      title="What you offer"
                      subtitle="Write a short, clear summary (stack + impact)."
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Professional Summary *</Label>
                          <span className="text-xs text-muted-foreground">
                            {formData.professional_summary.trim().length}/300
                          </span>
                        </div>

                        <Textarea
                          ref={setFieldRef("professional_summary") as any}
                          value={formData.professional_summary}
                          onChange={(e) => onChange("professional_summary", e.target.value)}
                          placeholder="Example: I’m a Full Stack Developer specializing in React + Node.js. I build scalable dashboards and APIs, focusing on performance and clean architecture..."
                          rows={6}
                          maxLength={300}
                          className={fieldErrors.professional_summary ? "border-destructive focus:ring-destructive" : ""}
                        />

                        <FieldHint>Minimum 20 characters. Mention skills + outcomes (e.g., speed, reliability, growth).</FieldHint>
                        {attemptedSubmit && fieldErrors.professional_summary ? (
                          <FieldError>{fieldErrors.professional_summary}</FieldError>
                        ) : null}
                      </div>
                    </SectionPanel>

                    {/* Section 3 */}
                    <SectionPanel
                      title="Rates & availability"
                      subtitle="Help teams understand your pricing and time commitment."
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Hourly Rate Range *</Label>
                          <select
                            ref={setFieldRef("hourly_rate_range")}
                            value={formData.hourly_rate_range}
                            onChange={(e) => onChange("hourly_rate_range", e.target.value)}
                            className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${
                              fieldErrors.hourly_rate_range ? "border-destructive focus:outline-none" : ""
                            }`}
                          >
                            <option value="" className="text-muted-foreground">
                              Select rate range
                            </option>
                            {HOURLY_RATE_RANGE.map((r) => (
                              <option key={r} value={r}>
                                {formatRangeLabel(r)}
                              </option>
                            ))}
                          </select>
                          <FieldHint>Select the closest range for your current expectations.</FieldHint>
                          {attemptedSubmit && fieldErrors.hourly_rate_range ? (
                            <FieldError>{fieldErrors.hourly_rate_range}</FieldError>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Availability *</Label>
                          <select
                            ref={setFieldRef("availability")}
                            value={formData.availability}
                            onChange={(e) => onChange("availability", e.target.value)}
                            className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${
                              fieldErrors.availability ? "border-destructive focus:outline-none" : ""
                            }`}
                          >
                            <option value="" className="text-muted-foreground">
                              Select availability
                            </option>
                            {AVAILABILITY.map((a) => (
                              <option key={a} value={a}>
                                {prettyLabel(a)}
                              </option>
                            ))}
                          </select>
                          <FieldHint>Choose the level you can reliably maintain.</FieldHint>
                          {attemptedSubmit && fieldErrors.availability ? (
                            <FieldError>{fieldErrors.availability}</FieldError>
                          ) : null}
                        </div>
                      </div>
                    </SectionPanel>

                    {/* Section 4 */}
                    <SectionPanel
                      title="Links & contact"
                      subtitle="These help us verify and contact you."
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">LinkedIn *</Label>
                          <Input
                            ref={setFieldRef("linkedin") as any}
                            value={formData.linkedin}
                            onChange={(e) => onChange("linkedin", e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className={fieldErrors.linkedin ? "border-destructive focus:ring-destructive" : ""}
                          />
                          <FieldHint>Must include https://</FieldHint>
                          {attemptedSubmit && fieldErrors.linkedin ? (
                            <FieldError>{fieldErrors.linkedin}</FieldError>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Portfolio (optional)</Label>
                          <Input
                            ref={setFieldRef("portfolio") as any}
                            value={formData.portfolio}
                            onChange={(e) => onChange("portfolio", e.target.value)}
                            placeholder="https://yourportfolio.com"
                          />
                          <FieldHint>GitHub, website, Notion, Dribbble — anything that shows your work.</FieldHint>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone *</Label>
                        <Input
                          ref={setFieldRef("phone") as any}
                          value={formData.phone}
                          onChange={(e) => onChange("phone", e.target.value)}
                          placeholder="+250..."
                          className={fieldErrors.phone ? "border-destructive focus:ring-destructive" : ""}
                        />
                        <FieldHint>Include country code (e.g. +250...).</FieldHint>
                        {attemptedSubmit && fieldErrors.phone ? (
                          <FieldError>{fieldErrors.phone}</FieldError>
                        ) : null}
                      </div>
                    </SectionPanel>

                    {/* Section 5 */}
                    <SectionPanel
                      title="Consent"
                      subtitle="Confirm your information is accurate so we can process your application."
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          ref={setFieldRef("agree") as any}
                          checked={formData.agree}
                          onCheckedChange={(v) => onChange("agree", Boolean(v))}
                          id="agree"
                        />
                        <div className="space-y-1">
                          <Label htmlFor="agree" className="leading-snug text-sm font-medium">
                            I confirm the information provided is accurate and I agree to be contacted.
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            You can update your profile later from your dashboard.
                          </p>
                          {attemptedSubmit && fieldErrors.agree ? <FieldError>{fieldErrors.agree}</FieldError> : null}
                        </div>
                      </div>
                    </SectionPanel>

                    {/* Sticky Submit Bar */}
                    <div className="sticky bottom-0 z-10 -mx-6 px-6 pt-4 pb-4 bg-background/80 backdrop-blur border-t">
                      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="w-full sm:w-auto">
                          <div className="text-xs text-muted-foreground">Completion</div>
                          <div className="text-sm font-semibold">{completion.pct}%</div>
                          <div className="w-56 h-2 mt-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${completion.pct}%` }} />
                          </div>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
                          <Button type="submit" className="w-full sm:w-[220px] rounded-xl" disabled={!sanity.canSubmit}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Application
                          </Button>
                          <p className="text-xs text-muted-foreground text-center sm:text-right">
                            Strong summary + valid LinkedIn increases approval speed.
                          </p>
                        </div>
                      </div>
                    </div>
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
