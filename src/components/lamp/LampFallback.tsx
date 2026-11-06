"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { COPY } from "@/engine/lamp/copy";

export const LampFallback: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-bg z-30">
      <div className="max-w-md w-full p-8 rounded-2xl border border-muted/20 bg-bg/80 text-center space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-text">
            {COPY.fallback.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            {COPY.fallback.message}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={COPY.nav.backHref}
            className="inline-block px-5 py-2.5 rounded-full border border-muted/30 text-xs font-mono text-text hover:border-accent transition-colors"
          >
            {COPY.fallback.action}
          </Link>
        </div>
      </div>
    </div>
  );
};

