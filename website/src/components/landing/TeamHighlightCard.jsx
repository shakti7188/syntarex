import React from "react";
import personImg from "../../assets/jay-hao.png";

export const TeamHighlightCard = () => {
  return (
    <section className="w-full overflow-hidden" style={{ backgroundColor: "#000" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-stretch">

          {/* Left: photo */}
          <div
            className="md:w-[35%] flex-shrink-0 flex items-end justify-center"
            style={{ backgroundColor: "#000" }}
          >
            <img
              src={personImg}
              alt="Jay Hao"
              className="h-[220px] sm:h-[320px] md:h-[560px] w-auto max-w-full object-contain"
            />
          </div>

          {/* Right: text */}
          <div className="flex-1 min-w-0 px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-10 md:py-16 flex flex-col justify-center gap-4 sm:gap-5">

            {/* Heading */}
            <div>
              <h3
                className="text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight"
                style={{ color: "#fff" }}
              >
                <span className="font-extralight">Engineered by</span>{" "}
                <span className="font-black uppercase">JAY HAO</span>
              </h3>
              <p className="mt-2 text-base" style={{ color: "rgba(255,255,255,0.6)" }}>
                Former CEO of OKX, one of the world&apos;s largest exchanges.
              </p>
            </div>

            {/* Expert & Vision */}
            <div className="flex flex-col gap-4">
              <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
                <span className="font-bold" style={{ color: "#fff" }}>The Expert:</span>{" "}
                A master of tokenomics who has engineered systems that survived the harshest bear markets.
              </p>
              <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
                <span className="font-bold" style={{ color: "#fff" }}>The Vision:</span>{" "}
                He didn&apos;t just build this to create a company; he built it to correct the injustice of insider access. With SynteraX, the public can finally enter before the insiders.
              </p>
            </div>

            {/* Quote */}
            <div
              className="rounded-lg px-5 py-4"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <p
                className="text-[15px] leading-[1.75] italic"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                &ldquo;I saw institutions monopolize infrastructure access&hellip; but never share it.
                SynteraX is my answer.&rdquo;
              </p>
              <p
                className="mt-2 text-xs font-semibold uppercase tracking-widest not-italic"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                &mdash; Jay Hao
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
