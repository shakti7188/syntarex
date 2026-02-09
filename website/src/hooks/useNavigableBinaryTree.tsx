import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface BinaryMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  binary_position?: "left" | "right" | null;
  is_active?: boolean;
  left_volume?: number;
  right_volume?: number;
  total_left_members?: number;
  total_right_members?: number;
  total_earnings?: number;
  sponsor_name?: string;
  username?: string;
}

interface BinaryTreeState {
  currentUser: BinaryMember | null;
  leftTeam: BinaryMember[];
  rightTeam: BinaryMember[];
  leftVolume: number;
  rightVolume: number;
  leftDirectChild: BinaryMember | null;
  rightDirectChild: BinaryMember | null;
}

export const useNavigableBinaryTree = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<BinaryMember[]>([]);
  const [treeData, setTreeData] = useState<BinaryTreeState>({
    currentUser: null,
    leftTeam: [],
    rightTeam: [],
    leftVolume: 0,
    rightVolume: 0,
    leftDirectChild: null,
    rightDirectChild: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTreeForUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch the tree data for a specific user using the edge function
      const { data, error } = await supabase.functions.invoke("get-network-tree", {
        method: "POST",
        body: { targetUserId: userId },
      });

      if (error) {
        // Fallback to GET if POST not supported yet
        const { data: getData, error: getError } = await supabase.functions.invoke(
          "get-network-tree",
          { method: "GET" }
        );
        if (getError) throw getError;
        
        // For now, use the default tree data
        if (getData) {
          setTreeData({
            currentUser: {
              id: user?.id || "",
              email: user?.email || "",
              full_name: null,
              avatar_url: null,
              rank: null,
            },
            leftTeam: getData.binaryTeam?.left || [],
            rightTeam: getData.binaryTeam?.right || [],
            leftVolume: getData.binaryTeam?.leftVolume || 0,
            rightVolume: getData.binaryTeam?.rightVolume || 0,
            leftDirectChild: getData.binaryTeam?.left?.[0] || null,
            rightDirectChild: getData.binaryTeam?.right?.[0] || null,
          });
        }
        return;
      }

      if (data) {
        setTreeData({
          currentUser: data.currentUser || null,
          leftTeam: data.binaryTeam?.left || [],
          rightTeam: data.binaryTeam?.right || [],
          leftVolume: data.binaryTeam?.leftVolume || 0,
          rightVolume: data.binaryTeam?.rightVolume || 0,
          leftDirectChild: data.leftDirectChild || data.binaryTeam?.left?.[0] || null,
          rightDirectChild: data.rightDirectChild || data.binaryTeam?.right?.[0] || null,
        });
      }
    } catch (error) {
      console.error("Error fetching tree:", error);
      toast({
        title: "Error loading tree",
        description: "Could not load binary tree data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Initial fetch for the logged-in user
  useEffect(() => {
    if (user?.id) {
      setViewingUserId(user.id);
      fetchTreeForUser(user.id);
    }
  }, [user?.id, fetchTreeForUser]);

  const navigateToMember = useCallback(async (memberId: string) => {
    // Find the member in current tree to add to path
    const member = [...treeData.leftTeam, ...treeData.rightTeam].find(
      (m) => m.id === memberId
    );

    if (member) {
      setNavigationPath((prev) => {
        // Check if we're going back in the path
        const existingIndex = prev.findIndex((p) => p.id === memberId);
        if (existingIndex >= 0) {
          return prev.slice(0, existingIndex + 1);
        }
        return [...prev, member];
      });
    }

    setViewingUserId(memberId);
    await fetchTreeForUser(memberId);
  }, [treeData, fetchTreeForUser]);

  const navigateBack = useCallback(async () => {
    if (user?.id) {
      setNavigationPath([]);
      setViewingUserId(user.id);
      await fetchTreeForUser(user.id);
    }
  }, [user?.id, fetchTreeForUser]);

  const goBottomLeft = useCallback(async () => {
    // Navigate to the deepest left member
    const deepestLeft = treeData.leftTeam[treeData.leftTeam.length - 1];
    if (deepestLeft) {
      await navigateToMember(deepestLeft.id);
    }
  }, [treeData.leftTeam, navigateToMember]);

  const goBottomRight = useCallback(async () => {
    // Navigate to the deepest right member
    const deepestRight = treeData.rightTeam[treeData.rightTeam.length - 1];
    if (deepestRight) {
      await navigateToMember(deepestRight.id);
    }
  }, [treeData.rightTeam, navigateToMember]);

  return {
    ...treeData,
    isLoading,
    viewingUserId,
    navigationPath,
    navigateToMember,
    navigateBack,
    goBottomLeft,
    goBottomRight,
    refetch: () => viewingUserId && fetchTreeForUser(viewingUserId),
  };
};
