import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Shield } from "lucide-react";
import { useEncryptSecret } from "@/hooks/useEncryptedSecrets";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  pool_provider: z.enum(['ANTPOOL', 'F2POOL']),
  pool_name: z.string().min(1, "Pool name is required").max(100),
  api_key: z.string().optional(),
  api_secret: z.string().min(1, "API secret/token is required"),
  subaccount: z.string().optional(),
  base_url: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export const AddPoolConnectionModal = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const encryptSecret = useEncryptSecret();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pool_provider: 'ANTPOOL',
      pool_name: '',
      api_key: '',
      api_secret: '',
      subaccount: '',
      base_url: '',
    },
  });

  const poolProvider = form.watch('pool_provider');

  const testConnection = async (data: FormData) => {
    setTesting(true);
    try {
      const testFunction = data.pool_provider === 'ANTPOOL'
        ? 'mining-pool-test-antpool'
        : 'mining-pool-test-f2pool';

      const payload = data.pool_provider === 'ANTPOOL'
        ? {
            api_key: data.api_key,
            api_secret: data.api_secret,
            subaccount: data.subaccount || undefined,
          }
        : {
            api_token: data.api_secret,
            account_name: data.subaccount || data.pool_name,
          };

      const { data: result, error } = await supabase.functions.invoke(testFunction, {
        body: payload,
      });

      if (error) throw error;

      if (result.status === 'connected') {
        toast({
          title: t('pools.connectionSuccess'),
          description: `${t('pools.connectedTo')} ${data.pool_provider.toUpperCase()}`,
        });
        return true;
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error: any) {
      toast({
        title: t('pools.connectionFailed'),
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Encrypt API key (if provided) using the secure subsystem
      let apiKeySecretId = null;
      if (data.api_key) {
        const apiKeyResult = await encryptSecret.mutateAsync({
          secretType: 'MINING_POOL_API_KEY',
          value: data.api_key,
          metadata: {
            pool_provider: data.pool_provider,
            pool_name: data.pool_name,
          },
        });
        apiKeySecretId = apiKeyResult.id;
      }

      // Encrypt API secret using the secure subsystem
      const apiSecretResult = await encryptSecret.mutateAsync({
        secretType: 'MINING_POOL_API_SECRET',
        value: data.api_secret,
        metadata: {
          pool_provider: data.pool_provider,
          pool_name: data.pool_name,
        },
      });

      // Store pool config with references to encrypted secrets
      const { error } = await supabase.from('mining_pool_configs').insert([{
        user_id: user.id,
        pool_provider: data.pool_provider,
        pool_name: data.pool_name,
        api_key: '', // Legacy field, keep empty for security
        api_secret: '', // Legacy field, keep empty for security
        api_key_secret_id: apiKeySecretId,
        api_secret_secret_id: apiSecretResult.id,
        uses_encrypted_secrets: true,
        subaccount: data.subaccount || null,
        base_url: data.base_url || null,
        is_active: true,
      }]);

      if (error) throw error;

      toast({
        title: t('pools.poolAdded'),
        description: t('pools.credentialsEncrypted'),
        action: <Shield className="h-4 w-4 text-green-500" />,
      });

      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: t('pools.addFailed'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('pools.addConnection')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pools.addPoolConnection')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pool_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.poolProvider')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pools.selectProvider')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ANTPOOL">AntPool</SelectItem>
                      <SelectItem value="F2POOL">F2Pool</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pool_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.poolName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="My Mining Pool" {...field} />
                  </FormControl>
                  <FormDescription>{t('pools.friendlyName')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {poolProvider === 'ANTPOOL' && (
              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pools.apiKey')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Your AntPool API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="api_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {poolProvider === 'ANTPOOL' ? t('pools.apiSecret') : t('pools.apiToken')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={poolProvider === 'ANTPOOL' ? 'Your API secret' : 'Your F2Pool API token'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subaccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {poolProvider === 'ANTPOOL' ? t('pools.subaccount') : t('pools.accountName')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={poolProvider === 'ANTPOOL' ? 'Subaccount name' : 'Your F2Pool account name'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.baseUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('pools.baseUrlPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{t('pools.baseUrlDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnection(form.getValues())}
                disabled={testing}
                className="flex-1"
              >
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('pools.testConnection')}
              </Button>
              <Button type="submit" className="flex-1">
                {t('pools.addPool')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
