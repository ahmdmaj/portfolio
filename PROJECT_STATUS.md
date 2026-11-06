# Project Status — Interactive Three.js Portfolio: Slingshot Lamp

## Current Phase: PHASE 4 — COMPLETE & VERIFIED

### Architecture & Foundation Overview
- **Framework**: Next.js 14 App Router (React 18, TypeScript strict mode)
- **Styling**: Tailwind CSS with custom palette:
  - Background: `#050607`
  - Text Primary: `#E6DFD3`
  - Text Muted: `#8A8176`
  - Accent Gold: `#E0B87A`
  - Bulb Warm Glow: `#FFB866`
- **Fonts**: Local variable grotesque typography (`GeistVF`) and monospace HUD font (`GeistMonoVF`)
- **Graphics Core**: Vanilla Three.js (`three@0.187.0`), client-only dynamic loading (`ssr: false`)
- **State Store**: Decoupled `LampStore` (single source of truth for bulb state, counters, audio preferences, drag state)
- **Coordinate System**: Normalized viewport anchors (`CoordinateUtils`) with automatic desktop/mobile responsive scaling
- **Lighting Core**: Decoupled `LightingSystem` + `EffectsSystem` (Gaussian planar light beam on wall, incandescent bulb glow halo, dynamic CSS variable synchronization)
- **Interactive Wall Switch Core**: Precision Three.js `Raycaster` with hover feedback, GSAP-powered rocker tilting animation, dynamic status LED (`#22c55e` $\leftrightarrow$ `#ef4444`), smooth lighting fade, and bi-directional DOM HUD synchronization

---

### Phase 4 Implementation & Verification Checklist

| Interactive Component / System | Implementation Details | Target & Behavior | Status |
| :--- | :--- | :--- | :---: |
| **A. Three.js Pointer Raycasting** | `Raycaster` on canvas container targeting specifically `rockerMesh`, `ledMesh`, and `labelMesh` | Ignores plate and background; handles pointer coordinates accurately | ✅ Complete |
| **B. Pointer Hover Feedback** | Subtly boosts rocker material emissive intensity (`0x22252c`, 0.85); sets `cursor: pointer` on container | Responsive cursor & visual feedback; cleanly restores on pointer leave | ✅ Complete |
| **C. Click Detection & Safeguards** | Validates pointer down vs up displacement ($< 8\text{px}$) to avoid misfiring during pan/drag | Reliable single-click toggle; calls `store.toggleSwitch()` | ✅ Complete |
| **D. GSAP Rocker Animation** | Smooth rotation of `rockerMesh.rotation.x`: ON ($-0.28\text{ rad}$) $\leftrightarrow$ OFF ($+0.28\text{ rad}$) via `gsap.to()` with `overwrite: "auto"` | Natural physical tilt in $0.22\text{s}$; gracefully redirects on rapid clicks | ✅ Complete |
| **E. Dynamic Status LED** | Toggles `ledMesh` material color & emissive between Green (`#22c55e`, 1.2 intensity) and Red (`#ef4444`, 0.45 intensity) | Realistic tactile status indicator on switch plate | ✅ Complete |
| **F. Smooth Lighting Fade** | GSAP tweens `lightTransition.factor` ($0.35\text{s}$, `power2.inOut`), coordinating `LightingSystem`, `EffectsSystem`, and `Bulb` | Warm beam & bulb glow fade to 0 when OFF; ambient/key light preserves room visibility | ✅ Complete |
| **G. Bi-directional HUD Sync** | `LampHUD` status indicator is an accessible button calling `store.toggleSwitch()`; 3D switch updates HUD | Clicking 3D switch updates HUD; clicking HUD updates 3D switch | ✅ Complete |

---

### Executable Roadmap

- [x] **PHASE 1**: Foundation, Coordinate Architecture & Initial Visual Composition
- [x] **PHASE 2**: Static 3D Environment & Lamp Construction (pendant cord, dome shade, socket, bulb, switch, slingshot, stone)
- [x] **PHASE 3**: Lighting, Glow, Atmosphere & Post-Processing (SpotLight, PointLight, Gaussian light beam, bulb halo, CSS sync)
- [x] **PHASE 4**: Interactive Wall Switch (3D switch plate, rocker animation, canvas labels, raycasting, HUD sync)
- [ ] **PHASE 5**: Slingshot & Projectile Mechanics (wooden Y fork, elastic band cylinders, stone pull/launch)
- [ ] **PHASE 6**: Physics & Swept Collision Detection (fixed 1/120s timestep, shade angular impulse, floor bounce)
- [ ] **PHASE 7**: Bulb Destruction & Replacement Flow (glass shards InstancedMesh, spark flash, screw-in DOM button)
- [ ] **PHASE 8**: Procedural Web Audio Synthesis (switch click, band twang, metal tonk, glass crash)
- [ ] **PHASE 9**: Responsiveness, A11y & Optimization (mobile layout, keyboard controls, prefers-reduced-motion)
- [ ] **PHASE 10**: Complete Portfolio Integration & Deployment Prep
