import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import Index from "./pages/Index";
import BitcoinMining from "./pages/BitcoinMining";
import Tokenomics from "./pages/Tokenomics";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Earnings from "./pages/Earnings";
import Settings from "./pages/Settings";
// import TokenInfo from "./pages/TokenInfo"; // Hidden for now
import Staking from "./pages/Staking";
import BuyMachines from "./pages/mining/BuyMachines";
import MyMachines from "./pages/mining/MyMachines";
// import TokenizeHashrate from "./pages/mining/TokenizeHashrate"; // Hidden for now
// import TokenizationHistory from "./pages/mining/TokenizationHistory"; // Hidden for now
// import HashrateTransactions from "./pages/mining/HashrateTransactions"; // Hidden for now
// import Deployment from "./pages/mining/Deployment"; // Hidden for now
// import Hosting from "./pages/mining/Hosting"; // Hidden for now
// import Marketplace from "./pages/mining/Marketplace"; // Hidden for now
import ROI from "./pages/mining/ROI";
import TransactionHistory from "./pages/TransactionHistory";
import TestResults from "./pages/admin/TestResults";
import TestTools from "./pages/admin/TestTools";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout";

const App = () => {
  // Check for version updates and reload if necessary
  useVersionCheck();

  return (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/bitcoin-mining" element={<BitcoinMining />} />
        <Route path="/tokenomics" element={<Tokenomics />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mining/buy"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <BuyMachines />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mining/my-machines"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <MyMachines />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        {/* Hidden for now
        <Route
          path="/mining/tokenize"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TokenizeHashrate />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        */}
        {/* Hidden for now - tokenization history
        <Route
          path="/mining/history"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TokenizationHistory />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        */}
        {/* Hidden for now - deployment
        <Route
          path="/mining/deployment"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Deployment />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        */}
        <Route
          path="/mining/roi"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ROI />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Earnings />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Settings />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        {/* Hidden for now
        <Route
          path="/token-info"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TokenInfo />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TransactionHistory />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staking"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Staking />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AuthenticatedLayout>
                <Admin />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/test-results"
          element={
            <ProtectedRoute requireAdmin>
              <AuthenticatedLayout>
                <TestResults />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/test-tools"
          element={
            <ProtectedRoute requireAdmin>
              <AuthenticatedLayout>
                <TestTools />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
  </ErrorBoundary>
  );
};

export default App;
