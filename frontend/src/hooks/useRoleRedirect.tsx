import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type UserRole = "admin" | "professional" | "client";

interface UseRoleRedirectResult {
  isChecking: boolean;
  userRole: UserRole | null;
}

export const useRoleRedirect = (): UseRoleRedirectResult => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsChecking(false);
        setUserRole(null);
        return;
      }

      try {
        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (isAdmin) {
          setUserRole("admin");
          setIsChecking(false);
          navigate("/admin");
          return;
        }

        // Check if user is a professional (has a record in professionals table)
        const { data: professional } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (professional) {
          setUserRole("professional");
          setIsChecking(false);
          navigate("/professional-dashboard");
          return;
        }

        // Check if professional by email (for professionals who haven't linked yet)
        const { data: professionalByEmail } = await supabase
          .from("professionals")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (professionalByEmail) {
          // Link the professional record to the user
          await supabase
            .from("professionals")
            .update({ user_id: user.id })
            .eq("id", professionalByEmail.id);
          
          setUserRole("professional");
          setIsChecking(false);
          navigate("/professional-dashboard");
          return;
        }

        // Default to client
        setUserRole("client");
        setIsChecking(false);
        navigate("/dashboard");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("client");
        setIsChecking(false);
        navigate("/dashboard");
      }
    };

    checkRoleAndRedirect();
  }, [user, authLoading, navigate]);

  return { isChecking, userRole };
};

// Utility function to check role without redirect
export const getUserRole = async (userId: string, userEmail: string): Promise<UserRole> => {
  try {
    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (isAdmin) return "admin";

    // Check if user is a professional
    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .maybeSingle();

    if (professional) return "professional";

    return "client";
  } catch {
    return "client";
  }
};