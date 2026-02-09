import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Weekly Commission Trends</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { week: "Week 46", direct: 142800, binary: 78400, override: 24600 },
              { week: "Week 45", direct: 138200, binary: 74800, override: 23200 },
              { week: "Week 44", direct: 125600, binary: 68200, override: 21400 },
            ].map((week, i) => (
              <div key={i} className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{week.week}</span>
                  <span className="text-accent font-bold">
                    ${((week.direct + week.binary + week.override) / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Direct</p>
                    <p className="font-semibold">${(week.direct / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Binary</p>
                    <p className="font-semibold">${(week.binary / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Override</p>
                    <p className="font-semibold">${(week.override / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Network Growth</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">New Users (Last 30 Days)</p>
              <p className="text-3xl font-bold text-accent">+342</p>
              <p className="text-xs text-muted-foreground mt-1">↑ 23% from previous period</p>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Average Network Depth</p>
              <p className="text-3xl font-bold">8.4</p>
              <p className="text-xs text-muted-foreground mt-1">levels deep</p>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Binary Tree Balance</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Left Leg</p>
                  <p className="text-xl font-bold text-accent">54%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Right Leg</p>
                  <p className="text-xl font-bold text-primary">46%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold">Cap Usage Analytics</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">Avg Cap Usage</p>
            <p className="text-2xl font-bold text-warning">34.8%</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">Users Near Cap</p>
            <p className="text-2xl font-bold text-destructive">127</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">Total Carry-Forward</p>
            <p className="text-2xl font-bold">$284K</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">Inactive Flushes</p>
            <p className="text-2xl font-bold">23</p>
          </div>
        </div>
      </Card>
    </div>
  );
};