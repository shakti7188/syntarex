import React from "react";
import { Sparkles, Zap, Server } from "lucide-react";
import heroImg from "../../assets/executive-banner.png";
import bI from "../../assets/hpc-facility.png";

export const ExecutiveSummarySection = () => {
  return (
    <section className="pt-32 sm:pt-36 pb-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="inline-flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
          <Server className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-primary">Infrastructure</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          The Mining Center
        </h2>

        {/* ── Hero banner ── */}
        <div className="w-full overflow-hidden rounded-xl">
          <img
            src={heroImg}
            alt="Bruderheim 45MW facility"
            className="w-full h-[200px] sm:h-[280px] md:h-[360px] object-cover object-center"
          />
        </div>

        {/* ── Executive Summary ── */}
        <h3 className="font-semibold text-xl sm:text-2xl tracking-tight mt-8 mb-4">
          Executive Summary
        </h3>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          This document outlines a compelling investment opportunity in Wattbyte, a leader in
          high-performance computing (HPC) and blockchain hosting. We are seeking an equity
          raise to fully operationalize our flagship 45 MW site in Bruderheim, Alberta, which is
          strategically positioned to deliver immediate and substantial returns, while also
          detailing a robust pipeline of future development.
        </p>

        {/* The Difference + The Engine */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-base sm:text-lg tracking-tight">
                The Difference
              </h4>
              <p className="mt-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                While other projects sell "roadmaps" and renderings, we are launching with active,
                industrial-grade infrastructure.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-base sm:text-lg tracking-tight">
                The Engine
              </h4>
              <p className="mt-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                This is the physical powerhouse that drives the Bitcoin revenue for the ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* ── Metrics grid ── */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard value="$9.5M"  label="Equity Raise"
            desc="For 30% equity in the 45 MW Bruderheim site (our flagship), providing investors with significant ownership in a high-capacity, high-margin asset." />
          <MetricCard value="≤ 90"   label="Days to Go-Live"
            desc="The site is already energized with existing infrastructure, enabling rapid deployment and revenue generation within 90 days of closing." />
          <MetricCard value="2.4¢"   label="kWh Gross Margin"
            desc="A highly competitive power cost of 4.6¢/kWh (all-in) and a targeted hosting price of 7.0¢/kWh, yielding a strong gross margin." />
          <MetricCard value="$9.18M" label="Annual EBITDA"
            desc="At 97% uptime, the site is projected to achieve ~$9.18M annual EBITDA (~34% margin). Investors receive 70% of profit until 1.2× payback." />
        </div>

        {/* ── Facility image ── */}
        <div className="mt-12 w-full overflow-hidden rounded-xl">
          <img
            src={bI}
            alt="HPC facility interior"
            className="w-full h-[200px] sm:h-[260px] md:h-[320px] object-cover object-center"
          />
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          This facility is already operational, bypassing the typical 3–5 year grid
          interconnection delay.
        </p>
      </div>
    </section>
  );
};

/* ── Metric card ── */
function MetricCard({ value, label, desc }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col">
      <div className="text-foreground text-2xl sm:text-3xl font-bold tracking-tight leading-none">
        {value}
      </div>
      <div className="mt-2 text-foreground text-sm font-semibold">
        {label}
      </div>
      <p className="mt-3 text-muted-foreground text-xs sm:text-sm leading-relaxed flex-1">
        {desc}
      </p>
    </div>
  );
}
