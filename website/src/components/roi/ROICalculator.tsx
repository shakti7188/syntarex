import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calculator, TrendingUp, Zap, DollarSign, RefreshCw, Bitcoin, 
  Activity, Info, ChevronDown, Calendar, Target, Wallet, Settings2,
  AlertTriangle, Clock, CheckCircle2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";
import { usePackages, Package } from "@/hooks/usePackages";
import { format, addMonths } from "date-fns";

interface ROIData {
  month: number;
  date: string;
  revenue: number;
  cumulative: number;
  cumulativeConservative: number;
  cumulativeOptimistic: number;
}

type PriceScenario = "conservative" | "current" | "moderate" | "optimistic";

const PLUG_IN_DATE = new Date("2026-02-01");

const priceScenarioMultipliers: Record<PriceScenario, number> = {
  conservative: 0.8,
  current: 1.0,
  moderate: 1.2,
  optimistic: 1.5,
};

const priceScenarioLabels: Record<PriceScenario, string> = {
  conservative: "Conservative (-20%)",
  current: "Current Price",
  moderate: "Moderate (+20%)",
  optimistic: "Optimistic (+50%)",
};

export const ROICalculator = () => {
  const { data: marketData, isLoading: marketLoading, refetch, dataUpdatedAt } = useBitcoinMarketData();
  const { data: packages, isLoading: packagesLoading } = usePackages();
  
  // Mode selection
  const [isCloudMining, setIsCloudMining] = useState(true);
  
  // Package selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>("custom");
  
  // Manual inputs
  const [hashrate, setHashrate] = useState<number>(10);
  const [investment, setInvestment] = useState<number>(1000);
  const [btcPrice, setBtcPrice] = useState<number>(90000);
  
  // Self-hosted inputs (only used when not cloud mining)
  const [electricityCost, setElectricityCost] = useState<number>(0.08);
  const [powerWatts, setPowerWatts] = useState<number>(3250);
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [difficultyGrowth, setDifficultyGrowth] = useState<number>(7);
  const [poolFee, setPoolFee] = useState<number>(1);
  const [priceScenario, setPriceScenario] = useState<PriceScenario>("current");

  // Update BTC price when market data loads
  useEffect(() => {
    if (marketData?.price) {
      setBtcPrice(marketData.price);
    }
  }, [marketData]);

  // Update inputs when package is selected
  useEffect(() => {
    if (selectedPackageId !== "custom" && packages) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (pkg) {
        setHashrate(pkg.hashrate_ths);
        setInvestment(pkg.price_usd);
      }
    }
  }, [selectedPackageId, packages]);

  const selectedPackage = useMemo(() => {
    if (selectedPackageId === "custom" || !packages) return null;
    return packages.find(p => p.id === selectedPackageId) || null;
  }, [selectedPackageId, packages]);

  // Calculate metrics and chart data
  const { metrics, roiData, packageComparison } = useMemo(() => {
    if (!marketData) {
      return { 
        metrics: null, 
        roiData: [], 
        packageComparison: [] 
      };
    }

    const calculateForHashrate = (ths: number, inv: number, btcPriceOverride?: number) => {
      const currentBtcPrice = btcPriceOverride || btcPrice;
      const hashrateInHs = ths * 1e12;
      const secondsPerDay = 86400;
      const pow232 = Math.pow(2, 32);
      const difficulty = marketData.difficulty;
      const blockReward = marketData.blockReward;
      
      // Base daily BTC calculation
      const dailyBTC = (hashrateInHs * blockReward * secondsPerDay) / (difficulty * pow232);
      
      // Apply pool fee
      const dailyBTCAfterFee = dailyBTC * (1 - poolFee / 100);
      
      // Cloud mining has no electricity cost
      const dailyElecCost = isCloudMining ? 0 : ((powerWatts * 24) / 1000) * electricityCost;
      
      const dailyUSD = dailyBTCAfterFee * currentBtcPrice;
      const dailyProfit = dailyUSD - dailyElecCost;
      const monthlyProfit = dailyProfit * 30;
      
      // Calculate annual values
      const annualProfit = dailyProfit * 365;
      const annualROI = inv > 0 ? (annualProfit / inv) * 100 : 0;
      
      // Calculate break-even considering difficulty growth
      let totalProfit = 0;
      let breakEvenMonth = 0;
      let currentDailyProfit = dailyProfit;
      
      for (let month = 1; month <= 60; month++) {
        // Apply monthly difficulty growth
        const monthlyDifficultyGrowth = Math.pow(1 + difficultyGrowth / 100 / 12, month);
        const adjustedDailyProfit = dailyProfit / monthlyDifficultyGrowth;
        totalProfit += adjustedDailyProfit * 30;
        
        if (totalProfit >= inv && breakEvenMonth === 0) {
          breakEvenMonth = month;
        }
      }
      
      return {
        dailyBTC: dailyBTCAfterFee,
        dailyUSD,
        dailyElecCost,
        dailyProfit,
        monthlyProfit,
        annualProfit,
        annualROI,
        breakEvenMonth: breakEvenMonth || Infinity,
      };
    };

    // Main metrics calculation
    const mainMetrics = calculateForHashrate(hashrate, investment);
    
    // Calculate break-even date from plug-in date
    const breakEvenDate = addMonths(PLUG_IN_DATE, Math.ceil(mainMetrics.breakEvenMonth));
    
    // Generate chart data with multiple scenarios
    const chartData: ROIData[] = [];
    let cumulativeCurrent = -investment;
    let cumulativeConservative = -investment;
    let cumulativeOptimistic = -investment;
    
    for (let month = 0; month <= 24; month++) {
      const monthlyDifficultyGrowth = Math.pow(1 + difficultyGrowth / 100 / 12, month);
      
      // Current scenario
      const currentMonthlyProfit = mainMetrics.monthlyProfit / monthlyDifficultyGrowth;
      cumulativeCurrent += month === 0 ? 0 : currentMonthlyProfit;
      
      // Conservative scenario (-20% BTC price)
      const conservativeMetrics = calculateForHashrate(hashrate, investment, btcPrice * 0.8);
      const conservativeMonthlyProfit = conservativeMetrics.monthlyProfit / monthlyDifficultyGrowth;
      cumulativeConservative += month === 0 ? 0 : conservativeMonthlyProfit;
      
      // Optimistic scenario (+50% BTC price)
      const optimisticMetrics = calculateForHashrate(hashrate, investment, btcPrice * 1.5);
      const optimisticMonthlyProfit = optimisticMetrics.monthlyProfit / monthlyDifficultyGrowth;
      cumulativeOptimistic += month === 0 ? 0 : optimisticMonthlyProfit;
      
      const futureDate = addMonths(PLUG_IN_DATE, month);
      
      chartData.push({
        month,
        date: format(futureDate, "MMM yyyy"),
        revenue: currentMonthlyProfit,
        cumulative: cumulativeCurrent,
        cumulativeConservative,
        cumulativeOptimistic,
      });
    }
    
    // Package comparison data
    const comparisonData = (packages || []).map(pkg => {
      const pkgMetrics = calculateForHashrate(pkg.hashrate_ths, pkg.price_usd);
      return {
        ...pkg,
        dailyBTC: pkgMetrics.dailyBTC,
        monthlyUSD: pkgMetrics.monthlyProfit,
        breakEvenMonth: pkgMetrics.breakEvenMonth,
        annualROI: pkgMetrics.annualROI,
      };
    });
    
    return {
      metrics: {
        ...mainMetrics,
        breakEvenDate: format(breakEvenDate, "MMM yyyy"),
        twoYearBTC: mainMetrics.dailyBTC * 730, // Simplified, doesn't account for difficulty
        twoYearUSD: chartData[24]?.cumulative + investment || 0,
      },
      roiData: chartData,
      packageComparison: comparisonData,
    };
  }, [marketData, hashrate, investment, btcPrice, electricityCost, powerWatts, difficultyGrowth, poolFee, isCloudMining, packages]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "N/A";

  return (
    <div className="space-y-6">
      {/* Live Network Stats */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live Bitcoin Network Stats
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={marketLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${marketLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-xs">
            Last updated: {lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Bitcoin className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-muted-foreground">BTC Price</p>
              <p className="text-lg font-bold">${marketData?.price.toLocaleString() || "—"}</p>
              {marketData?.priceChange24h !== undefined && (
                <p className={`text-xs ${marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                </p>
              )}
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">Network Hashrate</p>
              <p className="text-lg font-bold">{marketData?.networkHashrate.toFixed(0) || "—"} EH/s</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Target className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-xs text-muted-foreground">Difficulty</p>
              <p className="text-lg font-bold">{marketData?.difficulty ? (marketData.difficulty / 1e12).toFixed(2) + "T" : "—"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Bitcoin className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xs text-muted-foreground">Block Reward</p>
              <p className="text-lg font-bold">{marketData?.blockReward || "3.125"} BTC</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground">Daily $/TH/s</p>
              <p className="text-lg font-bold">${marketData?.dailyEarningsPerThs.toFixed(3) || "—"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">Plug-in Date</p>
              <p className="text-lg font-bold">Feb 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator Inputs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Profitability Calculator
              </CardTitle>
              <CardDescription>
                Calculate your potential Bitcoin mining returns
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="cloud-mode" className="text-sm text-muted-foreground">
                {isCloudMining ? "SynteraX Cloud Mining" : "Self-Hosted Mining"}
              </Label>
              <Switch
                id="cloud-mode"
                checked={isCloudMining}
                onCheckedChange={setIsCloudMining}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Package Selector */}
          {isCloudMining && (
            <div className="space-y-2">
              <Label>Select SynteraX Package</Label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package or enter custom values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Values</SelectItem>
                  {packages?.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price_usd.toLocaleString()} ({pkg.hashrate_ths} TH/s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPackage && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{selectedPackage.hashrate_ths} TH/s</Badge>
                  <Badge variant="secondary">{selectedPackage.xflow_tokens.toLocaleString()} XFLOW</Badge>
                  <Badge variant="outline">{selectedPackage.tier}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Main Inputs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hashrate">Hashrate (TH/s)</Label>
              <Input
                id="hashrate"
                type="number"
                value={hashrate}
                onChange={(e) => {
                  setHashrate(Number(e.target.value));
                  if (selectedPackageId !== "custom") setSelectedPackageId("custom");
                }}
                min="0"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment">Investment ($)</Label>
              <Input
                id="investment"
                type="number"
                value={investment}
                onChange={(e) => {
                  setInvestment(Number(e.target.value));
                  if (selectedPackageId !== "custom") setSelectedPackageId("custom");
                }}
                min="0"
                step="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btcPrice">BTC Price ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="btcPrice"
                  type="number"
                  value={btcPrice}
                  onChange={(e) => setBtcPrice(Number(e.target.value))}
                  min="0"
                  step="1000"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (marketData?.price) setBtcPrice(marketData.price);
                    refetch();
                  }}
                  disabled={marketLoading}
                  title="Reset to current price"
                >
                  <RefreshCw className={`h-4 w-4 ${marketLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Self-hosted inputs */}
            {!isCloudMining && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="electricity">Electricity Cost ($/kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power">Power Consumption (W)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>
              </>
            )}
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced Settings
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Difficulty Growth (% per year)</Label>
                    <span className="text-sm font-medium">{difficultyGrowth}%</span>
                  </div>
                  <Slider
                    value={[difficultyGrowth]}
                    onValueChange={([v]) => setDifficultyGrowth(v)}
                    min={0}
                    max={20}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Historical average: ~7% per year
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Pool Fee (%)</Label>
                    <span className="text-sm font-medium">{poolFee}%</span>
                  </div>
                  <Slider
                    value={[poolFee]}
                    onValueChange={([v]) => setPoolFee(v)}
                    min={0}
                    max={3}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    SynteraX uses 1% pool fee
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>BTC Price Scenario</Label>
                  <Select value={priceScenario} onValueChange={(v) => setPriceScenario(v as PriceScenario)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priceScenarioLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Daily BTC Mined</p>
                  <p className="text-xl font-bold">{metrics.dailyBTC.toFixed(6)} BTC</p>
                  <p className="text-sm text-green-600">${metrics.dailyUSD.toFixed(2)}/day</p>
                </div>
                <Bitcoin className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  <p className="text-xl font-bold">${metrics.monthlyProfit.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">{(metrics.dailyBTC * 30).toFixed(5)} BTC</p>
                </div>
                <Wallet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Annual ROI</p>
                  <p className="text-xl font-bold">{metrics.annualROI.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">${metrics.annualProfit.toFixed(0)}/year</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Break-Even</p>
                  <p className="text-xl font-bold">
                    {metrics.breakEvenMonth === Infinity ? "N/A" : `${metrics.breakEvenMonth} mo`}
                  </p>
                  <p className="text-sm text-muted-foreground">{metrics.breakEvenDate}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ROI Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            24-Month Profitability Projection
          </CardTitle>
          <CardDescription>
            Showing multiple BTC price scenarios with {difficultyGrowth}% annual difficulty growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval={3}
                />
                <YAxis 
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`$${value.toFixed(0)}`, name]}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeOptimistic" 
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Optimistic (+50%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={false}
                  name="Current Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeConservative" 
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Conservative (-20%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Package Comparison Table */}
      {packageComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Package Comparison
            </CardTitle>
            <CardDescription>
              Compare all SynteraX packages based on current network conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Hashrate</TableHead>
                    <TableHead className="text-right">Daily BTC</TableHead>
                    <TableHead className="text-right">Monthly USD</TableHead>
                    <TableHead className="text-right">Break-Even</TableHead>
                    <TableHead className="text-right">Annual ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packageComparison.map((pkg) => (
                    <TableRow 
                      key={pkg.id}
                      className={selectedPackageId === pkg.id ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">
                        {pkg.name}
                        {selectedPackageId === pkg.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">${pkg.price_usd.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{pkg.hashrate_ths} TH/s</TableCell>
                      <TableCell className="text-right">{pkg.dailyBTC.toFixed(6)}</TableCell>
                      <TableCell className="text-right">${pkg.monthlyUSD.toFixed(0)}</TableCell>
                      <TableCell className="text-right">
                        {pkg.breakEvenMonth === Infinity ? "N/A" : `${pkg.breakEvenMonth} mo`}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={pkg.annualROI > 0 ? "text-green-600" : "text-red-600"}>
                          {pkg.annualROI.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimers */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Important Disclaimers</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>All projections are <strong>estimates</strong> based on current network conditions and may vary significantly.</li>
                <li>Bitcoin mining difficulty adjusts approximately every 2 weeks and has historically increased ~7% per year.</li>
                <li>BTC price is highly volatile and can move significantly in either direction.</li>
                <li><strong>Plug-in Date:</strong> Mining operations begin February 1, 2026. Earnings projections start from this date.</li>
                <li>Past performance does not guarantee future results. Mining profitability depends on many factors.</li>
              </ul>
              <p className="pt-2">
                <a href="/bitcoin-mining" className="text-primary hover:underline inline-flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Learn more about Bitcoin mining
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
