import React, { useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";

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
  // no replaceAll -> supports older TS lib targets
  return v
    .replace(/_/g, " ")
    .replace("aiml", "AI/ML")
    .replace("b2b", "B2B")
    .replace("hr", "HR");
}

function isValidUrl(s: string) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export default function ProfessionalApplication() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [formData, setFormData] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);

  const sanity = useMemo(() => {
    const errors: string[] = [];

    if (!auth.currentUser) errors.push("You are signed out. Please sign in again.");
    if (role && role !== "professional") errors.push("You must be signed in as a professional to apply.");

    if (!formData.primary_role) errors.push("Primary role is required.");
    if (!formData.years_experience) errors.push("Years of experience is required.");
    if (!formData.industry) errors.push("Industry experience is required.");
    if (!formData.hourly_rate_range) errors.push("Hourly rate range is required.");
    if (!formData.availability) errors.push("Availability is required.");

    if (formData.professional_summary.trim().length < 20) errors.push("Professional summary must be at least 20 characters.");

    const linkedin = formData.linkedin.trim();
    if (!linkedin) errors.push("LinkedIn URL is required.");
    else if (!isValidUrl(linkedin)) errors.push("LinkedIn must be a valid URL (include https://).");

    if (!formData.phone.trim()) errors.push("Phone is required.");

    if (!formData.agree) errors.push("You must agree before submitting.");

    const canSubmit = errors.length === 0 && !submitting;
    return { canSubmit, errors };
  }, [formData, submitting, role]);

  const onChange = (key: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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

      // force refresh token (helps after account switching)
      const token = await user.getIdToken(true);
      if (!token) throw new Error("Missing auth token. Please sign in again.");

      // ✅ EXACT keys expected by your latest professionals_apply.php
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
      setFormData(defaultState);
      navigate("/professional-dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Professional Application</CardTitle>
                <CardDescription>Apply to join our professional network.</CardDescription>
              </CardHeader>

              <CardContent>
                {sanity.errors.length > 0 && (
                  <div className="mb-4 rounded-xl border p-3 text-sm">
                    <p className="font-medium mb-1">Please fix:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {sanity.errors.slice(0, 5).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Role *</Label>
                      <Select value={formData.primary_role} onValueChange={(v) => onChange("primary_role", v)}>
                        <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Years of Experience *</Label>
                      <Select value={formData.years_experience} onValueChange={(v) => onChange("years_experience", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS_EXPERIENCE.map((x) => (
                            <SelectItem key={x} value={x}>
                              {x.replace(/_/g, "-").replace("plus", "+")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry Experience *</Label>
                    <Select value={formData.industry} onValueChange={(v) => onChange("industry", v)}>
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label>Professional Summary *</Label>
                    <Textarea
                      value={formData.professional_summary}
                      onChange={(e) => onChange("professional_summary", e.target.value)}
                      placeholder="Describe your expertise and what you can offer (min 20 characters)"
                      rows={5}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hourly Rate Range *</Label>
                      <Select value={formData.hourly_rate_range} onValueChange={(v) => onChange("hourly_rate_range", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate range" />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURLY_RATE_RANGE.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.replace(/_/g, "-").replace("plus", "+")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Availability *</Label>
                      <Select value={formData.availability} onValueChange={(v) => onChange("availability", v)}>
                        <SelectTrigger>
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
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>LinkedIn *</Label>
                      <Input value={formData.linkedin} onChange={(e) => onChange("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Portfolio (optional)</Label>
                      <Input value={formData.portfolio} onChange={(e) => onChange("portfolio", e.target.value)} placeholder="https://yourportfolio.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+250..." />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox checked={formData.agree} onCheckedChange={(v) => onChange("agree", Boolean(v))} id="agree" />
                    <Label htmlFor="agree" className="leading-snug">
                      I confirm the information provided is accurate and I agree to be contacted.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={!sanity.canSubmit}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
