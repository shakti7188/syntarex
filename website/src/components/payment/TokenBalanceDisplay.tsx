import { Card } from "@/components/ui/card";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { Bitcoin, Wallet, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const TokenBalanceDisplay = () => {
  const { t } = useTranslation();
  const { data: balances, isLoading } = useTokenBalances();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const getIcon = (tokenType: string) => {
    if (tokenType === "BTC") return Bitcoin;
    return Wallet;
  };

  const getColor = (tokenType: string) => {
    const colors: Record<string, string> = {
      BTC: "hsl(28, 85%, 55%)",
      USDC: "hsl(214, 95%, 51%)",
      USDT: "hsl(160, 85%, 45%)",
      XFLOW: "hsl(280, 70%, 60%)",
    };
    return colors[tokenType] || "hsl(var(--primary))";
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{t("payment.myBalances")}</h3>
      {!balances || balances.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("payment.noBalances")}
        </p>
      ) : (
        <div className="space-y-3">
          {balances.map((balance) => {
            const Icon = getIcon(balance.token_type);
            const color = getColor(balance.token_type);
            const availableBalance = balance.balance - balance.locked_balance;

            return (
              <div
                key={balance.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold">{balance.token_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("payment.available")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{availableBalance.toLocaleString()}</p>
                  {balance.locked_balance > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {balance.locked_balance.toLocaleString()} {t("payment.locked")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
