import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ArrowRight, Plus, ShoppingBag } from "lucide-react";
import { MachineInventoryItem } from "@/hooks/useMachineInventory";
import { useNavigate } from "react-router-dom";
import { useCreateAllocation } from "@/hooks/useCreateAllocation";
import { EmptyState } from "@/components/ui/empty-state";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface MachineInventoryTableProps {
  machines: MachineInventoryItem[];
}

export const MachineInventoryTable = ({ machines }: MachineInventoryTableProps) => {
  const navigate = useNavigate();
  const createAllocationMutation = useCreateAllocation();
  const pagination = usePagination(machines, { pageSize: 10 });

  const handleCreateAllocation = async (machineId: string) => {
    await createAllocationMutation.mutateAsync({ machineInventoryId: machineId });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return 'default';
      case 'HOSTED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleTokenize = (machine: MachineInventoryItem) => {
    const availableThs = machine.machineType.hashRateThs - machine.tokenizedThs;
    navigate(`/mining/tokenize?machineId=${machine.id}&ths=${availableThs}&model=${encodeURIComponent(machine.machineType.brand + ' ' + machine.machineType.model)}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand & Model</TableHead>
                <TableHead>Hashrate (TH/s)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={ShoppingBag}
                      title="No Machines Found"
                      description="You don't have any mining machines yet. Purchase your first machine to get started."
                      action={{
                        label: "Buy Machines",
                        onClick: () => navigate("/mining/buy")
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginatedData.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{machine.machineType.brand}</div>
                          <div className="text-sm text-muted-foreground">{machine.machineType.model}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{machine.machineType.hashRateThs}</TableCell>
                    <TableCell>{machine.location || machine.machineType.location || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(machine.status)}>
                        {machine.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {machine.status === 'AVAILABLE' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCreateAllocation(machine.id)}
                          disabled={createAllocationMutation.isPending}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Create Allocation
                        </Button>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {machine.tokenizedThs < machine.machineType.hashRateThs && machine.status !== 'AVAILABLE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTokenize(machine)}
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
