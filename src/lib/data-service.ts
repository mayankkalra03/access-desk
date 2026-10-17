import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, isFirebaseConfigured } from "./firebase";
import { Account, AccountInput, Environment, Tag } from "@/types";
import { INITIAL_ENVIRONMENTS, INITIAL_TAGS } from "./seed-data";
import { encryptLocalPassword, decryptLocalPassword } from "./crypto-local";

const STORAGE_KEYS = {
  ENVIRONMENTS: "accessdesk_v3_environments",
  ACCOUNTS: "accessdesk_v3_accounts",
  TAGS: "accessdesk_v3_tags",
  CREDENTIALS: "accessdesk_v3_encrypted_credentials",
};

// No default mock accounts - real application starts clean with 0 accounts until user creates them
const INITIAL_ACCOUNTS: Account[] = [];

class DataService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      // Clean up legacy v1 and v2 storage if present
      try {
        window.localStorage.removeItem("accessdesk_environments_v1");
        window.localStorage.removeItem("accessdesk_accounts_v1");
        window.localStorage.removeItem("accessdesk_tags_v1");
        window.localStorage.removeItem("accessdesk_encrypted_credentials_v1");
        window.localStorage.removeItem("accessdesk_v2_environments");
        window.localStorage.removeItem("accessdesk_v2_accounts");
        window.localStorage.removeItem("accessdesk_v2_tags");
        window.localStorage.removeItem("accessdesk_v2_encrypted_credentials");
      } catch {}

      // Initialize clean 15 environments
      const storedEnvs = window.localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      if (!storedEnvs) {
        window.localStorage.setItem(
          STORAGE_KEYS.ENVIRONMENTS,
          JSON.stringify(INITIAL_ENVIRONMENTS)
        );
      }

      // Initialize clean suggested tags
      const storedTags = window.localStorage.getItem(STORAGE_KEYS.TAGS);
      if (!storedTags) {
        window.localStorage.setItem(
          STORAGE_KEYS.TAGS,
          JSON.stringify(INITIAL_TAGS)
        );
      }

      // Accounts start empty
      const storedAccounts = window.localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!storedAccounts) {
        window.localStorage.setItem(
          STORAGE_KEYS.ACCOUNTS,
          JSON.stringify(INITIAL_ACCOUNTS)
        );
      }
    }

    this.isInitialized = true;
  }

  // Environments
  async getEnvironments(): Promise<Environment[]> {
    await this.initialize();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, "environments"));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Environment);
        }
      } catch (e) {
        console.warn("Firestore fetch environments failed:", e);
      }
    }

    if (typeof window !== "undefined") {
      const data = window.localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      return data ? JSON.parse(data) : INITIAL_ENVIRONMENTS;
    }
    return INITIAL_ENVIRONMENTS;
  }

  async updateEnvironment(env: Environment): Promise<void> {
    env.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "environments", env.id), env, { merge: true });
        return;
      } catch (e) {
        console.warn("Firestore updateEnvironment error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const envs = await this.getEnvironments();
      const idx = envs.findIndex((e) => e.id === env.id);
      if (idx >= 0) {
        envs[idx] = env;
      } else {
        envs.push(env);
      }
      window.localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(envs));
    }
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    await this.initialize();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, "accounts"));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Account);
        }
      } catch (e) {
        console.warn("Firestore fetch accounts failed:", e);
      }
    }

    if (typeof window !== "undefined") {
      const data = window.localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    }
    return [];
  }

  async saveAccount(
    account: AccountInput,
    password?: string
  ): Promise<Account> {
    await this.initialize();
    const now = new Date().toISOString();
    const finalAccount: Account = {
      ...account,
      id: account.id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: account.createdAt || now,
      updatedAt: now,
    };

    // 1. Save metadata (WITHOUT PASSWORD)
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "accounts", finalAccount.id), finalAccount);
      } catch (e) {
        console.warn("Firestore saveAccount metadata error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const accounts = await this.getAccounts();
      const idx = accounts.findIndex((a) => a.id === finalAccount.id);
      if (idx >= 0) {
        accounts[idx] = finalAccount;
      } else {
        accounts.unshift(finalAccount);
      }
      window.localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }

    // 2. Save encrypted credentials
    if (password && password.trim()) {
      if (isFirebaseConfigured && functions) {
        try {
          const saveCredFn = httpsCallable<{ accountId: string; password: string }, { success: boolean }>(
            functions,
            "saveAccountCredential"
          );
          await saveCredFn({ accountId: finalAccount.id, password: password.trim() });
        } catch (e) {
          console.warn("Cloud function saveAccountCredential error:", e);
        }
      }

      // Local encrypted fallback
      const encrypted = await encryptLocalPassword(password.trim());
      this.storeLocalCredential(finalAccount.id, encrypted);
    }

    return finalAccount;
  }

  async deleteAccount(accountId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "accounts", accountId));
      } catch (e) {
        console.warn("Firestore deleteAccount error:", e);
      }
    }

    if (isFirebaseConfigured && functions) {
      try {
        const deleteCredFn = httpsCallable<{ accountId: string }, { success: boolean }>(
          functions,
          "deleteAccountCredential"
        );
        await deleteCredFn({ accountId });
      } catch (e) {
        console.warn("Cloud function deleteAccountCredential error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const accounts = await this.getAccounts();
      const filtered = accounts.filter((a) => a.id !== accountId);
      window.localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filtered));

      // Remove encrypted credentials
      this.removeLocalCredential(accountId);
    }
  }

  async revealAccountPassword(accountId: string): Promise<string> {
    if (isFirebaseConfigured && functions) {
      try {
        const getCredFn = httpsCallable<{ accountId: string }, { password: string }>(
          functions,
          "getAccountCredential"
        );
        const res = await getCredFn({ accountId });
        if (res.data?.password) {
          return res.data.password;
        }
      } catch (e: any) {
        console.warn("Cloud Function getAccountCredential error:", e?.message);
      }
    }

    // Local WebCrypto decryption
    const localCred = this.getLocalCredential(accountId);
    if (!localCred) {
      throw new Error("No encrypted credentials found for this account.");
    }
    return decryptLocalPassword(localCred.ciphertext, localCred.iv);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    await this.initialize();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, "tags"));
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Tag);
        }
      } catch (e) {
        console.warn("Firestore fetch tags error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const data = window.localStorage.getItem(STORAGE_KEYS.TAGS);
      return data ? JSON.parse(data) : INITIAL_TAGS;
    }
    return INITIAL_TAGS;
  }

  async saveTag(tag: Tag): Promise<Tag> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "tags", tag.id), tag, { merge: true });
      } catch (e) {
        console.warn("Firestore saveTag error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const tags = await this.getTags();
      const idx = tags.findIndex((t) => t.id === tag.id);
      if (idx >= 0) {
        tags[idx] = tag;
      } else {
        tags.push(tag);
      }
      window.localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    }

    return tag;
  }

  async deleteTag(tagId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "tags", tagId));
      } catch (e) {
        console.warn("Firestore deleteTag error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const tags = await this.getTags();
      const filtered = tags.filter((t) => t.id !== tagId);
      window.localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(filtered));
    }
  }

  private getLocalCredential(accountId: string): { ciphertext: string; iv: string } | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      const creds = raw ? JSON.parse(raw) : {};
      return creds[accountId] || null;
    } catch {
      return null;
    }
  }

  private storeLocalCredential(
    accountId: string,
    cred: { ciphertext: string; iv: string }
  ) {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      const creds = raw ? JSON.parse(raw) : {};
      creds[accountId] = cred;
      window.localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
    } catch (e) {
      console.warn("Failed to store local credential:", e);
    }
  }

  private removeLocalCredential(accountId: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (raw) {
        const creds = JSON.parse(raw);
        delete creds[accountId];
        window.localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
      }
    } catch {}
  }
}

export const dataService = new DataService();
