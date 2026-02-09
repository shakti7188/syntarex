import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MobileResponsiveTableProps {
  headers: string[];
  rows: ReactNode[][];
  className?: string;
}

export function MobileResponsiveTable({ headers, rows, className }: MobileResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className={cn("hidden md:block rounded-md border", className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((header, i) => (
                <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                {row.map((cell, j) => (
                  <td key={j} className="p-4 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {rows.map((row, i) => (
          <Card key={i} className="p-4 space-y-3">
            {row.map((cell, j) => (
              <div key={j} className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">{headers[j]}</span>
                <div className="text-sm">{cell}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}
