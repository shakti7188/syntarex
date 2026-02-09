import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export const LottieMiningAnimation = () => {
  const [animations, setAnimations] = useState<{
    bitcoin: any;
    dataCenter: any;
    dataFlow: any;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Load Lottie animations from URLs
    const loadAnimations = async () => {
      try {
        const [bitcoin, dataCenter, dataFlow] = await Promise.all([
          fetch("https://lottie.host/4d3d1c8e-8f4a-4f3e-9c5d-8b3e1f9a0c2d/8KQxQzXqYM.json").then(r => r.json()),
          fetch("https://lottie.host/c8e9d5f2-1a3b-4c7d-9e8f-2b4a6c8d0e1f/9LRyRzYrZN.json").then(r => r.json()),
          fetch("https://lottie.host/7f2e4d6a-9c8b-4a5d-8e7f-3c5d7e9f1a2b/0MSzSzZsZO.json").then(r => r.json()),
        ]);
        setAnimations({ bitcoin, dataCenter, dataFlow });
      } catch (error) {
        console.error("Failed to load Lottie animations:", error);
        setLoadError(true);
      }
    };

    loadAnimations();
  }, []);

  if (loadError || !animations) {
    // Fallback to simple animated elements
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="relative w-64 h-64 animate-pulse">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute inset-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-6xl">₿</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Layered Lottie Animations */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Background Layer: Data Center */}
        <div className="absolute inset-0 opacity-30 scale-125">
          <Lottie
            animationData={animations.dataCenter}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Middle Layer: Data Flow Particles */}
        <div className="absolute inset-0 opacity-40">
          <Lottie
            animationData={animations.dataFlow}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Foreground Layer: Bitcoin Mining */}
        <div className="relative z-10 w-full max-w-2xl px-8">
          <Lottie
            animationData={animations.bitcoin}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Edge fade masks for smooth blending */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
};
