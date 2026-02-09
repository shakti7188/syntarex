import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformStats } from "@/hooks/usePlatformStats";

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: platformStats } = usePlatformStats();

  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <TrendingUp className="h-16 w-16 mx-auto mb-6 text-primary" />
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Mining at Institutional Scale
          </h2>
          
          <p className="text-xl text-muted-foreground mb-4">
            Join leading Pioneers deploying capital in Bitcoin mining infrastructure
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-success mb-10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium">
              {platformStats?.totalHashrateThs ? `${(platformStats.totalHashrateThs / 1000000).toFixed(0)} PH/s Deployed` : '45 MW Infrastructure Already Built- Turn Key'}
              {' • '}
              {platformStats?.totalUsers ? `${platformStats.totalUsers}+ Active Users` : 'Professional Infrastructure'}
            </span>
          </div>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                   size="lg"
                   onClick={() => navigate("/mining/buy")}
                   className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                Deploy Capital
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="text-lg px-8 py-6"
              >
                View Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/mining/roi")}
                className="text-lg px-8 py-6 rounded-full"
              >
                View Projections
              </Button>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mt-8">
            SOC 2 Certified • Regulatory Compliant • Institutional Custody • Full Transparency
          </p>
        </motion.div>
      </div>
    </section>
  );
};
