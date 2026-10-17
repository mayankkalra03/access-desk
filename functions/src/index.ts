import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { encryptPassword, decryptPassword, EncryptedCredential } from "./crypto";

admin.initializeApp();
const db = admin.firestore();

// Fetch 256-bit AES master key from environment or Secret Manager
function getMasterKey(): string {
  const key = process.env.ACCESSDESK_ENCRYPTION_KEY || functions.config().accessdesk?.key;
  if (!key) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Server encryption key (ACCESSDESK_ENCRYPTION_KEY) is not configured. Credential operations are disabled."
    );
  }
  return key;
}

// Verify caller is authenticated and authorized
async function verifyAuthorizedUser(auth: functions.https.CallableContext["auth"]): Promise<{ uid: string; email: string }> {
  if (!auth || !auth.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required to access credential operations."
    );
  }

  const userEmail = auth.token.email || "";

  // Check allowlist in Firestore system_config
  const authDoc = await db.collection("system_config").doc("authorization").get();
  if (authDoc.exists) {
    const data = authDoc.data();
    const allowedEmails: string[] = data?.allowedEmails || [];
    const ownerEmail: string = data?.ownerEmail || "";

    const isAllowed =
      (ownerEmail && ownerEmail.toLowerCase() === userEmail.toLowerCase()) ||
      allowedEmails.some((e) => e.toLowerCase() === userEmail.toLowerCase());

    if (!isAllowed) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Your account is not authorized to access credentials in AccessDesk."
      );
    }
  } else {
    // If system_config is not set up yet, check ALLOWED_EMAILS environment variable
    const envAllowed = process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];
    if (envAllowed.length > 0 && !envAllowed.includes(userEmail.toLowerCase())) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Your account is not authorized to access credentials."
      );
    }
  }

  return { uid: auth.uid, email: userEmail };
}

/**
 * Cloud Function: Save encrypted account credential
 */
export const saveAccountCredential = functions.https.onCall(
  async (data: { accountId: string; password?: string }, context) => {
    const { email } = await verifyAuthorizedUser(context.auth);
    const { accountId, password } = data;

    if (!accountId || typeof accountId !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Valid accountId is required.");
    }

    if (!password || typeof password !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Password is required.");
    }

    const masterKey = getMasterKey();
    const encrypted = encryptPassword(password, masterKey);

    await db.collection("account_credentials").doc(accountId).set({
      ...encrypted,
      accountId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: email,
    });

    return { success: true, accountId };
  }
);

/**
 * Cloud Function: Get decrypted account credential
 * Only authenticated & authorized users can retrieve the password.
 */
export const getAccountCredential = functions.https.onCall(
  async (data: { accountId: string }, context) => {
    await verifyAuthorizedUser(context.auth);
    const { accountId } = data;

    if (!accountId || typeof accountId !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Valid accountId is required.");
    }

    const masterKey = getMasterKey();
    const doc = await db.collection("account_credentials").doc(accountId).get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "No credentials found for this account.");
    }

    const credentialData = doc.data() as EncryptedCredential;
    const decryptedPassword = decryptPassword(credentialData, masterKey);

    return { password: decryptedPassword };
  }
);

/**
 * Cloud Function: Delete account credential
 */
export const deleteAccountCredential = functions.https.onCall(
  async (data: { accountId: string }, context) => {
    await verifyAuthorizedUser(context.auth);
    const { accountId } = data;

    if (!accountId) {
      throw new functions.https.HttpsError("invalid-argument", "Valid accountId is required.");
    }

    await db.collection("account_credentials").doc(accountId).delete();
    return { success: true };
  }
);

/**
 * Cloud Function: Bootstrap initial owner (safe single-user setup)
 * Only succeeds if no owner exists yet.
 */
export const bootstrapOwner = functions.https.onCall(
  async (data: { ownerEmail: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const callerEmail = context.auth.token.email || "";
    const authRef = db.collection("system_config").doc("authorization");
    const doc = await authRef.get();

    if (doc.exists && doc.data()?.ownerEmail) {
      throw new functions.https.HttpsError(
        "already-exists",
        "AccessDesk already has a designated owner. Contact your administrator."
      );
    }

    const ownerEmail = (data.ownerEmail || callerEmail).toLowerCase().trim();
    await authRef.set(
      {
        ownerEmail,
        allowedEmails: [ownerEmail],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerEmail,
      },
      { merge: true }
    );

    return { success: true, ownerEmail };
  }
);

/**
 * Cloud Function: Check current authorization status
 */
export const checkAuthorizationStatus = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      return { authenticated: false, authorized: false };
    }
    const userEmail = context.auth.token.email || "";
    const authDoc = await db.collection("system_config").doc("authorization").get();

    if (!authDoc.exists) {
      return {
        authenticated: true,
        authorized: true,
        isOwner: true,
        needsBootstrap: true,
        email: userEmail,
      };
    }

    const data = authDoc.data();
    const ownerEmail = data?.ownerEmail || "";
    const allowedEmails: string[] = data?.allowedEmails || [];

    const isOwner = ownerEmail.toLowerCase() === userEmail.toLowerCase();
    const isAllowed = isOwner || allowedEmails.some((e) => e.toLowerCase() === userEmail.toLowerCase());

    return {
      authenticated: true,
      authorized: isAllowed,
      isOwner,
      needsBootstrap: false,
      email: userEmail,
    };
  }
);
