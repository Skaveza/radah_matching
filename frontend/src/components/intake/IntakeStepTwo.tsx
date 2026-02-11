import { cn } from "@/lib/utils";
import { Lightbulb, Rocket, Zap, TrendingUp } from "lucide-react";

interface IntakeStepTwoProps {
  value: string;
  onChange: (value: string) => void;
}

const projectStages = [
  {
    id: "idea",
    label: "Idea",
    description: "Validating concept, no product yet",
    icon: Lightbulb,
    color: "text-blue-500",
  },
  {
    id: "mvp",
    label: "MVP",
    description: "Building first version",
    icon: Rocket,
    color: "text-orange-500",
  },
  {
    id: "launch",
    label: "Launch",
    description: "Going to market soon",
    icon: Zap,
    color: "text-green-500",
  },
  {
    id: "growth",
    label: "Growth",
    description: "Scaling an existing product",
    icon: TrendingUp,
    color: "text-purple-500",
  },
];

const IntakeStepTwo = ({ value, onChange }: IntakeStepTwoProps) => {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        What stage is your project at?
      </h2>
      <p className="text-muted-foreground text-center mb-10">
        Different stages require different team compositions.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {projectStages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => onChange(stage.id)}
            className={cn(
              "p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg",
              value === stage.id
                ? "border-accent bg-accent/5 shadow-md"
                : "border-border hover:border-accent/50 bg-card"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  value === stage.id ? "bg-accent/20" : "bg-muted"
                )}
              >
                <stage.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    value === stage.id ? "text-accent" : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{stage.label}</h3>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntakeStepTwo;
