import { Environment, Tag, SEEDED_ENV_IDS } from "@/types";

export const INITIAL_ENVIRONMENTS: Environment[] = SEEDED_ENV_IDS.map((envId) => ({
  id: envId,
  name: envId,
  cpUrl: "",
  wpUrl: "",
  description: "",
  status: "active",
  isFavorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

// No predefined tags - all tags are user-created on the fly
export const INITIAL_TAGS: Tag[] = [];
