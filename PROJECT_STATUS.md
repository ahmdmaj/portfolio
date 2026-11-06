# Project Status — Interactive Three.js Portfolio: Slingshot Lamp

## Current Phase: PHASE 2 — COMPLETE & VERIFIED

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

---

### Phase 2 Implementation & Verification Checklist

| Physical Object / System | Geometry & Material Choice | Positioning & Scale | Status |
| :--- | :--- | :--- | :---: |
| **A. Wall Background** | Large planar mesh (`PlaneGeometry(30, 20)`), `MeshStandardMaterial` (roughness 0.95, near-black `#050607`) | Centered at $z = -1.5$, covers entire viewport frustum | ✅ Complete |
| **B. Hanging Lamp** | Braided black cable, brass relief ferrule, industrial dome shade via `LatheGeometry` with rolled lip & thickness | Upper center anchor ($nx: 0, ny: 0.96$), shade at ~28% viewport height | ✅ Complete |
| **C. Metallic Lamp Shade** | Double-sided brushed graphite metal (`MeshStandardMaterial`, roughness 0.32, metalness 0.88) | Integrated into swinging pivot group | ✅ Complete |
| **D. Bulb Socket** | Industrial bakelite/metal cylinder with brass threaded collar | Located at bottom of pendant cable | ✅ Complete |
| **E. Bulb** | Pear-shaped incandescent envelope (`LatheGeometry`) with warm emissive glow (`0xffeed1`, emissive `#ffb866`, intensity 1.35) and tungsten filament | Seated inside the socket beneath the shade | ✅ Complete |
| **F. Wall Switch** | Layered dark charcoal switch plate, tilting central rocker, green status LED indicator (`#22c55e`), procedural high-DPI "ON"/"OFF" markings, mounting screws | Right side anchor ($nx: 0.78, ny: 0.05$ on desktop; $nx: 0.40, ny: -0.20$ on mobile) | ✅ Complete |
| **G. Wooden Slingshot** | Natural walnut Y-shaped fork using `TubeGeometry` along 3D CatmullRom splines, straight vertical handle, dark leather pouch, surgical amber latex bands | Bottom-left anchor ($nx: -0.72, ny: -0.68$ on desktop; $nx: -0.52, ny: -0.66$ on mobile) | ✅ Complete |
| **H. Pebble Projectile** | Organic tumbled stone via perturbed `IcosahedronGeometry` (roughness 0.88, muted grey `#71717a`) | Resting securely inside slingshot leather pouch | ✅ Complete |
| **Lighting (Static)** | Ambient (0.65), Key light (1.15), Soft fill (0.45), Top rim light (0.85) | Sculpting physical contours and specular highlights without shaders | ✅ Complete |

---

### Executable Roadmap

- [x] **PHASE 1**: Foundation, Coordinate Architecture & Initial Visual Composition
- [x] **PHASE 2**: Static 3D Environment & Lamp Construction (pendant cord, dome shade, socket, bulb, switch, slingshot, stone)
- [ ] **PHASE 3**: Lighting, Glow, Atmosphere & Post-Processing (volumetric cone shader, UnrealBloomPass, CSS light mask sync)
- [ ] **PHASE 4**: Interactive Wall Switch (3D switch plate, rocker animation, canvas labels, raycasting)
- [ ] **PHASE 5**: Slingshot & Projectile Mechanics (wooden Y fork, elastic band cylinders, stone pull/launch)
- [ ] **PHASE 6**: Physics & Swept Collision Detection (fixed 1/120s timestep, shade angular impulse, floor bounce)
- [ ] **PHASE 7**: Bulb Destruction & Replacement Flow (glass shards InstancedMesh, spark flash, screw-in DOM button)
- [ ] **PHASE 8**: Procedural Web Audio Synthesis (switch click, band twang, metal tonk, glass crash)
- [ ] **PHASE 9**: Responsiveness, A11y & Optimization (mobile layout, keyboard controls, prefers-reduced-motion)
- [ ] **PHASE 10**: Complete Portfolio Integration & Deployment Prep
