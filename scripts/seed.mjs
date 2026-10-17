/**
 * AccessDesk Seeding Script
 * Seeds the 15 required environments and default tags into Firestore.
 * 
 * Usage:
 *   node scripts/seed.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const SEEDED_ENV_IDS = [
  "DEV1", "DEV2", "DEV4",
  "SIT1", "SIT2", "SIT4", "SIT5", "SIT10",
  "TRN",
  "UAT1", "UAT2", "UAT3",
  "STG1", "STG2", "STG3",
];

const INITIAL_TAGS = [];

async function seed() {
  console.log("🌱 AccessDesk Database Seeding...");

  // Check if service account key exists or use emulator / default credentials
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!getApps().length) {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      initializeApp({
        credential: cert(serviceAccountPath),
      });
      console.log(`✓ Initialized with service account: ${serviceAccountPath}`);
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "accessdesk-local",
      });
      console.log("✓ Initialized with default / emulator project context");
    }
  }

  const db = getFirestore();

  console.log(`\n📦 Seeding ${SEEDED_ENV_IDS.length} Environments...`);
  const envBatch = db.batch();
  for (const envId of SEEDED_ENV_IDS) {
    const docRef = db.collection("environments").doc(envId);
    envBatch.set(
      docRef,
      {
        id: envId,
        name: envId,
        cpUrl: "",
        wpUrl: "",
        description: "",
        status: "active",
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`  - Prepared environment: ${envId} (CP: empty, WP: empty)`);
  }
  await envBatch.commit();
  console.log("✓ All 15 environments seeded successfully.");

  console.log(`\n🏷️  Seeding ${INITIAL_TAGS.length} Suggested Tags...`);
  const tagBatch = db.batch();
  for (const tag of INITIAL_TAGS) {
    const docRef = db.collection("tags").doc(tag.id);
    tagBatch.set(
      docRef,
      {
        ...tag,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`  - Prepared tag: [${tag.category}] ${tag.name}`);
  }
  await tagBatch.commit();
  console.log("✓ Suggested tags seeded successfully.");

  console.log("\n✨ Database seeding completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seeding encountered an error:", err.message);
  process.exit(1);
});
