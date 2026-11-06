import * as THREE from "three";
import { CONFIG } from "../config";

export interface EffectsOptions {
  scene: THREE.Scene;
  lampSocketGroup: THREE.Group;
}

export class EffectsSystem {
  private lampSocketGroup: THREE.Group;

  // Visual Volumetric Light Cone
  private lightConeMesh: THREE.Mesh;
  private lightConeGeometry: THREE.CylinderGeometry;
  private lightConeMaterial: THREE.ShaderMaterial;

  // Warm Bulb Glow Aura
  private glowMesh: THREE.Mesh;
  private glowGeometry: THREE.SphereGeometry;
  private glowMaterial: THREE.ShaderMaterial;

  private currentIntensity = 1.0;

  constructor(options: EffectsOptions) {
    this.lampSocketGroup = options.lampSocketGroup;

    // 1. Subtle Volumetric Light Cone beneath the lamp
    // Height 8.5 units spanning from the lamp shade down toward the floor
    const coneHeight = 8.5;
    const radiusTop = 0.45;
    const radiusBottom = 4.0;
    this.lightConeGeometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      coneHeight,
      36,
      1,
      true
    );
    // Translate geometry so top rim aligns with y = 0
    this.lightConeGeometry.translate(0, -coneHeight / 2, 0);

    this.lightConeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(CONFIG.colors.bulbWarm) },
        uIntensity: { value: 1.0 },
        uHeight: { value: coneHeight },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vPosition = position;
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uHeight;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          // Vertical smooth falloff from lamp down to base
          float distY = clamp(-vPosition.y / uHeight, 0.0, 1.0);
          float verticalFade = smoothstep(1.0, 0.02, distY);

          // Soft translucent edge falloff (Fresnel-like soften on silhouette)
          vec3 viewDir = normalize(vViewPosition);
          float edge = abs(dot(vNormal, viewDir));
          float edgeFade = smoothstep(0.0, 0.5, edge);

          // Combined subtle haze transparency (non-intrusive)
          float alpha = verticalFade * edgeFade * 0.16 * uIntensity;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.lightConeMesh = new THREE.Mesh(this.lightConeGeometry, this.lightConeMaterial);
    // Positioned right at the base of the shade rim
    this.lightConeMesh.position.set(0, -0.66, 0);
    this.lampSocketGroup.add(this.lightConeMesh);

    // 2. Warm Optical Glow Halo around the incandescent bulb
    this.glowGeometry = new THREE.SphereGeometry(0.55, 24, 24);
    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(CONFIG.colors.bulbWarm) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float glow = pow(max(0.0, dot(vNormal, viewDir)), 2.5);
          float alpha = glow * 0.45 * uIntensity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
    this.glowMesh.position.set(0, -0.58, 0);
    this.lampSocketGroup.add(this.glowMesh);
  }

  /**
   * Sets effect intensity for light transitions
   */
  public setIntensity(factor: number): void {
    this.currentIntensity = Math.max(0, Math.min(1.5, factor));
    this.lightConeMaterial.uniforms.uIntensity.value = this.currentIntensity;
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

    // Project lamp world position to 2D screen coordinate
    const projected = lampWorldPos.clone().project(camera);
    const screenPercentX = ((projected.x + 1) / 2) * 100;

    const root = document.documentElement;
    root.style.setProperty("--light-x", `${screenPercentX.toFixed(1)}%`);
    root.style.setProperty("--light-i", this.currentIntensity.toFixed(2));
  }

  public dispose(): void {
    this.lampSocketGroup.remove(this.lightConeMesh);
    this.lampSocketGroup.remove(this.glowMesh);

    this.lightConeGeometry.dispose();
    this.lightConeMaterial.dispose();

    this.glowGeometry.dispose();
    this.glowMaterial.dispose();
  }
}
