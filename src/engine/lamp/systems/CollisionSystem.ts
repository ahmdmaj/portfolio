import * as THREE from "three";
import { CONFIG } from "../config";
import { LampPendulumSystem } from "./LampPendulumSystem";
import { Lamp } from "../objects/Lamp";
import { Switch } from "../objects/Switch";
import { LampStore } from "../state/LampStore";

export type CollisionTarget = "lamp_shade" | "bulb" | "switch_rocker" | "floor" | "wall";

export interface ImpactResult {
  target: CollisionTarget;
  contactPoint: THREE.Vector3;
  normal: THREE.Vector3;
  incomingVelocity: THREE.Vector3;
  speed: number;
  fraction: number; // time fraction t in [0.0, 1.0] within the physics step
}

export interface CollisionBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CollisionCallbacks {
  onBulbHit?: (contactPoint: THREE.Vector3, velocity: THREE.Vector3) => void;
  onShadeHit?: (contactPoint: THREE.Vector3, velocity: THREE.Vector3) => void;
  onSwitchHit?: () => void;
}

export class CollisionSystem {
  private lamp: Lamp;
  private lampPendulum: LampPendulumSystem;
  private wallSwitch: Switch;
  private store: LampStore;
  private callbacks: CollisionCallbacks;

  // Single-flight debounce to avoid duplicate switch toggles from one stone
  private hasHitSwitchThisFlight: boolean = false;

  constructor(
    lamp: Lamp,
    lampPendulum: LampPendulumSystem,
    wallSwitch: Switch,
    store: LampStore,
    callbacks: CollisionCallbacks = {}
  ) {
    this.lamp = lamp;
    this.lampPendulum = lampPendulum;
    this.wallSwitch = wallSwitch;
    this.store = store;
    this.callbacks = callbacks;
  }

  public resetFlight(): void {
    this.hasHitSwitchThisFlight = false;
  }

  /**
   * Continuous swept sphere collision detection between previous position p0 and predicted position p1
   */
  public checkSweptCollision(
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    radius: number,
    velocity: THREE.Vector3,
    bounds: CollisionBounds
  ): ImpactResult | null {
    const d = new THREE.Vector3().subVectors(p1, p0);
    const speed = velocity.length();
    let earliestImpact: ImpactResult | null = null;
    let minT = 1.0;

    // 1. Swept test against dynamic swinging Lamp Shade proxy
    const shadeProxy = this.lampPendulum.getShadeCollisionProxy();
    const R_shade = shadeProxy.radius + radius;
    const mShade = new THREE.Vector3().subVectors(p0, shadeProxy.center);

    const aShade = d.dot(d);
    const bShade = 2.0 * mShade.dot(d);
    const cShade = mShade.dot(mShade) - R_shade * R_shade;

    if (aShade > 0.00001) {
      const disc = bShade * bShade - 4.0 * aShade * cShade;
      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        let t = (-bShade - sqrtDisc) / (2.0 * aShade);

        // If starting already inside or penetrating
        if (cShade <= 0) {
          t = 0.0;
        }

        if (t >= 0.0 && t <= minT) {
          const hitPos = new THREE.Vector3().copy(p0).addScaledVector(d, t);
          const norm = new THREE.Vector3().subVectors(hitPos, shadeProxy.center).normalize();
          const contact = shadeProxy.center.clone().addScaledVector(norm, shadeProxy.radius);

          minT = t;
          earliestImpact = {
            target: "lamp_shade",
            contactPoint: contact,
            normal: norm,
            incomingVelocity: velocity.clone(),
            speed,
            fraction: t,
          };
        }
      }
    }

    // 2. Swept test against Bulb proxy (only if not already broken)
    if (this.store.getState().bulb !== "broken") {
      const bulbWorldPos = this.lamp.bulb.getBulbWorldCenter();
      const R_bulb = CONFIG.lamp.bulbRadius + radius;
      const mBulb = new THREE.Vector3().subVectors(p0, bulbWorldPos);

      const aBulb = d.dot(d);
      const bBulb = 2.0 * mBulb.dot(d);
      const cBulb = mBulb.dot(mBulb) - R_bulb * R_bulb;

      if (aBulb > 0.00001) {
        const disc = bBulb * bBulb - 4.0 * aBulb * cBulb;
        if (disc >= 0) {
          const sqrtDisc = Math.sqrt(disc);
          let t = (-bBulb - sqrtDisc) / (2.0 * aBulb);
          if (cBulb <= 0) t = 0.0;

          if (t >= 0.0 && t <= minT) {
            const hitPos = new THREE.Vector3().copy(p0).addScaledVector(d, t);
            const norm = new THREE.Vector3().subVectors(hitPos, bulbWorldPos).normalize();

            minT = t;
            earliestImpact = {
              target: "bulb",
              contactPoint: hitPos,
              normal: norm,
              incomingVelocity: velocity.clone(),
              speed,
              fraction: t,
            };
          }
        }
      }
    }

    // 3. Swept test against Wall Switch Rocker proxy
    const rockerWorldPos = new THREE.Vector3();
    this.wallSwitch.rockerMesh.getWorldPosition(rockerWorldPos);
    const switchScale = this.wallSwitch.group.scale.x;
    const R_switch = 0.38 * switchScale + radius;
    const mSwitch = new THREE.Vector3().subVectors(p0, rockerWorldPos);

