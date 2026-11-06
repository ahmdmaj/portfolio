import * as THREE from "three";
import { CONFIG } from "../config";

export class Stone {
  public readonly group: THREE.Group;
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshStandardMaterial;

  constructor(radius = 0.15) {
    this.group = new THREE.Group();

    // 1. Organic irregular tumbled pebble geometry
    const baseGeom = new THREE.IcosahedronGeometry(radius, 1);
    const posAttr = baseGeom.getAttribute("position");

    // Deform vertices slightly for organic pebble appearance
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      // Deterministic perturbation based on vertex coordinates
      const noise =
        1.0 +
        Math.sin(vx * 15.0 + vy * 12.0) * 0.08 +
        Math.cos(vz * 18.0) * 0.06;

      posAttr.setXYZ(i, vx * noise, vy * noise * 0.92, vz * noise);
    }
    baseGeom.computeVertexNormals();
    this.geometry = baseGeom;

    // 2. Matte stone material with natural rough slate finish
    this.material = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.stone,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = false;
    this.group.add(this.mesh);
  }

  public setPosition(x: number, y: number, z = 0): void {
    this.group.position.set(x, y, z);
  }

  public setRotation(rx: number, ry: number, rz: number): void {
    this.mesh.rotation.set(rx, ry, rz);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

