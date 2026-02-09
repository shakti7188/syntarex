import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { Bitcoin, Wallet, CreditCard, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
  amount: number;
  showDiscount?: boolean;
}

export const PaymentMethodSelector = ({
  selectedMethod,
  onMethodSelect,
  amount,
  showDiscount = true,
}: PaymentMethodSelectorProps) => {
  const { t } = useTranslation();
  const { data: xflowInfo } = useTokenInfo("XFLOW");

  const paymentMethods = [
    {
      id: "BTC",
      name: "Bitcoin",
      icon: Bitcoin,
      color: "hsl(28, 85%, 55%)",
      description: "Pay with Bitcoin",
    },
    {
      id: "USDC",
      name: "USDC",
      icon: Wallet,
      color: "hsl(214, 95%, 51%)",
      description: "USD Coin (ERC-20)",
    },
    {
      id: "USDT",
      name: "USDT",
      icon: Wallet,
      color: "hsl(160, 85%, 45%)",
      description: "Tether (ERC-20)",
    },
    {
      id: "XFLOW",
      name: "XFLOW",
      icon: Wallet,
      color: "hsl(280, 70%, 60%)",
      description: "XFLOW Token (BEP-20)",
      discount: xflowInfo?.payment_discount_percent || 0,
    },
    {
      id: "CARD",
      name: "Credit Card",
      icon: CreditCard,
      color: "hsl(220, 13%, 18%)",
      description: "Visa, Mastercard, Amex",
      fees: "5% withdrawal fee",
    },
  ];

  const calculateFinalAmount = (method: string) => {
    if (method === "XFLOW" && xflowInfo) {
      const discount = amount * (xflowInfo.payment_discount_percent / 100);
      return amount - discount;
    }
    return amount;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("payment.selectMethod")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const finalAmount = calculateFinalAmount(method.id);
          const hasSavings = finalAmount < amount;

          return (
            <Card
              key={method.id}
              className={cn(
                "p-4 cursor-pointer transition-all border-2",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50"
              )}
              onClick={() => onMethodSelect(method.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${method.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: method.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{method.name}</h4>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <Badge variant="default" className="text-xs">
                    {t("payment.selected")}
                  </Badge>
                )}
              </div>

              {method.discount && method.discount > 0 && showDiscount && (
                <div className="mt-2 p-2 rounded-lg bg-accent/20 border border-accent/30">
                  <div className="flex items-center gap-2 text-accent">
                    <Percent className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {method.discount}% {t("payment.discount")}!
                    </span>
                  </div>
                  <p className="text-xs mt-1">
                    {t("payment.savingsAmount", {
                      amount: (amount - finalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }),
                    })}
                  </p>
                </div>
              )}

              {method.fees && (
                <p className="text-xs text-warning mt-2">⚠️ {method.fees}</p>
              )}

              {hasSavings && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("payment.finalAmount")}:</span>
                    <span className="font-bold">${finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
