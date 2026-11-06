"use client";

import React from "react";
import Link from "next/link";
import { COPY } from "@/engine/lamp/copy";
import { LampState } from "@/engine/lamp/types";

interface LampHUDProps {
  state: LampState;
  onToggleSound: () => void;
}

export const LampHUD: React.FC<LampHUDProps> = ({ state, onToggleSound }) => {
  const getStatusColor = () => {
    switch (state.bulb) {
      case "on":
        return "text-accent";
      case "off":
        return "text-muted";
      case "broken":
        return "text-red-400";
    }
  };

  return (
    <header className="absolute inset-x-0 top-0 p-3.5 sm:p-6 md:p-8 flex justify-between items-start pointer-events-none z-20 font-mono text-xs select-none">
      {/* Top Left Navigation and Status HUD */}
      <div className="space-y-2 pointer-events-auto">
        <Link
          href={COPY.nav.backHref}
          className="inline-block text-muted hover:text-text transition-colors tracking-tight"
        >
          {COPY.nav.back}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[11px] text-muted/80">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-text font-medium">{COPY.hud.title}</span>
            <span>·</span>
            <span className={`uppercase font-semibold ${getStatusColor()}`}>
              {state.bulb}
            </span>
          </div>

          <span className="hidden sm:inline text-muted/40">/</span>

          <div className="flex items-center gap-2 text-muted">
            <span>
              {COPY.hud.shotsLabel} <strong className="text-text font-semibold">{state.shots}</strong>
            </span>
            <span>·</span>
            <span>
              {COPY.hud.bulbsLabel} <strong className="text-text font-semibold">{state.bulbs}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Top Right Sound Toggle Pill */}
      <div className="pointer-events-auto">
        <button
          onClick={onToggleSound}
          type="button"
          aria-label={state.soundEnabled ? "Mute audio" : "Unmute audio"}
          className="px-3 py-1.5 rounded-full border border-muted/20 bg-bg/40 backdrop-blur-sm text-[11px] text-muted hover:text-text hover:border-accent/50 transition-all flex items-center gap-2"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              state.soundEnabled ? "bg-accent shadow-[0_0_8px_rgba(224,184,122,0.8)]" : "bg-muted/40"
            }`}
          />
          <span>{state.soundEnabled ? COPY.hud.soundOn : COPY.hud.soundOff}</span>
        </button>
      </div>
    </header>
  );
};

