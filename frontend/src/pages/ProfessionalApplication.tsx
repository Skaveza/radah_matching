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

type FormState = {
  name: string;
  email: string;
  role: string;
  experience: string;
  industry: string;
  summary: string;
  rate_range: string;
  availability: string;
  linkedin: string;
  portfolio: string;
  phone: string;
  agree: boolean;
};

const defaultState: FormState = {
  name: "",
  email: "",
  role: "",
  experience: "",
  industry: "",
  summary: "",
  rate_range: "",
  availability: "",
  linkedin: "",
  portfolio: "",
  phone: "",
  agree: false,
};

export default function ProfessionalApplication() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    return (
      formData.name.trim().length >= 2 &&
      emailOk &&
      formData.role.trim().length >= 2 &&
      formData.experience.trim().length >= 1 &&
      formData.industry.trim().length >= 2 &&
      formData.summary.trim().length >= 20 &&
      formData.rate_range.trim().length >= 1 &&
      formData.availability.trim().length >= 1 &&
      formData.agree &&
      !submitting
    );
  }, [formData, submitting]);

  const onChange = (key: keyof FormState, value: any) => {
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

      // ✅ requested: replace supabase.functions.invoke with Firebase token + apiFetch
      const token = await auth.currentUser?.getIdToken();

      // send exact JSON payload
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        experience: formData.experience.trim(),
        industry: formData.industry.trim(),
        summary: formData.summary.trim(),
        rate_range: formData.rate_range.trim(),
        availability: formData.availability.trim(),
        linkedin: formData.linkedin.trim() || null,
        portfolio: formData.portfolio.trim() || null,
        phone: formData.phone.trim() || null,
      };

      await apiFetch("/api/professionals/apply", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
                <CardDescription>
                  Apply to join our professional network. Fill in all required fields.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Role *</Label>
                      <Input
                        value={formData.role}
                        onChange={(e) => onChange("role", e.target.value)}
                        placeholder="e.g. UI/UX Designer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Experience *</Label>
                      <Input
                        value={formData.experience}
                        onChange={(e) => onChange("experience", e.target.value)}
                        placeholder="e.g. 3 years"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <Input
                      value={formData.industry}
                      onChange={(e) => onChange("industry", e.target.value)}
                      placeholder="e.g. FinTech, Health, E-commerce"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Professional Summary *</Label>
                    <Textarea
                      value={formData.summary}
                      onChange={(e) => onChange("summary", e.target.value)}
                      placeholder="Describe your expertise, achievements, and what you can offer (min 20 chars)"
                      rows={5}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rate Range *</Label>
                      <Select
                        value={formData.rate_range}
                        onValueChange={(v) => onChange("rate_range", v)}
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

                    <div className="space-y-2">
                      <Label>Availability *</Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(v) => onChange("availability", v)}
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>LinkedIn (optional)</Label>
                      <Input
                        value={formData.linkedin}
                        onChange={(e) => onChange("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Portfolio (optional)</Label>
                      <Input
                        value={formData.portfolio}
                        onChange={(e) => onChange("portfolio", e.target.value)}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone (optional)</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      placeholder="+250..."
                    />
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
