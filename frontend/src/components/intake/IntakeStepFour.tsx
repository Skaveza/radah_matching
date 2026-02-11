import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface IntakeStepFourProps {
  value: string;
  onChange: (value: string) => void;
}

const IntakeStepFour = ({ value, onChange }: IntakeStepFourProps) => {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        Describe your project
      </h2>
      <p className="text-muted-foreground text-center mb-10">
        The more detail you provide, the better our AI can architect your ideal team.
      </p>

      <div className="max-w-xl mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">
            Project Description
          </Label>
          <Textarea
            id="description"
            placeholder="Tell us about your project goals, target audience, key features you want to build, challenges you're facing, and any specific expertise you're looking for..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[200px] resize-none"
          />
        </div>
        
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Include information about 
            your target market, any technical requirements, timeline constraints, and 
            what success looks like for this project.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntakeStepFour;
