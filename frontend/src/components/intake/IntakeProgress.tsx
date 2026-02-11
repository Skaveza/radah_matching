import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface IntakeProgressProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { label: "Business Type" },
  { label: "Project Stage" },
  { label: "Details" },
  { label: "Description" },
];

const IntakeProgress = ({ currentStep, totalSteps }: IntakeProgressProps) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  index < currentStep
                    ? "bg-accent text-accent-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 transition-colors",
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 md:w-24 h-px mx-2 transition-colors",
                  index < currentStep ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntakeProgress;
