import * as THREE from "three";
import { CONFIG } from "../config";
import { Stone } from "../objects/Stone";
import { CollisionSystem } from "./CollisionSystem";

export interface ProjectileBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class ProjectileSystem {
  private scene: THREE.Scene;
  public readonly stone: Stone;
  public collisionSystem: CollisionSystem | null = null;

  public active: boolean = false;
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationSpeed: THREE.Vector3 = new THREE.Vector3();

  // Settling state on floor
  public isSettling: boolean = false;
  private settleTimer: number = 0.0;
  private bounceCount: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.stone = new Stone(CONFIG.physics.stoneRadius);
    this.stone.setVisible(false);
    this.scene.add(this.stone.group);
  }

  public setCollisionSystem(collisionSystem: CollisionSystem): void {
    this.collisionSystem = collisionSystem;
  }

  /**
   * Launches projectile with initial world position and velocity vector
   */
  public launch(origin: THREE.Vector3, velocity: THREE.Vector3): void {
    this.active = true;
    this.isSettling = false;
    this.settleTimer = 0.0;
    this.bounceCount = 0;
    this.collisionSystem?.resetFlight();

    this.position.copy(origin);
    this.position.z = Math.max(origin.z, 0.12);
    this.velocity.copy(velocity);

    // Organic tumbling rotation
    this.rotationSpeed.set(
      (Math.random() - 0.5) * 8.0,
      (Math.random() - 0.5) * 12.0,
      (Math.random() - 0.5) * 8.0
    );

    this.stone.setPosition(this.position.x, this.position.y, this.position.z);
    this.stone.setVisible(true);
  }

  /**
   * Physics update step with sub-stepping and continuous swept collision detection
   */
  public update(
    dt: number,
    bounds: ProjectileBounds,
    onComplete?: () => void
  ): void {
    if (!this.active) return;

    // Handle resting settling state on the floor
    if (this.isSettling) {
      this.settleTimer += dt;
      if (this.settleTimer >= CONFIG.physics.settleDuration) {
        this.reset();
        onComplete?.();
      }
      return;
    }

    // Sub-stepping to maintain precision across frames
    const subSteps = 3;
    const subDt = Math.min(dt, 0.033) / subSteps;

    for (let s = 0; s < subSteps; s++) {
      if (!this.active || this.isSettling) break;

      // 1. Predict next velocity with gravity & aerodynamic drag
      const vNext = this.velocity.clone();
      vNext.y += CONFIG.physics.gravity * subDt;
      const drag = Math.pow(CONFIG.physics.airDrag, subDt * 60);
      vNext.x *= drag;
      vNext.y *= drag;

      // 2. Predict next position
      const pPredicted = this.position.clone().addScaledVector(vNext, subDt);

      // 3. Continuous swept collision test against proxies
      let impact = null;
      if (this.collisionSystem) {
        impact = this.collisionSystem.checkSweptCollision(
          this.position,
          pPredicted,
          CONFIG.physics.stoneRadius,
          vNext,
          bounds
        );
      }

      if (impact) {
        // Resolve collision impact and bounce physics
        this.collisionSystem!.resolveImpact(impact, this.position, this.velocity);
        this.bounceCount++;

        // Settle projectile if rolling to a stop on the floor
        if (impact.target === "floor") {
          const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
          if (
            (Math.abs(this.velocity.y) < CONFIG.physics.settleVelocityThreshold &&
              horizontalSpeed < CONFIG.physics.settleVelocityThreshold) ||
            this.bounceCount >= CONFIG.physics.maxBounces
          ) {
            this.isSettling = true;
            this.velocity.set(0, 0, 0);
            this.rotationSpeed.set(0, 0, 0);
          }
        }
      } else {
        // Free ballistic movement
        this.velocity.copy(vNext);
        this.position.copy(pPredicted);
      }

      // Update mesh transform
      this.stone.setPosition(this.position.x, this.position.y, this.position.z);

      if (!this.isSettling) {
        this.stone.mesh.rotation.x += this.rotationSpeed.x * subDt;
        this.stone.mesh.rotation.y += this.rotationSpeed.y * subDt;
        this.stone.mesh.rotation.z += this.rotationSpeed.z * subDt;
      }
    }

    // Out-of-bounds check
    if (
      this.position.y < bounds.minY - 3.0 ||
      this.position.x > bounds.maxX + 3.5 ||
      this.position.x < bounds.minX - 3.5 ||
      this.position.y > bounds.maxY + 4.5
    ) {
      this.reset();
      onComplete?.();
    }
  }

  public reset(): void {
    this.active = false;
    this.isSettling = false;
    this.settleTimer = 0.0;
    this.bounceCount = 0;
    this.stone.setVisible(false);
    this.velocity.set(0, 0, 0);
    this.rotationSpeed.set(0, 0, 0);
  }

  public dispose(): void {
    this.reset();
    this.scene.remove(this.stone.group);
    this.stone.dispose();
  }
}
