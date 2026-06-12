import { FC, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ServerConfig } from '@/lib/types/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, HelpCircle, Network, Info, BookOpen, ExternalLink, Lock, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { getProxyStatus } from '@/services/network.service';
import { LINK_CONNECTIVITY_SETTINGS } from '@/lib/providers/constants';
import { getPlayitLogs, PlayitStatusResponse } from '@/services/docker/fetchs';

interface ConnectivitySettingsTabProps {
  config: ServerConfig;
  updateConfig: <K extends keyof ServerConfig>(field: K, value: ServerConfig[K]) => void;
}

export const ConnectivitySettingsTab: FC<ConnectivitySettingsTabProps> = ({
  config,
  updateConfig,
}) => {
  const { t } = useLanguage();
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [playitInfo, setPlayitInfo] = useState<PlayitStatusResponse | null>(null);
  const [globalPlayitInfo, setGlobalPlayitInfo] = useState<PlayitStatusResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  useEffect(() => {
    getProxyStatus()
      .then((status) => setProxyEnabled(status.enabled))
      .catch(() => setProxyEnabled(false));
  }, []);

  useEffect(() => {
    if (!config.usePlayit || !config.id) {
      setPlayitInfo(null);
      return;
    }

    let active = true;
    const fetchStatus = async () => {
      try {
        const data = await getPlayitLogs(config.id!);
        if (active) {
          setPlayitInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch playit logs:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [config.usePlayit, config.id]);

  useEffect(() => {
    let active = true;
    const fetchGlobalStatus = async () => {
      try {
        const data = await getPlayitLogs('global');
        if (active) {
          setGlobalPlayitInfo(data.status === 'not_found' ? null : data);
        }
      } catch (err) {
        if (active) {
          setGlobalPlayitInfo(null);
        }
      }
    };

    fetchGlobalStatus();
    const interval = setInterval(fetchGlobalStatus, 7000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isJava = config.edition !== 'BEDROCK';
  const isBedrock = config.edition === 'BEDROCK';
  // Proxy only works with Java edition
  const serverUsesProxy = isJava && proxyEnabled && config.useProxy !== false;
  const defaultPort = isBedrock ? '19132' : '25565';

  return (
    <>
      <div className="space-y-4 p-4 rounded-md bg-gray-800/50 border border-gray-700/50">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg text-emerald-400 font-minecraft flex items-center gap-2">
            <Image src="/images/ender-pearl.webp" alt="Conectividad" width={20} height={20} />
            {t('connectivitySettings')}
          </h3>
          <a href={LINK_CONNECTIVITY_SETTINGS} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <BookOpen className="h-4 w-4" />
            {t('documentation')}
          </a>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverPort" className="text-gray-200 font-minecraft text-sm">
              {t('serverPort')} {isBedrock && '(UDP)'}
            </Label>
            <Input
              id="serverPort"
              type="number"
              value={serverUsesProxy ? defaultPort : config.port || defaultPort}
              onChange={(e) => updateConfig('port', String(e.target.value))}
              placeholder={defaultPort}
              disabled={serverUsesProxy}
              className={`bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30 ${serverUsesProxy ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="text-xs text-gray-400">{t('serverPortDesc')}</p>
            {serverUsesProxy ? (
              <Alert className="bg-cyan-900/30 border-cyan-800 text-cyan-200 mt-2 py-2">
                <Info className="h-4 w-4" />
                <AlertDescription>{t('serverPortProxyInfo')}</AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-amber-900/30 border-amber-800 text-amber-200 mt-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('serverPortWarning')}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerIdleTimeout" className="text-gray-200 font-minecraft text-sm">
              {t('playerIdleTimeout')}
            </Label>
            <Input
              id="playerIdleTimeout"
              type="number"
              value={config.playerIdleTimeout || 0}
              onChange={(e) => updateConfig('playerIdleTimeout', String(e.target.value))}
              placeholder="0"
              className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
            />
            <p className="text-xs text-gray-400">{t('playerIdleTimeoutDesc')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="onlineMode"
                className="text-gray-200 font-minecraft text-sm flex items-center gap-2"
              >
                <Image src="/images/sword.png" alt="Modo Online" width={16} height={16} />
                {t('onlineMode')}
              </Label>
              <Switch
                id="onlineMode"
                checked={config.onlineMode !== false}
                onCheckedChange={(checked) => updateConfig('onlineMode', checked)}
              />
            </div>
            <p className="text-xs text-gray-400">{t('onlineModeDesc')}</p>
          </div>

          {isJava && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="preventProxyConnections"
                  className="text-gray-200 font-minecraft text-sm flex items-center gap-2"
                >
                  <Image src="/images/shield.png" alt="Prevenir Proxy" width={16} height={16} />
                  {t('preventProxyConnections')}
                </Label>
                <Switch
                  id="preventProxyConnections"
                  checked={config.preventProxyConnections === true}
                  onCheckedChange={(checked) => updateConfig('preventProxyConnections', checked)}
                />
              </div>
              <p className="text-xs text-gray-400">{t('preventProxyConnectionsDesc')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-md bg-gray-800/50 border border-gray-700/50 mt-4">
        <h3 className="text-lg text-emerald-400 font-minecraft flex items-center gap-2">
          <Image src="/images/command-block.webp" alt="Jugadores" width={20} height={20} />
          {t('accessControl')}
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="ops"
              className="text-gray-200 font-minecraft text-sm flex items-center gap-2"
            >
              <Image src="/images/diamond.webp" alt="Operadores" width={16} height={16} />
              {t('serverOperators')}
            </Label>
            <Input
              id="ops"
              value={config.ops || ''}
              onChange={(e) => updateConfig('ops', e.target.value)}
              placeholder="admin1,admin2"
              className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
            />
            <p className="text-xs text-gray-400">{t('serverOperatorsDesc')}</p>
          </div>

          {isJava && (
            <div className="space-y-2">
              <Label htmlFor="opPermissionLevel" className="text-gray-200 font-minecraft text-sm">
                {t('opPermissionLevel')}
              </Label>
              <Select
                value={config.opPermissionLevel?.toString() || '4'}
                onValueChange={(value) => updateConfig('opPermissionLevel', String(value))}
              >
                <SelectTrigger
                  id="opPermissionLevel"
                  className="bg-gray-800/70 border-gray-700/50 focus:ring-emerald-500/30"
                >
                  <SelectValue placeholder={t('selectOpPermissionLevel')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                  <SelectItem value="1">{t('opPermissionLevel1')}</SelectItem>
                  <SelectItem value="2">{t('opPermissionLevel2')}</SelectItem>
                  <SelectItem value="3">{t('opPermissionLevel3')}</SelectItem>
                  <SelectItem value="4">{t('opPermissionLevel4')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">{t('opPermissionLevelDesc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* RCON section - Java only */}
      {isJava && (
        <Accordion
          type="single"
          collapsible
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md mt-4"
        >
          <AccordionItem value="rcon" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-gray-200 font-minecraft text-sm hover:bg-gray-700/30 rounded-t-md">
              <div className="flex items-center gap-2">
                <Image src="/images/command-block.webp" alt="RCON" width={16} height={16} />
                {t('rcon')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 bg-transparent hover:bg-gray-700/50"
                      >
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200">
                      <p>{t('rconDesc')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableRcon" className="text-gray-200 font-minecraft text-sm">
                    {t('enableRcon')}
                  </Label>
                  <Switch
                    id="enableRcon"
                    checked={config.enableRcon !== false}
                    onCheckedChange={(checked) => updateConfig('enableRcon', checked)}
                  />
                </div>
                <p className="text-xs text-gray-400">{t('enableRconDesc')}</p>

                {config.enableBackup && !config.enableRcon && (
                  <Alert
                    variant="destructive"
                    className="bg-red-900/30 border-red-800 text-red-200 mt-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('backupRequiresRcon')}</AlertDescription>
                  </Alert>
                )}
              </div>

              {config.enableRcon !== false && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rconPort" className="text-gray-200 font-minecraft text-sm">
                      {t('rconPort')}
                    </Label>
                    <Input
                      id="rconPort"
                      type="number"
                      value={config.rconPort || 25575}
                      onChange={(e) => updateConfig('rconPort', String(e.target.value))}
                      placeholder="25575"
                      className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rconPassword" className="text-gray-200 font-minecraft text-sm">
                      {t('rconPassword')}
                    </Label>
                    <Input
                      id="rconPassword"
                      type="password"
                      value={config.rconPassword || ''}
                      onChange={(e) => updateConfig('rconPassword', e.target.value)}
                      placeholder="Contraseña segura requerida"
                      className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
                    />
                    <p className="text-xs text-red-400 font-medium">{t('rconPasswordImportant')}</p>
                  </div>

                  {config.enableBackup && (
                    <Alert className="bg-amber-900/30 border-amber-800 text-amber-200 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{t('backupRconDesc')}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="broadcastRconToOps"
                        className="text-gray-200 font-minecraft text-sm"
                      >
                        {t('broadcastRconToOps')}
                      </Label>
                      <Switch
                        id="broadcastRconToOps"
                        checked={config.broadcastRconToOps || false}
                        onCheckedChange={(checked) => updateConfig('broadcastRconToOps', checked)}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{t('broadcastRconToOpsDesc')}</p>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Additional Permissions - Java only */}
      {isJava && (
        <div className="space-y-4 p-4 rounded-md bg-gray-800/50 border border-gray-700/50 mt-4">
          <h3 className="text-lg text-emerald-400 font-minecraft flex items-center gap-2">
            <Image src="/images/nether.webp" alt="Permisos" width={20} height={20} />
            {t('additionalPermissions')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="commandBlock"
                className="text-gray-200 font-minecraft text-sm flex items-center gap-2"
              >
                <Image
                  src="/images/command-block.webp"
                  alt="Bloques de Comandos"
                  width={16}
                  height={16}
                />
                {t('commandBlock')}
              </Label>
              <Switch
                id="commandBlock"
                checked={config.commandBlock || false}
                onCheckedChange={(checked) => updateConfig('commandBlock', checked)}
              />
            </div>
            <p className="text-xs text-gray-400">{t('commandBlockDesc')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="allowFlight"
                className="text-gray-200 font-minecraft text-sm flex items-center gap-2"
              >
                <Image src="/images/elytra.webp" alt="Vuelo" width={16} height={16} />
                {t('allowFlight')}
              </Label>
              <Switch
                id="allowFlight"
                checked={config.allowFlight || false}
                onCheckedChange={(checked) => updateConfig('allowFlight', checked)}
              />
            </div>
            <p className="text-xs text-gray-400">{t('allowFlightDesc')}</p>
          </div>
        </div>
      )}

      {/* Proxy settings - Java only (mc-router doesn't support Bedrock UDP) */}
      {isJava && (
        <Accordion
          type="single"
          collapsible
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md mt-4"
        >
          <AccordionItem value="proxy" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-gray-200 font-minecraft text-sm hover:bg-gray-700/30 rounded-t-md">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-400" />
                {t('proxySettings')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 bg-transparent hover:bg-gray-700/50"
                      >
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-700 text-gray-200 max-w-xs">
                      <p>{t('proxySettingsServerDesc')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 px-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="proxyHostname" className="text-gray-200 font-minecraft text-sm">
                  {t('proxyHostname')}
                </Label>
                <Input
                  id="proxyHostname"
                  value={config.proxyHostname || ''}
                  onChange={(e) => updateConfig('proxyHostname', e.target.value)}
                  placeholder={`${config.id}.mc.example.com`}
                  className="bg-gray-800/70 border-gray-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30"
                />
                <p className="text-xs text-gray-400">{t('proxyHostnameDesc')}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useProxy" className="text-gray-200 font-minecraft text-sm">
                    {t('useProxy')}
                  </Label>
                  <Switch
                    id="useProxy"
                    checked={config.useProxy !== false}
                    onCheckedChange={(checked) => updateConfig('useProxy', checked)}
                  />
                </div>
                <p className="text-xs text-gray-400">{t('useProxyDesc')}</p>
              </div>

              <Alert className="bg-cyan-900/30 border-cyan-800 text-cyan-200 mt-2">
                <Network className="h-4 w-4" />
                <AlertDescription>{t('proxyServerInfo')}</AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Playit.gg section */}
      <div className="space-y-4 p-4 rounded-md bg-gray-800/50 border border-gray-700/50 mt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg text-emerald-400 font-minecraft flex items-center gap-2">
            <Image src="/images/ender-pearl.webp" alt="Playit.gg" width={20} height={20} className={config.usePlayit ? "animate-pulse" : ""} />
            Playit.gg Tunnel
          </h3>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 ${
            playitInfo?.status === 'running' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : config.usePlayit 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' 
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              playitInfo?.status === 'running' 
                ? 'bg-emerald-400' 
                : config.usePlayit 
                  ? 'bg-amber-400' 
                  : 'bg-gray-400'
            }`} />
            {playitInfo?.status 
              ? playitInfo.status.toUpperCase() 
              : config.usePlayit 
                ? 'STARTING...' 
                : 'DISABLED'}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="usePlayit" className="text-gray-200 font-minecraft text-sm">
                {t('usePlayit')}
              </Label>
              <p className="text-xs text-gray-400 max-w-md">{t('usePlayitDesc')}</p>
            </div>
            <Switch
              id="usePlayit"
              checked={config.usePlayit === true}
              onCheckedChange={(checked) => updateConfig('usePlayit', checked)}
            />
          </div>

          {config.usePlayit && (
            <div className="space-y-4 pt-2 border-t border-gray-700/50 animate-in fade-in duration-300">
              {/* Playit Secret Key field */}
              <div className="space-y-2">
                <Label htmlFor="playitSecret" className="text-gray-200 font-minecraft text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  {t('playitSecretLabel')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="playitSecret"
                    type="password"
                    autoComplete="new-password"
                    value={config.playitSecret || ''}
                    onChange={(e) => updateConfig('playitSecret', e.target.value)}
                    placeholder="e.g. playit-secret-key-..."
                    className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400">{t('playitSecretDesc')}</p>
                {!config.playitSecret && (
                  <Alert className="bg-gray-950/40 border-gray-850 text-gray-300 mt-2 p-3 text-xs leading-relaxed">
                    <Info className="h-4 w-4 text-cyan-400 inline-block mr-2" />
                    <span>{t('playitInstructions')}</span>
                  </Alert>
                )}
              </div>

              {/* Claim section if claim url exists */}
              {playitInfo?.claimUrl && (
                <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200 mt-2 p-4">
                  <Info className="h-5 w-5 text-amber-400" />
                  <div>
                    <h4 className="font-semibold text-amber-300 mb-1">{t('playitClaimLink')}</h4>
                    <p className="text-sm text-gray-300 mb-3">{t('playitClaimDesc')}</p>
                    <a
                      href={playitInfo.claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-md hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all text-sm font-minecraft"
                    >
                      {t('playitClaimLink')}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </Alert>
              )}

              {/* Active Tunnels display */}
              {playitInfo?.status === 'running' && (
                <div className="space-y-3 bg-gray-900/40 p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-minecraft text-emerald-400 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    {t('playitTunnels')}
                  </h4>
                  
                  {playitInfo.tunnels && playitInfo.tunnels.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">{t('playitTunnelsDesc')}</p>
                      <div className="space-y-1.5">
                        {playitInfo.tunnels.map((tunnel, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-800/40 px-3 py-2 rounded border border-gray-700/35">
                            <span className="font-mono text-xs text-cyan-300 select-all">{tunnel}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 hover:bg-gray-700/50 text-gray-400 hover:text-emerald-400 transition-colors"
                              onClick={() => handleCopy(tunnel, idx)}
                            >
                              {copiedIndex === idx ? (
                                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">Copied!</span>
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Alert className="bg-gray-800/40 border-gray-700 py-3">
                        <AlertDescription className="text-xs text-gray-300">
                          {t('playitNoTunnels')}
                        </AlertDescription>
                      </Alert>
                      <a
                        href="https://playit.gg/account/setup/new-tunnel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-emerald-400 font-semibold rounded border border-gray-700 transition-colors text-xs font-minecraft"
                      >
                        {t('playitMakeYourOwn')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 italic leading-relaxed">{t('playitInstructions')}</p>
                </div>
              )}
            </div>
          )}

          {!config.usePlayit && globalPlayitInfo && globalPlayitInfo.status === 'running' && (
            <div className="space-y-3 bg-gray-900/40 p-4 rounded-lg border border-gray-800 mt-4 animate-in fade-in duration-300">
              <h4 className="text-sm font-minecraft text-cyan-400 flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-400" />
                Global Playit.gg Agent Active
              </h4>
              <p className="text-xs text-gray-300">
                You can route this server using the global Playit agent configured in the panel settings. 
                In your Playit.gg dashboard, create a tunnel pointing to the local address:
              </p>
              <div className="bg-gray-850 px-3 py-2 rounded border border-gray-700/50 flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-300 select-all">
                  {config.id}:{config.port || (config.edition === 'BEDROCK' ? '19132' : '25565')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-gray-850/80 text-gray-400 hover:text-emerald-400"
                  onClick={() => handleCopy(`${config.id}:${config.port || (config.edition === 'BEDROCK' ? '19132' : '25565')}`, 999)}
                >
                  {copiedIndex === 999 ? (
                    <span className="text-xs text-emerald-400 font-semibold">Copied!</span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 italic">
                Note: Since they are on the same Docker network, the global agent can connect directly to this server using its server ID as the hostname.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
