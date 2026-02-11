import { Sparkles, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: "warning" | "success" | "info";
  message: string;
}

interface AISuggestionsProps {
  suggestions: Suggestion[];
}

const AISuggestions = ({ suggestions }: AISuggestionsProps) => {
  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "warning":
        return AlertTriangle;
      case "success":
        return CheckCircle2;
      case "info":
        return Lightbulb;
    }
  };

  const getStyles = (type: Suggestion["type"]) => {
    switch (type) {
      case "warning":
        return "bg-warning/10 border-warning/30 text-warning";
      case "success":
        return "bg-success/10 border-success/30 text-success";
      case "info":
        return "bg-accent/10 border-accent/30 text-accent";
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">AI Recommendations</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Final decision is yours.
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const Icon = getIcon(suggestion.type);
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                getStyles(suggestion.type)
              )}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{suggestion.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AISuggestions;
