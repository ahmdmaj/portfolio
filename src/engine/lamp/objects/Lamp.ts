import * as THREE from "three";
import { Bulb } from "./Bulb";

export class Lamp {
  public readonly group: THREE.Group;       // Top pivot group at ceiling
  public readonly swingGroup: THREE.Group;  // Swiveling body (for pendulum in Phase 6)
  public readonly shadeMesh: THREE.Mesh;
  public readonly socketMesh: THREE.Mesh;
  public readonly cableMesh: THREE.Mesh;
  public readonly ceilingCapMesh: THREE.Mesh;
  public readonly bulb: Bulb;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(cableLength = 2.2) {
    this.group = new THREE.Group();
    this.swingGroup = new THREE.Group();
    this.group.add(this.swingGroup);

    // 1. Ceiling mount rose (attachment plate)
    const capGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.08, 32);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      metalness: 0.7,
    });
    this.geometries.push(capGeom);
    this.materials.push(capMat);
    this.ceilingCapMesh = new THREE.Mesh(capGeom, capMat);
    this.ceilingCapMesh.position.set(0, 0, 0);
    this.group.add(this.ceilingCapMesh);

    // 2. Hanging black pendant cable
    const cableGeom = new THREE.CylinderGeometry(0.02, 0.02, cableLength, 16);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.geometries.push(cableGeom);
    this.materials.push(cableMat);
    this.cableMesh = new THREE.Mesh(cableGeom, cableMat);
    // Cable center is half-way down the length
    this.cableMesh.position.set(0, -cableLength / 2, 0);
    this.swingGroup.add(this.cableMesh);

    // 3. Socket assembly housing at the bottom of the cable
    const socketY = -cableLength;
    const socketGroup = new THREE.Group();
    socketGroup.position.set(0, socketY, 0);

    // Top cord relief ferrule
    const ferruleGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x8c734b, // Warm antique brass
      roughness: 0.35,
      metalness: 0.85,
    });
    this.geometries.push(ferruleGeom);
    this.materials.push(brassMat);
    const ferrule = new THREE.Mesh(ferruleGeom, brassMat);
    ferrule.position.set(0, 0.07, 0);
    socketGroup.add(ferrule);

    // Main socket housing
    const socketGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.32, 24);
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x222327,
      roughness: 0.45,
      metalness: 0.75,
    });
    this.geometries.push(socketGeom);
    this.materials.push(darkMetalMat);
    this.socketMesh = new THREE.Mesh(socketGeom, darkMetalMat);
    this.socketMesh.position.set(0, -0.16, 0);
    socketGroup.add(this.socketMesh);

    // 4. Industrial dome-shaped shade using LatheGeometry with realistic thickness & rolled rim
    const shadePoints: THREE.Vector2[] = [];
    // Outer surface profile (from neck down to flared rim)
    shadePoints.push(new THREE.Vector2(0.18, 0.15));
    shadePoints.push(new THREE.Vector2(0.24, 0.10));
    shadePoints.push(new THREE.Vector2(0.38, 0.02));
    shadePoints.push(new THREE.Vector2(0.62, -0.18));
    shadePoints.push(new THREE.Vector2(0.85, -0.42));
    shadePoints.push(new THREE.Vector2(0.96, -0.60));
    shadePoints.push(new THREE.Vector2(1.00, -0.66)); // Outer rolled rim lip
    shadePoints.push(new THREE.Vector2(0.98, -0.68)); // Bottom edge of rolled rim
    // Inner surface profile (returning up with geometric thickness)
    shadePoints.push(new THREE.Vector2(0.94, -0.65));
    shadePoints.push(new THREE.Vector2(0.82, -0.42));
    shadePoints.push(new THREE.Vector2(0.59, -0.18));
    shadePoints.push(new THREE.Vector2(0.35, 0.00));
    shadePoints.push(new THREE.Vector2(0.22, 0.08));
    shadePoints.push(new THREE.Vector2(0.17, 0.14));

    const shadeGeom = new THREE.LatheGeometry(shadePoints, 36);
    this.geometries.push(shadeGeom);

    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x32343a, // Industrial brushed graphite metal with subtle sheen
      roughness: 0.32,
      metalness: 0.88,
      side: THREE.DoubleSide,
    });
    this.materials.push(shadeMat);

    this.shadeMesh = new THREE.Mesh(shadeGeom, shadeMat);
    this.shadeMesh.position.set(0, -0.16, 0);
    socketGroup.add(this.shadeMesh);

    // 5. Bulb child object placed inside the socket
    this.bulb = new Bulb();
    this.bulb.group.position.set(0, -0.32, 0);
    socketGroup.add(this.bulb.group);

    this.swingGroup.add(socketGroup);
  }

  public setPosition(x: number, y: number): void {
    this.group.position.set(x, y, 0);
  }

  public setRotation(angleRad: number): void {
    this.swingGroup.rotation.z = angleRad;
  }

  public getSocketWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.socketMesh.getWorldPosition(pos);
    return pos;
  }

  public dispose(): void {
    this.bulb.dispose();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}

