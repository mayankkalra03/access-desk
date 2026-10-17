import { z } from "zod";

export const PORTALS = ["CP", "WP"] as const;
export type PortalType = (typeof PORTALS)[number];

export const CP_ROLES = ["Broker", "Employer", "Employee"] as const;
export type CPRole = (typeof CP_ROLES)[number];

export const WP_ROLES = ["Admin"] as const;
export type WPRole = (typeof WP_ROLES)[number];

export const ALL_ROLES = [...CP_ROLES, ...WP_ROLES] as const;
export type RoleType = CPRole | WPRole;

export const PRODUCTS = ["ICHRA", "SHOP", "Both"] as const;
export type ProductType = (typeof PRODUCTS)[number];

export const SEEDED_ENV_IDS = [
  "DEV1",
  "DEV2",
  "DEV4",
  "SIT1",
  "SIT2",
  "SIT4",
  "SIT5",
  "SIT10",
  "TRN",
  "UAT1",
  "UAT2",
  "UAT3",
  "STG1",
  "STG2",
  "STG3",
] as const;
export type SeededEnvId = (typeof SEEDED_ENV_IDS)[number];

export interface Environment {
  id: string;
  name: string;
  cpUrl: string;
  wpUrl: string;
  description?: string;
  status: "active" | "inactive";
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  username: string;
  environmentId: string;
  portal: PortalType;
  role: RoleType;
  product?: ProductType;
  tags: string[];
  organization?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export type AccountInput = Omit<Account, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
};

export interface Tag {
  id: string;
  name: string;
  category?: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
  isOwner?: boolean;
  isAuthorized: boolean;
}

// Zod Schemas
export const urlValidation = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid HTTP or HTTPS URL (e.g. https://portal.example.com)" }
  );

export const environmentFormSchema = z.object({
  name: z.string().min(2, "Environment name must be at least 2 characters"),
  cpUrl: urlValidation,
  wpUrl: urlValidation,
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  isFavorite: z.boolean().optional(),
});

export const accountFormSchema = z
  .object({
    environmentId: z.string().min(1, "Environment must be selected"),
    portal: z.enum(["CP", "WP"]),
    username: z.string().min(2, "Username is required (min 2 chars)"),
    password: z.string().min(4, "Password must be at least 4 characters").optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    product: z.string().optional(),
    tags: z.array(z.string()).default([]),
    organization: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role && data.role.trim() !== "") {
      if (data.portal === "CP") {
        if (!CP_ROLES.includes(data.role as CPRole)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Consumer Portal (CP) role must be Broker, Employer, or Employee",
            path: ["role"],
          });
        }
      } else if (data.portal === "WP") {
        if (!WP_ROLES.includes(data.role as WPRole)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Worker Portal (WP) role must be Admin",
            path: ["role"],
          });
        }
      }
    }
  });

export type AccountFormData = z.infer<typeof accountFormSchema>;
export type EnvironmentFormData = z.infer<typeof environmentFormSchema>;
