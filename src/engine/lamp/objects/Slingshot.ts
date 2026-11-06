import * as THREE from "three";
import gsap from "gsap";
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

  // Anchor points for elastic bands in local slingshot coordinates
  public readonly leftForkTip = new THREE.Vector3(
    CONFIG.slingshot.leftForkTip.x,
    CONFIG.slingshot.leftForkTip.y,
    CONFIG.slingshot.leftForkTip.z
  );
  public readonly rightForkTip = new THREE.Vector3(
    CONFIG.slingshot.rightForkTip.x,
    CONFIG.slingshot.rightForkTip.y,
    CONFIG.slingshot.rightForkTip.z
  );
  public readonly restPouchPos = new THREE.Vector3(
    CONFIG.slingshot.restPouchPos.x,
    CONFIG.slingshot.restPouchPos.y,
    CONFIG.slingshot.restPouchPos.z
  );
  public currentPouchPos: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
    this.currentPouchPos.copy(this.restPouchPos);

    // 1. Warm natural oiled walnut material for the Y frame
    const woodMat = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.slingshotWood,
      roughness: 0.68,
      metalness: 0.06,
    });
    this.materials.push(woodMat);

    // Handle (straight vertical shaft)
    const handleGeom = new THREE.CylinderGeometry(0.08, 0.09, 0.65, 20);
    this.geometries.push(handleGeom);
    this.handleMesh = new THREE.Mesh(handleGeom, woodMat);
    this.handleMesh.position.set(0, -0.32, 0);
    this.handleMesh.castShadow = true;
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
    this.leftForkMesh.castShadow = true;
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
    this.rightForkMesh.castShadow = true;
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
    this.pouchMesh.castShadow = true;
    this.group.add(this.pouchMesh);

    // 3. Elastic rubber bands
    const bandMat = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.elasticBand,
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
   * Efficiently scales and re-orients existing meshes without reallocating geometries
   */
  public updateBands(pouchPos: THREE.Vector3): void {
    this.currentPouchPos.copy(pouchPos);
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

    // Thin slightly as elastic stretches
    const thickness = Math.max(0.65, 1.0 - (length - 0.4) * 0.22);
    band.scale.set(thickness, Math.max(length, 0.01), thickness);

    // Align cylinder (pointing up in Y by default) along direction vector
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      up,
      dir.clone().normalize()
    );
    band.quaternion.copy(quaternion);
  }

  /**
   * Snaps the pouch and stretched elastic bands back to their resting position
   * Uses a high-frequency elastic bounce for realistic rubber band snap
   */
  public snapToRest(duration = 0.14, onComplete?: () => void): void {
    gsap.killTweensOf(this.currentPouchPos);
    gsap.to(this.currentPouchPos, {
      x: this.restPouchPos.x,
      y: this.restPouchPos.y,
      z: this.restPouchPos.z,
      duration,
      ease: "elastic.out(1.25, 0.35)",
      overwrite: "auto",
      onUpdate: () => {
        this.updateBands(this.currentPouchPos);
      },
      onComplete: () => {
        this.updateBands(this.restPouchPos);
        onComplete?.();
      },
    });
  }

  public setStoneVisible(visible: boolean): void {
    this.restingStone.setVisible(visible);
  }

  public resetStone(): void {
    this.updateBands(this.restPouchPos);
    this.restingStone.setVisible(true);
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

  public getWorldForkCenter(): THREE.Vector3 {
    const left = new THREE.Vector3();
    const right = new THREE.Vector3();
    this.leftForkMesh.getWorldPosition(left);
    this.rightForkMesh.getWorldPosition(right);
    return left.add(right).multiplyScalar(0.5);
  }

  public dispose(): void {
    gsap.killTweensOf(this.currentPouchPos);
    this.restingStone.dispose();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}
