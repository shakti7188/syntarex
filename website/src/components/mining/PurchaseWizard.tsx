import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "@/hooks/usePackages";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";
import { useCreatePaymentOrder, useSubmitTransaction, useVerifyPayment } from "@/hooks/usePaymentOrder";
import { usePaymentAutoDetect } from "@/hooks/usePaymentAutoDetect";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRPayment } from "./QRPayment";
import { TrustBadgesInline } from "./TrustBadgesInline";
import { PurchaseSuccess } from "./PurchaseSuccess";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Zap, 
  Shield,
  CreditCard,
  AlertTriangle,
  Wallet,
  Clock,
  Search,
  Radio
} from "lucide-react";
import { Link } from "react-router-dom";

interface PurchaseWizardProps {
  package: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "confirm" | "payment-method" | "send-payment" | "verify" | "success";
type PaymentMethod = "usdt-solana" | "usdt-ethereum" | "usdt-tron";
type Chain = "SOLANA" | "ETHEREUM" | "TRON";

interface UserWallet {
  wallet_address: string | null;
  wallet_network: string | null;
  wallet_verified: boolean;
}

export const PurchaseWizard = ({ package: pkg, open, onOpenChange }: PurchaseWizardProps) => {
  const [step, setStep] = useState<Step>("confirm");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain>("SOLANA");
  const [txSignature, setTxSignature] = useState("");
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState<"auto" | "manual">("auto");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    walletAddress: string;
    amount: number;
    expiresAt: string;
  } | null>(null);

  const { user } = useAuth();
  const { data: marketData } = useBitcoinMarketData();
  const createOrder = useCreatePaymentOrder();
  const submitTx = useSubmitTransaction();
  const verifyPayment = useVerifyPayment();

  // Auto-detection hook
  const handleTransactionFound = useCallback(async (txHash: string) => {
    if (!orderData) return;
    
    setTxSignature(txHash);
    console.log('Auto-detected transaction:', txHash);
    
    try {
      // Auto-submit the transaction
      await submitTx.mutateAsync({ 
        orderId: orderData.orderId, 
        txSignature: txHash 
      });
      
      // Auto-verify
      const result = await verifyPayment.mutateAsync(orderData.orderId);
      
      if (result.success) {
        setStep("success");
      }
    } catch (error) {
      console.error("Auto-verification failed:", error);
      // Fall back to manual - show verify step with pre-filled hash
      setStep("verify");
    }
  }, [orderData, submitTx, verifyPayment]);

  const { isSearching, pollCount } = usePaymentAutoDetect({
    orderId: orderData?.orderId || null,
    enabled: autoDetectEnabled && step === "send-payment",
    pollingInterval: 10000,
    onTransactionFound: handleTransactionFound,
  });

