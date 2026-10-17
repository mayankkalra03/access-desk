import { describe, it, expect } from "vitest";
import { filterAccounts, searchGlobal } from "../src/lib/search";
import { Account, Environment } from "../src/types";

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Jane Doe",
    username: "jane.doe",
    environmentId: "SIT1",
    portal: "CP",
    role: "Employee",
    product: "Both",
    tags: ["AutoPayments", "MicroDeposits"],
    organization: "Acme Health",
    notes: "Primary test user for payment scenarios",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "acc-2",
    name: "Acme Broker",
    username: "acme.broker",
    environmentId: "DEV2",
    portal: "CP",
    role: "Broker",
    product: "ICHRA",
    tags: ["Renewals"],
    organization: "Acme Brokerage",
    notes: "Broker testing renewals",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-02-02T12:00:00.000Z",
  },
  {
    id: "acc-3",
    name: "Global Employer",
    username: "global.employer",
    environmentId: "SIT1",
    portal: "CP",
    role: "Employer",
    product: "SHOP",
    tags: ["EmployerLed"],
    organization: "Global Corp",
    notes: "SHOP employer setup",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-02-03T14:00:00.000Z",
  },
  {
    id: "acc-4",
    name: "Both Employer",
    username: "both.employer",
    environmentId: "UAT1",
    portal: "CP",
    role: "Employer",
    product: "Both",
    tags: ["Renewals"],
    organization: "Both Benefits Inc",
    notes: "Supports both products",
    createdAt: "2026-01-04T00:00:00.000Z",
    updatedAt: "2026-02-04T16:00:00.000Z",
  },
  {
    id: "acc-5",
    name: "Tech Admin",
    username: "tech.admin",
    environmentId: "SIT1",
    portal: "WP",
    role: "Admin",
    product: "Both",
    tags: ["PendingApproval"],
    organization: "Operations",
    notes: "Admin for worker portal",
    createdAt: "2026-01-05T00:00:00.000Z",
    updatedAt: "2026-02-05T18:00:00.000Z",
  },
];

const mockEnvironments: Environment[] = [
  {
    id: "SIT1",
    name: "SIT1",
    cpUrl: "https://cp.sit1.example.com",
    wpUrl: "https://wp.sit1.example.com",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "UAT1",
    name: "UAT1",
    cpUrl: "https://cp.uat1.example.com",
    wpUrl: "https://wp.uat1.example.com",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("AccessDesk Filter & Search System", () => {
  it("filters by Employee + AutoPayments", () => {
    const results = filterAccounts(mockAccounts, {
      role: "Employee",
      tags: ["AutoPayments"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("jane.doe");
  });

  it("filters by Employee + MicroDeposits + SIT1", () => {
    const results = filterAccounts(mockAccounts, {
      role: "Employee",
      environmentId: "SIT1",
      tags: ["MicroDeposits"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("jane.doe");
  });

  it("filters by Any role + Renewals + UAT1", () => {
    const results = filterAccounts(mockAccounts, {
      environmentId: "UAT1",
      tags: ["Renewals"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("both.employer");
  });

  it("supports multi-tag match mode 'all' vs 'any'", () => {
    // Both tags
    const allMatch = filterAccounts(mockAccounts, {
      tags: ["AutoPayments", "MicroDeposits"],
      tagMatchMode: "all",
    });
    expect(allMatch).toHaveLength(1);

    // Any tags (AutoPayments or Renewals)
    const anyMatch = filterAccounts(mockAccounts, {
      tags: ["AutoPayments", "Renewals"],
      tagMatchMode: "any",
    });
    expect(anyMatch).toHaveLength(3); // jane.doe, acme.broker, both.employer
  });

  it("executes global search across accounts and environments", () => {
    const searchRes = searchGlobal(mockAccounts, mockEnvironments, "SIT1");
    expect(searchRes.environments).toHaveLength(1);
    expect(searchRes.environments[0].name).toBe("SIT1");
    // Accounts in SIT1: jane.doe, global.employer, tech.admin
    expect(searchRes.accounts.length).toBe(3);
  });

  it("searches account notes and organizations", () => {
    const searchRes = searchGlobal(mockAccounts, mockEnvironments, "payment scenarios");
    expect(searchRes.accounts).toHaveLength(1);
    expect(searchRes.accounts[0].name).toBe("Jane Doe");
  });
});
