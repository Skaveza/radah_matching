import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import IntakeProgress from "@/components/intake/IntakeProgress";
import IntakeStepOne from "@/components/intake/IntakeStepOne";
import IntakeStepTwo from "@/components/intake/IntakeStepTwo";
import IntakeStepThree from "@/components/intake/IntakeStepThree";
import IntakeStepFour from "@/components/intake/IntakeStepFour";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

interface IntakeData {
  businessType: string;
  projectStage: string;
  industry: string;
  timeline: string;
  budget: string;
  description: string;
}

type CreateProjectResponse = {
  success?: boolean;
  project_id?: string;
  id?: string;
  project?: any;
  error?: string;
};

const Intake = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<IntakeData>({
    businessType: "",
    projectStage: "",
    industry: "",
    timeline: "",
    budget: "",
    description: "",
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.businessType !== "";
      case 1:
        return data.projectStage !== "";
      case 2:
        return data.industry !== "" && data.timeline !== "" && data.budget !== "";
      case 3:
        return data.description.trim().length >= 50;
      default:
        return false;
    }
  };

  const updateField = (field: keyof IntakeData, value: string) => {
    setData({ ...data, [field]: value });
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Final submit
    if (submitting) return;
    if (!canProceed()) return;

    try {
      setSubmitting(true);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Missing auth token. Please log in again.");

      // Map intake fields to backend schema
      const payload = {
        business_type: data.businessType,
        project_stage: data.projectStage,
        industry: data.industry,
        timeline: data.timeline,
        budget_range: data.budget,
        description: data.description,
      };

      const res = await apiFetch<CreateProjectResponse>("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const projectId = res.project_id || res.id || res.project?.project_id || res.project?.id;

      if (!projectId) {
        throw new Error("Project created, but no project id was returned by the API.");
      }

      // Keep for Team Builder + fallback UI
      localStorage.setItem("activeProjectId", projectId);
      localStorage.setItem("intakeData", JSON.stringify(data));

      toast.success("Project created. Generating your team...");
      navigate(`/team-builder?projectId=${encodeURIComponent(projectId)}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <IntakeProgress currentStep={currentStep} totalSteps={4} />

          <div className="max-w-3xl mx-auto">
            {currentStep === 0 && (
              <IntakeStepOne
                value={data.businessType}
                onChange={(v) => updateField("businessType", v)}
              />
            )}

            {currentStep === 1 && (
              <IntakeStepTwo
                value={data.projectStage}
                onChange={(v) => updateField("projectStage", v)}
              />
            )}

            {currentStep === 2 && (
              <IntakeStepThree
                data={{
                  industry: data.industry,
                  timeline: data.timeline,
                  budget: data.budget,
                }}
                onChange={(field, value) => updateField(field as keyof IntakeData, value)}
              />
            )}

            {currentStep === 3 && (
              <IntakeStepFour
                value={data.description}
                onChange={(v) => updateField("description", v)}
              />
            )}

            <div className="flex items-center justify-between mt-12 max-w-xl mx-auto">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || submitting}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                variant={currentStep === 3 ? "premium" : "default"}
                size="lg"
                onClick={handleNext}
                disabled={!canProceed() || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate My Team
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Intake;