  // Fetch user's wallet info
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user?.id) {
        setLoadingWallet(false);
        return;
      }
      
      setLoadingWallet(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, wallet_network, wallet_verified')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserWallet({
          wallet_address: data.wallet_address,
          wallet_network: data.wallet_network,
          wallet_verified: data.wallet_verified || false
        });
        // Auto-select payment method based on linked wallet
        if (data.wallet_network === 'SOLANA' && data.wallet_address) {
          setPaymentMethod('usdt-solana');
        } else if (data.wallet_network === 'ETHEREUM' && data.wallet_address) {
          setPaymentMethod('usdt-ethereum');
        } else if (data.wallet_network === 'TRON' && data.wallet_address) {
          setPaymentMethod('usdt-tron');
        }
      }
      setLoadingWallet(false);
    };
    
    if (open) {
      fetchWallet();
    }
  }, [user?.id, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("confirm");
        setPaymentMethod(null);
        setSelectedChain("SOLANA");
        setTxSignature("");
        setOrderData(null);
        setVerificationMethod("auto");
        setAutoDetectEnabled(false);
      }, 300);
    }
  }, [open]);

  if (!pkg) return null;

  const steps: { id: Step; label: string }[] = [
    { id: "confirm", label: "Confirm" },
    { id: "payment-method", label: "Payment" },
    { id: "send-payment", label: "Send" },
    { id: "verify", label: "Verify" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  // Calculate estimates
  const dailyBTC = pkg.hashrate_ths * (marketData?.dailyEarningsPerThs || 0.000004);
  const monthlyUSD = dailyBTC * 30 * (marketData?.price || 97000);

  // Check wallet availability and verification
  const hasSolanaWallet = userWallet?.wallet_network === 'SOLANA' && !!userWallet?.wallet_address;
  const hasEthereumWallet = userWallet?.wallet_network === 'ETHEREUM' && !!userWallet?.wallet_address;
  const hasTronWallet = userWallet?.wallet_network === 'TRON' && !!userWallet?.wallet_address;
  const isWalletVerified = userWallet?.wallet_verified === true;
  const hasAnyWallet = hasSolanaWallet || hasEthereumWallet || hasTronWallet;

  // Determine if selected payment method is available (wallet must be linked AND verified)
  const canProceedWithPayment = isWalletVerified && (
    (paymentMethod === 'usdt-solana' && hasSolanaWallet) ||
    (paymentMethod === 'usdt-ethereum' && hasEthereumWallet) ||
    (paymentMethod === 'usdt-tron' && hasTronWallet)
  );

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConfirm = () => {
    setStep("payment-method");
  };

  const handlePaymentMethodSelect = async () => {
    if (!paymentMethod || !canProceedWithPayment) return;
    
    try {
      const chain: Chain = paymentMethod === "usdt-ethereum" ? "ETHEREUM" : paymentMethod === "usdt-tron" ? "TRON" : "SOLANA";
      setSelectedChain(chain);
      
      const result = await createOrder.mutateAsync({ packageId: pkg.id, chain });
      setOrderData({
        orderId: result.order.id,
        walletAddress: result.walletAddress,
        amount: result.amountUsdt,
        expiresAt: result.expiresAt,
      });
      // Enable auto-detection
      setAutoDetectEnabled(true);
      setStep("send-payment");
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const handlePaymentSent = () => {
    setStep("verify");
  };

  const handleVerify = async () => {
    if (!orderData || !txSignature) return;
    
    try {
      await submitTx.mutateAsync({ 
        orderId: orderData.orderId, 
        txSignature 
      });
      
      const result = await verifyPayment.mutateAsync(orderData.orderId);
      
      if (result.success) {
        setStep("success");
      }
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const isLoading = createOrder.isPending || submitTx.isPending || verifyPayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step !== "success" && (
          <DialogHeader>
            <DialogTitle className="text-center">
              {step === "confirm" && "Confirm Your Package"}
              {step === "payment-method" && "Choose Payment Method"}
              {step === "send-payment" && "Send Payment"}
              {step === "verify" && "Verify Payment"}
            </DialogTitle>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      i < currentStepIndex 
                        ? "bg-green-500 text-white" 
                        : i === currentStepIndex 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${i < currentStepIndex ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>
        )}

        <div className="py-4">
          {/* Step 1: Confirm Package */}
          {step === "confirm" && (
            <div className="space-y-6">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{pkg.hashrate_ths}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-medium">You're getting:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Hashrate</p>
                    <p className="font-semibold">{pkg.hashrate_ths} TH/s</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">XFLOW Tokens</p>
                    <p className="font-semibold">{pkg.xflow_tokens.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <p className="text-xs text-muted-foreground">Est. Daily BTC</p>
                    <p className="font-semibold text-amber-600">~{dailyBTC.toFixed(6)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground">Est. Monthly</p>
                    <p className="font-semibold text-green-600">~${monthlyUSD.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold">${pkg.price_usd.toLocaleString()}</span>
              </div>

              {/* Wallet Requirement Warning */}
              {!loadingWallet && !hasAnyWallet && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You must link a wallet before purchasing</span>
                    <Link to="/settings">
                      <Button variant="outline" size="sm">
                        <Wallet className="h-4 w-4 mr-2" />
                        Link Wallet
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {/* Wallet Not Verified Warning */}
              {!loadingWallet && hasAnyWallet && !isWalletVerified && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Wallet verification required</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Sign a message to prove wallet ownership before purchasing</p>
                    </div>
                    <Link to="/settings">
                      <Button variant="outline" size="sm" className="border-amber-500 text-amber-700 hover:bg-amber-100">
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Now
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <TrustBadgesInline />

              <Button 
                onClick={handleConfirm} 
                className="w-full" 
                size="lg"
                disabled={loadingWallet || !hasAnyWallet || !isWalletVerified}
              >
                {loadingWallet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !hasAnyWallet ? (
                  "Link Wallet to Continue"
                ) : !isWalletVerified ? (
                  "Verify Wallet to Continue"
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === "payment-method" && (
            <div className="space-y-6">
              {/* Wallet Status Banner */}
              {userWallet?.wallet_address && (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Your linked wallet ({userWallet.wallet_network}): 
                        <span className="font-mono ml-1">{truncateAddress(userWallet.wallet_address)}</span>
                      </span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <RadioGroup value={paymentMethod || ""} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <div className="space-y-3">
                  {/* USDT Solana */}
                  <div className="relative">
                    <RadioGroupItem 
                      value="usdt-solana" 
                      id="usdt-solana" 
                      className="peer sr-only" 
                      disabled={!hasSolanaWallet}
                    />
                    <Label
                      htmlFor="usdt-solana"
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all 
                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 
                        ${!hasSolanaWallet ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'}`}
                    >
                      <CreditCard className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pay with USDT</span>
                          {hasSolanaWallet && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Wallet Linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Solana network • Fast, low fees</p>
                        {!hasSolanaWallet && (
                          <p className="text-xs text-destructive mt-1">
                            ⚠️ Link a Solana wallet first
                          </p>
                        )}
                      </div>
                      <span className="font-bold">${pkg.price_usd.toLocaleString()}</span>
                    </Label>
                  </div>

                  {/* USDT Ethereum */}
                  <div className="relative">
                    <RadioGroupItem 
                      value="usdt-ethereum" 
                      id="usdt-ethereum" 
                      className="peer sr-only"
                      disabled={!hasEthereumWallet}
                    />
                    <Label
                      htmlFor="usdt-ethereum"
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all 
                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 
                        ${!hasEthereumWallet ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'}`}
                    >
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pay with USDT</span>
                          {hasEthereumWallet && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Wallet Linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Ethereum network • ERC-20</p>
                        {!hasEthereumWallet && (
                          <p className="text-xs text-destructive mt-1">
                            ⚠️ Link an Ethereum wallet first
                          </p>
                        )}
                      </div>
                      <span className="font-bold">${pkg.price_usd.toLocaleString()}</span>
                    </Label>
                  </div>

                  {/* USDT Tron */}
                  <div className="relative">
                    <RadioGroupItem 
                      value="usdt-tron" 
                      id="usdt-tron" 
                      className="peer sr-only"
                      disabled={!hasTronWallet}
                    />
                    <Label
                      htmlFor="usdt-tron"
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all 
                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 
                        ${!hasTronWallet ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'}`}
                    >
                      <CreditCard className="h-6 w-6 text-red-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pay with USDT</span>
                          {hasTronWallet && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Wallet Linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Tron network • TRC-20 • Low fees</p>
                        {!hasTronWallet && (
                          <p className="text-xs text-destructive mt-1">
                            ⚠️ Link a Tron wallet first
                          </p>
                        )}
                      </div>
                      <span className="font-bold">${pkg.price_usd.toLocaleString()}</span>
                    </Label>
                  </div>

                  {/* No Wallet Linked Warning */}
                  {!hasAnyWallet && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex flex-col gap-2">
                        <span>No wallet linked. You must link a wallet to make a purchase.</span>
                        <Link to="/settings">
                          <Button variant="outline" size="sm" className="w-full">
                            <Wallet className="h-4 w-4 mr-2" />
                            Go to Settings to Link Wallet
                          </Button>
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </RadioGroup>

              {/* Security Notice */}
              {paymentMethod && canProceedWithPayment && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Security:</strong> Payment must be sent from your linked wallet address. 
                    Payments from other addresses will be rejected.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("confirm")} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handlePaymentMethodSelect} 
                  className="flex-1"
                  disabled={!paymentMethod || !canProceedWithPayment || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Send Payment */}
          {step === "send-payment" && orderData && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => {
                setAutoDetectEnabled(false);
                setStep("payment-method");
              }} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {/* Sender Wallet Warning */}
              {userWallet?.wallet_address && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IMPORTANT:</strong> Send only from your linked wallet:
                    <div className="font-mono text-sm mt-1 p-2 bg-background rounded">
                      {userWallet.wallet_address}
                    </div>
                    <span className="text-xs">Payments from other addresses will be REJECTED.</span>
                  </AlertDescription>
                </Alert>
              )}
              
              <QRPayment
                walletAddress={orderData.walletAddress}
                amount={orderData.amount}
                expiresAt={orderData.expiresAt}
                chain={selectedChain}
                onPaymentSent={() => {
                  setAutoDetectEnabled(false);
                  handlePaymentSent();
                }}
              />

              {/* Auto-Detection Status */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  {isSearching ? (
                    <>
                      <div className="relative">
                        <Radio className="h-5 w-5 text-primary animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Scanning blockchain for your payment...</p>
                        <p className="text-xs text-muted-foreground">
                          Check #{pollCount} • We'll auto-verify once detected
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Auto-detection ready</p>
                        <p className="text-xs text-muted-foreground">
                          Send payment and we'll find it automatically
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Manual Fallback Option */}
              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => {
                    setAutoDetectEnabled(false);
                    setStep("verify");
                  }}
                  className="text-muted-foreground"
                >
                  Or enter transaction hash manually
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Verify */}
          {step === "verify" && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold mb-2">Verify Your Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedChain === "ETHEREUM" 
                    ? "Paste your Ethereum transaction hash to complete the purchase"
                    : selectedChain === "TRON"
                    ? "Paste your Tron transaction hash to complete the purchase"
                    : "Paste your Solana transaction signature to complete the purchase"
                  }
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="txSignature">
                  {selectedChain === "SOLANA" ? "Transaction Signature" : "Transaction Hash"}
                </Label>
                <Input
                  id="txSignature"
                  placeholder={selectedChain === "SOLANA" ? "e.g., 5J7dg8Ky..." : selectedChain === "TRON" ? "e.g., a1b2c3d4..." : "e.g., 0x1234..."}
                  value={txSignature}
                  onChange={(e) => setTxSignature(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can find this in your wallet's transaction history
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("send-payment")} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleVerify} 
                  className="flex-1"
                  disabled={!txSignature || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Verify & Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <PurchaseSuccess 
              package={pkg} 
              onClose={() => onOpenChange(false)} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
