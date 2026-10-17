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
import { auth, db } from "./firebase";
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
  isFirebaseActive: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

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
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      throw new Error("Username and password are required.");
    }
    if (!auth) {
      throw new Error("Authentication service is unavailable.");
    }

    let targetEmail = cleanId;

    if (!cleanId.includes("@")) {
      if (!db) {
        throw new Error("Database service is unavailable. Please sign in with your email.");
      }
      const uQuery = query(
        collection(db, "app_users"),
        where("username", "==", cleanId)
      );
      const uSnap = await getDocs(uQuery);
      if (uSnap.empty) {
        throw new Error(
          `No account found with username "${cleanId}". Please check your username or click "Create Account".`
        );
      }
      const userData = uSnap.docs[0].data();
      if (!userData?.email) {
        throw new Error("No email linked to this username. Please sign in using your email address.");
      }
      targetEmail = userData.email;
    }

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, targetEmail, password);
    } catch (authErr: any) {
      if (
        authErr.code === "auth/invalid-credential" ||
        authErr.code === "auth/wrong-password" ||
        authErr.code === "auth/user-not-found"
      ) {
        throw new Error("Invalid username/email or password. Please verify your credentials.");
      }
      if (authErr.code === "auth/too-many-requests") {
        throw new Error("Too many unsuccessful login attempts. Please try again later.");
      }
      throw new Error(authErr.message || "Failed to sign in. Please verify your credentials.");
    }

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

    setProfile({
      uid: cred.user.uid,
      username: resolvedUsername,
      email: cred.user.email || targetEmail,
      displayName: cred.user.displayName || resolvedUsername,
      isAuthorized: true,
      isOwner: true,
    });
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
    if (!auth || !db) {
      throw new Error("Authentication or Database service is unavailable.");
    }

    const uQuery = query(
      collection(db, "app_users"),
      where("username", "==", cleanUsername)
    );
    const uSnap = await getDocs(uQuery);
    if (!uSnap.empty) {
      throw new Error("This username is already taken. Please choose another.");
    }

    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (authErr: any) {
      if (authErr.code === "auth/email-already-in-use") {
        throw new Error("This email is already in use. Please sign in or use another email.");
      }
      if (authErr.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters.");
      }
      throw new Error(authErr.message || "Failed to create account.");
    }

    if (cleanName) {
      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch {}
    }

    await setDoc(doc(db, "app_users", cred.user.uid), {
      uid: cred.user.uid,
      username: cleanUsername,
      email: cleanEmail,
      displayName: cleanName,
      createdAt: new Date().toISOString(),
    });

    setUser(cred.user);
    setProfile({
      uid: cred.user.uid,
      username: cleanUsername,
      email: cleanEmail,
      displayName: cleanName,
      isAuthorized: true,
      isOwner: true,
    });
  };

  const signOut = async () => {
    if (auth) {
      await fbSignOut(auth);
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
        isFirebaseActive: Boolean(auth),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
