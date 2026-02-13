import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IntakeStepThreeProps {
  data: {
    industry: string;
    timeline: string;
    budget: string;
  };
  onChange: (field: string, value: string) => void;
}

const IntakeStepThree = ({ data, onChange }: IntakeStepThreeProps) => {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        Tell us more about your project
      </h2>
      <p className="text-muted-foreground text-center mb-10">
        These details help us match you with the right professionals.
      </p>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-foreground">
            Industry
          </Label>
          <Select value={data.industry} onValueChange={(v) => onChange("industry", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>

            {/* IMPORTANT: these values must match Enums::$INDUSTRIES */}
            <SelectContent>
              <SelectItem value="fintech">Fintech</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="ecommerce">E-Commerce</SelectItem>

              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="software">SaaS / Software</SelectItem>

              <SelectItem value="media_entertainment">Media & Entertainment</SelectItem>
              <SelectItem value="travel_hospitality">Travel & Hospitality</SelectItem>
              <SelectItem value="food_beverage">Food & Beverage</SelectItem>
              <SelectItem value="logistics_supply_chain">Logistics & Supply Chain</SelectItem>

              <SelectItem value="hr_recruitment">HR & Recruiting</SelectItem>
              <SelectItem value="marketing_advertising">Marketing & Advertising</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>

              {/* nonprofit is not in your backend list, so map it to "other" or add it to backend enums */}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label htmlFor="timeline" className="text-foreground">
            Target Timeline
          </Label>
          <Select value={data.timeline} onValueChange={(v) => onChange("timeline", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="When do you need this team?" />
            </SelectTrigger>

            {/* IMPORTANT: these values must match Enums::$TIMELINES */}
            <SelectContent>
              <SelectItem value="asap">As soon as possible</SelectItem>
              <SelectItem value="1_2_weeks">Within 1-2 weeks</SelectItem>
              <SelectItem value="within_a_month">Within a month</SelectItem>
              <SelectItem value="just_exploring">Just exploring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-foreground">
            Monthly Budget Range
          </Label>
          <Select value={data.budget} onValueChange={(v) => onChange("budget", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your budget range" />
            </SelectTrigger>

            {/* IMPORTANT: these values must match Enums::$BUDGET_RANGES */}
            <SelectContent>
              <SelectItem value="under_5000">Under $5,000/month</SelectItem>
              <SelectItem value="5000_10000">$5,000 - $10,000/month</SelectItem>
              <SelectItem value="10000_25000">$10,000 - $25,000/month</SelectItem>
              <SelectItem value="25000_50000">$25,000 - $50,000/month</SelectItem>
              <SelectItem value="50000_plus">$50,000+/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default IntakeStepThree;
