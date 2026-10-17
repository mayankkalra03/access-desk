# AccessDesk — Environment & Account Manager

> **One place. Every environment.**  
> A premium, production-ready internal engineering tool for managing healthcare insurance platform environments, portal URLs, test account credentials, and feature-specific test accounts.

---

## 1. Product Overview

AccessDesk manages test environments and credentials across two primary portals:
- **Consumer Portal (CP)**: Broker, Employer, Employee
- **Worker Portal / Admin Portal (WP)**: Admin

Supporting two core insurance products:
- **ICHRA** (Individual Coverage Health Reimbursement Arrangement)
- **SHOP** (Small Business Health Options Program)
- **Both** (Dual-product accounts)

Across 15 predefined testing environments:
`DEV1`, `DEV2`, `DEV4`, `SIT1`, `SIT2`, `SIT4`, `SIT5`, `SIT10`, `TRN`, `UAT1`, `UAT2`, `UAT3`, `STG1`, `STG2`, `STG3`

---

## 2. Technology & Security Architecture

- **Frontend**: Next.js 16 with TypeScript, React 19, Tailwind CSS, Lucide icons
- **Static Hosting**: Firebase Hosting (`output: 'export'` with clean client-side deep linking and no continuously running Node.js server)
- **Database**: Cloud Firestore (Metadata partitioned in `accounts`, `environments`, and `tags`)
- **Credential Vault**: AES-256-GCM authenticated encryption handled by Firebase Cloud Functions. Passwords are never stored in plaintext on disk, in client bundles, or in public Firestore documents.
- **Access Control**: Firebase Authentication with server-side allowlist (`system_config/authorization`) and lockdown Firestore Security Rules.
- **Validation**: Strict schema validation using Zod for CP vs WP role enforcement and HTTP/HTTPS destination verification.
- **Testing**: Vitest test suite covering crypto operations, validation schemas, search/filter algorithms, and security rules.

---

## 3. Getting Started

### Prerequisites
- Node.js 20+ (tested on Node v22)
- npm 10+

### Local Development
1. Clone the repository and install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. Run the automated test suite:
   ```bash
   npm test
   ```

4. Type-check the codebase:
   ```bash
   npm run typecheck
   ```

5. Build the static production bundle:
   ```bash
   npm run build
   ```

---

## 4. Key Workflows & Features

### Accounts Management (`/accounts`)
- **Dense Data Table**: View account names, environment badges, CP/WP portals, roles, products, tags, usernames, and last updated timestamps.
- **Multi-faceted Filtering**:
  - Combined filters (e.g. `Employee` + `AutoPayments`, `Employee` + `MicroDeposits` + `SIT1`)
  - Multi-select tag filter with **ALL** (AND) vs **ANY** (OR) matching modes.
  - Quick Search across all metadata, organizations, and notes.
- **Flyout Detail Drawer**:
  - Masked credentials by default (`••••••••`).
  - **Reveal Password**: On-demand decryption with automatic purge on drawer close.
  - **Copy Password**: Decrypts and copies directly to clipboard.
  - **Open Portal**: Safely launches the associated CP or WP portal in a new tab.
  - **Duplicate Metadata**: Copies role, environment, product, and tags while intentionally requiring explicit password creation.

### Environments Management (`/environments`)
- Dedicated cards for all 15 environments (`DEV1` through `STG3`).
- Independent configuration for Consumer Portal (CP) and Worker Portal (WP) URLs.
- Direct account count badges and 1-click portal launching.
- Environment detail drawer with associated accounts list.

### Global Command Palette (`⌘ K` / `Ctrl+K`)
- Instant search across all 15 environments, account names, usernames, roles, tags, notes, and organizations.
- Keyboard navigable with Escape to close.

### Taxonomy Tags (`/tags`)
- Seeded with essential healthcare testing tags:
  - **Products**: `ICHRA`, `SHOP`, `Both`
  - **Payments**: `AutoPayments`, `MicroDeposits`
  - **Enrollment**: `Renewals`, `ChangeRequests`, `EmployeeLed`, `EmployerLed`, `PendingApproval`
- Impact-aware tag deletion displaying active account usage before removal.

---

## 5. Deployment Guide (Firebase Hosting & Cloud Functions)

### Step 1: Firebase Project Setup
1. Log in to Firebase:
   ```bash
   npx firebase-tools login
   ```
2. Initialize or link your project:
   ```bash
   npx firebase-tools use --add <your-firebase-project-id>
   ```

### Step 2: Environment Configuration
Copy `.env.example` to `.env.local` and configure your Firebase web credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Step 3: Configure Cloud Functions Encryption Key
Generate a secure 256-bit AES hex key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set the secret in Google Cloud Secret Manager or Firebase Functions config:
```bash
npx firebase-tools functions:secrets:set ACCESSDESK_ENCRYPTION_KEY
```

### Step 4: Seed Database
Populate the 15 environments and taxonomy tags in Firestore:
```bash
npm run seed
```

### Step 5: Deploy
Deploy rules, functions, and the static frontend:
```bash
npm run deploy
```
Or deploy individual services:
- Frontend static build to Firebase Hosting: `npm run deploy:hosting`
- Security rules and indexes: `npm run deploy:rules`
- Cloud Functions: `npm run deploy:functions`

---

## 6. Security Guarantees

1. **Zero Plaintext Credentials in Database**: Account passwords are encrypted via AES-256-GCM before write operations and stored in a separated `account_credentials` collection.
2. **Client Lockdown**: Firestore security rules set `allow read, write: if false;` on `account_credentials`. Only trusted Cloud Functions using the Firebase Admin SDK can access raw encrypted credentials.
3. **Restricted Access**: Only authenticated users on the authorized allowlist can trigger decryption routines.
4. **Leak Prevention**: Credentials are excluded from URLs, browser history, search indexes, client log statements, and error payloads.
