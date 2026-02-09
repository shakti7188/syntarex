import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, MapPin, Zap } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface HostingSite {
  id: string;
  site_name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  total_capacity_mw: number;
  assigned_capacity_mw: number;
  available_capacity_mw: number;
  cooling_type: 'AIR' | 'HYDRO' | 'IMMERSION';
  status: string;
  notes: string | null;
}

export const HostingSitesManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    site_name: "",
    location: "",
    latitude: "",
    longitude: "",
    total_capacity_mw: "",
    cooling_type: "AIR",
    notes: ""
  });

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['hosting-sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosting_sites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HostingSite[];
    }
  });

  const createSite = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('hosting_sites').insert({
        site_name: data.site_name,
        location: data.location,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        total_capacity_mw: parseFloat(data.total_capacity_mw),
        cooling_type: data.cooling_type,
        notes: data.notes || null
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosting-sites'] });
      toast.success("Hosting site created successfully");
      setIsOpen(false);
      setFormData({
        site_name: "",
        location: "",
        latitude: "",
        longitude: "",
        total_capacity_mw: "",
        cooling_type: "AIR",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create site: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSite.mutate(formData);
  };

  const totalCapacity = sites.reduce((sum, site) => sum + Number(site.total_capacity_mw), 0);
  const totalAssigned = sites.reduce((sum, site) => sum + Number(site.assigned_capacity_mw), 0);
  const totalAvailable = totalCapacity - totalAssigned;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Data Center Capacity Management
          </h2>
          <p className="text-muted-foreground mt-1">Manage hosting sites and power allocation</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Hosting Site</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Site Name *</Label>
                  <Input
                    value={formData.site_name}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Total Capacity (MW) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.total_capacity_mw}
                    onChange={(e) => setFormData({ ...formData, total_capacity_mw: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Cooling Type *</Label>
                  <Select value={formData.cooling_type} onValueChange={(value) => setFormData({ ...formData, cooling_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AIR">Air Cooling</SelectItem>
                      <SelectItem value="HYDRO">Hydro Cooling</SelectItem>
                      <SelectItem value="IMMERSION">Immersion Cooling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createSite.isPending}>
                {createSite.isPending ? "Creating..." : "Create Hosting Site"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">{totalCapacity.toFixed(2)} MW</p>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-warning/10 to-warning/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold">{totalAssigned.toFixed(2)} MW</p>
            </div>
            <Zap className="w-8 h-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{totalAvailable.toFixed(2)} MW</p>
            </div>
            <Zap className="w-8 h-8 text-accent" />
          </div>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Cooling</TableHead>
              <TableHead className="text-right">Total MW</TableHead>
              <TableHead className="text-right">Assigned MW</TableHead>
              <TableHead className="text-right">Available MW</TableHead>
              <TableHead className="text-right">Utilization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hosting sites yet. Add your first site to get started.
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => {
                const utilization = site.total_capacity_mw > 0 
                  ? (site.assigned_capacity_mw / site.total_capacity_mw * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.site_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {site.location}
                      </div>
                    </TableCell>
                    <TableCell>{site.cooling_type}</TableCell>
                    <TableCell className="text-right">{Number(site.total_capacity_mw).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(site.assigned_capacity_mw).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-accent font-medium">
                      {Number(site.available_capacity_mw).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        Number(utilization) > 90 ? 'text-destructive' :
                        Number(utilization) > 70 ? 'text-warning' :
                        'text-accent'
                      }`}>
                        {utilization}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        site.status === 'ACTIVE' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                      }`}>
                        {site.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
