import { TestDataGenerator } from "@/components/admin/TestDataGenerator";
import { ComprehensiveTest } from "@/components/admin/ComprehensiveTest";
import { SystemTest } from "@/components/admin/SystemTest";
import { SynteraxSystemTest } from "@/components/admin/SynteraxSystemTest";

export default function TestTools() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Tools</h1>
        <p className="text-muted-foreground">
          Generate test data and run system tests to verify affiliate network functionality
        </p>
      </div>
      
      <div className="space-y-6">
        <SynteraxSystemTest />
        <TestDataGenerator />
        <ComprehensiveTest />
        <SystemTest />
      </div>
    </div>
  );
}
