import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { Account, AccountInput, Environment, Tag } from "@/types";
import { INITIAL_ENVIRONMENTS } from "./seed-data";

class DataService {
  private seeded = false;

  async getEnvironments(): Promise<Environment[]> {
    if (!db) return INITIAL_ENVIRONMENTS;

    try {
      const snap = await getDocs(collection(db, "environments"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Environment);
      }

      // Seed initial environments into Firestore once if collection is empty
      if (!this.seeded) {
        this.seeded = true;
        const batch = writeBatch(db);
        for (const env of INITIAL_ENVIRONMENTS) {
          batch.set(doc(db, "environments", env.id), env);
        }
        await batch.commit();
      }
      return INITIAL_ENVIRONMENTS;
    } catch (e) {
      console.warn("Failed to fetch environments:", e);
      return INITIAL_ENVIRONMENTS;
    }
  }

  async updateEnvironment(env: Environment): Promise<void> {
    if (!db) throw new Error("Database unavailable.");
    env.updatedAt = new Date().toISOString();
    await setDoc(doc(db, "environments", env.id), env, { merge: true });
  }

  async getAccounts(): Promise<Account[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "accounts"));
      return snap.docs.map((d) => d.data() as Account);
    } catch (e) {
      console.warn("Failed to fetch accounts:", e);
      return [];
    }
  }

  async saveAccount(
    account: AccountInput,
    password?: string
  ): Promise<Account> {
    if (!db) throw new Error("Database unavailable.");

    const now = new Date().toISOString();
    const finalAccount: Account = {
      ...account,
      id: account.id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: account.createdAt || now,
      updatedAt: now,
    };

    // Save account metadata to Firestore (never contains plaintext password)
    await setDoc(doc(db, "accounts", finalAccount.id), finalAccount);

    // Save encrypted password via Cloud Function
    if (password && password.trim() && functions) {
      try {
        const saveCredFn = httpsCallable<
          { accountId: string; password: string },
          { success: boolean }
        >(functions, "saveAccountCredential");
        await saveCredFn({
          accountId: finalAccount.id,
          password: password.trim(),
        });
      } catch (err: any) {
        console.warn("Cloud function saveAccountCredential error:", err?.message);
      }
    }

    return finalAccount;
  }

  async deleteAccount(accountId: string): Promise<void> {
    if (!db) throw new Error("Database unavailable.");

    await deleteDoc(doc(db, "accounts", accountId));

    if (functions) {
      try {
        const deleteCredFn = httpsCallable<
          { accountId: string },
          { success: boolean }
        >(functions, "deleteAccountCredential");
        await deleteCredFn({ accountId });
      } catch (err: any) {
        console.warn("Cloud function deleteAccountCredential error:", err?.message);
      }
    }
  }

  async revealAccountPassword(accountId: string): Promise<string> {
    if (!functions) {
      throw new Error("Functions service is not available.");
    }

    const getCredFn = httpsCallable<
      { accountId: string },
      { password: string }
    >(functions, "getAccountCredential");
    const res = await getCredFn({ accountId });
    if (!res.data?.password) {
      throw new Error("No credential found for this account.");
    }
    return res.data.password;
  }

  async getTags(): Promise<Tag[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "tags"));
      return snap.docs.map((d) => d.data() as Tag);
    } catch (e) {
      console.warn("Failed to fetch tags:", e);
      return [];
    }
  }

  async saveTag(tag: Tag): Promise<Tag> {
    if (!db) throw new Error("Database unavailable.");
    await setDoc(doc(db, "tags", tag.id), tag, { merge: true });
    return tag;
  }

  async deleteTag(tagId: string): Promise<void> {
    if (!db) throw new Error("Database unavailable.");
    await deleteDoc(doc(db, "tags", tagId));
  }
}

export const dataService = new DataService();
