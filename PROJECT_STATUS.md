# Project Status — Interactive Three.js Portfolio: Slingshot Lamp

## Current Phase: PHASE 6 — COMPLETE & VERIFIED

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
- **State Store**: Decoupled `LampStore` (single source of truth for bulb state, counters, audio preferences, drag state, normalized draw power)
- **Coordinate System**: Normalized viewport anchors (`CoordinateUtils`) with automatic desktop/mobile responsive scaling
- **Lighting Core**: Decoupled `LightingSystem` + `EffectsSystem` (Gaussian planar light beam on wall, incandescent bulb glow halo, dynamic CSS variable synchronization)
- **Interactive Wall Switch Core**: Precision Three.js `Raycaster` with hover feedback, GSAP-powered rocker tilting animation, dynamic status LED (`#22c55e` $\leftrightarrow$ `#ef4444`), smooth lighting fade, and bi-directional DOM HUD synchronization
- **Slingshot & Projectile Core**: Decoupled `SlingshotInteractionSystem` + `ProjectileSystem`, dynamic elastic band deformation with physical thinning, draw distance clamping, normalized power calculation, and damped elastic spring-back
- **Physics, Swept Collision & Pendulum Core**: Decoupled `CollisionSystem` + `LampPendulumSystem`, continuous swept sphere collision detection against dynamic proxies, momentum transfer into angular pendulum oscillation ($I \ddot{\theta} + c \dot{\theta} + mgL \sin\theta = \tau$), physical switch activation, and multi-bounce floor restitution with settling lifecycle

---

### Phase 6 Implementation & Verification Checklist

| Physics & Collision System | Implementation Details | Target & Behavior | Status |
| :--- | :--- | :--- | :---: |
| **A. Continuous Swept Collision** | Mathematical segment-to-sphere/plane intersection between $P_0$ and predicted $P_1$ | Zero projectile tunneling through thin targets at high velocities | ✅ Complete |
| **B. Lamp Shade Strike Detection** | Tests swept sphere against moving shade proxy ($R_{\text{shade}} = 0.88$); calculates contact point and normal $\vec{n}$ | Accurately catches strikes on front, bottom rim, and curved metal dome | ✅ Complete |
| **C. Lamp Pendulum Dynamics** | Angular harmonic oscillator ($I \ddot{\theta} + c \dot{\theta} + mgL \sin\theta = \tau$); updates `lamp.setRotation(theta)` | Lamp shade, bulb, socket, and Gaussian light beam swing in unison with realistic damping | ✅ Complete |
| **D. Momentum Transfer to Pendulum** | Imparts angular impulse $\Delta \omega = \frac{(\vec{r} \times m_{\text{stone}}\vec{v})_z}{I}$ into `LampPendulumSystem` | Stronger hits produce wider swings; glancing hits produce subtle sways; subsequent hits modify motion | ✅ Complete |
| **E. Physical Wall Switch Activation** | Swept collision with switch rocker proxy; checks threshold speed $\ge 4.5\text{ units/s}$ with single-flight debounce | Struck rocker physically toggles `store.toggleSwitch()`, triggering LED, sound hook, and lighting fade | ✅ Complete |
| **F. Environmental Bounces & Settling**| Floor reflection ($e = 0.52$, friction $0.82$); secondary bounces until speed $< 0.65\text{ units/s}$ | Stone settles realistically on the floor before graceful timed respawn | ✅ Complete |
| **G. Sub-Stepping Precision** | Fixed sub-stepped physics integration ($3\text{ substeps/frame}$) clamping max delta time ($0.033\text{s}$) | Frame-rate independent collision and trajectory consistency across high-DPI and mobile | ✅ Complete |

---

### Executable Roadmap

- [x] **PHASE 1**: Foundation, Coordinate Architecture & Initial Visual Composition
- [x] **PHASE 2**: Static 3D Environment & Lamp Construction (pendant cord, dome shade, socket, bulb, switch, slingshot, stone)
- [x] **PHASE 3**: Lighting, Glow, Atmosphere & Post-Processing (SpotLight, PointLight, Gaussian light beam, bulb halo, CSS sync)
- [x] **PHASE 4**: Interactive Wall Switch (3D switch plate, rocker animation, canvas labels, raycasting, HUD sync)
- [x] **PHASE 5**: Slingshot & Projectile Mechanics (wooden Y fork, elastic band deformation, draw/aim/launch, ballistic flight)
- [x] **PHASE 6**: Physics & Swept Collision Detection (swept continuous collision, lamp pendulum mechanics, physical switch toggle, floor bounce/settle)
- [ ] **PHASE 7**: Bulb Destruction & Replacement Flow (glass shards InstancedMesh, spark flash, screw-in DOM button)
- [ ] **PHASE 8**: Procedural Web Audio Synthesis (switch click, band twang, metal tonk, glass crash)
- [ ] **PHASE 9**: Responsiveness, A11y & Optimization (mobile layout, keyboard controls, prefers-reduced-motion)
- [ ] **PHASE 10**: Complete Portfolio Integration & Deployment Prep
