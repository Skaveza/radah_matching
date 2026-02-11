import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfessionalApplication = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    experience: "",
    industry: "",
    portfolio: "",
    linkedin: "",
    rateRange: "",
    availability: "",
    summary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-application", {
        body: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          experience: formData.experience,
          industry: formData.industry,
          portfolio: formData.portfolio || null,
          linkedin: formData.linkedin || null,
          rate_range: formData.rateRange,
          availability: formData.availability,
          summary: formData.summary,
        },
      });

      if (error) {
        console.error("Submission error:", error);
        toast.error("Failed to submit application. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Application Submitted
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for applying to join Radah Works. Our team will review your 
            application and get back to you within 3-5 business days. Check your email 
            for a confirmation.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="premium" onClick={() => navigate("/professional-login")}>
              Go to Professional Dashboard
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
                <span className="text-accent-foreground font-bold">R</span>
              </div>
              <span className="font-display text-2xl font-semibold text-foreground">
                Radah Works
              </span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Join Our Professional Network
            </h1>
            <p className="text-muted-foreground">
              Connect with founders who need your expertise. Get matched to projects 
              that align with your skills and experience.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Primary Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(v) => updateField("role", v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical-lead">Technical Lead</SelectItem>
                      <SelectItem value="fullstack-developer">Full-Stack Developer</SelectItem>
                      <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                      <SelectItem value="backend-developer">Backend Developer</SelectItem>
                      <SelectItem value="ui-ux-designer">UI/UX Designer</SelectItem>
                      <SelectItem value="product-manager">Product Manager</SelectItem>
                      <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                      <SelectItem value="qa-engineer">QA Engineer</SelectItem>
                      <SelectItem value="marketing-strategist">Marketing Strategist</SelectItem>
                      <SelectItem value="content-writer">Content Writer</SelectItem>
                      <SelectItem value="data-analyst">Data Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select 
                    value={formData.experience} 
                    onValueChange={(v) => updateField("experience", v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-7">5-7 years</SelectItem>
                      <SelectItem value="7-10">7-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry Experience *</Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(v) => updateField("industry", v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="e-commerce">E-commerce</SelectItem>
                    <SelectItem value="edtech">EdTech</SelectItem>
                    <SelectItem value="ai-ml">AI/ML</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="b2b">B2B Software</SelectItem>
                    <SelectItem value="consumer">Consumer Apps</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="media">Media & Entertainment</SelectItem>
                    <SelectItem value="logistics">Logistics & Supply Chain</SelectItem>
                    <SelectItem value="travel">Travel & Hospitality</SelectItem>
                    <SelectItem value="hr-tech">HR Tech</SelectItem>
                    <SelectItem value="legal-tech">Legal Tech</SelectItem>
                    <SelectItem value="insurtech">InsurTech</SelectItem>
                    <SelectItem value="proptech">PropTech</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://..."
                    value={formData.portfolio}
                    onChange={(e) => updateField("portfolio", e.target.value)}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL *</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    required
                    value={formData.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    className="h-12"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate Range (USD) *</Label>
                  <Select 
                    value={formData.rateRange} 
                    onValueChange={(v) => updateField("rateRange", v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select rate range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50-75">$50 - $75/hr</SelectItem>
                      <SelectItem value="75-100">$75 - $100/hr</SelectItem>
                      <SelectItem value="100-150">$100 - $150/hr</SelectItem>
                      <SelectItem value="150-200">$150 - $200/hr</SelectItem>
                      <SelectItem value="200+">$200+/hr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <Select 
                    value={formData.availability} 
                    onValueChange={(v) => updateField("availability", v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time (40+ hrs/week)</SelectItem>
                      <SelectItem value="part-time">Part-time (20-40 hrs/week)</SelectItem>
                      <SelectItem value="limited">Limited (10-20 hrs/week)</SelectItem>
                      <SelectItem value="project-based">Project-based only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary *</Label>
                <Textarea
                  id="summary"
                  placeholder="Tell us about your expertise, notable projects, and what types of work you're most interested in..."
                  required
                  value={formData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="min-h-[150px]"
                  disabled={isSubmitting}
                />
              </div>

              <Button 
                variant="premium" 
                size="lg" 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalApplication;
