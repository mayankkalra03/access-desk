import { Account, Environment } from "@/types";

export interface AccountFilterOptions {
  search?: string;
  environmentId?: string;
  portal?: string;
  role?: string;
  product?: string;
  tags?: string[];
  tagMatchMode?: "all" | "any";
  sortBy?: "name" | "updatedAt" | "environmentId";
  sortOrder?: "asc" | "desc";
}

export function filterAccounts(
  accounts: Account[],
  options: AccountFilterOptions
): Account[] {
  const {
    search = "",
    environmentId = "",
    portal = "",
    role = "",
    product = "",
    tags = [],
    tagMatchMode = "all",
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = options;

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = accounts.filter((account) => {
    // Environment filter
    if (environmentId && environmentId !== "all" && account.environmentId !== environmentId) {
      return false;
    }

    // Portal filter
    if (portal && portal !== "all" && account.portal !== portal) {
      return false;
    }

    // Role filter
    if (role && role !== "all" && account.role !== role) {
      return false;
    }

    // Product filter
    if (product && product !== "all" && account.product !== product) {
      return false;
    }

    // Tag filter
    if (tags && tags.length > 0) {
      if (tagMatchMode === "all") {
        const hasAllTags = tags.every((t) => account.tags.includes(t));
        if (!hasAllTags) return false;
      } else {
        const hasAnyTag = tags.some((t) => account.tags.includes(t));
        if (!hasAnyTag) return false;
      }
    }

    // Free text search
    if (normalizedSearch) {
      const matchName = account.name.toLowerCase().includes(normalizedSearch);
      const matchUsername = account.username.toLowerCase().includes(normalizedSearch);
      const matchEnv = account.environmentId.toLowerCase().includes(normalizedSearch);
      const matchRole = account.role.toLowerCase().includes(normalizedSearch);
      const matchPortal = account.portal.toLowerCase().includes(normalizedSearch);
      const matchProduct = account.product.toLowerCase().includes(normalizedSearch);
      const matchTags = account.tags.some((t) => t.toLowerCase().includes(normalizedSearch));
      const matchOrg = account.organization?.toLowerCase().includes(normalizedSearch) || false;
      const matchNotes = account.notes?.toLowerCase().includes(normalizedSearch) || false;

      if (
        !matchName &&
        !matchUsername &&
        !matchEnv &&
        !matchRole &&
        !matchPortal &&
        !matchProduct &&
        !matchTags &&
        !matchOrg &&
        !matchNotes
      ) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "environmentId") {
      comparison = a.environmentId.localeCompare(b.environmentId);
    } else {
      // Default: updatedAt
      comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return sortOrder === "asc" ? -comparison : comparison;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return filtered;
}

export interface GlobalSearchResult {
  environments: Environment[];
  accounts: Account[];
}

export function searchGlobal(
  accounts: Account[],
  environments: Environment[],
  query: string
): GlobalSearchResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { environments: [], accounts: [] };
  }

  const matchedEnvs = environments.filter((env) => {
    return (
      env.name.toLowerCase().includes(q) ||
      (env.description && env.description.toLowerCase().includes(q)) ||
      (env.cpUrl && env.cpUrl.toLowerCase().includes(q)) ||
      (env.wpUrl && env.wpUrl.toLowerCase().includes(q))
    );
  });

  const matchedAccounts = accounts.filter((account) => {
    return (
      account.name.toLowerCase().includes(q) ||
      account.username.toLowerCase().includes(q) ||
      account.environmentId.toLowerCase().includes(q) ||
      account.role.toLowerCase().includes(q) ||
      account.portal.toLowerCase().includes(q) ||
      account.product.toLowerCase().includes(q) ||
      account.tags.some((t) => t.toLowerCase().includes(q)) ||
      (account.organization && account.organization.toLowerCase().includes(q)) ||
      (account.notes && account.notes.toLowerCase().includes(q))
    );
  });

  return {
    environments: matchedEnvs,
    accounts: matchedAccounts,
  };
}
