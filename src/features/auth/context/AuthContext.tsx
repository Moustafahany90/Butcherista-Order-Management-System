import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import type { Role } from "../../../types";

export interface AuthUser {
  uid: string;
  email: string;
  companyId: string;
  employeeId: string;
  name: string;
  role: Role;
  active: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (employeeId: string, password: string, companyDomain: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function buildSyntheticEmail(employeeId: string, companyDomain: string): string {
  return `${employeeId}@${companyDomain}.system`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email ?? "",
              companyId: data.companyId,
              employeeId: data.employeeId,
              name: data.name,
              role: data.role as Role,
              active: data.active,
            });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (employeeId: string, password: string, companyDomain: string) => {
    await setPersistence(auth, browserSessionPersistence);
    const email = buildSyntheticEmail(employeeId, companyDomain);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (!userDoc.exists()) throw new Error("User profile not found");
      const data = userDoc.data();
      if (!data.active) throw new Error("Account is deactivated. Contact your admin.");
      setUser({
        uid: cred.user.uid,
        email: cred.user.email ?? "",
        companyId: data.companyId,
        employeeId: data.employeeId,
        name: data.name,
        role: data.role as Role,
        active: data.active,
      });
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === "auth/user-not-found") {
        throw new Error("Employee ID not found");
      }
      if (firebaseErr.code === "auth/wrong-password") {
        throw new Error("Incorrect password");
      }
      if (firebaseErr.code === "auth/invalid-credential") {
        throw new Error("Wrong employee ID or password");
      }
      if (firebaseErr.code === "auth/too-many-requests") {
        throw new Error("Too many attempts. Try again later.");
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
