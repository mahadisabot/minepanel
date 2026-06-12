import { FC, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerConfig } from '@/lib/types/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { getPlayitLogs, PlayitStatusResponse } from '@/services/docker/fetchs';
import { Network, Lock, ExternalLink, Info, Copy } from 'lucide-react';
import Image from 'next/image';

interface TunnelsTabProps {
  serverId: string;
  config: ServerConfig;
  updateConfig: <K extends keyof ServerConfig>(field: K, value: ServerConfig[K]) => void;
  serverStatus: string;
}

export const TunnelsTab: FC<TunnelsTabProps> = ({
  serverId,
  config,
  updateConfig,
  serverStatus,
}) => {
  const { t } = useLanguage();
  const [playitInfo, setPlayitInfo] = useState<PlayitStatusResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isServerRunning = serverStatus === 'running' || serverStatus === 'starting';

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  useEffect(() => {
    if (!config.usePlayit || !serverId) {
      setPlayitInfo(null);
      return;
    }

    let active = true;
    const fetchStatus = async () => {
      try {
        const data = await getPlayitLogs(serverId);
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
  }, [config.usePlayit, serverId, serverStatus]);

  return (
    <div className="space-y-6">
      {/* Playit.gg Config & Status Card */}
      <div className="p-6 rounded-lg bg-gray-900/40 border border-gray-800 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Image src="/images/ender-pearl.webp" alt="Playit.gg" width={28} height={28} className={config.usePlayit && isServerRunning ? "animate-pulse" : ""} />
            <div>
              <h3 className="text-lg font-minecraft text-emerald-400">Playit.gg Tunnel</h3>
              <p className="text-xs text-gray-400">{t('usePlayitDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border ${
              playitInfo?.status === 'running'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : config.usePlayit && isServerRunning
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-gray-800 text-gray-400 border-gray-700/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                playitInfo?.status === 'running'
                  ? 'bg-emerald-400'
                  : config.usePlayit && isServerRunning
                    ? 'bg-amber-400'
                    : 'bg-gray-500'
              }`} />
              {playitInfo?.status
                ? playitInfo.status.toUpperCase()
                : config.usePlayit && isServerRunning
                  ? 'STARTING...'
                  : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between p-4 bg-gray-850/40 rounded-lg border border-gray-800/60">
            <div className="space-y-0.5">
              <Label htmlFor="usePlayit" className="text-gray-200 font-minecraft text-sm cursor-pointer">
                {t('usePlayit')}
              </Label>
              <p className="text-xs text-gray-400 max-w-lg">
                Enable this to automatically spin up a secure network tunnel so other players can connect without configuring your home router or firewall.
              </p>
            </div>
            <Switch
              id="usePlayit"
              disabled={isServerRunning}
              checked={config.usePlayit === true}
              onCheckedChange={(checked) => updateConfig('usePlayit', checked)}
            />
          </div>

          {isServerRunning && (
            <Alert className="bg-cyan-900/20 border-cyan-800/40 text-cyan-300">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                To enable/disable Playit or update the secret key, you must stop the Minecraft server first.
              </AlertDescription>
            </Alert>
          )}

          {config.usePlayit && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              {/* Playit Secret Key field */}
              <div className="space-y-2">
                <Label htmlFor="playitSecret" className="text-gray-200 font-minecraft text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  {t('playitSecretLabel')}
                </Label>
                <Input
                  id="playitSecret"
                  type="password"
                  autoComplete="new-password"
                  disabled={isServerRunning}
                  value={config.playitSecret || ''}
                  onChange={(e) => updateConfig('playitSecret', e.target.value)}
                  placeholder="Paste your playit agent secret key here"
                  className="bg-gray-800/70 border-gray-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/30 font-mono text-sm"
                />
                <p className="text-xs text-gray-400">{t('playitSecretDesc')}</p>
                {!config.playitSecret && (
                  <Alert className="bg-gray-950/40 border-gray-800 text-gray-300 mt-2 p-3 text-xs leading-relaxed">
                    <Info className="h-4 w-4 text-cyan-400 inline-block mr-2" />
                    <span>{t('playitInstructions')}</span>
                  </Alert>
                )}
              </div>

              {/* Claim section if claim url exists */}
              {playitInfo?.claimUrl && (
                <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200 p-4">
                  <Info className="h-5 w-5 text-amber-400" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-amber-300 text-sm">{t('playitClaimLink')}</h4>
                    <p className="text-xs text-gray-300">{t('playitClaimDesc')}</p>
                    <a
                      href={playitInfo.claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-md hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all text-xs font-minecraft"
                    >
                      {t('playitClaimLink')}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </Alert>
              )}

              {/* Active Tunnels display */}
              {isServerRunning && (
                <div className="space-y-4 bg-gray-950/60 p-5 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-minecraft text-emerald-400 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    {t('playitTunnels')}
                  </h4>
                  
                  {playitInfo?.tunnels && playitInfo.tunnels.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400">{t('playitTunnelsDesc')}</p>
                      <div className="space-y-2">
                        {playitInfo.tunnels.map((tunnel, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-900/80 px-4 py-2.5 rounded-md border border-gray-800">
                            <span className="font-mono text-xs text-cyan-300 select-all">{tunnel}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 transition-colors"
                              onClick={() => handleCopy(tunnel, idx)}
                            >
                              {copiedIndex === idx ? (
                                <span className="text-xs text-emerald-400 font-semibold">Copied!</span>
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Alert className="bg-gray-900/60 border-gray-800 py-3">
                        <AlertDescription className="text-xs text-gray-300">
                          {playitInfo?.status === 'running' 
                            ? t('playitNoTunnels')
                            : 'Playit client is starting or authenticating. Please wait a few seconds...'}
                        </AlertDescription>
                      </Alert>
                      {playitInfo?.status === 'running' && (
                        <a
                          href="https://playit.gg/account/setup/new-tunnel"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-emerald-400 font-semibold rounded border border-gray-700 transition-colors text-xs font-minecraft"
                        >
                          {t('playitMakeYourOwn')}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 italic leading-relaxed pt-2 border-t border-gray-900">{t('playitInstructions')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
