import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { ProfitabilityPreview } from "@/components/landing/ProfitabilityPreview";
import { HowItWorksAnimated } from "@/components/landing/HowItWorksAnimated";
import { BenefitsGrid } from "@/components/landing/BenefitsGrid";
import { PackagesPreview } from "@/components/landing/PackagesPreview";
import { TokenSection } from "@/components/landing/TokenSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { BitcoinMiningSection } from "@/components/landing/BitcoinMiningSection";
import { ExecutiveSummarySection } from "@/components/landing/ExecutiveSummarySection";
import { TeamHighlightCard } from "@/components/landing/TeamHighlightCard";
const Index = () => {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <div id="trust">
        <TrustBadges />
      </div>

      <div id="what-is-mining">
        <BitcoinMiningSection />
      </div>
      <TeamHighlightCard />
      <ExecutiveSummarySection />
      {/* <div id="how-it-works">
        <HowItWorksAnimated />
      </div> */}
      {/* <div id="packages">
        <PackagesPreview />
      </div> */}
      {/* <div id="roi">
        <ProfitabilityPreview />
      </div> */}
      {/* <div id="benefits">
        <BenefitsGrid />
      </div> */}
      <div id="xflow">
        <TokenSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
