// src/pages/ChooseRole.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type RoleOption = "entrepreneur" | "professional";

export default function ChooseRole() {
  const navigate          = useNavigate();
  const { user, saveRole } = useAuth();
  const [role, setRole]   = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (!role)  return toast.error("Please choose a role to continue");
    if (!user)  return navigate("/signup", { replace: true });

    try {
      setLoading(true);
      await saveRole(role);
      // Use capital D for entrepreneur to match the new /Dashboard route
      navigate(
        role === "entrepreneur" ? "/Dashboard" : "/professional-dashboard",
        { replace: true }
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to save role — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold text-xl">
            R
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Join Radah Works</h1>
          <p className="text-muted-foreground mt-2">
            Choose how you want to use the platform.
          </p>
        </div>

        {/* Role cards — both always visible, selected one highlights */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Entrepreneur */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setRole("entrepreneur")}
            className={`text-left rounded-2xl border p-6 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              role === "entrepreneur"
                ? "border-amber-400 bg-amber-50 shadow-amber-100"
                : "border-border bg-card hover:border-amber-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
                🚀
              </div>
              {role === "entrepreneur" && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Entrepreneur</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Create projects, build your team blueprint, and track your startup's
              execution from idea to investor-ready.
            </p>
          </button>

          {/* Professional */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setRole("professional")}
            className={`text-left rounded-2xl border p-6 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              role === "professional"
                ? "border-amber-400 bg-amber-50 shadow-amber-100"
                : "border-border bg-card hover:border-amber-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                💼
              </div>
              {role === "professional" && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Professional</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Apply to join startup teams, get matched to projects that fit your
              skills, and grow your career. No payment required.
            </p>
          </button>
        </div>

        {/* Continue button */}
        <div className="mt-6">
          <Button
            className="w-full py-6 text-base"
            onClick={onContinue}
            disabled={!role || loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              : role
                ? `Continue as ${role === "entrepreneur" ? "Entrepreneur" : "Professional"} →`
                : "Select a role to continue"
            }
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          You can update your role later from your profile settings.
        </p>
      </div>
    </div>
  );
}
