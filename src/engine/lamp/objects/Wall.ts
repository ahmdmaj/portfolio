import * as THREE from "three";
import { CONFIG } from "../config";

export class Wall {
  public readonly group: THREE.Group;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshStandardMaterial;
  private mesh: THREE.Mesh;

  constructor(worldWidth = 30, worldHeight = 20) {
    this.group = new THREE.Group();

    // Large background plane covering the entire orthographic viewport frustum
    this.geometry = new THREE.PlaneGeometry(worldWidth, worldHeight);
    this.material = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.bg,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, -1.5);
    this.mesh.receiveShadow = false;
    this.group.add(this.mesh);
  }

  public resize(worldWidth: number, worldHeight: number): void {
    const w = Math.max(worldWidth * 1.5, 25);
    const h = Math.max(worldHeight * 1.5, 18);
    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(w, h);
    this.mesh.geometry = this.geometry;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

