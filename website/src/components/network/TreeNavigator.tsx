import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

interface BinaryMember {
  id: string;
  full_name: string | null;
  email: string;
  username?: string;
}

interface TreeNavigatorProps {
  navigationPath: BinaryMember[];
  onNavigateBack?: () => void;
  onNavigateToMember?: (memberId: string) => void;
}

export const TreeNavigator = ({
  navigationPath,
  onNavigateBack,
  onNavigateToMember,
}: TreeNavigatorProps) => {
  if (navigationPath.length === 0) return null;

  const getDisplayName = (member: BinaryMember) => {
    return member.full_name || member.username || member.email.split("@")[0];
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg overflow-x-auto">
      {/* Back to Top Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateBack}
        className="flex-shrink-0"
      >
        <Home className="h-4 w-4 mr-1" />
        Back to Top
      </Button>

      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {navigationPath.map((member, index) => (
          <div key={member.id} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <Button
              variant={index === navigationPath.length - 1 ? "secondary" : "ghost"}
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => {
                if (index < navigationPath.length - 1) {
                  onNavigateToMember?.(member.id);
                }
              }}
              disabled={index === navigationPath.length - 1}
            >
              {getDisplayName(member)}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
