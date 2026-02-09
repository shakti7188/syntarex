import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, DollarSign, TrendingUp, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TestResults() {
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [directComms, setDirectComms] = useState<any[]>([]);
  const [binaryComms, setBinaryComms] = useState<any[]>([]);
  const [overrideComms, setOverrideComms] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  useEffect(() => {
    loadTestResults();
  }, []);

  const loadTestResults = async () => {
    try {
      // Get current week start
      const now = new Date();
      const ws = new Date(now.setDate(now.getDate() - now.getDay()));
      ws.setHours(0, 0, 0, 0);
      const weekStartStr = ws.toISOString().split('T')[0];
      setWeekStart(weekStartStr);

      // Fetch all data
      const txResult = await supabase
        .from('transactions')
        .select('id, amount, created_at, user_id')
        .eq('week_start', weekStartStr)
        .order('created_at');

      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, email, sponsor_id, binary_parent_id, binary_position')
        .order('created_at', { ascending: false })
        .limit(10);

      const directResult = await supabase
        .from('direct_commissions')
        .select('id, user_id, source_user_id, tier, rate, amount')
        .eq('week_start', weekStartStr);

      const binaryResult = await supabase
        .from('binary_commissions')
        .select('id, user_id, weak_leg_volume, base_amount, scale_factor, scaled_amount')
        .eq('week_start', weekStartStr);

      const overrideResult = await supabase
        .from('override_commissions')
        .select('id, user_id, source_user_id, level, base_amount, scaled_amount')
        .eq('week_start', weekStartStr);

      const settlementResult = await supabase
        .from('weekly_settlements')
        .select('id, user_id, direct_total, binary_total, override_total, grand_total')
        .eq('week_start_date', weekStartStr);

      // Fetch profile info for display
      const allUserIds = new Set([
        ...(txResult.data?.map(t => t.user_id) || []),
        ...(profileResult.data?.map(p => p.id) || []),
      ]);

      const profilesResult = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(allUserIds));

      const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);

      // Enrich data with profile names
      const enrichedDeposits = (txResult.data || []).map(t => ({
        id: t.id,
        amount: t.amount,
        created_at: t.created_at,
        user_id: t.user_id,
        profileName: profileMap.get(t.user_id)?.full_name || 'Unknown',
        profileEmail: profileMap.get(t.user_id)?.email || '',
      }));

      const enrichedDirect = (directResult.data || []).map(c => ({
        id: c.id,
        user_id: c.user_id,
        source_user_id: c.source_user_id,
        tier: c.tier,
        rate: c.rate,
        amount: c.amount,
        userName: profileMap.get(c.user_id)?.full_name || 'Unknown',
        sourceName: profileMap.get(c.source_user_id)?.full_name || 'Unknown',
      }));

      const enrichedBinary = (binaryResult.data || []).map(c => ({
        id: c.id,
        user_id: c.user_id,
        weak_leg_volume: c.weak_leg_volume,
        base_amount: c.base_amount,
        scale_factor: c.scale_factor,
        scaled_amount: c.scaled_amount,
        userName: profileMap.get(c.user_id)?.full_name || 'Unknown',
      }));

      const enrichedOverride = (overrideResult.data || []).map(c => ({
        id: c.id,
        user_id: c.user_id,
        source_user_id: c.source_user_id,
        level: c.level,
        base_amount: c.base_amount,
        scaled_amount: c.scaled_amount,
        userName: profileMap.get(c.user_id)?.full_name || 'Unknown',
        sourceName: profileMap.get(c.source_user_id)?.full_name || 'Unknown',
      }));

      const enrichedSettlements = (settlementResult.data || []).map(s => ({
        id: s.id,
        user_id: s.user_id,
        direct_total: s.direct_total,
        binary_total: s.binary_total,
        override_total: s.override_total,
        grand_total: s.grand_total,
        userName: profileMap.get(s.user_id)?.full_name || 'Unknown',
      }));

      setDeposits(enrichedDeposits);
      setUsers(profileResult.data || []);
      setDirectComms(enrichedDirect);
      setBinaryComms(enrichedBinary);
      setOverrideComms(enrichedOverride);
      setSettlements(enrichedSettlements);

    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalDirect = directComms.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalBinary = binaryComms.reduce((sum, c) => sum + Number(c.scaled_amount || 0), 0);
  const totalOverride = overrideComms.reduce((sum, c) => sum + Number(c.scaled_amount || 0), 0);
  const grandTotal = totalDirect + totalBinary + totalOverride;

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Test Results Dashboard</h1>
          <p className="text-muted-foreground">Week starting: {weekStart}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Test Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalDeposits / 1000).toFixed(0)}K</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Commissions Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${grandTotal.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-500" />
                Payout Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((grandTotal / totalDeposits) * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* User Tree */}
        <Card>
          <CardHeader>
            <CardTitle>User Tree Structure</CardTitle>
            <CardDescription>Test users with network placement</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Binary Position</TableHead>
                  <TableHead>Sponsor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.binary_position ? (
                        <Badge variant={user.binary_position === 'left' ? 'default' : 'secondary'}>
                          {user.binary_position}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.sponsor_id?.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deposits */}
        <Card>
          <CardHeader>
            <CardTitle>Deposits</CardTitle>
            <CardDescription>{deposits.length} transactions totaling ${totalDeposits.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">{deposit.profileName}</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      ${deposit.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(deposit.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Direct Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Commissions</CardTitle>
            <CardDescription>{directComms.length} commissions totaling ${totalDirect.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directComms.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">{comm.userName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{comm.sourceName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">T{comm.tier}</Badge>
                    </TableCell>
                    <TableCell>{(comm.rate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right font-semibold">${comm.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Binary Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Binary Commissions</CardTitle>
            <CardDescription>{binaryComms.length} commissions totaling ${totalBinary.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Weak Leg Volume</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Scale Factor</TableHead>
                  <TableHead className="text-right">Scaled Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {binaryComms.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">{comm.userName}</TableCell>
                    <TableCell>${Number(comm.weak_leg_volume || 0).toLocaleString()}</TableCell>
                    <TableCell>${Number(comm.base_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{Number(comm.scale_factor || 1).toFixed(4)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(comm.scaled_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Override Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Override Commissions</CardTitle>
            <CardDescription>{overrideComms.length} commissions totaling ${totalOverride.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Downline Source</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead className="text-right">Scaled Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrideComms.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">{comm.userName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{comm.sourceName}</TableCell>
                    <TableCell>
                      <Badge>L{comm.level}</Badge>
                    </TableCell>
                    <TableCell>${Number(comm.base_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(comm.scaled_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Weekly Settlements */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Settlement Summary</CardTitle>
            <CardDescription>Complete payout breakdown per user</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Direct</TableHead>
                  <TableHead className="text-right">Binary</TableHead>
                  <TableHead className="text-right">Override</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">{settlement.userName}</TableCell>
                    <TableCell className="text-right">${Number(settlement.direct_total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${Number(settlement.binary_total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${Number(settlement.override_total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${Number(settlement.grand_total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
