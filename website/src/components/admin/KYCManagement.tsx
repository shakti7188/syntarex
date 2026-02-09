import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface UserKYC {
  id: string;
  user_id: string;
  status: string;
  total_purchase_amount: number;
  total_tokenization_ths: number;
  kyc_required_threshold_met: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  full_name: string | null;
  email: string;
}

export const KYCManagement = () => {
  const queryClient = useQueryClient();
  const [selectedKYC, setSelectedKYC] = useState<UserKYC | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: kycRecords = [], isLoading } = useQuery({
    queryKey: ['kyc-records'],
    queryFn: async () => {
      const { data: kycData, error: kycError } = await supabase
        .from('user_kyc')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (kycError) throw kycError;
      if (!kycData) return [];

      // Fetch profiles separately
      const userIds = kycData.map(k => k.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Merge the data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return kycData.map(kyc => ({
        ...kyc,
        full_name: profilesMap.get(kyc.user_id)?.full_name || null,
        email: profilesMap.get(kyc.user_id)?.email || 'Unknown'
      })) as UserKYC[];
    }
  });

  const updateKYCStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: status as any,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id || null,
        rejection_reason: status === 'REJECTED' ? notes : null,
        notes: status === 'APPROVED' ? notes : null
      };

      const { error } = await supabase
        .from('user_kyc')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-records'] });
      toast.success("KYC status updated successfully");
      setSelectedKYC(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update KYC: ${error.message}`);
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NOT_REQUIRED: { icon: Shield, color: "bg-muted text-muted-foreground" },
      PENDING: { icon: Clock, color: "bg-warning/20 text-warning" },
      SUBMITTED: { icon: Clock, color: "bg-primary/20 text-primary" },
      UNDER_REVIEW: { icon: AlertTriangle, color: "bg-warning/20 text-warning" },
      APPROVED: { icon: CheckCircle, color: "bg-accent/20 text-accent" },
      REJECTED: { icon: XCircle, color: "bg-destructive/20 text-destructive" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const pendingReviews = kycRecords.filter(k => 
    k.status === 'SUBMITTED' || k.status === 'UNDER_REVIEW'
  ).length;

  const approvedCount = kycRecords.filter(k => k.status === 'APPROVED').length;
  const rejectedCount = kycRecords.filter(k => k.status === 'REJECTED').length;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          KYC Compliance Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Review and manage user KYC submissions (Required for purchases &gt;$10k or large tokenizations)
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Records</p>
          <p className="text-2xl font-bold">{kycRecords.length}</p>
        </Card>
        <Card className="p-4 bg-warning/10">
          <p className="text-sm text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-bold text-warning">{pendingReviews}</p>
        </Card>
        <Card className="p-4 bg-accent/10">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-accent">{approvedCount}</p>
        </Card>
        <Card className="p-4 bg-destructive/10">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Purchase Amount</TableHead>
              <TableHead className="text-right">Tokenized TH/s</TableHead>
              <TableHead className="text-center">Threshold Met</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : kycRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No KYC records found
                </TableCell>
              </TableRow>
            ) : (
              kycRecords.map((kyc) => (
                <TableRow key={kyc.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{kyc.full_name || 'No name'}</div>
                      <div className="text-sm text-muted-foreground">{kyc.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                  <TableCell className="text-right">
                    ${Number(kyc.total_purchase_amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(kyc.total_tokenization_ths).toFixed(2)} TH/s
                  </TableCell>
                  <TableCell className="text-center">
                    {kyc.kyc_required_threshold_met ? (
                      <AlertTriangle className="w-5 h-5 text-warning mx-auto" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    {kyc.submitted_at 
                      ? new Date(kyc.submitted_at).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {(kyc.status === 'SUBMITTED' || kyc.status === 'UNDER_REVIEW') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedKYC(kyc)}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review KYC Submission</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium">User</p>
                              <p className="text-sm text-muted-foreground">
                                {kyc.full_name} ({kyc.email})
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Purchase Amount</p>
                              <p className="text-sm text-muted-foreground">
                                ${Number(kyc.total_purchase_amount).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Tokenized TH/s</p>
                              <p className="text-sm text-muted-foreground">
                                {Number(kyc.total_tokenization_ths).toFixed(2)} TH/s
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Review Notes</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={3}
                                placeholder="Add notes about this review..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={() => {
                                  if (selectedKYC) {
                                    updateKYCStatus.mutate({
                                      id: selectedKYC.id,
                                      status: 'APPROVED',
                                      notes: reviewNotes
                                    });
                                  }
                                }}
                                disabled={updateKYCStatus.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => {
                                  if (selectedKYC && reviewNotes.trim()) {
                                    updateKYCStatus.mutate({
                                      id: selectedKYC.id,
                                      status: 'REJECTED',
                                      notes: reviewNotes
                                    });
                                  } else {
                                    toast.error("Please provide a reason for rejection");
                                  }
                                }}
                                disabled={updateKYCStatus.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
