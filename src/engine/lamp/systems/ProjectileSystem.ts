import * as THREE from "three";
import { CONFIG } from "../config";
import { Stone } from "../objects/Stone";

export interface ProjectileBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class ProjectileSystem {
  private scene: THREE.Scene;
  public readonly stone: Stone;

  public active: boolean = false;
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationSpeed: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.stone = new Stone(0.13);
    this.stone.setVisible(false);
    this.scene.add(this.stone.group);
  }

  /**
   * Launches projectile with initial world position and velocity vector
   */
  public launch(origin: THREE.Vector3, velocity: THREE.Vector3): void {
    this.active = true;
    this.position.copy(origin);
    // Keep projectile slightly in front of wall and physical objects
    this.position.z = Math.max(origin.z, 0.12);
    this.velocity.copy(velocity);

    // Realistic organic spin/tumble
    this.rotationSpeed.set(
      (Math.random() - 0.5) * 8.0,
      (Math.random() - 0.5) * 12.0,
      (Math.random() - 0.5) * 8.0
    );

    this.stone.setPosition(this.position.x, this.position.y, this.position.z);
    this.stone.setVisible(true);
  }

  /**
   * Physics update step integrating velocity, gravity and aerodynamic drag
   */
  public update(
    dt: number,
    bounds: ProjectileBounds,
    onComplete?: () => void
  ): void {
    if (!this.active) return;

    // Clamp delta time to avoid large physics steps
    const step = Math.min(dt, 0.033);

    // Apply gravity
    this.velocity.y += CONFIG.physics.gravity * step;

    // Apply aerodynamic air drag
    const drag = Math.pow(CONFIG.physics.airDrag, step * 60);
    this.velocity.x *= drag;
    this.velocity.y *= drag;

    // Update position
    this.position.addScaledVector(this.velocity, step);
    this.stone.setPosition(this.position.x, this.position.y, this.position.z);

    // Update tumble rotation
    this.stone.mesh.rotation.x += this.rotationSpeed.x * step;
    this.stone.mesh.rotation.y += this.rotationSpeed.y * step;
    this.stone.mesh.rotation.z += this.rotationSpeed.z * step;

    // Check if projectile exited the visible viewport frustum
    if (
      this.position.y < bounds.minY - 2.0 ||
      this.position.x > bounds.maxX + 3.0 ||
      this.position.x < bounds.minX - 3.0 ||
      this.position.y > bounds.maxY + 4.0
    ) {
      this.reset();
      onComplete?.();
    }
  }

  public reset(): void {
    this.active = false;
    this.stone.setVisible(false);
    this.velocity.set(0, 0, 0);
  }

  public dispose(): void {
    this.reset();
    this.scene.remove(this.stone.group);
    this.stone.dispose();
  }
}

