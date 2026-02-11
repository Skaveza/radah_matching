import { cn } from "@/lib/utils";
import { X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Role {
  id: string;
  title: string;
  responsibility: string;
  whyCritical: string;
  experience: string;
  industry: string;
  skillFocus?: string;
}

interface RoleCardProps {
  role: Role;
  onRemove?: () => void;
  isRemovable?: boolean;
  isAnonymized?: boolean;
}

const RoleCard = ({ role, onRemove, isRemovable = true, isAnonymized = false }: RoleCardProps) => {
  const skills = role.skillFocus?.split(",").map((s) => s.trim()).filter(Boolean) || [];

  return (
    <div className="group relative bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all duration-200 hover:border-accent/30">
      {isRemovable && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">{role.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{role.responsibility}</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Why critical:</span>
              <span className="text-xs text-foreground">{role.whyCritical}</span>
            </div>

            {!isAnonymized ? (
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                  {role.experience}
                </span>
                <span className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                  {role.industry}
                </span>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-xs rounded-md bg-accent/10 text-accent-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Full contact details unlocked after purchase
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
