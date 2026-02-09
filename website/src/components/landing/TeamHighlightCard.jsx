import React from "react";
import personImg from "../../assets/jay-hao.png";

export const TeamHighlightCard = () => {
  return (
    <section style={{ backgroundColor: "#000", width: "100%", padding: "0", overflow: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}>
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Left: image — no overlays, image already has dark bg */}
          <div className="md:w-[35%] flex-shrink-0 flex items-end justify-center" style={{ backgroundColor: "#000" }}>
            <img
              src={personImg}
              alt="Jay Hao"
              className="h-[320px] sm:h-[400px] md:h-[560px]"
              style={{ objectFit: "contain", objectPosition: "bottom center", display: "block", maxWidth: "100%" }}
            />
          </div>

          {/* Right: text */}
          <div className="flex-1 min-w-0 px-6 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12 flex flex-col justify-center">
            <h3 style={{ lineHeight: 1.15, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "-0.01em", fontSize: "clamp(24px, 3vw, 38px)" }}>
              <span style={{ color: "#fff", fontWeight: 200 }}>Engineered by</span>{" "}
              <span style={{ color: "#fff", fontWeight: 900 }}>Jay Hao</span>
            </h3>

            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", fontWeight: 400, marginBottom: "20px" }}>
              Former CEO of OKX, one of the world&apos;s largest exchanges.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", lineHeight: 1.7 }}>
                <span style={{ color: "#fff", fontWeight: 700 }}>The Expert:</span>{" "}
                A master of tokenomics who has engineered systems that survived the harshest bear markets.
              </p>

              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", lineHeight: 1.7 }}>
                <span style={{ color: "#fff", fontWeight: 700 }}>The Vision:</span>{" "}
                He didn&apos;t just build this to create a company; he built it to correct the injustice of insider access. With SynteraX, the public can finally enter before the insiders.
              </p>
            </div>

            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px",
              padding: "14px 18px"
            }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", lineHeight: 1.7, fontStyle: "italic" }}>
                &ldquo;I saw institutions monopolize infrastructure access&hellip; but never share it.
                SynteraX is my answer.&rdquo;
              </p>
              <p style={{
                marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.4)",
                fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontStyle: "normal"
              }}>
                &mdash; Jay Hao
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
