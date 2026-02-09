import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveAdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ResponsiveAdminLayout({
  title,
  description,
  children,
  actions,
  className,
}: ResponsiveAdminLayoutProps) {
  return (
    <div className={cn("container mx-auto p-4 md:p-6 lg:p-8", className)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 flex-wrap">{actions}</div>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        {children}
      </ScrollArea>
    </div>
  );
}
