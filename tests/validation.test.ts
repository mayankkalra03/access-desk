import { describe, it, expect } from "vitest";
import {
  accountFormSchema,
  environmentFormSchema,
  CP_ROLES,
  WP_ROLES,
  PRODUCTS,
} from "../src/types";

describe("AccessDesk Validation Schemas", () => {
  describe("Account Form Validation", () => {
    it("accepts valid Consumer Portal (CP) account with Employee role and ICHRA product", () => {
      const validCP = {
        name: "Jane Doe",
        username: "jane.doe",
        password: "securePassword123!",
        environmentId: "SIT1",
        portal: "CP",
        role: "Employee",
        product: "ICHRA",
        tags: ["AutoPayments"],
      };
      const result = accountFormSchema.safeParse(validCP);
      expect(result.success).toBe(true);
    });

    it("accepts valid Worker Portal (WP) account with Admin role", () => {
      const validWP = {
        name: "Admin User",
        username: "tech.admin",
        password: "adminPassword!",
        environmentId: "DEV1",
        portal: "WP",
        role: "Admin",
        product: "Both",
        tags: [],
      };
      const result = accountFormSchema.safeParse(validWP);
      expect(result.success).toBe(true);
    });

    it("accepts minimalist account with only mandatory fields (env, portal, username, password)", () => {
      const minimal = {
        environmentId: "DEV4",
        portal: "CP",
        username: "minimal.user",
        password: "secretPassword1",
      };
      const result = accountFormSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it("rejects invalid role for Consumer Portal (e.g. Admin in CP)", () => {
      const invalid = {
        name: "Bad Account",
        username: "bad.user",
        password: "password123",
        environmentId: "SIT1",
        portal: "CP",
        role: "Admin", // Admin is not allowed in CP
        product: "SHOP",
        tags: [],
      };
      const result = accountFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const roleErrors = result.error.issues.filter((e) => e.path.includes("role"));
        expect(roleErrors.length).toBeGreaterThan(0);
        expect(roleErrors[0].message).toContain("Consumer Portal (CP) role must be Broker, Employer, or Employee");
      }
    });

    it("rejects invalid role for Worker Portal (e.g. Employee in WP)", () => {
      const invalid = {
        name: "Bad Worker",
        username: "bad.worker",
        password: "password123",
        environmentId: "SIT1",
        portal: "WP",
        role: "Employee", // Employee is not allowed in WP
        product: "Both",
        tags: [],
      };
      const result = accountFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const roleErrors = result.error.issues.filter((e) => e.path.includes("role"));
        expect(roleErrors.length).toBeGreaterThan(0);
        expect(roleErrors[0].message).toContain("Worker Portal (WP) role must be Admin");
      }
    });

    it("validates all 3 product options (ICHRA, SHOP, Both)", () => {
      for (const product of PRODUCTS) {
        const acc = {
          name: "Test Account",
          username: "test.user",
          password: "password123",
          environmentId: "SIT2",
          portal: "CP",
          role: "Broker",
          product,
          tags: [],
        };
        const result = accountFormSchema.safeParse(acc);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Environment Form Validation", () => {
    it("accepts empty portal URLs on initial creation without error", () => {
      const env = {
        name: "DEV1",
        cpUrl: "",
        wpUrl: "",
        status: "active" as const,
      };
      const result = environmentFormSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("accepts valid HTTPS portal URLs", () => {
      const env = {
        name: "SIT1",
        cpUrl: "https://consumer.sit1.internal.healthcare.com",
        wpUrl: "https://admin.sit1.internal.healthcare.com",
        status: "active" as const,
      };
      const result = environmentFormSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("rejects malformed URLs", () => {
      const env = {
        name: "SIT1",
        cpUrl: "ftp://invalid-url.com",
        wpUrl: "not a url",
        status: "active" as const,
      };
      const result = environmentFormSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });
});
