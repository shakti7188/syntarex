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
    <div className="min-h-screen relative">
      {/* Page-wide subtle blue wash */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-0 left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsla(221, 100%, 50%, 0.25), transparent 70%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsla(221, 100%, 65%, 0.2), transparent 70%)",
            filter: "blur(110px)",
          }}
        />
        <div
          className="absolute top-[70%] left-[20%] w-[550px] h-[550px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsla(221, 100%, 50%, 0.2), transparent 70%)",
            filter: "blur(130px)",
          }}
        />
      </div>
      <div className="relative z-10">
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
    </div>
  );
};

export default Index;
