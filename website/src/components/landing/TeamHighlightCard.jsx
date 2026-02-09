import React from "react";
import personImg from "../../assets/jay-hao.png";

export const TeamHighlightCard = () => {
  return (
    <section style={{ backgroundColor: "#000", width: "100%", padding: "0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          {/* Ambient glow */}
          <div style={{
            pointerEvents: "none", position: "absolute", bottom: "-112px", left: "-112px",
            height: "320px", width: "320px", borderRadius: "50%",
            background: "rgba(30,123,255,0.25)", filter: "blur(60px)"
          }} />
          <div style={{
            pointerEvents: "none", position: "absolute", bottom: "-112px", right: "-112px",
            height: "320px", width: "320px", borderRadius: "50%",
            background: "rgba(30,123,255,0.25)", filter: "blur(60px)"
          }} />

          <div style={{ position: "relative", display: "flex", flexDirection: "row", alignItems: "stretch" }}
               className="flex-col md:flex-row">
            {/* Left: image */}
            <div className="md:w-[40%]" style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={personImg}
                alt="Jay Hao"
                className="h-[300px] sm:h-[360px] md:h-full"
                style={{ width: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
              />
              {/* Right fade into black */}
              <div className="hidden md:block" style={{
                pointerEvents: "none", position: "absolute", inset: 0,
                background: "linear-gradient(to right, transparent 40%, #000 100%)"
              }} />
              {/* Bottom fade for mobile */}
              <div className="md:hidden" style={{
                pointerEvents: "none", position: "absolute", inset: 0,
                background: "linear-gradient(to top, #000 0%, transparent 60%)"
              }} />
            </div>

            {/* Right: text */}
            <div className="px-6 sm:px-10 md:px-14 py-8 sm:py-10 md:py-14"
                 style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3 style={{ lineHeight: 1.1, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "-0.02em" }}
                  className="text-3xl sm:text-4xl md:text-5xl">
                <span style={{ color: "#fff", fontWeight: 200 }}>Engineered by</span>{" "}
                <span style={{ color: "#fff", fontWeight: 900 }}>Jay Hao</span>
              </h3>

              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", fontWeight: 400, marginBottom: "24px" }}>
                Former CEO of OKX, one of the world&apos;s largest exchanges.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
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
                padding: "16px 20px", marginTop: "auto"
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
      </div>
    </section>
  );
};
