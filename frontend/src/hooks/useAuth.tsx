// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
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
  name?: string | null;
  email?: string | null;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  region: string;
  remember?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;

  role: Role;
  professional_status: string | null;
  payment_status: string | null;
  plan: string | null;

  refreshMe: () => Promise<MeResponse | null>;

  saveBasicProfile: (payload: { name: string; region: string }) => Promise<void>;
  saveRole: (role: "entrepreneur" | "professional") => Promise<void>;

  signUp: (p: SignupPayload) => Promise<void>;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signInWithGoogle: (remember?: boolean) => Promise<MeResponse | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getBearerHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    ...(extra || {}),
    Authorization: `Bearer ${token}`,
  };
}

async function applyPersistence(remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  localStorage.setItem("auth_remember", remember ? "1" : "0");
}

function getSavedRemember(): boolean {
  return localStorage.getItem("auth_remember") === "1";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

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

  /**
   * ✅ Refresh /api/me with a guaranteed Bearer token.
   * - Throws if called too early (no user yet). This prevents "silent null" causing bad redirects.
   * - Uses getIdToken(true) to reduce random 401s after refresh.
   */
  const refreshMe = async (): Promise<MeResponse | null> => {
    const u = auth.currentUser;
    if (!u) {
      // Called before Firebase restored session (common on hard refresh)
      throw new Error("No authenticated user yet");
    }

    const token = await u.getIdToken(true);

    const me = await apiFetch<MeResponse>("/api/me", {
      method: "GET",
      headers: getBearerHeaders(token),
    });

    applyMe(me);
    return me;
  };

  const saveBasicProfile = async (payload: { name: string; region: string }) => {
    const u = auth.currentUser;
    const email = u?.email;

    if (!u) throw new Error("No authenticated user");
    if (!email) throw new Error("Missing email");

    const token = await u.getIdToken(true);

    await apiFetch("/api/users/basic-profile", {
      method: "POST",
      headers: getBearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: payload.name,
        email,
        region: payload.region,
      }),
    });

    await refreshMe();
  };

  const saveRole = async (pickedRole: "entrepreneur" | "professional") => {
    const u = auth.currentUser;
    if (!u) throw new Error("No authenticated user");

    const token = await u.getIdToken(true);

    await apiFetch("/api/users/setup", {
      method: "POST",
      headers: getBearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ role: pickedRole }),
    });

    await refreshMe();
  };

  const signUp = async (p: SignupPayload) => {
    await applyPersistence(p.remember ?? getSavedRemember());

    const cred = await createUserWithEmailAndPassword(auth, p.email, p.password);
    await updateProfile(cred.user, { displayName: p.fullName });

    // Save basic profile only (NO role here)
    await saveBasicProfile({ name: p.fullName, region: p.region });
  };

  const signIn = async (email: string, password: string, remember = getSavedRemember()) => {
    await applyPersistence(remember);
    await signInWithEmailAndPassword(auth, email, password);

    // After sign in, token exists; refreshMe will work.
    await refreshMe();
  };

  const signInWithGoogle = async (remember = getSavedRemember()) => {
    await applyPersistence(remember);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    // New Google users may not have role yet; refreshMe returns role/null depending on backend profile.
    return await refreshMe();
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setRole(null);
    setProfessionalStatus(null);
    setPaymentStatus(null);
    setPlan(null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // Best-effort refresh; don't crash UI if backend is down
        try {
          await refreshMe();
        } catch {
          // keep state as-is
        }
      } else {
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
      saveBasicProfile,
      saveRole,
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
