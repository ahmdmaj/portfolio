# Project Status — Interactive Three.js Portfolio: Slingshot Lamp

## Current Phase: PHASE 1 — Foundation & Initial Visual Composition

### Architecture Overview
- **Framework**: Next.js 14 App Router with TypeScript (Strict mode) & ESLint
- **Styling**: Tailwind CSS with custom palette (`#050607`, `#E6DFD3`, `#8A8176`, `#E0B87A`, `#FFB866`)
- **Graphics**: Vanilla Three.js (`LampScene` engine), client-only dynamic loading (`ssr: false`)
- **State**: Single source of truth in `LampStore` decoupled from React
- **Coordinate System**: Normalized viewport anchors (`CoordinateUtils`) with responsive desktop/mobile scaling

---

### Phase 1 Objectives & Verification Checklist

| Criterion | Target | Status | Verification Method |
| :--- | :--- | :---: | :--- |
| **Project Foundation** | Next.js 14 + App Router + TS in current directory | ✅ Complete | Inspected `package.json`, layout, and configs |
| **Dependencies** | `three`, `@types/three`, `gsap`, `lucide-react` | ✅ Complete | Verified version `three@0.187.0` |
| **Visual Composition** | Near-black background (`#050607`), subtle grid, editorial layout | ✅ Complete | Styled in `globals.css` and `LampExperience.tsx` |
| **Typography & Copy** | Centralized in `copy.ts`, heavy grotesk headline, mono HUD | ✅ Complete | Verified in `copy.ts` and Tailwind config |
| **HUD & Controls** | Experiments nav link, status indicator, counters, sound toggle pill | ✅ Complete | Implemented in `LampHUD.tsx` |
| **Three.js Engine** | Standalone `LampScene` with Orthographic camera, DPR cap, resize handling | ✅ Complete | Implemented in `LampScene.ts` |
| **Coordinate Anchors** | Normalized viewport coordinates with responsive offsets | ✅ Complete | Implemented in `CoordinateUtils.ts` |
| **Lifecycle & Teardown** | Clean `mount`, `start`, `stop`, `dispose`, rAF cancel, resource disposal | ✅ Complete | Tested GPU teardown in `LampScene.dispose()` |
| **Routes** | `/`, `/experiments`, `/experiments/lamp` | ✅ Complete | Created pages with SEO metadata |
| **Typecheck** | `npx tsc --noEmit` passes with 0 errors | ⏳ Pending verification | Running in verification step |
| **ESLint** | `npm run lint` passes with 0 warnings/errors | ⏳ Pending verification | Running in verification step |
| **Production Build** | `npm run build` succeeds | ⏳ Pending verification | Running in verification step |

---

### Next Phases Roadmap
- **Phase 2**: Static 3D Environment & Lamp Construction (pendant cord, dome shade, socket, bulb mesh)
- **Phase 3**: Lighting, Glow, Atmosphere & Post-Processing (volumetric cone shader, UnrealBloomPass, CSS light mask sync)
- **Phase 4**: Interactive Wall Switch (3D switch plate, rocker animation, canvas labels, raycasting)
- **Phase 5**: Slingshot & Projectile Mechanics (wooden Y fork, elastic band cylinders, stone pull/launch)
- **Phase 6**: Physics & Swept Collision Detection (fixed 1/120s timestep, shade angular impulse, floor bounce)
- **Phase 7**: Bulb Destruction & Replacement Flow (glass shards InstancedMesh, spark flash, screw-in DOM button)
- **Phase 8**: Procedural Web Audio Synthesis (switch click, band twang, metal tonk, glass crash)
- **Phase 9**: Responsiveness, A11y & Optimization (mobile layout, keyboard controls, prefers-reduced-motion)
- **Phase 10**: Portfolio Polish & Deployment Prep
