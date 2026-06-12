import api from "../axios.service";

export interface ModrinthSearchHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  date_modified?: string;
  versions: string[];
  categories: string[];
}

export interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  icon_url?: string;
  downloads: number;
  published: string;
  updated: string;
  game_versions: string[];
  loaders: string[];
  gallery?: Array<{
    url: string;
    featured: boolean;
    title?: string;
    description?: string;
  }>;
  team: string;
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  date_published: string;
  downloads: number;
  version_type: "release" | "beta" | "alpha";
  files: Array<{
    url: string;
    filename: string;
    primary: boolean;
    size: number;
  }>;
  game_versions: string[];
  loaders: string[];
}

export const searchModpacks = async (
  q?: string,
  limit: number = 20,
  offset: number = 0
): Promise<ModrinthSearchResponse> => {
  try {
    const response = await api.get("/modrinth/search", {
      params: { q, limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching Modrinth modpacks:", error);
    throw error;
  }
};

export const getFeaturedModpacks = async (limit: number = 10): Promise<ModrinthSearchResponse> => {
  try {
    const response = await api.get("/modrinth/featured", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching featured Modrinth modpacks:", error);
    throw error;
  }
};

export const getPopularModpacks = async (limit: number = 10): Promise<ModrinthSearchResponse> => {
  try {
    const response = await api.get("/modrinth/popular", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching popular Modrinth modpacks:", error);
    throw error;
  }
};

export const getModpack = async (idOrSlug: string): Promise<ModrinthProject> => {
  try {
    const response = await api.get(`/modrinth/${idOrSlug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Modrinth modpack details:", error);
    throw error;
  }
};

export const getModpackVersions = async (idOrSlug: string): Promise<ModrinthVersion[]> => {
  try {
    const response = await api.get(`/modrinth/${idOrSlug}/version`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Modrinth modpack versions:", error);
    throw error;
  }
};

export const formatDownloadCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export interface UnifiedModpack {
  id: string;
  name: string;
  slug: string;
  summary: string;
  logoUrl?: string;
  downloadCount: number;
  isFeatured: boolean;
  websiteUrl: string;
  latestVersion?: string;
  provider: "curseforge" | "modrinth";
  rawCurseForge?: any;
  rawModrinth?: any;
}
