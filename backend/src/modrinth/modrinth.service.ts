import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface NormalizedModSearchResult {
  provider: 'curseforge' | 'modrinth';
  projectId: string;
  slug: string;
  name: string;
  summary: string;
  iconUrl?: string;
  downloads?: number;
  lastUpdated?: string;
  supportedVersions: string[];
  supportedLoaders: string[];
}

export interface NormalizedModSearchResponse {
  data: NormalizedModSearchResult[];
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}

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

@Injectable()
export class ModrinthService {
  private readonly apiClient: AxiosInstance;
  private readonly MODRINTH_API_BASE = 'https://api.modrinth.com/v2';
  private readonly KNOWN_LOADERS = ['forge', 'neoforge', 'fabric', 'quilt'];

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.MODRINTH_API_BASE,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Minepanel/1.0.0 (contact@minepanel.com)',
      },
    });
  }

  async searchMods(query: {
    q?: string;
    limit?: number;
    offset?: number;
    minecraftVersion: string;
    loader?: 'forge' | 'neoforge' | 'fabric' | 'quilt';
  }): Promise<NormalizedModSearchResponse> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const offset = Math.max(query.offset ?? 0, 0);

    const facets: string[][] = [
      ['project_type:mod'],
      [`versions:${query.minecraftVersion}`],
    ];

    if (query.loader) {
      facets.push([`categories:${query.loader}`]);
    }

    try {
      const response = await this.apiClient.get<ModrinthSearchResponse>('/search', {
        params: {
          query: query.q,
          limit,
          offset,
          index: 'relevance',
          facets: JSON.stringify(facets),
        },
      });

      const normalized = response.data.hits
        .map((hit) => this.normalizeHit(hit))
        .filter((mod) => this.isCompatibleResult(mod, query.minecraftVersion, query.loader));

      return {
        data: normalized,
        pagination: {
          index: offset,
          pageSize: limit,
          resultCount: normalized.length,
          totalCount: response.data.total_hits,
        },
      };
    } catch (error) {
      console.error('Error searching Modrinth mods:', error);

      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error searching mods',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException('Error searching mods', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchModpacks(query: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<ModrinthSearchResponse> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const offset = Math.max(query.offset ?? 0, 0);

    const facets: string[][] = [['project_type:modpack']];

    try {
      const response = await this.apiClient.get<ModrinthSearchResponse>('/search', {
        params: {
          query: query.q,
          limit,
          offset,
          index: 'relevance',
          facets: JSON.stringify(facets),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error searching Modrinth modpacks:', error);
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error searching modpacks',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Error searching modpacks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFeaturedModpacks(limit: number = 10): Promise<ModrinthSearchResponse> {
    const facets: string[][] = [['project_type:modpack']];

    try {
      const response = await this.apiClient.get<ModrinthSearchResponse>('/search', {
        params: {
          limit,
          offset: 0,
          index: 'follows',
          facets: JSON.stringify(facets),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching featured Modrinth modpacks:', error);
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error fetching featured modpacks',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Error fetching featured modpacks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPopularModpacks(limit: number = 10): Promise<ModrinthSearchResponse> {
    const facets: string[][] = [['project_type:modpack']];

    try {
      const response = await this.apiClient.get<ModrinthSearchResponse>('/search', {
        params: {
          limit,
          offset: 0,
          index: 'downloads',
          facets: JSON.stringify(facets),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching popular Modrinth modpacks:', error);
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error fetching popular modpacks',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Error fetching popular modpacks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModpack(idOrSlug: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/project/${idOrSlug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Modrinth modpack details:', error);
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error fetching modpack details',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Error fetching modpack details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModpackVersions(idOrSlug: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/project/${idOrSlug}/version`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Modrinth modpack versions:', error);
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data?.description || 'Error fetching modpack versions',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException('Error fetching modpack versions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private normalizeHit(hit: ModrinthSearchHit): NormalizedModSearchResult {
    const supportedLoaders = (hit.categories ?? []).filter((category) =>
      this.KNOWN_LOADERS.includes(category.toLowerCase()),
    );

    return {
      provider: 'modrinth',
      projectId: hit.project_id,
      slug: hit.slug,
      name: hit.title,
      summary: hit.description ?? '',
      iconUrl: hit.icon_url,
      downloads: hit.downloads,
      lastUpdated: hit.date_modified,
      supportedVersions: hit.versions ?? [],
      supportedLoaders,
    };
  }

  private isCompatibleResult(
    mod: NormalizedModSearchResult,
    minecraftVersion: string,
    loader?: 'forge' | 'neoforge' | 'fabric' | 'quilt',
  ): boolean {
    const hasVersion = mod.supportedVersions.some((version) => version === minecraftVersion);
    if (!hasVersion) return false;

    if (!loader) return true;
    if (mod.supportedLoaders.length === 0) return true;
    return mod.supportedLoaders.includes(loader);
  }
}
