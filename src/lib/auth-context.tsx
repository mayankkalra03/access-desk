"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isFirebaseActive: false,
});

const SESSION_STORAGE_KEY = "accessdesk_session_v2";
const REGISTRY_STORAGE_KEY = "accessdesk_auth_registry_v2";

interface StoredUserAccount {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  isAuthorized: boolean;
}

async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          let resolvedUsername = firebaseUser.email?.split("@")[0] || "user";
          try {
            if (db) {
              const uDoc = await getDoc(doc(db, "app_users", firebaseUser.uid));
              if (uDoc.exists() && uDoc.data().username) {
                resolvedUsername = uDoc.data().username;
              }
            }
          } catch {}

          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "user@internal.accessdesk.io",
            username: resolvedUsername,
            displayName: firebaseUser.displayName || resolvedUsername || "Authorized User",
            isAuthorized: true,
            isOwner: true,
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local session check
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
          } catch {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const getLocalRegistry = (): StoredUserAccount[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalRegistry = (registry: StoredUserAccount[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  };

  const signIn = async (identifier: string, password: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      throw new Error("Username and password are required.");
    }

    if (isFirebaseConfigured && auth) {
      let targetEmail = cleanId;

      // If user provided a username without @, resolve email from Firestore
      if (!cleanId.includes("@") && db) {
        try {
          const uQuery = query(
            collection(db, "app_users"),
            where("username", "==", cleanId)
          );
          const uSnap = await getDocs(uQuery);
          if (uSnap.empty) {
            throw new Error(
              "No account found with this username. Please verify your spelling or create an account."
            );
          }
          targetEmail = uSnap.docs[0].data().email;
        } catch (err: any) {
          if (err.message && err.message.includes("No account found")) {
            throw err;
          }
        }
      }

      const cred = await signInWithEmailAndPassword(auth, targetEmail, password);
      setUser(cred.user);

      let resolvedUsername = cleanId.includes("@")
        ? cred.user.email?.split("@")[0] || "user"
        : cleanId;

      try {
        if (db) {
          const uDoc = await getDoc(doc(db, "app_users", cred.user.uid));
          if (uDoc.exists() && uDoc.data().username) {
            resolvedUsername = uDoc.data().username;
          }
        }
      } catch {}

      const userProf: UserProfile = {
        uid: cred.user.uid,
        username: resolvedUsername,
        email: cred.user.email || targetEmail,
        displayName: cred.user.displayName || resolvedUsername,
        isAuthorized: true,
        isOwner: true,
      };
      setProfile(userProf);
      return;
    }

    // Local authentication registry
    const registry = getLocalRegistry();
    const existing = registry.find(
      (u) => u.username === cleanId || u.email === cleanId
    );
    if (!existing) {
      throw new Error(
        "No account found with this username or email. Please verify or create an account."
      );
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== existing.passwordHash) {
      throw new Error("Incorrect password. Please verify your credentials.");
    }

    const userProf: UserProfile = {
      uid: existing.uid,
      username: existing.username,
      email: existing.email,
      displayName: existing.displayName,
      isAuthorized: existing.isAuthorized,
      isOwner: true,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProf));
    }
    setProfile(userProf);
  };

  const signUp = async (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ) => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (displayName || "").trim() || cleanUsername;

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error("Username must be at least 3 characters long.");
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      throw new Error(
        "Username can only contain letters, numbers, dots, and underscores."
      );
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("A valid email address is required.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (isFirebaseConfigured && auth && db) {
      // Check if username already exists in Firestore
      try {
        const uQuery = query(
          collection(db, "app_users"),
          where("username", "==", cleanUsername)
        );
        const uSnap = await getDocs(uQuery);
        if (!uSnap.empty) {
          throw new Error("This username is already taken. Please choose another.");
        }
      } catch (err: any) {
        if (err.message && err.message.includes("already taken")) throw err;
      }

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }

      // Save user profile mapping in Firestore
      try {
        await setDoc(doc(db, "app_users", cred.user.uid), {
          uid: cred.user.uid,
          username: cleanUsername,
          email: cleanEmail,
          displayName: cleanName,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Could not save app_users record:", e);
      }

      setUser(cred.user);
      const userProf: UserProfile = {
        uid: cred.user.uid,
        username: cleanUsername,
        email: cleanEmail,
        displayName: cleanName,
        isAuthorized: true,
        isOwner: true,
      };
      setProfile(userProf);
      return;
    }

    // Local authentication registry
    const registry = getLocalRegistry();
    if (registry.some((u) => u.username === cleanUsername)) {
      throw new Error("This username is already taken. Please choose another.");
    }
    if (registry.some((u) => u.email === cleanEmail)) {
      throw new Error("An account with this email already exists. Please Sign In.");
    }

    const passwordHash = await hashPassword(password);
    const newUser: StoredUserAccount = {
      uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      username: cleanUsername,
      email: cleanEmail,
      displayName: cleanName,
      passwordHash,
      createdAt: new Date().toISOString(),
      isAuthorized: true,
    };

    registry.push(newUser);
    saveLocalRegistry(registry);

    const userProf: UserProfile = {
      uid: newUser.uid,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      isAuthorized: true,
      isOwner: true,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProf));
    }
    setProfile(userProf);
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isFirebaseActive: isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
