import { cn } from "@/lib/utils";
import { Building2, ShoppingCart, Users, Sparkles } from "lucide-react";

interface IntakeStepOneProps {
  value: string;
  onChange: (value: string) => void;
}

const businessTypes = [
  {
    id: "saas",
    label: "SaaS",
    description: "Software as a Service product",
    icon: Building2,
  },
  {
    id: "ecommerce",
    label: "eCommerce",
    description: "Online store or marketplace",
    icon: ShoppingCart,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Platform connecting buyers & sellers",
    icon: Users,
  },
  {
    id: "other",
    label: "Other",
    description: "Different type of business",
    icon: Sparkles,
  },
];

const IntakeStepOne = ({ value, onChange }: IntakeStepOneProps) => {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        What type of business are you building?
      </h2>
      <p className="text-muted-foreground text-center mb-10">
        This helps us recommend the right team structure for your industry.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {businessTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={cn(
              "p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg",
              value === type.id
                ? "border-accent bg-accent/5 shadow-md"
                : "border-border hover:border-accent/50 bg-card"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  value === type.id ? "bg-accent/20" : "bg-muted"
                )}
              >
                <type.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    value === type.id ? "text-accent" : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntakeStepOne;
