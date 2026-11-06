import * as THREE from "three";
import { CONFIG } from "../config";
import { Stone } from "./Stone";

export class Slingshot {
  public readonly group: THREE.Group;
  public readonly handleMesh: THREE.Mesh;
  public readonly leftForkMesh: THREE.Mesh;
  public readonly rightForkMesh: THREE.Mesh;
  public readonly pouchMesh: THREE.Mesh;
  public readonly restingStone: Stone;

  // Elastic band meshes
  private leftBandMesh: THREE.Mesh;
  private rightBandMesh: THREE.Mesh;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  // Anchor points for elastic bands
  private leftForkTip = new THREE.Vector3(-0.36, 0.56, 0.06);
  private rightForkTip = new THREE.Vector3(0.36, 0.56, 0.06);
  private restPouchPos = new THREE.Vector3(0, 0.22, 0.08);

  constructor() {
    this.group = new THREE.Group();

    // 1. Warm natural oiled wood material for the Y frame
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x7c4e26, // Natural rich walnut wood
      roughness: 0.68,
      metalness: 0.06,
    });
    this.materials.push(woodMat);

    // Handle (straight vertical shaft)
    const handleGeom = new THREE.CylinderGeometry(0.08, 0.09, 0.65, 20);
    this.geometries.push(handleGeom);
    this.handleMesh = new THREE.Mesh(handleGeom, woodMat);
    this.handleMesh.position.set(0, -0.32, 0);
    this.group.add(this.handleMesh);

    // Handle bottom rounded butt cap
    const buttCapGeom = new THREE.SphereGeometry(0.09, 16, 12);
    this.geometries.push(buttCapGeom);
    const buttCapMesh = new THREE.Mesh(buttCapGeom, woodMat);
    buttCapMesh.position.set(0, -0.64, 0);
    this.group.add(buttCapMesh);

    // Left curved branch of the Y fork using smooth CatmullRomCurve3
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 0),
      new THREE.Vector3(-0.16, 0.18, 0.02),
      new THREE.Vector3(-0.32, 0.38, 0.04),
      this.leftForkTip.clone(),
    ]);
    const leftForkGeom = new THREE.TubeGeometry(leftCurve, 24, 0.065, 16, false);
    this.geometries.push(leftForkGeom);
    this.leftForkMesh = new THREE.Mesh(leftForkGeom, woodMat);
    this.group.add(this.leftForkMesh);

    // Right curved branch of the Y fork
    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 0),
      new THREE.Vector3(0.16, 0.18, 0.02),
      new THREE.Vector3(0.32, 0.38, 0.04),
      this.rightForkTip.clone(),
    ]);
    const rightForkGeom = new THREE.TubeGeometry(rightCurve, 24, 0.065, 16, false);
    this.geometries.push(rightForkGeom);
    this.rightForkMesh = new THREE.Mesh(rightForkGeom, woodMat);
    this.group.add(this.rightForkMesh);

    // 2. Leather projectile pouch
    const pouchGeom = new THREE.BoxGeometry(0.18, 0.16, 0.05);
    this.geometries.push(pouchGeom);
    const pouchMat = new THREE.MeshStandardMaterial({
      color: 0x3d2714, // Dark brown leather
      roughness: 0.85,
      metalness: 0.1,
    });
    this.materials.push(pouchMat);
    this.pouchMesh = new THREE.Mesh(pouchGeom, pouchMat);
    this.pouchMesh.position.copy(this.restPouchPos);
    this.group.add(this.pouchMesh);

    // 3. Elastic rubber bands
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xc87d32, // Amber/tan surgical latex band
      roughness: 0.58,
      metalness: 0.15,
    });
    this.materials.push(bandMat);

    // Bands are modeled as thin dynamic cylinders
    const dummyCylGeom = new THREE.CylinderGeometry(0.016, 0.016, 1, 12);
    this.geometries.push(dummyCylGeom);

    this.leftBandMesh = new THREE.Mesh(dummyCylGeom, bandMat);
    this.rightBandMesh = new THREE.Mesh(dummyCylGeom, bandMat);
    this.group.add(this.leftBandMesh);
    this.group.add(this.rightBandMesh);

    // Position bands at rest
    this.updateBands(this.restPouchPos);

    // 4. Resting Stone placed inside the leather pouch
    this.restingStone = new Stone(0.13);
    this.restingStone.setPosition(
      this.restPouchPos.x,
      this.restPouchPos.y,
      this.restPouchPos.z + 0.04
    );
    this.group.add(this.restingStone.group);
  }

  /**
   * Updates the elastic bands and pouch orientation given the current pouch position
   */
  public updateBands(pouchPos: THREE.Vector3): void {
    this.pouchMesh.position.copy(pouchPos);
    if (this.restingStone) {
      this.restingStone.setPosition(pouchPos.x, pouchPos.y, pouchPos.z + 0.04);
    }

    // Left band update
    this.orientBand(this.leftBandMesh, this.leftForkTip, pouchPos);
    // Right band update
    this.orientBand(this.rightBandMesh, this.rightForkTip, pouchPos);
  }

  private orientBand(
    band: THREE.Mesh,
    start: THREE.Vector3,
    end: THREE.Vector3
  ): void {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    band.position.copy(mid);
    band.scale.set(1, Math.max(length, 0.01), 1);

    // Align cylinder (pointing up in Y by default) along direction vector
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      up,
      dir.clone().normalize()
    );
    band.quaternion.copy(quaternion);
  }

  public setPosition(x: number, y: number, scale = 1.0): void {
    this.group.position.set(x, y, 0);
    this.group.scale.setScalar(scale);
  }

  public getRestingPouchWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.pouchMesh.getWorldPosition(pos);
    return pos;
  }

  public dispose(): void {
    this.restingStone.dispose();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}
