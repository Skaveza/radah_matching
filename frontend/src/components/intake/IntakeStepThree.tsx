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
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-foreground">
            Industry
          </Label>
          <Select value={data.industry} onValueChange={(v) => onChange("industry", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fintech">Fintech</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="ecommerce">E-Commerce</SelectItem>
              <SelectItem value="real-estate">Real Estate</SelectItem>
              <SelectItem value="saas">SaaS / Software</SelectItem>
              <SelectItem value="media">Media & Entertainment</SelectItem>
              <SelectItem value="travel">Travel & Hospitality</SelectItem>
              <SelectItem value="food">Food & Beverage</SelectItem>
              <SelectItem value="logistics">Logistics & Supply Chain</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="hr">HR & Recruiting</SelectItem>
              <SelectItem value="marketing">Marketing & Advertising</SelectItem>
              <SelectItem value="nonprofit">Nonprofit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeline" className="text-foreground">
            Target Timeline
          </Label>
          <Select value={data.timeline} onValueChange={(v) => onChange("timeline", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="When do you need this team?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">As soon as possible</SelectItem>
              <SelectItem value="1-2-weeks">Within 1-2 weeks</SelectItem>
              <SelectItem value="1-month">Within a month</SelectItem>
              <SelectItem value="exploring">Just exploring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="text-foreground">
            Monthly Budget Range
          </Label>
          <Select value={data.budget} onValueChange={(v) => onChange("budget", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your budget range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-5k">Under $5,000/month</SelectItem>
              <SelectItem value="5k-10k">$5,000 - $10,000/month</SelectItem>
              <SelectItem value="10k-25k">$10,000 - $25,000/month</SelectItem>
              <SelectItem value="25k-50k">$25,000 - $50,000/month</SelectItem>
              <SelectItem value="50k+">$50,000+/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default IntakeStepThree;
