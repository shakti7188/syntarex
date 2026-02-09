import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManualWalletEntry } from './ManualWalletEntry';
import { WalletNetwork } from '@/lib/validation-schemas';
import { toast } from 'sonner';

export const WalletButton = () => {
  const { user } = useAuth();
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<WalletNetwork>('SOLANA');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletAddress();
    }
  }, [user]);

  const fetchWalletAddress = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_network')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setLinkedWallet(data.wallet_address);
      setWalletNetwork((data.wallet_network as WalletNetwork) || 'SOLANA');
    }
  };

  const handleSubmit = async (address: string, network: WalletNetwork) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      // Check if wallet is already linked to another account
      const { data: existingWallet } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', address)
        .neq('id', user.id)
        .maybeSingle();

      if (existingWallet) {
        toast.error('This wallet is already linked to another account');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: address,
          wallet_network: network,
          wallet_link_method: 'MANUAL'
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setLinkedWallet(address);
      setWalletNetwork(network);
      setIsOpen(false);
      toast.success('Wallet linked successfully');
    } catch (error) {
      toast.error('Failed to link wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {linkedWallet ? (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
          >
            <div 
              className={`w-2 h-2 rounded-full ${
                walletNetwork === 'SOLANA' ? 'bg-purple-500' : walletNetwork === 'TRON' ? 'bg-red-500' : 'bg-blue-500'
              }`}
            />
            <span className="text-sm font-medium font-mono text-foreground">
              {truncateAddress(linkedWallet)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-semibold">Link Wallet</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {linkedWallet ? 'Manage Wallet' : 'Link Your Wallet'}
          </DialogTitle>
        </DialogHeader>
        <ManualWalletEntry 
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
          isSubmitting={isSubmitting}
          showCancel={true}
        />
      </DialogContent>
    </Dialog>
  );
};