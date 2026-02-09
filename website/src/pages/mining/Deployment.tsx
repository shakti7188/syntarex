import { DeploymentTimeline } from "@/components/deployment/DeploymentTimeline";
import { useMachineInventory } from "@/hooks/useMachineInventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

const Deployment = () => {
  const { t } = useTranslation();
  const { data: machines, isLoading } = useMachineInventory();

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              {t('mining.deploymentTracking')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('mining.deploymentDesc')}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : !machines || machines.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('mining.noMachinesFound')}</h3>
              <p className="text-muted-foreground">
                {t('mining.noMachinesFoundDesc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={machines[0].id} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {machines.map((machine) => (
                <TabsTrigger key={machine.id} value={machine.id}>
                  {machine.machineType.brand} {machine.machineType.model}
                </TabsTrigger>
              ))}
            </TabsList>
            {machines.map((machine) => (
              <TabsContent key={machine.id} value={machine.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('mining.machineDetails')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('mining.model')}</p>
                        <p className="font-semibold">{machine.machineType.brand} {machine.machineType.model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('mining.hashrate')}</p>
                        <p className="font-semibold">{machine.machineType.hashRateThs} TH/s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('mining.location')}</p>
                        <p className="font-semibold">{machine.location || machine.machineType.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <DeploymentTimeline machineId={machine.id} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
  );
};

export default Deployment;
