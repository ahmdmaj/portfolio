"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { LampScene } from "@/engine/lamp/LampScene";
import { COPY } from "@/engine/lamp/copy";
import { LampState, SocketScreenPosition } from "@/engine/lamp/types";
import { LampHUD } from "./LampHUD";
import { LampFallback } from "./LampFallback";

export const LampExperience: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<LampScene | null>(null);

  const [lampState, setLampState] = useState<LampState>({
    bulb: "on",
    switchOn: true,
    shots: 0,
    bulbs: 0,
    soundEnabled: true,
    isDragging: false,
    drawPower: 0,
  });

  const [socketPos, setSocketPos] = useState<SocketScreenPosition | null>(null);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  const handleToggleSound = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.store.toggleSound();
    }
  }, []);

  const handleTogglePower = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.store.toggleSwitch();
    }
  }, []);

  const handleReplaceBulb = useCallback(() => {
    if (engineRef.current && !isReplacing) {
      setIsReplacing(true);
      engineRef.current.replaceBulb(() => {
        setIsReplacing(false);
      });
    }
  }, [isReplacing]);

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
      onSocketPositionChange: (pos) => {
        setSocketPos(pos);
      },
    });

    engine.mount(containerRef.current);
    engineRef.current = engine;
    setLampState(engine.store.getState());

    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__lampEngine = engine;
      (window as unknown as Record<string, unknown>).__lampStore = engine.store;
    }

    // 3. Global keyboard accessibility (R = Replace bulb, S = Flip switch)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "KeyR" && engine.store.getState().bulb === "broken") {
        e.preventDefault();
        handleReplaceBulb();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        handleTogglePower();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 4. Cleanup on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [handleReplaceBulb, handleTogglePower]);

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
      <LampHUD
        state={lampState}
        onToggleSound={handleToggleSound}
        onTogglePower={handleTogglePower}
      />

      {/* Accessible DOM Button for Bulb Replacement (projected to 3D socket position) */}
      {lampState.bulb === "broken" && !isReplacing && (
        <div
          style={{
            left: socketPos ? `${socketPos.x}px` : "50%",
            top: socketPos ? `${socketPos.y + 42}px` : "34vh",
            transform: "translate(-50%, 0)",
          }}
          className="absolute z-30 pointer-events-auto transition-transform duration-75 ease-out animate-in fade-in zoom-in-95"
        >
          <button
            type="button"
            onClick={handleReplaceBulb}
            aria-label={COPY.actions.replaceBulb}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-accent/40 bg-bg/90 backdrop-blur-md text-xs font-mono text-accent hover:text-text hover:border-accent hover:bg-accent/15 transition-all shadow-[0_0_25px_rgba(224,184,122,0.25)] cursor-pointer group active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-accent group-hover:scale-125 transition-transform animate-pulse" />
            <span className="font-medium tracking-wide">{COPY.actions.replaceBulb}</span>
            <span className="text-[10px] text-muted/70 bg-muted/10 px-1.5 py-0.5 rounded border border-muted/20 group-hover:text-text transition-colors">
              [R]
            </span>
          </button>
        </div>
      )}

      {/* Upper-Center Small Monospace Time Label under Lamp */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[30vh] sm:top-[32vh] pointer-events-none z-20">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted/70 px-2.5 py-1 rounded border border-muted/10 bg-bg/60 backdrop-blur-sm shadow-sm">
          {COPY.lampMeta.timeLabel}
        </span>
      </div>

      {/* Centered Editorial Headline & Supporting Copy */}
      <div className="absolute inset-x-0 top-[58vh] -translate-y-1/2 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-20">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tightest leading-[0.95] max-w-4xl text-text font-grotesk">
          {COPY.headline.line1} <br />
          <span className="text-accent">{COPY.headline.accentWord}</span>
        </h1>

        <div className="mt-5 space-y-1 max-w-[280px] sm:max-w-lg mx-auto text-xs sm:text-sm text-muted/80 font-normal leading-relaxed">
          <p>{COPY.headline.subcopyLine1}</p>
          <p className="hidden sm:block text-muted/60">{COPY.headline.subcopyLine2}</p>
        </div>
      </div>

      {/* Bottom Monospace Interaction Instructions */}
      <footer className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 flex justify-center items-center pointer-events-none z-20 font-mono text-[11px] text-muted/60 text-center">
        <span className="px-3 py-1 rounded-full border border-muted/10 bg-bg/60 backdrop-blur-sm">
          <span className="hidden sm:inline">{COPY.hint.desktop}</span>
          <span className="sm:hidden">{COPY.hint.mobile}</span>
        </span>
      </footer>
    </div>
  );
};

