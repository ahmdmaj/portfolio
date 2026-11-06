import * as THREE from "three";
import { CONFIG } from "../config";

export class Bulb {
  public readonly group: THREE.Group;
  public readonly bulbMesh: THREE.Mesh;
  private readonly socketBaseMesh: THREE.Mesh;
  private readonly filamentMesh: THREE.LineSegments;

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

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffeed1,
      emissive: CONFIG.colors.bulbWarm,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
    });
    this.materials.push(bulbMat);

    this.bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
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

    const filamentMat = new THREE.LineBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.7,
      linewidth: 1,
    });
    this.materials.push(filamentMat);

    this.filamentMesh = new THREE.LineSegments(filamentGeom, filamentMat);
    this.group.add(this.filamentMesh);
  }

  public getBulbWorldCenter(): THREE.Vector3 {
    const target = new THREE.Vector3();
    this.bulbMesh.getWorldPosition(target);
    target.y -= 0.38; // Center of the bulb spherical area
    return target;
  }

  public dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}
