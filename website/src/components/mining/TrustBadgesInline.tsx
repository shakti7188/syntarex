import { Shield, Users, Clock, CheckCircle, Lock } from "lucide-react";

interface TrustBadgesInlineProps {
  variant?: "horizontal" | "vertical";
  showStats?: boolean;
}

export const TrustBadgesInline = ({ variant = "horizontal", showStats = true }: TrustBadgesInlineProps) => {
  const badges = [
    { icon: Lock, label: "256-bit Encrypted", color: "text-green-600" },
    { icon: Shield, label: "Secure Payments", color: "text-blue-600" },
    { icon: Clock, label: "24h Activation", color: "text-amber-600" },
    { icon: CheckCircle, label: "Verified Hashrate", color: "text-emerald-600" },
  ];

  const stats = [
    { icon: Users, value: "847+", label: "packages sold this week" },
  ];

  if (variant === "vertical") {
    return (
      <div className="space-y-3">
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <badge.icon className={`h-4 w-4 ${badge.color}`} />
            <span className="text-muted-foreground">{badge.label}</span>
          </div>
        ))}
        {showStats && stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 text-sm pt-2 border-t">
            <stat.icon className="h-4 w-4 text-primary" />
            <span>
              <strong>{stat.value}</strong> {stat.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
          <span>{badge.label}</span>
        </div>
      ))}
      {showStats && stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-1.5 text-foreground font-medium">
          <stat.icon className="h-3.5 w-3.5 text-primary" />
          <span>{stat.value} {stat.label}</span>
        </div>
      ))}
    </div>
  );
};
