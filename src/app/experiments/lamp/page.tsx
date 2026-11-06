import { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamic client-only import with ssr: false so Three.js stays out of the initial SSR bundle
const LampExperience = dynamic(
  () =>
    import("@/components/lamp/LampExperience").then((mod) => mod.LampExperience),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen bg-bg flex items-center justify-center font-mono text-xs text-muted/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>loading experiment...</span>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Slingshot Lamp · Interactive Experiment",
  description:
    "A full-viewport 2.5D interactive study: swinging industrial lamp, slingshot projectile physics, swept collisions, fragile bulb shattering, and procedural Web Audio.",
  openGraph: {
    title: "Slingshot Lamp · Interactive Three.js Experiment",
    description:
      "A tactile physical light experiment with dynamic shadows, bloom post-processing, and interactive slingshot mechanics.",
    type: "website",
    images: [
      {
        url: "/og/slingshot-lamp.png",
        width: 1200,
        height: 630,
        alt: "Slingshot Lamp Experiment Preview",
      },
    ],
  },
};

export default function LampPage() {
  return <LampExperience />;
}
