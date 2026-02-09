import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Zap, DollarSign, MapPin } from "lucide-react";
import { MachineType } from "@/hooks/useMachineTypes";
import { useTranslation } from "react-i18next";

interface MachineCardProps {
  machine: MachineType;
  onPurchase: (machine: MachineType) => void;
}

export const MachineCard = ({ machine, onPurchase }: MachineCardProps) => {
  const { t } = useTranslation();
  
  const getStatusBadge = () => {
    if (machine.status === 'PRE_ORDER') {
      return <Badge variant="secondary">{t('mining.preOrder')}</Badge>;
    }
    if (machine.available_quantity > 0) {
      return <Badge variant="default">{t('mining.inStock')}</Badge>;
    }
    return <Badge variant="outline">{t('mining.outOfStock')}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          {getStatusBadge()}
        </div>
        <CardTitle className="text-xl">{machine.brand} {machine.model}</CardTitle>
        <CardDescription className="text-2xl font-bold text-foreground">
          ${machine.price_usdt.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {machine.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {machine.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('mining.hashrate')}</span>
            <span className="font-medium">{machine.hash_rate_ths} TH/s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('mining.power')}</span>
            <span className="font-medium">{machine.power_watts}W</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('mining.efficiency')}</span>
            <span className="font-medium">{machine.efficiency_j_per_th} J/TH</span>
          </div>
          {machine.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('mining.location')}
              </span>
              <span className="font-medium">{machine.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('mining.available')}</span>
            <span className="font-medium">{machine.available_quantity} {t('mining.units')}</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={() => onPurchase(machine)}
          disabled={machine.available_quantity === 0}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          {machine.status === 'PRE_ORDER' ? t('mining.preOrderNow') : t('mining.purchaseMachine')}
        </Button>
      </CardContent>
    </Card>
  );
};
