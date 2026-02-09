import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const WeeklySettlement = () => {
  const { t } = useTranslation();
  const settlements = [
    {
      week: "Week 45, 2025",
      date: "Nov 3 - Nov 9",
      status: "Completed",
      total: 12458,
      breakdown: {
        direct: 6980,
        binary: 3600,
        override: 1540,
        carryForward: 338,
      },
    },
    {
      week: "Week 44, 2025",
      date: "Oct 27 - Nov 2",
      status: "Completed",
      total: 10230,
      breakdown: {
        direct: 5820,
        binary: 3100,
        override: 1310,
        carryForward: 0,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-accent/10 via-card to-card border-accent/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">{t("settlements.currentWeek")}</h3>
              <Badge variant="outline" className="border-accent text-accent">{t("settlements.statusInProgress")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("settlements.weekInfo", { week: "46, 2025", dates: "Nov 10 - Nov 16" })}</p>
            
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("settlements.projectedEarnings")}</p>
                <p className="text-2xl font-bold text-accent">$8,420</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("settlements.direct")}</p>
                <p className="text-xl font-semibold">$4,680</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("settlements.binary")}</p>
                <p className="text-xl font-semibold">$2,890</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("settlements.override")}</p>
                <p className="text-xl font-semibold">$850</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-muted-foreground">
                {t("settlements.autoProcessInfo")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("settlements.previousSettlements")}</h3>
        {settlements.map((settlement, i) => (
          <Card key={i} className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold">{settlement.week}</h4>
                <p className="text-sm text-muted-foreground">{settlement.date}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">{t("settlements.statusCompleted")}</Badge>
                <p className="text-2xl font-bold text-accent mt-1">
                  ${settlement.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("settlements.directLabel")}</p>
                <p className="font-semibold">${settlement.breakdown.direct.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("settlements.binaryLabel")}</p>
                <p className="font-semibold">${settlement.breakdown.binary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("settlements.overrideLabel")}</p>
                <p className="font-semibold">${settlement.breakdown.override.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("settlements.carryForward")}</p>
                <p className="font-semibold text-warning">
                  ${settlement.breakdown.carryForward.toLocaleString()}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              {t("settlements.viewDetails")}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};