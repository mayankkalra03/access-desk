import { Account, Environment } from "@/types";

export interface AccountFilterOptions {
  search?: string;
  environmentId?: string;
  portal?: string;
  role?: string;
  tags?: string[];
  tagMatchMode?: "all" | "any";
  sortBy?: "name" | "updatedAt" | "environmentId";
  sortOrder?: "asc" | "desc";
}

/**
 * Builds a search corpus string containing all indexed account fields,
 * including spaced environment variants (e.g. "DEV2" and "DEV 2").
 */
export function getAccountSearchCorpus(account: Account): string {
  const parts = [
    account.name,
    account.username,
    account.username.replace(/^@/, ""),
    account.environmentId,
    account.environmentId.replace(/([a-zA-Z]+)(\d+)/, "$1 $2"),
    account.role,
    account.portal,
    account.portal === "CP"
      ? "consumer portal"
      : account.portal === "WP"
      ? "worker portal admin"
      : "",
    ...(account.tags || []),
    account.organization || "",
    account.notes || "",
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Matches an account against a free-text search query.
 * Supports multi-token and cross-field matching (e.g. "dev2 broker").
 */
export function matchAccountQuery(account: Account, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const corpus = getAccountSearchCorpus(account);

  // Exact phrase substring match
  if (corpus.includes(q)) return true;

  // Multi-token match: every word/token in the query must match the corpus
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => corpus.includes(token));
}

/**
 * Builds a search corpus string for an environment.
 */
export function getEnvironmentSearchCorpus(env: Environment): string {
  const parts = [
    env.id,
    env.id.replace(/([a-zA-Z]+)(\d+)/, "$1 $2"),
    env.name,
    env.name.replace(/([a-zA-Z]+)(\d+)/, "$1 $2"),
    env.description || "",
    env.cpUrl || "",
    env.wpUrl || "",
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Matches an environment against a free-text search query.
 */
export function matchEnvironmentQuery(env: Environment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const corpus = getEnvironmentSearchCorpus(env);

  if (corpus.includes(q)) return true;

  const tokens = q.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => corpus.includes(token));
}

function getAccountMatchScore(account: Account, query: string, tokens: string[]): number {
  const q = query.trim().toLowerCase();
  const username = account.username.toLowerCase();
  const name = account.name.toLowerCase();
  const env = account.environmentId.toLowerCase();
  const role = account.role.toLowerCase();

  let score = 0;
  if (username === q || username.replace(/^@/, "") === q) score += 100;
  else if (username.includes(q)) score += 50;

  if (name === q) score += 80;
  else if (name.includes(q)) score += 40;

  if (env === q) score += 60;
  if (role === q) score += 50;

  for (const token of tokens) {
    if (username.includes(token)) score += 25;
    if (name.includes(token)) score += 15;
    if (env.includes(token)) score += 20;
    if (role.includes(token)) score += 15;
    if (account.tags.some((t) => t.toLowerCase().includes(token))) score += 10;
  }

  return score;
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

    // Free text search supporting multi-token cross-field queries
    if (normalizedSearch) {
      if (!matchAccountQuery(account, normalizedSearch)) {
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

  const tokens = q.split(/[\s,]+/).filter(Boolean);

  const matchedEnvs = environments.filter((env) => matchEnvironmentQuery(env, q));
  const matchedAccounts = accounts.filter((account) => matchAccountQuery(account, q));

  // Sort matched accounts by relevance score
  matchedAccounts.sort((a, b) => {
    const scoreA = getAccountMatchScore(a, q, tokens);
    const scoreB = getAccountMatchScore(b, q, tokens);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    environments: matchedEnvs,
    accounts: matchedAccounts,
  };
}
