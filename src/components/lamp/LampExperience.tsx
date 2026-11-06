"use client";

import React, { useEffect, useRef, useState } from "react";
import { LampScene } from "@/engine/lamp/LampScene";
import { COPY } from "@/engine/lamp/copy";
import { LampState } from "@/engine/lamp/types";
import { LampHUD } from "./LampHUD";
import { LampFallback } from "./LampFallback";

export const LampExperience: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<LampScene | null>(null);

  const [lampState, setLampState] = useState<LampState>({
    bulb: "on",
    shots: 0,
    bulbs: 0,
    soundEnabled: true,
    isDragging: false,
  });

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    // 1. Verify WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setHasWebGL(false);
      return;
    }

    if (!containerRef.current) return;

    // 2. Initialize vanilla Three.js LampScene engine
    const engine = new LampScene({
      onStateChange: (newState) => {
        setLampState(newState);
      },
    });

    engine.mount(containerRef.current);
    engineRef.current = engine;

    // 3. Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  const handleToggleSound = () => {
    if (engineRef.current) {
      engineRef.current.store.toggleSound();
    }
  };

  if (!hasWebGL) {
    return <LampFallback />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Subtle Background Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-10 opacity-60" />

      {/* Top HUD & Navigation */}
      <LampHUD state={lampState} onToggleSound={handleToggleSound} />

      {/* Upper-Center Small Monospace Time Label under Lamp */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[24vh] sm:top-[26vh] pointer-events-none z-20">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted/70 px-2.5 py-1 rounded border border-muted/10 bg-bg/60 backdrop-blur-sm shadow-sm">
          {COPY.lampMeta.timeLabel}
        </span>
      </div>

      {/* Centered Editorial Headline & Supporting Copy */}
      <div className="absolute inset-x-0 top-[56vh] sm:top-[58vh] -translate-y-1/2 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-20">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tightest leading-[0.95] max-w-4xl text-text font-grotesk">
          {COPY.headline.line1} <br className="hidden sm:inline" />
          <span className="text-accent">{COPY.headline.accentWord}</span>
        </h1>

        <div className="mt-5 space-y-1 max-w-lg text-xs sm:text-sm text-muted/80 font-normal leading-relaxed">
          <p>{COPY.headline.subcopyLine1}</p>
          <p className="hidden sm:block text-muted/60">{COPY.headline.subcopyLine2}</p>
        </div>
      </div>

      {/* Bottom Monospace Interaction Instructions */}
      <footer className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex justify-center items-center pointer-events-none z-20 font-mono text-[11px] text-muted/60 text-center">
        <span className="px-3 py-1 rounded-full border border-muted/10 bg-bg/60 backdrop-blur-sm">
          <span className="hidden sm:inline">{COPY.hint.desktop}</span>
          <span className="sm:hidden">{COPY.hint.mobile}</span>
        </span>
      </footer>
    </div>
  );
};

