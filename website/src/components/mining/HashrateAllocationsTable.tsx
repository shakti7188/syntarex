import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Coins } from "lucide-react";
import { HashrateAllocation } from "@/hooks/useHashrateAllocations";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface HashrateAllocationsTableProps {
  allocations: HashrateAllocation[];
}

export const HashrateAllocationsTable = ({ allocations }: HashrateAllocationsTableProps) => {
  const navigate = useNavigate();
  const pagination = usePagination(allocations, { pageSize: 10 });

  const handleTokenize = (allocation: HashrateAllocation) => {
    navigate(`/mining/tokenize?allocationId=${allocation.id}&ths=${allocation.untokenizedThs}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Total TH/s</TableHead>
                <TableHead>Tokenized TH/s</TableHead>
                <TableHead>Available TH/s</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Coins}
                      title="No Allocations"
                      description="Allocations are automatically created when you purchase and deploy machines."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginatedData.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Allocation {allocation.id.substring(0, 8)}...</div>
                          <div className="text-sm text-muted-foreground">Machine-based allocation</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{allocation.totalThs.toFixed(3)}</TableCell>
                    <TableCell>
                      {allocation.tokenizedThs > 0 ? (
                        <span className="font-medium text-primary">{allocation.tokenizedThs.toFixed(3)}</span>
                      ) : (
                        <span className="text-muted-foreground">0.000</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">{allocation.untokenizedThs.toFixed(3)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {allocation.untokenizedThs > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTokenize(allocation)}
                        >
                          Tokenize <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls {...pagination} onPageChange={pagination.goToPage} />
      </CardContent>
    </Card>
  );
};
