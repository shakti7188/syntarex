import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Award, Ban, Loader2 } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { CreateUserModal } from "./CreateUserModal";

export const AdminUserManagement = () => {
  const { users, isLoading } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by name, email, or ID..." 
              className="pl-10 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CreateUserModal />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No users found matching your search" : "No users found"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 bg-secondary border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center font-bold text-sm">
                      {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{user.full_name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Rank</p>
                      <Badge variant={user.rank === "Gold" ? "default" : "secondary"} className="mt-1">
                        <Award className="w-3 h-3 mr-1" />
                        {user.rank || "Member"}
                      </Badge>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1">
                        {user.role}
                      </Badge>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="font-semibold text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/50">
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};