import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Users, ArrowLeft, ArrowRight } from "lucide-react";

type BinaryPosition = 'left' | 'right';

export const ReferralSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [defaultLeg, setDefaultLeg] = useState<BinaryPosition>('left');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDefaultLeg = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_placement_leg')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        if (data?.default_placement_leg) {
          setDefaultLeg(data.default_placement_leg as BinaryPosition);
        }
      } catch (error) {
        console.error('Error fetching default leg:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultLeg();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_placement_leg: defaultLeg })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: `New referrals will be placed on your ${defaultLeg} leg.`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Placement
        </CardTitle>
        <CardDescription>
          Choose which leg new team members will automatically join when they sign up using your referral link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={defaultLeg}
          onValueChange={(value) => setDefaultLeg(value as BinaryPosition)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Label
            htmlFor="leg-left"
            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              defaultLeg === 'left' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="left" id="leg-left" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <ArrowLeft className="h-4 w-4" />
                Left Leg
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                New referrals join your left team
              </p>
            </div>
          </Label>
          
          <Label
            htmlFor="leg-right"
            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              defaultLeg === 'right' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="right" id="leg-right" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <ArrowRight className="h-4 w-4" />
                Right Leg
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                New referrals join your right team
              </p>
            </div>
          </Label>
        </RadioGroup>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preference
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
