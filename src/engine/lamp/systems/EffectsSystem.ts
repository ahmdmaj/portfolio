import * as THREE from "three";
import { CONFIG } from "../config";

export interface EffectsOptions {
  scene: THREE.Scene;
  lampSocketGroup: THREE.Group;
}

export class EffectsSystem {
  private lampSocketGroup: THREE.Group;

  // Cinematic Planar Light Beam on Wall
  private lightBeamMesh: THREE.Mesh;
  private lightBeamGeometry: THREE.BufferGeometry;
  private lightBeamMaterial: THREE.ShaderMaterial;

  // Warm Bulb Optical Glow Halo
  private glowMesh: THREE.Mesh;
  private glowGeometry: THREE.PlaneGeometry;
  private glowMaterial: THREE.ShaderMaterial;

  private currentIntensity = 1.0;

  constructor(options: EffectsOptions) {
    this.lampSocketGroup = options.lampSocketGroup;

    // 1. Construct subdivided trapezoid planar light beam
    // Placed directly in front of the wall (z = -1.35) and parented to lampSocketGroup
    // so it naturally swings in sync with the physical lamp pendulum
    const rows = 24;
    const cols = 24;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const topWidth = 1.6;
    const bottomWidth = 11.5;
    const height = 9.8;

    for (let r = 0; r <= rows; r++) {
      const v = 1.0 - r / rows; // 1 at top (apex under shade), 0 at bottom
      const y = -r * (height / rows);
      const width = topWidth + (1.0 - v) * (bottomWidth - topWidth);

      for (let c = 0; c <= cols; c++) {
        const u = c / cols;
        const x = (u - 0.5) * width;
        positions.push(x, y, 0);
        uvs.push(u, v);
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i0 = r * (cols + 1) + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (cols + 1) + c;
        const i3 = i2 + 1;
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    this.lightBeamGeometry = new THREE.BufferGeometry();
    this.lightBeamGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.lightBeamGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(uvs, 2)
    );
    this.lightBeamGeometry.setIndex(indices);
    this.lightBeamGeometry.computeVertexNormals();

    this.lightBeamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xd9822b) },       // Deep warm amber
        uColorCore: { value: new THREE.Color(0xffe8ba) },   // Radiant glowing golden core
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uColorCore;
        uniform float uIntensity;
        varying vec2 vUv;

        void main() {
          // Horizontal distance from central vertical spine [0.0 at center, 1.0 at outer edge]
          float dx = abs(vUv.x - 0.5) * 2.0;

          // Pure mathematical Gaussian horizontal falloff (zero hard boundaries)
          float gaussian = exp(-3.2 * dx * dx);
          float edgeCut = smoothstep(1.0, 0.72, dx);
          float horizontalProfile = gaussian * edgeCut;

          // Vertical falloff: warm intense radiance at the lamp shade, smoothly decaying downwards
          float verticalProfile = pow(vUv.y, 0.75) * smoothstep(0.0, 0.12, vUv.y);

          // Core radiant warmth interpolation
          float coreMix = pow(vUv.y, 1.2) * exp(-5.0 * dx * dx);
          vec3 finalColor = mix(uColor, uColorCore, clamp(coreMix, 0.0, 1.0));

          // Calibrated opacity factor for rich moody contrast against #050607
          float alpha = horizontalProfile * verticalProfile * 0.48 * uIntensity;

          gl_FragColor = vec4(finalColor * alpha, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.lightBeamMesh = new THREE.Mesh(this.lightBeamGeometry, this.lightBeamMaterial);
    // Positioned right at the shade rim lip, just in front of the wall plane
    this.lightBeamMesh.position.set(0, -0.68, -1.35);
    this.lampSocketGroup.add(this.lightBeamMesh);

    // 2. Warm Optical Glow Halo around the incandescent bulb
    this.glowGeometry = new THREE.PlaneGeometry(1.6, 1.6);
    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(CONFIG.colors.bulbWarm) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          if (dist > 1.0) discard;

          float falloff = exp(-3.6 * dist * dist) * smoothstep(1.0, 0.55, dist);
          float alpha = falloff * 0.38 * uIntensity;
          gl_FragColor = vec4(uColor * alpha, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
    this.glowMesh.position.set(0, -0.62, 0.22);
    this.lampSocketGroup.add(this.glowMesh);
  }

  /**
   * Sets effect intensity for light transitions
   */
  public setIntensity(factor: number): void {
    this.currentIntensity = Math.max(0, Math.min(1.5, factor));
    this.lightBeamMaterial.uniforms.uIntensity.value = this.currentIntensity;
    this.glowMaterial.uniforms.uIntensity.value = this.currentIntensity;
  }

  /**
   * Updates CSS variables --light-x and --light-i on document root
   * so DOM typography dynamically aligns with the physical lamp position and intensity
   */
  public updateDOMIllumination(
    lampWorldPos: THREE.Vector3,
    camera: THREE.Camera,
    containerWidth: number
  ): void {
    if (typeof document === "undefined" || containerWidth <= 0) return;

    const projected = lampWorldPos.clone().project(camera);
    const screenPercentX = ((projected.x + 1) / 2) * 100;

    const root = document.documentElement;
    root.style.setProperty("--light-x", `${screenPercentX.toFixed(1)}%`);
    root.style.setProperty("--light-i", this.currentIntensity.toFixed(2));
  }

  public dispose(): void {
    this.lampSocketGroup.remove(this.lightBeamMesh);
    this.lampSocketGroup.remove(this.glowMesh);

    this.lightBeamGeometry.dispose();
    this.lightBeamMaterial.dispose();

    this.glowGeometry.dispose();
    this.glowMaterial.dispose();
  }
}
