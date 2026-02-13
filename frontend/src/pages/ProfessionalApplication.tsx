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

// ✅ Must match backend enums exactly (professional_enums.php)
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

// Types derived from enums
type PrimaryRole = (typeof PRIMARY_ROLES)[number];
type YearsExperience = (typeof YEARS_EXPERIENCE)[number];
type IndustryExperience = (typeof INDUSTRY_EXPERIENCE)[number];
type HourlyRateRange = (typeof HOURLY_RATE_RANGE)[number];
type Availability = (typeof AVAILABILITY)[number];

type FormState = {
  primary_role: PrimaryRole | "";
  years_experience: YearsExperience | "";

  // UI selects one, backend needs array -> we send [industry]
  industry: IndustryExperience | "";

  professional_summary: string;
  hourly_rate_range: HourlyRateRange | "";
  availability: Availability | "";

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

// ✅ TS-safe label formatting (no replaceAll)
function prettyLabel(v: string) {
  return v
    .split("_")
    .join(" ")
    .replace("aiml", "AI/ML")
    .replace("b2b", "B2B")
    .replace("hr", "HR");
}

function labelYears(x: string) {
  return String(x).split("_").join("-").replace("plus", "+");
}

function labelRate(r: string) {
  return String(r).split("_").join("-").replace("plus", "+");
}

// very light phone check: not strict, just avoids empty/garbage
function phoneLooksOk(phone: string) {
  const cleaned = phone.replace(/\s+/g, "");
  // allows +, digits, spaces; requires at least 7 digits
  const digits = cleaned.replace(/[^\d]/g, "");
  return digits.length >= 7;
}

function isValidUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Sanity-check: make sure selected values are within our enum arrays
function assertInEnum<T extends readonly string[]>(
  allowed: T,
  value: string,
  field: string
): asserts value is T[number] {
  if (!allowed.includes(value)) {
    throw new Error(
      `Invalid ${field}. Got "${value}". Allowed: ${allowed.join(", ")}`
    );
  }
}

export default function ProfessionalApplication() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const linkedin = formData.linkedin.trim();
    const phone = formData.phone.trim();

    const linkedinOk = linkedin.length > 0 && isValidUrl(linkedin);
    const phoneOk = phone.length > 0 && phoneLooksOk(phone);

    return (
      formData.primary_role !== "" &&
      formData.years_experience !== "" &&
      formData.industry !== "" &&
      formData.professional_summary.trim().length >= 20 &&
      formData.hourly_rate_range !== "" &&
      formData.availability !== "" &&
      linkedinOk &&
      phoneOk &&
      formData.agree &&
      !submitting
    );
  }, [formData, submitting]);

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");

      //  Force refresh token (helps after switching accounts)
      const token = await user.getIdToken(true);
      if (!token) throw new Error("Missing auth token. Please sign in again.");

      // Extra sanity checks before sending (prevents confusing 422s)
      const primary_role = String(formData.primary_role).trim();
      const years_experience = String(formData.years_experience).trim();
      const industry = String(formData.industry).trim();
      const hourly_rate_range = String(formData.hourly_rate_range).trim();
      const availability = String(formData.availability).trim();

      assertInEnum(PRIMARY_ROLES, primary_role, "primary_role");
      assertInEnum(YEARS_EXPERIENCE, years_experience, "years_experience");
      assertInEnum(INDUSTRY_EXPERIENCE, industry, "industry_experience");
      assertInEnum(HOURLY_RATE_RANGE, hourly_rate_range, "hourly_rate_range");
      assertInEnum(AVAILABILITY, availability, "availability");

      const linkedin = formData.linkedin.trim();
      if (!isValidUrl(linkedin)) throw new Error("LinkedIn must be a valid URL (https://...)");

      const phone = formData.phone.trim();
      if (!phoneLooksOk(phone)) throw new Error("Phone number looks invalid. Please enter a valid number.");

      const portfolio = formData.portfolio.trim();
      if (portfolio && !isValidUrl(portfolio)) {
        throw new Error("Portfolio must be a valid URL (https://...) or left empty.");
      }

      // EXACT backend keys for /api/professionals/apply (matches your updated professionals_apply.php)
      const payload = {
        primary_role,
        years_experience,
        industry_experience: [industry], // backend requires non-empty array
        hourly_rate_range,
        availability,
        professional_summary: formData.professional_summary.trim(),
        linkedin, // required by backend
        phone, // required by backend
        portfolio: portfolio || null, //  consistent with backend storage
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
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Role *</Label>
                      <Select
                        value={formData.primary_role}
                        onValueChange={(v) => onChange("primary_role", v as FormState["primary_role"])}
                      >
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
                      <Select
                        value={formData.years_experience}
                        onValueChange={(v) => onChange("years_experience", v as FormState["years_experience"])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS_EXPERIENCE.map((x) => (
                            <SelectItem key={x} value={x}>
                              {labelYears(x)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry Experience *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(v) => onChange("industry", v as FormState["industry"])}
                    >
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
                      <Select
                        value={formData.hourly_rate_range}
                        onValueChange={(v) => onChange("hourly_rate_range", v as FormState["hourly_rate_range"])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate range" />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURLY_RATE_RANGE.map((r) => (
                            <SelectItem key={r} value={r}>
                              {labelRate(r)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Availability *</Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(v) => onChange("availability", v as FormState["availability"])}
                      >
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
                      <Input
                        value={formData.linkedin}
                        onChange={(e) => onChange("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                      <p className="text-xs text-muted-foreground">Must be a valid URL (https://...)</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Portfolio (optional)</Label>
                      <Input
                        value={formData.portfolio}
                        onChange={(e) => onChange("portfolio", e.target.value)}
                        placeholder="https://yourportfolio.com"
                      />
                      <p className="text-xs text-muted-foreground">If provided, must be a valid URL (https://...)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      placeholder="+250..."
                    />
                    <p className="text-xs text-muted-foreground">Include country code if possible.</p>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      checked={formData.agree}
                      onCheckedChange={(v) => onChange("agree", Boolean(v))}
                      id="agree"
                    />
                    <Label htmlFor="agree" className="leading-snug">
                      I confirm the information provided is accurate and I agree to be contacted.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={!canSubmit}>
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
