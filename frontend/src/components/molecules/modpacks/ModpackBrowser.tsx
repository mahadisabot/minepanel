"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchModpacks as searchCFModpacks, getPopularModpacks as getCFPopular } from "@/services/curseforge/curseforge.service";
import { searchModpacks as searchMRModpacks, getPopularModpacks as getMRPopular, UnifiedModpack, formatDownloadCount } from "@/services/modrinth/modrinth.service";
import { Search, Loader2, Package, Download, Check } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";

interface ModpackBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (modpack: UnifiedModpack) => void;
  provider: "curseforge" | "modrinth";
}

export function ModpackBrowser({ open, onClose, onSelect, provider }: ModpackBrowserProps) {
  const { t } = useLanguage();
  const [modpacks, setModpacks] = useState<UnifiedModpack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mappers
  const mapCurseForge = useCallback((cf: any): UnifiedModpack => ({
    id: cf.id.toString(),
    name: cf.name,
    slug: cf.slug,
    summary: cf.summary || "",
    logoUrl: cf.logo?.url || cf.logo?.thumbnailUrl,
    downloadCount: cf.downloadCount || 0,
    isFeatured: cf.isFeatured || false,
    websiteUrl: cf.links?.websiteUrl || `https://www.curseforge.com/minecraft/modpacks/${cf.slug}`,
    latestVersion: cf.latestFiles?.[0]?.gameVersions?.[0] || "N/A",
    provider: "curseforge",
    rawCurseForge: cf,
  }), []);

  const mapModrinth = useCallback((hit: any): UnifiedModpack => ({
    id: hit.project_id || hit.id,
    name: hit.title || hit.name,
    slug: hit.slug,
    summary: hit.description || hit.summary || "",
    logoUrl: hit.icon_url,
    downloadCount: hit.downloads || 0,
    isFeatured: false,
    websiteUrl: `https://modrinth.com/modpack/${hit.slug}`,
    latestVersion: hit.versions?.[0] || hit.game_versions?.[0] || "N/A",
    provider: "modrinth",
    rawModrinth: hit,
  }), []);

  const loadPopular = useCallback(async () => {
    setIsLoading(true);
    try {
      if (provider === "curseforge") {
        const response = await getCFPopular(12);
        setModpacks(response.data.map(mapCurseForge));
      } else {
        const response = await getMRPopular(12);
        setModpacks(response.hits.map(mapModrinth));
      }
      setHasSearched(true);
    } catch (err) {
      console.error("Error loading modpacks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [provider, mapCurseForge, mapModrinth]);

  useEffect(() => {
    if (open) {
      setModpacks([]);
      setHasSearched(false);
      setSearchQuery("");
      loadPopular();
    }
  }, [open, loadPopular]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopular();
      return;
    }
    setIsLoading(true);
    try {
      if (provider === "curseforge") {
        const response = await searchCFModpacks(searchQuery, 12);
        setModpacks(response.data.map(mapCurseForge));
      } else {
        const response = await searchMRModpacks(searchQuery, 12);
        setModpacks(response.hits.map(mapModrinth));
      }
      setHasSearched(true);
    } catch (err) {
      console.error("Error searching modpacks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (modpack: UnifiedModpack) => {
    setSelectedId(modpack.id);
    onSelect(modpack);
    setTimeout(() => {
      onClose();
      setSelectedId(null);
    }, 300);
  };

  const platformName = provider === "curseforge" ? "CurseForge" : "Modrinth";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gray-900 border border-gray-700 text-white p-0">
        <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900 px-6 py-4">
          <DialogTitle className="text-xl font-bold font-minecraft text-emerald-400 flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            {t("browseModpacks")} - {platformName}
          </DialogTitle>
          <div className="flex gap-2">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder={t("searchModpacks")} className="bg-gray-800 border-gray-700 text-white" />
            <Button onClick={handleSearch} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button onClick={loadPopular} disabled={isLoading} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              {t("popular")}
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-gray-400 mt-2">{t("loading")}</p>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-minecraft">{t("searchOrBrowsePopular")}</p>
            </div>
          ) : modpacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Image src="/images/barrier.webp" alt="No results" width={48} height={48} className="opacity-50 mb-4" />
              <p>{t("noModpacksFound")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modpacks.map((modpack) => (
                <div key={modpack.id} onClick={() => handleSelect(modpack)} className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedId === modpack.id ? "border-emerald-500 bg-emerald-900/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"}`}>
                  {modpack.logoUrl && <Image src={modpack.logoUrl} alt={modpack.name} width={48} height={48} className="rounded flex-shrink-0 object-cover h-12 w-12" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-minecraft text-sm text-white truncate">{modpack.name}</h3>
                      {selectedId === modpack.id && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{modpack.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        <Download className="h-3 w-3 mr-1" />
                        {formatDownloadCount(modpack.downloadCount)}
                      </Badge>
                      {modpack.latestVersion && (
                        <Badge variant="secondary" className="text-xs bg-blue-900/50 text-blue-300">
                          {modpack.latestVersion}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
