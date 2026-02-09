import React from "react";
import heroImg from "../../assets/executive-banner.png";
import bI from "../../assets/hpc-facility.png";

export const ExecutiveSummarySection = () => {
  return (
    <section className="w-full bg-[#0a0a0a] pt-16 pb-20">
      <div className="mx-auto max-w-7xl px-4">

        {/* Section title */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          The Mining Center
        </h2>

        {/* Top image strip */}
        <div className="w-full overflow-hidden rounded-lg">
          <img
            src={heroImg}
            alt="Executive summary banner"
            className="w-full h-[180px] sm:h-[240px] md:h-[300px] object-cover object-center"
          />
        </div>

        {/* Content card */}
        <div className="bg-[#F2EFEA] rounded-lg mt-8">
          <div className="px-6 sm:px-10 md:px-14 py-10 sm:py-14 md:py-16">

            {/* Title + intro */}
            <h2 className="text-[#1A2A3A] text-2xl sm:text-3xl font-bold tracking-tight">
              Executive Summary
            </h2>

            <p className="mt-5 max-w-4xl text-[#3E4A55] text-[14px] sm:text-[15px] leading-[1.8]">
              This document outlines a compelling investment opportunity in Wattbyte, a leader in
              high-performance computing (HPC) and blockchain hosting. We are seeking an equity
              raise to fully operationalize our flagship 45 MW site in Bruderheim, Alberta, which is
              strategically positioned to deliver immediate and substantial returns, while also
              detailing a robust pipeline of future development.
            </p>

            {/* Sub sections */}
            <div className="mt-8 grid gap-6 max-w-4xl">
              <div>
                <h3 className="text-[#1A2A3A] text-lg sm:text-xl font-bold tracking-tight">
                  The Difference
                </h3>
                <p className="mt-2 text-[#3E4A55] text-[14px] sm:text-[15px] leading-[1.8]">
                  While other projects sell &ldquo;roadmaps&rdquo; and renderings, we are launching with active,
                  industrial-grade infrastructure.
                </p>
              </div>

              <div>
                <h3 className="text-[#1A2A3A] text-lg sm:text-xl font-bold tracking-tight">
                  The Engine
                </h3>
                <p className="mt-2 text-[#3E4A55] text-[14px] sm:text-[15px] leading-[1.8]">
                  This is the physical powerhouse that drives the Bitcoin revenue for the ecosystem.
                </p>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
              <MetricBlock
                value="$9.5M"
                label="Equity Raise"
                desc="For 30% equity in the 45 MW Bruderheim site (our flagship), providing investors with significant ownership in a high-capacity, high-margin asset. This capital is crucial for scaling operations efficiently."
              />

              <MetricBlock
                value="≤90"
                label="Days to Go-Live"
                desc="The site is already energized with existing infrastructure, enabling rapid deployment and revenue generation. Full revenue commencement is projected within 90 days of closing, minimizing time-to-market risk."
              />

              <MetricBlock
                value="2.4¢"
                label="kWh Gross Margin (Conservative estimate)"
                desc="We boast a highly competitive power cost of 4.6¢/kWh (all-in) and a targeted hosting price of 7.0¢/kWh, yielding a strong gross margin that drives profitability and provides a competitive edge in the market."
              />

              <MetricBlock
                value="$9.18M"
                label="Annual EBITDA"
                desc="At an optimal 97% uptime, the Bruderheim site is projected to achieve an impressive annual EBITDA of approximately $9.18 million, representing a ~34% margin. Our investor-friendly model ensures the investor receives 70% of the profit until a 1.2× payback is achieved, prioritizing early returns."
              />
            </div>

            {/* Bottom image */}
            <div className="mt-14">
              <div className="w-full overflow-hidden rounded-lg">
                <img
                  src={bI}
                  alt="HPC facility interior"
                  className="w-full h-[180px] sm:h-[220px] md:h-[280px] object-cover object-center"
                />
              </div>

              <p className="mt-4 text-[#3E4A55] text-[13px] sm:text-[14px] leading-relaxed">
                This facility is already operational, bypassing the typical 3–5 year grid
                interconnection delay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function MetricBlock({ value, label, desc }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-[#1A2A3A] text-5xl sm:text-6xl font-bold tracking-tight">
        {value}
      </div>

      <div className="mt-2 text-[#2E3A46] text-[14px] sm:text-[15px] font-semibold">
        {label}
      </div>

      <p className="mt-3 text-[#3E4A55] text-[13px] sm:text-[14px] leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
