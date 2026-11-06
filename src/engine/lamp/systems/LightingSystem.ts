import * as THREE from "three";
import { CONFIG } from "../config";

export interface LightingOptions {
  scene: THREE.Scene;
  lampSocketGroup: THREE.Group;
}

export class LightingSystem {
  private scene: THREE.Scene;
  private lampSocketGroup: THREE.Group;

  // Primary Lights
  public spotLight: THREE.SpotLight;
  public spotTarget: THREE.Object3D;
  public bulbLight: THREE.PointLight;
  public ambientLight: THREE.AmbientLight;
  public keyLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;

  // Calibrated base intensities
  private baseSpotIntensity = 22.0;
  private baseBulbIntensity = 5.0;
  private baseAmbientIntensity = 0.25;
  private baseKeyIntensity = 0.55;
  private baseRimIntensity = 0.45;
  private baseFillIntensity = 0.20;

  private currentIntensityFactor = 1.0;

  constructor(options: LightingOptions) {
    this.scene = options.scene;
    this.lampSocketGroup = options.lampSocketGroup;

    // 1. Primary Downward SpotLight: Creates the photorealistic, smooth warm light cone on the wall
    // Attached directly to lampSocketGroup so it naturally sways when the lamp swings
    this.spotLight = new THREE.SpotLight(
      CONFIG.colors.bulbWarm,
      this.baseSpotIntensity,
      22.0,                  // Maximum throw distance
      Math.PI / 3.4,         // Beam angle (~53 degrees, perfect editorial cone)
      0.82,                  // Ultra-soft feathered penumbra (zero hard cutoff boundaries)
      2.0                    // Physically correct quadratic falloff
    );
    this.spotLight.position.set(0, -0.65, 0.15);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 0.2;
    this.spotLight.shadow.camera.far = 25.0;
    this.spotLight.shadow.bias = -0.001;

    // SpotLight target anchored straight down towards the wall plane
    this.spotTarget = new THREE.Object3D();
    this.spotTarget.position.set(0, -9.0, -1.0);
    this.lampSocketGroup.add(this.spotTarget);
    this.spotLight.target = this.spotTarget;
    this.lampSocketGroup.add(this.spotLight);

    // 2. Local Bulb Glow PointLight: Provides soft 360-degree local warmth to the bulb envelope & socket
    this.bulbLight = new THREE.PointLight(
      CONFIG.colors.bulbWarm,
      this.baseBulbIntensity,
      4.5,
      2.0
    );
    this.bulbLight.position.set(0, -0.62, 0.12);
    this.bulbLight.castShadow = false;
    this.lampSocketGroup.add(this.bulbLight);

    // 3. Subtle ambient fill (keeps shadowed areas dark without pitch black)
    this.ambientLight = new THREE.AmbientLight(0x0a0c12, this.baseAmbientIntensity);
    this.scene.add(this.ambientLight);

    // 4. Directional Key Light from top-left (creates soft specular highlights on metallic shade and wood)
    this.keyLight = new THREE.DirectionalLight(0xffeedd, this.baseKeyIntensity);
    this.keyLight.position.set(-4.0, 5.5, 5.0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.scene.add(this.keyLight);

    // 5. Directional Rim Light placed BEHIND the lamp (sculpts the industrial metal shade edge without washing out the front)
    this.rimLight = new THREE.DirectionalLight(0xffffff, this.baseRimIntensity);
    this.rimLight.position.set(0, 7.5, -2.5);
    this.scene.add(this.rimLight);

    // 6. Soft warm bounce fill from lower right
    this.fillLight = new THREE.DirectionalLight(CONFIG.colors.accent, this.baseFillIntensity);
    this.fillLight.position.set(3.5, -1.8, 4.5);
    this.scene.add(this.fillLight);
  }

  /**
   * Sets overall lighting intensity factor [0.0 to 1.0] for switch toggles & transitions
   */
  public setIntensity(factor: number): void {
    this.currentIntensityFactor = Math.max(0, Math.min(1.5, factor));
    this.spotLight.intensity = this.baseSpotIntensity * this.currentIntensityFactor;
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
    this.lampSocketGroup.remove(this.spotLight);
    this.lampSocketGroup.remove(this.spotTarget);
    this.spotLight.dispose();

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
