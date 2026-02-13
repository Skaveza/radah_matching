import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

type Role = "entrepreneur" | "professional" | "admin" | null;

type MeResponse = {
  success?: boolean;
  uid?: string;
  role: Role;
  professional_status?: string | null;
  payment_status?: string | null;
  plan?: string | null;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  role: "entrepreneur" | "professional";
  region: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;

  // backend profile
  role: Role;
  professional_status: string | null;
  payment_status: string | null;
  plan: string | null;

  // actions
  refreshMe: () => Promise<MeResponse | null>;
  usersSetup: (payload: { name: string; role: "entrepreneur" | "professional"; region: string }) => Promise<void>;
  signUp: (p: SignupPayload) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<MeResponse | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getBearerHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    ...(extra || {}),
    Authorization: `Bearer ${token}`,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  // backend profile fields
  const [role, setRole] = useState<Role>(null);
  const [professional_status, setProfessionalStatus] = useState<string | null>(null);
  const [payment_status, setPaymentStatus] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);

  const applyMe = (me: MeResponse | null) => {
    if (!me) return;
    setRole(me.role ?? null);
    setProfessionalStatus(me.professional_status ?? null);
    setPaymentStatus(me.payment_status ?? null);
    setPlan(me.plan ?? null);
  };

  const refreshMe = async (): Promise<MeResponse | null> => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return null;

    const me = await apiFetch<MeResponse>("/api/me", {
      method: "GET",
      headers: getBearerHeaders(token),
    });

    applyMe(me);
    return me;
  };

  // Create/merge user profile in Firestore via your PHP API
  const usersSetup = async (payload: {
    name: string;
    role: "entrepreneur" | "professional";
    region: string;
  }) => {
    const token = await auth.currentUser?.getIdToken();
    const email = auth.currentUser?.email;

    if (!token) throw new Error("Missing auth token");
    if (!email) throw new Error("Missing email");

    await apiFetch("/api/users/setup", {
      method: "POST",
      headers: getBearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: payload.name,
        email,
        role: payload.role,
        region: payload.region,
      }),
    });

    await refreshMe();
  };

  const signUp = async (p: SignupPayload) => {
    const cred = await createUserWithEmailAndPassword(auth, p.email, p.password);
    await updateProfile(cred.user, { displayName: p.fullName });

    await usersSetup({ name: p.fullName, role: p.role, region: p.region });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    await refreshMe();
  };

  /**
   * Google sign-in does NOT collect role/region.
   * After sign-in:
   *  - call /api/me
   *  - if role is null => you must send user to ChooseRole/Setup screen
   */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    // This may return role=null for a brand new Google user
    return await refreshMe();
  };

  const signOut = async () => {
    await fbSignOut(auth);

    // reset backend profile state
    setRole(null);
    setProfessionalStatus(null);
    setPaymentStatus(null);
    setPlan(null);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // load backend role/payment status
        await refreshMe();
      } else {
        // logged out
        setRole(null);
        setProfessionalStatus(null);
        setPaymentStatus(null);
        setPlan(null);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      role,
      professional_status,
      payment_status,
      plan,
      refreshMe,
      usersSetup,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, role, professional_status, payment_status, plan]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