    const aSwitch = d.dot(d);
    const bSwitch = 2.0 * mSwitch.dot(d);
    const cSwitch = mSwitch.dot(mSwitch) - R_switch * R_switch;

    if (aSwitch > 0.00001) {
      const disc = bSwitch * bSwitch - 4.0 * aSwitch * cSwitch;
      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        let t = (-bSwitch - sqrtDisc) / (2.0 * aSwitch);
        if (cSwitch <= 0) t = 0.0;

        if (t >= 0.0 && t <= minT) {
          const hitPos = new THREE.Vector3().copy(p0).addScaledVector(d, t);
          const norm = new THREE.Vector3().subVectors(hitPos, rockerWorldPos).normalize();
          // Rocker faces front (+Z), ensure normal deflects outwards towards room
          if (norm.z < 0.2) norm.z = 0.2;
          norm.normalize();

          minT = t;
          earliestImpact = {
            target: "switch_rocker",
            contactPoint: hitPos,
            normal: norm,
            incomingVelocity: velocity.clone(),
            speed,
            fraction: t,
          };
        }
      }
    }

    // 4. Swept test against Floor plane
    const floorY = bounds.minY + 0.35;
    if (d.y < -0.00001 && p0.y > floorY + radius && p1.y <= floorY + radius) {
      const t = (floorY + radius - p0.y) / d.y;
      if (t >= 0.0 && t <= minT) {
        minT = t;
        const hitPos = new THREE.Vector3().copy(p0).addScaledVector(d, t);
        earliestImpact = {
          target: "floor",
          contactPoint: new THREE.Vector3(hitPos.x, floorY, hitPos.z),
          normal: new THREE.Vector3(0, 1, 0),
          incomingVelocity: velocity.clone(),
          speed,
          fraction: t,
        };
      }
    }

    return earliestImpact;
  }

  /**
   * Resolves physical response for the detected impact
   */
  public resolveImpact(
    impact: ImpactResult,
    position: THREE.Vector3,
    velocity: THREE.Vector3
  ): void {
    const { target, normal, contactPoint, speed } = impact;

    switch (target) {
      case "bulb": {
        // 1. Transfer angular momentum to swinging lamp pendulum
        this.lampPendulum.applyImpulse(
          contactPoint,
          velocity,
          CONFIG.physics.stoneMass
        );

        // 2. Trigger bulb hit callback (particle explosion, sound, store update)
        this.callbacks.onBulbHit?.(contactPoint, velocity);

        // 3. Deflect stone off bulb surface
        const vn = velocity.dot(normal);
        if (vn < 0) {
          velocity.sub(
            normal.clone().multiplyScalar((1.0 + CONFIG.physics.lampRestitution) * vn)
          );
        }
        velocity.multiplyScalar(CONFIG.physics.friction);
        position.copy(impact.contactPoint).addScaledVector(normal, CONFIG.physics.stoneRadius + 0.02);
        break;
      }

      case "lamp_shade": {
        // 1. Transfer angular momentum to swinging lamp pendulum
        this.lampPendulum.applyImpulse(
          contactPoint,
          velocity,
          CONFIG.physics.stoneMass
        );

        this.callbacks.onShadeHit?.(contactPoint, velocity);

        // 2. Reflect stone velocity along impact surface normal with restitution
        const vn = velocity.dot(normal);
        if (vn < 0) {
          velocity.sub(
            normal.clone().multiplyScalar((1.0 + CONFIG.physics.lampRestitution) * vn)
          );
        }
        velocity.multiplyScalar(CONFIG.physics.friction);
        position.copy(impact.contactPoint).addScaledVector(normal, CONFIG.physics.stoneRadius + 0.02);
        break;
      }

      case "switch_rocker": {
        // Physical switch activation: toggle power if impact speed exceeds threshold
        if (
          !this.hasHitSwitchThisFlight &&
          speed >= CONFIG.physics.switchThresholdSpeed
        ) {
          this.hasHitSwitchThisFlight = true;
          this.store.toggleSwitch();
          this.callbacks.onSwitchHit?.();
        }

        // Deflect stone off switch face
        const vn = velocity.dot(normal);
        if (vn < 0) {
          velocity.sub(
            normal.clone().multiplyScalar((1.0 + CONFIG.physics.wallRestitution) * vn)
          );
        }
        velocity.multiplyScalar(CONFIG.physics.friction);
        position.copy(impact.contactPoint).addScaledVector(normal, CONFIG.physics.stoneRadius + 0.02);
        break;
      }

      case "floor": {
        // Floor bounce with energy loss
        velocity.y = -velocity.y * CONFIG.physics.floorRestitution;
        velocity.x *= CONFIG.physics.friction;
        velocity.z *= CONFIG.physics.friction;

        // Position on floor plane
        position.y = contactPoint.y + CONFIG.physics.stoneRadius;
        break;
      }

      case "wall": {
        const vn = velocity.dot(normal);
        if (vn < 0) {
          velocity.sub(
            normal.clone().multiplyScalar((1.0 + CONFIG.physics.wallRestitution) * vn)
          );
        }
        velocity.multiplyScalar(CONFIG.physics.friction);
        break;
      }
    }
  }
}

