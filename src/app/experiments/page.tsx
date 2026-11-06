import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Experiments · Creative Engineering Lab",
  description: "A showcase of interactive Three.js experiments, shader simulations, and kinetic mechanics.",
};

export default function ExperimentsPage() {
  const experiments = [
    {
      id: "lamp",
      title: "Slingshot Lamp",
      status: "Phase 1 Active",
      description:
        "A physical-grade 2.5D interactive study: a swinging industrial pendant lamp, responsive wall switch, slingshot projectile mechanics, swept collision dynamics, fragile bulb shatter, and procedural audio synthesis.",
      href: "/experiments/lamp",
      tags: ["Three.js", "Custom Physics", "Shaders", "Web Audio API", "Post-Processing"],
    },
  ];

  return (
    <main className="min-h-screen p-6 sm:p-12 md:p-16 max-w-5xl mx-auto flex flex-col justify-between bg-grid-pattern">
      <div>
        <header className="flex items-center justify-between pb-8 border-b border-muted/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>back to portfolio</span>
          </Link>
          <span className="text-xs font-mono text-muted uppercase tracking-widest">
            Laboratory / Experiments
          </span>
        </header>

        <section className="pt-12 sm:pt-16 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text">
            Experiments & Studies
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-xl leading-relaxed">
            Tangible, playful web interactions engineered from first principles with custom 
            physics integrators and hardware-accelerated graphics.
          </p>

          <div className="pt-10 grid gap-6">
            {experiments.map((exp) => (
              <Link
                key={exp.id}
                href={exp.href}
                className="group block p-6 sm:p-8 rounded-2xl border border-muted/20 bg-bg/60 backdrop-blur-sm hover:border-accent/60 transition-all hover:shadow-xl hover:shadow-accent/5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-text group-hover:text-accent transition-colors">
                        {exp.title}
                      </h2>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        {exp.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted leading-relaxed max-w-2xl">
                      {exp.description}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-muted/20 flex items-center justify-center text-muted group-hover:border-accent group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-muted/10 text-muted/90 border border-muted/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="pt-16 border-t border-muted/10 text-xs font-mono text-muted/60 flex justify-between">
        <span>Portfolio · Experiments</span>
        <span>/experiments/lamp</span>
      </footer>
    </main>
  );
}

