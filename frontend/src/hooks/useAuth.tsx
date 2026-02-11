import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  getIdToken,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: "entrepreneur" | "professional";
  region: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignupData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  const signUp = async ({
    fullName,
    email,
    password,
    role,
    region,
  }: SignupData) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      uid,
      full_name: fullName,
      email,
      role,
      region,
      plan: "starter",
      projects_created: 0,
      max_projects: 1,
      payment_status: "inactive",
      created_at: serverTimestamp(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const uid = result.user.uid;
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        uid,
        full_name: result.user.displayName || "",
        email: result.user.email,
        role: "professional",
        region: "Kenya",
        plan: "starter",
        projects_created: 0,
        max_projects: 1,
        payment_status: "inactive",
        created_at: serverTimestamp(),
      });
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser, true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        resetPassword,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};