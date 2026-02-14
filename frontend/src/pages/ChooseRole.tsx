import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ChooseRole() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<"entrepreneur" | "professional" | null>(null);

  const onContinue = () => {
    if (!role) return toast.error("Please choose a role");

    if (user) {
      navigate(`/setup-profile?role=${role}`);
    } else {
      navigate(`/signup?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Join Radah Works</h1>
          <p className="text-muted-foreground mt-2">Choose how you want to use the platform.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {role !== "professional" && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Entrepreneur</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Create projects, generate a team blueprint, and unlock full results with a plan.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  className="w-full"
                  variant={role === "entrepreneur" ? "default" : "outline"}
                  onClick={() => setRole("entrepreneur")}
                >
                  Select Entrepreneur
                </Button>
              </div>
            </div>
          )}

          {role !== "entrepreneur" && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Professional</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Apply to join teams and get matched to projects. No payment required.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  className="w-full"
                  variant={role === "professional" ? "default" : "outline"}
                  onClick={() => setRole("professional")}
                >
                  Select Professional
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {role && (
            <Button variant="outline" className="flex-1" onClick={() => setRole(null)}>
              Change choice
            </Button>
          )}
          <Button className="flex-1" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
