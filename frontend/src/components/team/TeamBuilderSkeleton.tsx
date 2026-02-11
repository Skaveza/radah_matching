import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Search, Users, Target } from "lucide-react";

const steps = [
  { icon: Brain, label: "Analyzing your project requirements..." },
  { icon: Search, label: "Identifying skill gaps..." },
  { icon: Users, label: "Designing optimal team structure..." },
  { icon: Target, label: "Matching experience levels..." },
];

const TeamBuilderSkeleton = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps */}
      <div className="flex flex-col items-center mb-12">
        <div className="space-y-4 w-full max-w-md">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isDone = index < activeStep;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                  isActive
                    ? "bg-accent/10 border border-accent/20"
                    : isDone
                    ? "opacity-50"
                    : "opacity-20"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? "bg-accent/20" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-accent animate-pulse" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-5"
              style={{ opacity: Math.max(0.15, 1 - i * 0.2) }}
            >
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default TeamBuilderSkeleton;
