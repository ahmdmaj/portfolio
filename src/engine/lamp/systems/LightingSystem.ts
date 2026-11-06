import * as THREE from "three";
import { CONFIG } from "../config";

export interface LightingOptions {
  scene: THREE.Scene;
  lampSocketGroup: THREE.Group;
}

export class LightingSystem {
  private scene: THREE.Scene;
  private lampSocketGroup: THREE.Group;

  // Lights
  public bulbLight: THREE.PointLight;
  public ambientLight: THREE.AmbientLight;
  public keyLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;

  // Base intensities for tuning and state changes
  private baseBulbIntensity = 18.0;
  private baseAmbientIntensity = 0.28;
  private baseKeyIntensity = 0.55;
  private baseRimIntensity = 0.65;
  private baseFillIntensity = 0.22;

  private currentIntensityFactor = 1.0;

  constructor(options: LightingOptions) {
    this.scene = options.scene;
    this.lampSocketGroup = options.lampSocketGroup;

    // 1. Primary bulb PointLight (mounted directly at the bulb center inside the lamp socket group)
    // Warm incandescent amber/gold with physically correct quadratic decay (decay = 2)
    this.bulbLight = new THREE.PointLight(
      CONFIG.colors.bulbWarm,
      this.baseBulbIntensity,
      16.0,
      2.0
    );
    // Positioned slightly below the socket collar at the bulb's center
    this.bulbLight.position.set(0, -0.68, 0.12);
    this.bulbLight.castShadow = true;

    // Optimize shadow map settings
    this.bulbLight.shadow.mapSize.width = 1024;
    this.bulbLight.shadow.mapSize.height = 1024;
    this.bulbLight.shadow.camera.near = 0.1;
    this.bulbLight.shadow.camera.far = 20.0;
    this.bulbLight.shadow.bias = -0.001;
    this.bulbLight.shadow.normalBias = 0.02;

    this.lampSocketGroup.add(this.bulbLight);

    // 2. Subtle ambient fill (keeps shadowed areas dark without total black pitch)
    this.ambientLight = new THREE.AmbientLight(0x0e1017, this.baseAmbientIntensity);
    this.scene.add(this.ambientLight);

    // 3. Directional Key Light from top-left (creates soft specular highlights on metallic shade and wood)
    this.keyLight = new THREE.DirectionalLight(0xffeedd, this.baseKeyIntensity);
    this.keyLight.position.set(-4.0, 5.5, 6.0);
    this.scene.add(this.keyLight);

    // 4. Directional Rim Light from behind/top (sculpts the industrial metal shade edge)
    this.rimLight = new THREE.DirectionalLight(0xffffff, this.baseRimIntensity);
    this.rimLight.position.set(0, 6.5, 1.2);
    this.scene.add(this.rimLight);

    // 5. Soft warm bounce fill from lower right
    this.fillLight = new THREE.DirectionalLight(CONFIG.colors.accent, this.baseFillIntensity);
    this.fillLight.position.set(3.5, -1.8, 4.5);
    this.scene.add(this.fillLight);
  }

  /**
   * Sets overall lighting intensity factor [0.0 to 1.0] for switch toggles & transitions
   */
  public setIntensity(factor: number): void {
    this.currentIntensityFactor = Math.max(0, Math.min(1.5, factor));
    this.bulbLight.intensity = this.baseBulbIntensity * this.currentIntensityFactor;
    // Ambient and key light slightly adjust to simulate real optical pupil response
    this.ambientLight.intensity = this.baseAmbientIntensity * (0.6 + 0.4 * this.currentIntensityFactor);
  }

  public getBulbWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.bulbLight.getWorldPosition(pos);
    return pos;
  }

  public dispose(): void {
    this.lampSocketGroup.remove(this.bulbLight);
    this.bulbLight.dispose();

    this.scene.remove(this.ambientLight);
    this.ambientLight.dispose();

    this.scene.remove(this.keyLight);
    this.keyLight.dispose();

    this.scene.remove(this.rimLight);
    this.rimLight.dispose();

    this.scene.remove(this.fillLight);
    this.fillLight.dispose();
  }
}
