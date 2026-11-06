import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-5xl mx-auto bg-grid-pattern">
      <header className="flex justify-between items-center text-xs font-mono text-muted uppercase tracking-widest border-b border-muted/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Portfolio</span>
        </div>
        <span>Creative Developer · 2026</span>
      </header>

      <section className="my-auto py-16 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Feature Experiment</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-text leading-[1.08]">
          Building tactile, <br />
          <span className="text-accent">kinetic digital craft.</span>
        </h1>

        <p className="text-muted text-base sm:text-lg max-w-xl leading-relaxed">
          Exploring the frontier where physical metaphors meet real-time WebGL shaders, 
          custom physics engines, and high-fidelity browser interaction design.
        </p>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link
            href="/experiments/lamp"
            className="group px-6 py-3.5 rounded-full bg-accent text-bg font-mono text-sm font-semibold hover:opacity-95 transition-all inline-flex items-center gap-2 shadow-lg shadow-accent/10"
          >
            <span>Launch Slingshot Lamp</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link
            href="/experiments"
            className="px-6 py-3.5 rounded-full border border-muted/30 hover:border-accent text-text font-mono text-sm hover:bg-muted/5 transition-all"
          >
            View All Experiments
          </Link>
        </div>
      </section>

      <footer className="text-xs font-mono text-muted/60 flex flex-col sm:flex-row justify-between gap-4 border-t border-muted/10 pt-6">
        <span>Signature Experiment: Slingshot Lamp</span>
        <span>Built with Three.js, Next.js & Web Audio API</span>
      </footer>
    </main>
  );
}
