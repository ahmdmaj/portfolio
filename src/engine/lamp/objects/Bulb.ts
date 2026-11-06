import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config";

export class Bulb {
  public readonly group: THREE.Group;
  public readonly bulbMesh: THREE.Mesh;
  private readonly socketBaseMesh: THREE.Mesh;
  private readonly filamentMesh: THREE.LineSegments;
  private readonly brokenNeckMesh: THREE.Mesh;
  private readonly brokenFilamentMesh: THREE.LineSegments;

  private bulbMat: THREE.MeshStandardMaterial;
  private filamentMat: THREE.LineBasicMaterial;
  private brokenStemMat: THREE.LineBasicMaterial;

  public isBroken: boolean = false;
  private isAnimating: boolean = false;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 1. Threaded metal connector neck
    const screwBaseGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24);
    this.geometries.push(screwBaseGeom);

    const screwBaseMat = new THREE.MeshStandardMaterial({
      color: 0x8c734b, // Warm antique brass
      roughness: 0.35,
      metalness: 0.85,
    });
    this.materials.push(screwBaseMat);

    this.socketBaseMesh = new THREE.Mesh(screwBaseGeom, screwBaseMat);
    this.socketBaseMesh.position.set(0, 0.08, 0);
    this.group.add(this.socketBaseMesh);

    // 2. Realistic pear-shaped incandescent bulb envelope using LatheGeometry
    const bulbPoints: THREE.Vector2[] = [];
    bulbPoints.push(new THREE.Vector2(0.11, 0.0));     // Neck top
    bulbPoints.push(new THREE.Vector2(0.12, -0.06));  // Neck collar
    bulbPoints.push(new THREE.Vector2(0.18, -0.16));  // Flare
    bulbPoints.push(new THREE.Vector2(0.26, -0.28));  // Shoulder
    bulbPoints.push(new THREE.Vector2(0.28, -0.38));  // Maximum radius
    bulbPoints.push(new THREE.Vector2(0.25, -0.48));  // Lower curve
    bulbPoints.push(new THREE.Vector2(0.18, -0.56));  // Bottom curvature
    bulbPoints.push(new THREE.Vector2(0.08, -0.61));  // Approaching bottom apex
    bulbPoints.push(new THREE.Vector2(0.0, -0.62));   // Sealed tip

    const bulbGeom = new THREE.LatheGeometry(bulbPoints, 32);
    this.geometries.push(bulbGeom);

    this.bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffeed1,
      emissive: CONFIG.colors.bulbWarm,
      emissiveIntensity: 1.35,
      roughness: 0.18,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
    });
    this.materials.push(this.bulbMat);

    this.bulbMesh = new THREE.Mesh(bulbGeom, this.bulbMat);
    this.group.add(this.bulbMesh);

    // 3. Subtle internal tungsten filament inside the bulb
    const filamentPoints = [
      new THREE.Vector3(-0.06, -0.22, 0),
      new THREE.Vector3(-0.02, -0.32, 0),
      new THREE.Vector3(0.0, -0.34, 0),
      new THREE.Vector3(0.02, -0.32, 0),
      new THREE.Vector3(0.06, -0.22, 0),
    ];
    const filamentGeom = new THREE.BufferGeometry().setFromPoints(filamentPoints);
    this.geometries.push(filamentGeom);

    this.filamentMat = new THREE.LineBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.7,
      linewidth: 1,
    });
    this.materials.push(this.filamentMat);

    this.filamentMesh = new THREE.LineSegments(filamentGeom, this.filamentMat);
    this.group.add(this.filamentMesh);

    // 4. Jagged broken glass collar remnant (visible when broken)
    const jaggedNeckPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.11, 0.0),
      new THREE.Vector2(0.12, -0.05),
      new THREE.Vector2(0.14, -0.09),
      new THREE.Vector2(0.09, -0.07),
    ];
    const jaggedNeckGeom = new THREE.LatheGeometry(jaggedNeckPoints, 16);
    this.geometries.push(jaggedNeckGeom);
    this.brokenNeckMesh = new THREE.Mesh(jaggedNeckGeom, this.bulbMat);
    this.brokenNeckMesh.visible = false;
    this.group.add(this.brokenNeckMesh);

    // 5. Snapped lead wire stems inside socket (visible when broken)
    const brokenStemPoints = [
      new THREE.Vector3(-0.04, 0.0, 0),
      new THREE.Vector3(-0.03, -0.12, 0.01),
      new THREE.Vector3(0.04, 0.0, 0),
      new THREE.Vector3(0.02, -0.09, -0.01),
    ];
    const brokenStemGeom = new THREE.BufferGeometry().setFromPoints(brokenStemPoints);
    this.geometries.push(brokenStemGeom);
    this.brokenStemMat = new THREE.LineBasicMaterial({
      color: 0x5a5d65,
      transparent: true,
      opacity: 0.85,
      linewidth: 1,
    });
    this.materials.push(this.brokenStemMat);
    this.brokenFilamentMesh = new THREE.LineSegments(brokenStemGeom, this.brokenStemMat);
    this.brokenFilamentMesh.visible = false;
    this.group.add(this.brokenFilamentMesh);
  }

  /**
   * Sets illumination factor [0.0 = off, 1.0 = on] for switch transitions
   */
  public setIlluminated(factor: number): void {
    const clamped = Math.max(0, Math.min(1.5, factor));
    this.bulbMat.emissiveIntensity = 1.35 * clamped;
    this.bulbMat.color.setHex(clamped > 0.05 ? 0xffeed1 : 0x4a4d55);
    this.filamentMat.opacity = 0.12 + 0.58 * clamped;
  }

  /**
   * Toggles broken state visibility
   */
  public setBroken(broken: boolean): void {
    this.isBroken = broken;
    if (broken) {
      this.bulbMesh.visible = false;
      this.filamentMesh.visible = false;
      this.brokenNeckMesh.visible = true;
      this.brokenFilamentMesh.visible = true;
      this.setIlluminated(0);
    } else {
      this.bulbMesh.visible = true;
      this.filamentMesh.visible = true;
      this.bulbMesh.position.set(0, 0, 0);
      this.bulbMesh.rotation.set(0, 0, 0);
      this.filamentMesh.position.set(0, 0, 0);
      this.filamentMesh.rotation.set(0, 0, 0);
      this.brokenNeckMesh.visible = false;
      this.brokenFilamentMesh.visible = false;
    }
  }

  /**
   * Animates replacement bulb dropping in and screwing into the socket
   */
  public animateReplacement(onComplete: () => void): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Hide broken remnants
    this.brokenNeckMesh.visible = false;
    this.brokenFilamentMesh.visible = false;

    // Show fresh bulb in displaced position (dropped down slightly, rotated)
    this.bulbMesh.visible = true;
    this.filamentMesh.visible = true;
    this.bulbMesh.position.set(0, -0.32, 0);
    this.bulbMesh.rotation.set(0, -Math.PI * 4, 0);
    this.filamentMesh.position.set(0, -0.32, 0);
    this.filamentMesh.rotation.set(0, -Math.PI * 4, 0);
    this.setIlluminated(0);

    const tl = gsap.timeline({
      onComplete: () => {
        this.isBroken = false;
        this.isAnimating = false;
        onComplete();
      },
    });

    // Screw-in movement: translates up into socket while rotating clockwise
    tl.to(
      [this.bulbMesh.position, this.filamentMesh.position],
      {
        y: 0,
        duration: 0.82,
        ease: "power2.out",
      },
      0
    );

    tl.to(
      [this.bulbMesh.rotation, this.filamentMesh.rotation],
      {
        y: 0,
        duration: 0.82,
        ease: "power2.out",
      },
      0
    );
  }

  public getBulbWorldCenter(): THREE.Vector3 {
    const target = new THREE.Vector3();
    this.bulbMesh.getWorldPosition(target);
    target.y -= 0.38; // Center of the bulb spherical area
    return target;
  }

  public dispose(): void {
    gsap.killTweensOf(this.bulbMesh.position);
    gsap.killTweensOf(this.bulbMesh.rotation);
    gsap.killTweensOf(this.filamentMesh.position);
    gsap.killTweensOf(this.filamentMesh.rotation);
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}
