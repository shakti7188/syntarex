import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  rank: string | null;
  created_at: string;
  role: string;
}

export const useAdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, rank, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles.map(profile => {
        const userRoles = roles.filter(r => r.user_id === profile.id);
        const role = userRoles.find(r => r.role === "admin") 
          ? "admin" 
          : userRoles[0]?.role || "user";
        
        return {
          ...profile,
          role,
        };
      });

      return usersWithRoles as AdminUser[];
    },
  });

  return { users: users || [], isLoading };
};

export const useCreateUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      fullName: string;
      role: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "api-admin-users-create",
        {
          body: userData,
        }
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
