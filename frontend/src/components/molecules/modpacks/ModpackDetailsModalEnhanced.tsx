"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedModpack, formatDownloadCount, getModpack as getModrinthModpack, getModpackVersions as getModrinthVersions, ModrinthProject, ModrinthVersion } from "@/services/modrinth/modrinth.service";
import { Download, ExternalLink, Calendar, Users, Package, Copy, Check, Rocket, Globe, Loader2 } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mcToast } from "@/lib/utils/minecraft-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { createServer } from "@/services/docker/fetchs";

interface ModpackDetailsModalEnhancedProps {
  readonly modpack: UnifiedModpack | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function ModpackDetailsModalEnhanced({ modpack, open, onClose }: ModpackDetailsModalEnhancedProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [serverId, setServerId] = useState("");
  const [serverName, setServerName] = useState("");
  
  // CurseForge Specific
  const [installMethod, setInstallMethod] = useState<"url" | "slug">("url");
  const [fileId, setFileId] = useState("");
  
  // Modrinth Specific
  const [modrinthDetails, setModrinthDetails] = useState<ModrinthProject | null>(null);
  const [modrinthVersions, setModrinthVersions] = useState<ModrinthVersion[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState("");

  useEffect(() => {
    if (open && modpack && modpack.provider === "modrinth") {
      setIsLoadingDetails(true);
      Promise.all([
        getModrinthModpack(modpack.id),
        getModrinthVersions(modpack.id),
      ])
        .then(([details, versions]) => {
          setModrinthDetails(details);
          setModrinthVersions(versions);
        })
        .catch((err) => {
          console.error("Error loading Modrinth details:", err);
          mcToast.error(t("errorLoadingModpacks") || "Error loading Modrinth details");
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else {
      setModrinthDetails(null);
      setModrinthVersions([]);
      setSelectedVersionId("");
    }
  }, [open, modpack, t]);

  if (!modpack) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    mcToast.success(`${label} ${t("copiedToClipboard")}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateServer = async () => {
    if (!serverId.trim()) {
      mcToast.error(t("serverIdRequired") || "Server ID is required");
      return;
    }

    setIsCreating(true);
    try {
      let config;
      if (modpack.provider === "curseforge") {
        config = {
          id: serverId,
          serverName: serverName || modpack.name,
          serverType: "AUTO_CURSEFORGE" as const,
          cfMethod: installMethod,
          cfUrl: installMethod === "url" ? modpack.websiteUrl : "",
          cfSlug: installMethod === "slug" ? modpack.slug : "",
          cfFile: installMethod === "slug" && fileId ? fileId : "",
          minecraftVersion: (() => {
            if (installMethod === "slug" && fileId && modpack.rawCurseForge?.latestFiles) {
              const selectedFile = modpack.rawCurseForge.latestFiles.find((f: any) => f.id.toString() === fileId);
              if (selectedFile?.gameVersions?.[0]) return selectedFile.gameVersions[0];
            }
            return modpack.rawCurseForge?.latestFiles?.[0]?.gameVersions?.[0] || "";
          })(),
        };
      } else {
        let mcVersion = "";
        if (selectedVersionId) {
          const selectedVer = modrinthVersions.find((v) => v.id === selectedVersionId);
          if (selectedVer && selectedVer.game_versions && selectedVer.game_versions.length > 0) {
            mcVersion = selectedVer.game_versions[0];
          }
        } else if (modrinthVersions && modrinthVersions.length > 0) {
          mcVersion = modrinthVersions[0].game_versions[0];
        }

        config = {
          id: serverId,
          serverName: serverName || modpack.name,
          serverType: "MODRINTH" as const,
          modrinthModpack: selectedVersionId || modpack.slug,
          minecraftVersion: mcVersion || "latest",
        };
      }

      await createServer(config);
      mcToast.success(t("serverCreated"));
      onClose();
      router.push(`/dashboard/servers/${serverId}`);
    } catch (error) {
      console.error("Error creating server:", error);
      mcToast.error(t("errorCreatingServer"));
    } finally {
      setIsCreating(false);
    }
  };

  // Resolve CurseForge vs Modrinth fields
  const displayCreatedDate = modpack.provider === "curseforge"
    ? modpack.rawCurseForge?.dateCreated
    : modrinthDetails?.published;

  const displayUpdatedDate = modpack.provider === "curseforge"
    ? modpack.rawCurseForge?.dateModified
    : modrinthDetails?.updated;

  const screenshots = modpack.provider === "curseforge"
    ? (modpack.rawCurseForge?.screenshots || [])
    : (modrinthDetails?.gallery?.map((g: any, idx: number) => ({ id: idx, url: g.url, title: g.title || "" })) || []);

  const authors = modpack.provider === "curseforge"
    ? (modpack.rawCurseForge?.authors?.map((a: any) => a.name) || [])
    : (modpack.rawModrinth?.author ? [modpack.rawModrinth.author] : ["Modrinth Creator"]);

  const latestFileCF = modpack.provider === "curseforge" && modpack.rawCurseForge?.latestFiles?.[0]
    ? modpack.rawCurseForge.latestFiles[0]
    : null;

  const latestVersionMR = modrinthVersions?.[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-700 text-white scrollbar-hide p-0">
        <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-4">
            {modpack.logoUrl && (
              <Image src={modpack.logoUrl} alt={modpack.name} width={60} height={60} className="rounded-lg border border-gray-700" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-2xl font-bold font-minecraft text-white">{modpack.name}</DialogTitle>
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400 capitalize">
                  {modpack.provider}
                </Badge>
              </div>
              <DialogDescription className="text-sm text-gray-400 mt-1">{modpack.summary}</DialogDescription>
            </div>
          </div>
        </div>

        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <p className="text-gray-400 font-minecraft">{t("loading")}</p>
          </div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2 bg-gray-800">
              <TabsTrigger value="info" className="text-white data-[state=active]:bg-emerald-600">
                <Package className="mr-2 h-4 w-4" />
                {t("modpackDetails")}
              </TabsTrigger>
              <TabsTrigger value="create" className="text-white data-[state=active]:bg-blue-600">
                <Rocket className="mr-2 h-4 w-4" />
                {t("createServer")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4 px-6 pb-6">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Download className="h-4 w-4" />
                    <span className="text-xs font-semibold">{t("downloads")}</span>
                  </div>
                  <p className="mt-1 font-bold text-white">{formatDownloadCount(modpack.downloadCount)}</p>
                </div>

                <div className="rounded-lg border border-blue-600/30 bg-blue-600/10 p-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-semibold">{t("created")}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-white">{formatDate(displayCreatedDate)}</p>
                </div>

                <div className="rounded-lg border border-purple-600/30 bg-purple-600/10 p-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-semibold">{t("updated")}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-white">{formatDate(displayUpdatedDate)}</p>
                </div>

                <div className="rounded-lg border border-yellow-600/30 bg-yellow-600/10 p-3">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-semibold">{t("files")}</span>
                  </div>
                  <p className="mt-1 font-bold text-white">
                    {modpack.provider === "curseforge"
                      ? (modpack.rawCurseForge?.latestFiles?.length || 0)
                      : (modrinthVersions?.length || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {screenshots && screenshots.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-minecraft text-sm font-bold text-white">
                        <Globe className="h-4 w-4 text-emerald-400" />
                        Screenshots
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {screenshots.slice(0, 4).map((screenshot: any) => (
                          <div key={screenshot.id} className="relative h-24 overflow-hidden rounded border border-gray-700">
                            <Image src={screenshot.url} alt={screenshot.title || "Screenshot"} fill className="object-cover" sizes="200px" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-minecraft text-sm font-bold text-white">
                      <Users className="h-4 w-4 text-blue-400" />
                      {t("authors") || "Authors"}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {authors.map((authorName: string, idx: number) => (
                        <Badge key={idx} className="border-blue-500/30 bg-blue-500/20 text-xs text-blue-300">
                          {authorName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {modpack.provider === "curseforge" && latestFileCF && (
                    <div>
                      <h3 className="mb-2 font-minecraft text-sm font-bold text-white">{t("latestVersion")}</h3>
                      <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-800/40 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("fileName")}:</span>
                          <span className="text-white truncate max-w-[250px]">{latestFileCF.fileName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("gameVersions")}:</span>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                            {latestFileCF.gameVersions.slice(0, 3).map((version: string) => (
                              <Badge key={version} className="border-blue-600/30 bg-blue-600/20 text-xs text-blue-400">
                                {version}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("releaseDate")}:</span>
                          <span className="text-white">{formatDate(latestFileCF.fileDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {modpack.provider === "modrinth" && latestVersionMR && (
                    <div>
                      <h3 className="mb-2 font-minecraft text-sm font-bold text-white">{t("latestVersion")}</h3>
                      <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-800/40 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Version Name:</span>
                          <span className="text-white truncate max-w-[250px]">{latestVersionMR.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Version:</span>
                          <span className="text-white">{latestVersionMR.version_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("gameVersions")}:</span>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                            {latestVersionMR.game_versions.slice(0, 3).map((version: string) => (
                              <Badge key={version} className="border-blue-600/30 bg-blue-600/20 text-xs text-blue-400">
                                {version}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{t("releaseDate")}:</span>
                          <span className="text-white">{formatDate(latestVersionMR.date_published)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-700 pt-4">
                <Button onClick={() => window.open(modpack.websiteUrl, "_blank")} className="flex-1 bg-blue-600 font-minecraft hover:bg-blue-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {modpack.provider === "curseforge" ? t("viewOnCurseForge") : "View on Modrinth"}
                </Button>
                <Button onClick={onClose} variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600">
                  {t("close")}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-4 px-6 pb-6">
              <div className="space-y-4 rounded-lg border border-emerald-600/40 bg-emerald-900/10 p-6">
                <div>
                  <h3 className="font-minecraft text-xl font-bold text-emerald-400">{t("createServer")}</h3>
                  <p className="text-sm text-gray-400">{t("createServerFromModpack") || "Create a new server using this modpack"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-white">
                        {t("serverId")} <span className="text-red-400">*</span>
                      </Label>
                      <Input value={serverId} onChange={(e) => setServerId(e.target.value.toLowerCase().replaceAll(/[^a-z0-9-_]/g, ""))} placeholder="my-modpack-server" className="mt-1 bg-gray-800 border-gray-700 text-white" />
                      <p className="mt-1 text-xs text-gray-500">{t("serverIdDescription")}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-white">{t("serverName")}</Label>
                      <Input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder={modpack.name} className="mt-1 bg-gray-800 border-gray-700 text-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {modpack.provider === "curseforge" ? (
                      <>
                        <div>
                          <Label className="text-sm font-semibold text-white">{t("installationMethod")}</Label>
                          <div className="mt-1 grid grid-cols-2 gap-2">
                            <Button type="button" size="sm" variant={installMethod === "url" ? "default" : "outline"} onClick={() => setInstallMethod("url")} className={installMethod === "url" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-emerald-400 hover:border-emerald-500"}>
                              URL
                            </Button>
                            <Button type="button" size="sm" variant={installMethod === "slug" ? "default" : "outline"} onClick={() => setInstallMethod("slug")} className={installMethod === "slug" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-emerald-400 hover:border-emerald-500"}>
                              Slug
                            </Button>
                          </div>
                        </div>

                        {installMethod === "url" ? (
                          <div>
                            <Label className="text-sm font-semibold text-white">{t("modpackUrl")}</Label>
                            <div className="mt-1 flex gap-2">
                              <Input value={modpack.websiteUrl} readOnly className="bg-gray-800 border-gray-700 text-white" />
                              <Button variant="outline" size="icon" onClick={() => copyToClipboard(modpack.websiteUrl, "URL")} className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-semibold text-white">{t("modpackSlug")}</Label>
                              <div className="mt-1 flex gap-2">
                                <Input value={modpack.slug} readOnly className="bg-gray-800 border-gray-700 text-white" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(modpack.slug, "Slug")} className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500">
                                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-semibold text-white">
                                {t("fileId")} <span className="text-xs text-gray-500">({t("optional")})</span>
                              </Label>
                              {modpack.rawCurseForge?.latestFiles && modpack.rawCurseForge.latestFiles.length > 0 ? (
                                <select value={fileId} onChange={(e) => setFileId(e.target.value)} className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                  <option value="">{t("latestVersion")} (Auto)</option>
                                  {modpack.rawCurseForge.latestFiles.slice(0, 10).map((file: any) => (
                                    <option key={file.id} value={file.id}>
                                      {file.displayName} - {file.gameVersions[0] || "Unknown"}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input value={fileId} onChange={(e) => setFileId(e.target.value)} placeholder="" className="mt-1 bg-gray-800 border-gray-700 text-white" />
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold text-white">{t("modpackSlug") || "Modpack Slug"}</Label>
                          <div className="mt-1 flex gap-2">
                            <Input value={modpack.slug} readOnly className="bg-gray-800 border-gray-700 text-white" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(modpack.slug, "Slug")} className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500">
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-white">
                            {t("version")} <span className="text-xs text-gray-500">({t("optional")})</span>
                          </Label>
                          {modrinthVersions && modrinthVersions.length > 0 ? (
                            <select value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)} className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="">{t("latestVersion") || "Latest version"} (Auto)</option>
                              {modrinthVersions.map((version) => (
                                <option key={version.id} value={version.id}>
                                  {version.name} - {version.game_versions[0] || "Unknown"}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)} placeholder="Version ID" className="mt-1 bg-gray-800 border-gray-700 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-blue-600/30 bg-blue-900/20 p-3">
                  <p className="text-sm text-blue-300">
                    {modpack.provider === "curseforge"
                      ? t("cfApiKeyRequired")
                      : "Modrinth modpacks do not require an API key and are downloaded automatically."}
                  </p>
                </div>

                <Button onClick={handleCreateServer} disabled={isCreating || !serverId.trim()} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 font-minecraft hover:from-emerald-500 hover:to-emerald-600">
                  <Rocket className="mr-2 h-4 w-4" />
                  {isCreating ? t("creating") : t("createServer")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
