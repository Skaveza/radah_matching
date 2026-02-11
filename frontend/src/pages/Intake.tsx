import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import IntakeProgress from "@/components/intake/IntakeProgress";
import IntakeStepOne from "@/components/intake/IntakeStepOne";
import IntakeStepTwo from "@/components/intake/IntakeStepTwo";
import IntakeStepThree from "@/components/intake/IntakeStepThree";
import IntakeStepFour from "@/components/intake/IntakeStepFour";

interface IntakeData {
  businessType: string;
  projectStage: string;
  industry: string;
  timeline: string;
  budget: string;
  description: string;
}

const Intake = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
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
        return data.description.length >= 50;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Store data and navigate to team generation
      localStorage.setItem("intakeData", JSON.stringify(data));

      // Persist to database (best-effort, non-blocking)
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const { data: userData } = await supabase.auth.getUser();
      supabase.from("intake_submissions").insert({
        session_id: sessionId,
        user_id: userData?.user?.id || null,
        business_type: data.businessType,
        project_stage: data.projectStage,
        industry: data.industry,
        timeline: data.timeline,
        budget: data.budget,
        description: data.description,
      }).then(() => {});

      navigate("/team-builder");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateField = (field: keyof IntakeData, value: string) => {
    setData({ ...data, [field]: value });
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
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                variant={currentStep === 3 ? "premium" : "default"}
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                {currentStep === 3 ? (
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
