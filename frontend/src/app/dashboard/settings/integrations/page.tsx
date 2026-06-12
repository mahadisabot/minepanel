'use client';

import { useEffect, useState } from 'react';
import { Key, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getSettings, testDiscordWebhook, updateSettings, UserSettings, getNgrokStatus, NgrokStatusResponse, getUpnpRouterStatus, UpnpRouterStatusResponse } from '@/services/settings/settings.service';
import { mcToast } from '@/lib/utils/minecraft-toast';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { getCurrentUser } from '@/services/users/users.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';


export default function IntegrationsSettingsPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [canManageSystemSettings, setCanManageSystemSettings] = useState(false);
  const [ngrokStatus, setNgrokStatus] = useState<NgrokStatusResponse | null>(null);
  const [upnpStatus, setUpnpStatus] = useState<UpnpRouterStatusResponse | null>(null);
  const form = useForm<UserSettings>({ defaultValues: { cfApiKey: '', discordWebhook: '', panelPlayitSecret: '', ngrokAuthtoken: '', useUpnp: false } });

  useEffect(() => {
    Promise.all([getSettings(), getCurrentUser(), getNgrokStatus(), getUpnpRouterStatus()])
      .then(([settings, user, ngrok, upnp]) => {
        setCanManageSystemSettings(user.role === 'ADMIN' || user.access.permissions.accessAllServers);
        form.reset(settings);
        setNgrokStatus(ngrok);
        setUpnpStatus(upnp);
      })
      .catch((error) => {
        console.error('Error loading settings:', error);
        mcToast.error(t('errorLoadingServerInfo'));
      })
      .finally(() => setIsLoading(false));
  }, [form, t]);


  if (!isLoading && !canManageSystemSettings) {
    return (
      <div className="max-w-3xl">
        <Card className="border-2 border-gray-700/60 bg-gray-900/80 backdrop-blur-md shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                <Key className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white font-minecraft">{t('integrationsSettingsTitle')}</CardTitle>
                <CardDescription className="text-gray-400">{t('settingsRestrictedDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: UserSettings) => {
    setIsSaving(true);
    try {
      await updateSettings({ cfApiKey: data.cfApiKey, discordWebhook: data.discordWebhook, panelPlayitSecret: data.panelPlayitSecret, ngrokAuthtoken: data.ngrokAuthtoken, useUpnp: data.useUpnp });
      mcToast.success(t('settingsSaved'));
      // Reload ngrok and UPnP status after short delay
      setTimeout(async () => {
        try {
          const [ngrok, upnp] = await Promise.all([getNgrokStatus(), getUpnpRouterStatus()]);
          setNgrokStatus(ngrok);
          setUpnpStatus(upnp);
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      mcToast.error(t('settingsSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    try {
      const result = await testDiscordWebhook();
      if (result.success) {
        mcToast.success(t('webhookTestSuccess'));
      } else {
        mcToast.error(result.message);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      mcToast.error(t('webhookTestFailed'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Card className="border-2 border-gray-700/60 bg-gray-900/80 backdrop-blur-md shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
              <Key className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white font-minecraft">{t('integrationsSettingsTitle')}</CardTitle>
              <CardDescription className="text-gray-400">{t('integrationsSettingsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-300">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('loading')}
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="cfApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">{t('curseforgeApiKey')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••••••••••" className="bg-gray-800 border-gray-700 text-white" />
                        </FormControl>
                        <FormDescription className="text-gray-400">{t('curseforgeApiKeyDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discordWebhook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">{t('discordWebhook')}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://discord.com/api/webhooks/..." className="flex-1 bg-gray-800 border-gray-700 text-white" />
                          </FormControl>
                          <Button type="button" variant="outline" onClick={handleTestWebhook} disabled={isTesting || !field.value} className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('test')}
                          </Button>
                        </div>
                        <FormDescription className="text-gray-400">{t('discordWebhookDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelPlayitSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">{t('panelPlayitSecretLabel')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••••••••••" className="bg-gray-800 border-gray-700 text-white" />
                        </FormControl>
                        <FormDescription className="text-gray-400">{t('panelPlayitSecretDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ngrokAuthtoken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">{t('ngrokAuthtokenLabel')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••••••••••" className="bg-gray-800 border-gray-700 text-white" />
                        </FormControl>
                        <FormDescription className="text-gray-400">{t('ngrokAuthtokenDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {ngrokStatus?.status === 'running' && ngrokStatus.url && (
                    <Alert className="bg-emerald-950/20 border-emerald-800/40 text-emerald-300 mt-2">
                      <AlertDescription className="w-full">
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="font-semibold text-xs font-minecraft text-emerald-400">Ngrok Tunnel Active</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 bg-gray-950/40 p-2.5 rounded border border-gray-800/80 mt-1 w-full max-w-lg">
                            <a
                              href={ngrokStatus.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-cyan-300 hover:text-cyan-400 underline decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors select-all break-all flex-1 min-w-0"
                            >
                              {ngrokStatus.url}
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 transition-colors shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(ngrokStatus.url!);
                                mcToast.success('Copied to clipboard!');
                              }}
                            >
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {ngrokStatus?.status === 'offline' && form.getValues('ngrokAuthtoken') && (
                    <Alert className="bg-amber-950/20 border-amber-800/40 text-amber-300 mt-2">
                      <AlertDescription className="w-full">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Ngrok Tunnel is connecting or offline. Check your authtoken if this persists.</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="useUpnp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 bg-gray-950/20 p-4 mt-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-200 text-sm font-semibold">Enable UPnP Port Forwarding</FormLabel>
                          <FormDescription className="text-gray-400 text-xs max-w-xl">
                            Automatically open Minecraft server ports on your router using UPnP when servers start up, and close them when they stop.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('useUpnp') && upnpStatus && (
                    <Alert className={`mt-2 ${upnpStatus.online ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
                      <AlertDescription className="w-full">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`h-2 w-2 rounded-full ${upnpStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          <span>
                            {upnpStatus.online 
                              ? `UPnP Router Online (External IP: ${upnpStatus.externalIp || 'Unknown'})` 
                              : `UPnP Router Offline/Disabled: ${upnpStatus.error || 'Check router settings'}`}
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-minecraft mt-6">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSaving ? t('saving') : t('saveChanges')}
                  </Button>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
