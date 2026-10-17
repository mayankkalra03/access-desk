import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Account, AccountInput, Environment, Tag, SEEDED_ENV_IDS } from "@/types";
import { INITIAL_ENVIRONMENTS } from "./seed-data";
import { encryptCredential, decryptCredential, EncryptedData } from "./crypto";

class DataService {
  private seeded = false;

  async getEnvironments(): Promise<Environment[]> {
    if (!db) return INITIAL_ENVIRONMENTS;

    try {
      const snap = await getDocs(collection(db, "environments"));
      let envList: Environment[] = [];
      if (!snap.empty) {
        envList = snap.docs.map((d) => d.data() as Environment);
      } else {
        if (!this.seeded) {
          this.seeded = true;
          const batch = writeBatch(db);
          for (const env of INITIAL_ENVIRONMENTS) {
            batch.set(doc(db, "environments", env.id), env);
          }
          await batch.commit();
        }
        envList = INITIAL_ENVIRONMENTS;
      }

      // Sort strictly by the canonical order: DEV1, DEV2, DEV4, SIT1, SIT2, SIT4, SIT5, SIT10, TRN, UAT1, UAT2, UAT3, STG1, STG2, STG3
      return envList.sort((a, b) => {
        const idxA = (SEEDED_ENV_IDS as readonly string[]).indexOf(a.id);
        const idxB = (SEEDED_ENV_IDS as readonly string[]).indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
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

    // Save AES-256 encrypted password to Firestore account_credentials
    if (password && password.trim()) {
      try {
        const encrypted = await encryptCredential(password.trim());
        await setDoc(doc(db, "account_credentials", finalAccount.id), {
          ...encrypted,
          accountId: finalAccount.id,
          updatedAt: now,
        });
      } catch (err: any) {
        console.warn("Failed to encrypt and store credential:", err?.message);
      }
    }

    return finalAccount;
  }

  async deleteAccount(accountId: string): Promise<void> {
    if (!db) throw new Error("Database unavailable.");

    await deleteDoc(doc(db, "accounts", accountId));
    try {
      await deleteDoc(doc(db, "account_credentials", accountId));
    } catch {}
  }

  async revealAccountPassword(accountId: string): Promise<string> {
    if (!db) throw new Error("Database service is not available.");

    const credDoc = await getDoc(doc(db, "account_credentials", accountId));
    if (!credDoc.exists()) {
      throw new Error("No credential found for this account.");
    }
    const data = credDoc.data() as EncryptedData;
    return await decryptCredential(data);
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
