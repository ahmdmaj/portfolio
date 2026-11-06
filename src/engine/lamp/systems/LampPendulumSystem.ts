import * as THREE from "three";
import { CONFIG } from "../config";
import { Lamp } from "../objects/Lamp";

export class LampPendulumSystem {
  private lamp: Lamp;

  // Pendulum physical parameters
  public theta: number = 0.0; // Current angular displacement [radians]
  public omega: number = 0.0; // Angular velocity [rad/s]
  public alpha: number = 0.0; // Angular acceleration [rad/s^2]

  private readonly L: number = CONFIG.physics.lampPivotLength;
  private readonly g: number = CONFIG.lamp.gravity;
  private readonly m: number = CONFIG.physics.lampMass;
  private readonly damping: number = CONFIG.lamp.damping;
  private readonly I: number; // Moment of inertia = m * L^2

  constructor(lamp: Lamp) {
    this.lamp = lamp;
    this.I = this.m * this.L * this.L;
  }

  /**
   * Physics update step integrating angular oscillation with gravitational restoring torque & damping
   */
  public update(dt: number): void {
    if (this.theta === 0 && this.omega === 0) {
      return;
    }

    const subSteps = 2;
    const subDt = Math.min(dt, 0.033) / subSteps;

    for (let i = 0; i < subSteps; i++) {
      // Restoring gravitational torque: tau = -m * g * L * sin(theta)
      const tauGrav = -this.m * this.g * this.L * Math.sin(this.theta);
      // Damping resistance torque: tau = -c * omega
      const tauDamp = -this.damping * this.I * this.omega;

      this.alpha = (tauGrav + tauDamp) / this.I;
      this.omega += this.alpha * subDt;
      this.theta += this.omega * subDt;
    }

    // Natural settling threshold to avoid endless microscopic jitter
    if (Math.abs(this.theta) < 0.0006 && Math.abs(this.omega) < 0.001) {
      this.theta = 0.0;
      this.omega = 0.0;
      this.alpha = 0.0;
    }

    // Synchronize rotation across all lamp components (shade, socket, bulb, lights, wall light beam)
    this.lamp.setRotation(this.theta);
  }

  /**
   * Transfers kinetic angular impulse from a projectile impact into the pendulum
   */
  public applyImpulse(
    impactWorldPoint: THREE.Vector3,
    stoneVelocity: THREE.Vector3,
    stoneMass: number
  ): void {
    const pivotPos = this.lamp.group.position;
    // Lever arm vector from ceiling pivot to contact point
    const rx = impactWorldPoint.x - pivotPos.x;
    const ry = impactWorldPoint.y - pivotPos.y;

    // Cross product in 2D (r x p)_z = r.x * p.y - r.y * p.x
    const angularMomentum = (rx * stoneVelocity.y - ry * stoneVelocity.x) * stoneMass;

    // Transfer impulse into angular velocity
    const deltaOmega = (angularMomentum / this.I) * 1.35;
    this.omega += deltaOmega;

    // Clamp maximum angular velocity to prevent unnatural full-circle looping
    const maxOmega = 8.5;
    this.omega = Math.max(-maxOmega, Math.min(maxOmega, this.omega));
  }

  /**
   * Gets current dynamic world center and collision radius of the swinging lamp shade
   */
  public getShadeCollisionProxy(): { center: THREE.Vector3; radius: number } {
    const center = this.lamp.getSocketWorldPosition();
    // Center of the shade dome sits slightly below the socket attachment
    center.y -= 0.35;
    return {
      center,
      radius: CONFIG.lamp.shadeRadius,
    };
  }

  public reset(): void {
    this.theta = 0.0;
    this.omega = 0.0;
    this.alpha = 0.0;
    this.lamp.setRotation(0.0);
  }

  public dispose(): void {
    this.reset();
  }
}

