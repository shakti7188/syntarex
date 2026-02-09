import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronRight, Sparkles, Wallet } from "lucide-react";
import { useUserNFTs } from "@/hooks/useUserNFTs";
import { NFTReceiptCard } from "./NFTReceiptCard";
import { NFTDetailModal } from "./NFTDetailModal";
import { useState } from "react";
import { PurchaseNFT } from "@/hooks/useUserNFTs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const MyNFTsWidget = () => {
  const { nfts, stats, isLoading } = useUserNFTs();
  const [selectedNFT, setSelectedNFT] = useState<PurchaseNFT | null>(null);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Award className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No NFT Certificates Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Purchase a mining package to receive your NFT receipt
          </p>
          <Button onClick={() => navigate('/mining/buy-machines')} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Browse Packages
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            NFT Certificates
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats.minted > 0 && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                {stats.minted} Minted
              </Badge>
            )}
            {stats.pending > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {stats.pending} Pending
              </Badge>
            )}
            {stats.walletRequired > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                <Wallet className="h-3 w-3 mr-1" />
                {stats.walletRequired} Need Wallet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {nfts.slice(0, 3).map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NFTReceiptCard 
                  nft={nft} 
                  compact 
                  onClick={() => setSelectedNFT(nft)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {nfts.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/nfts')}
            >
              View All {nfts.length} Certificates
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      <NFTDetailModal 
        nft={selectedNFT}
        open={!!selectedNFT}
        onClose={() => setSelectedNFT(null)}
      />
    </>
  );
};
