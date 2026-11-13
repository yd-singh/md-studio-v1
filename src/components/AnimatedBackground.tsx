import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div 
      id="home-animated-background"
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-slate-50 select-none"
    >
      {/* Base soothing ambient radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#e0e7ff_0%,#f8fafc_45%,#f1f5f9_100%)]" />

      {/* Floating Orb 1: Indigo & Violet glow (Top-Left) */}
      <div
        className="animate-orb-1 absolute -top-28 -left-28 w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full bg-gradient-to-br from-indigo-300/40 via-purple-300/30 to-blue-200/10 blur-3xl transform-gpu"
      />

      {/* Floating Orb 2: Sky Blue & Cyan glow (Bottom-Right) */}
      <div
        className="animate-orb-2 absolute -bottom-28 -right-28 w-[460px] sm:w-[560px] h-[460px] sm:h-[560px] rounded-full bg-gradient-to-tl from-sky-300/35 via-blue-200/25 to-indigo-200/10 blur-3xl transform-gpu"
      />

      {/* Floating Orb 3: Soft Amber & Warm Rose shimmer (Center-Right) */}
      <div
        className="animate-orb-3 absolute top-1/3 right-1/4 w-[380px] sm:w-[460px] h-[380px] sm:h-[460px] rounded-full bg-gradient-to-tr from-amber-200/30 via-rose-200/20 to-purple-200/15 blur-3xl transform-gpu"
      />

      {/* Floating Orb 4: Soft Cyan/Teal accent (Bottom-Left) */}
      <div
        className="animate-orb-1 absolute bottom-1/4 left-1/6 w-[360px] sm:w-[440px] h-[360px] sm:h-[440px] rounded-full bg-gradient-to-tr from-cyan-200/25 via-indigo-200/15 to-transparent blur-3xl transform-gpu"
      />

      {/* Subtle animated pattern overlay for tactile depth */}
      <div
        className="animate-mesh-pulse absolute inset-0 bg-[radial-gradient(#6366f1_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]"
      />
    </div>
  );
};

