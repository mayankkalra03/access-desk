import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Firestore Security Rules & Access Control Verification", () => {
  const rulesContent = fs.readFileSync(
    path.join(__dirname, "../firestore.rules"),
    "utf-8"
  );

  it("strictly locks down account_credentials from all direct client access", () => {
    // Verifies match /account_credentials/{credentialId} { allow read, write: if false; }
    expect(rulesContent).toMatch(/match\s+\/account_credentials\/\{credentialId\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/);
  });

  it("strictly forbids client storing plaintext password fields in accounts collection", () => {
    // Verifies rule: !request.resource.data.keys().hasAny(['password', 'plainPassword'])
    expect(rulesContent).toContain("!request.resource.data.keys().hasAny(['password', 'plainPassword'])");
  });

  it("requires authentication for environments and tags", () => {
    expect(rulesContent).toContain("function isAuthenticated()");
    expect(rulesContent).toContain("request.auth != null");
  });

  it("restricts system_config writes to server-side Admin SDK only", () => {
    expect(rulesContent).toMatch(/match\s+\/system_config\/\{configDoc\}\s*\{\s*allow\s+read:\s*if\s+isAuthenticated\(\);\s*allow\s+write:\s*if\s+false;\s*\}/);
  });
});
