import { HostingFeesTable } from "@/components/billing/HostingFeesTable";
import { Server } from "lucide-react";

const Hosting = () => {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8" />
              Hosting & Billing
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your monthly hosting fees and payment history
            </p>
          </div>
        </div>

        <HostingFeesTable />
      </main>
  );
};

export default Hosting;
