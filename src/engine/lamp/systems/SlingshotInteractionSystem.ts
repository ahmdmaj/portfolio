import * as THREE from "three";
import { CONFIG } from "../config";
import { Slingshot } from "../objects/Slingshot";
import { ProjectileSystem } from "./ProjectileSystem";
import { LampStore } from "../state/LampStore";

export class SlingshotInteractionSystem {
  private slingshot: Slingshot;
  private projectileSystem: ProjectileSystem;
  private store: LampStore;

  public isDragging: boolean = false;
  public isHovering: boolean = false;
  public drawPower: number = 0.0;

  private interactionPlane: THREE.Plane = new THREE.Plane();
  private currentLocalPouch: THREE.Vector3 = new THREE.Vector3();

  constructor(
    slingshot: Slingshot,
    projectileSystem: ProjectileSystem,
    store: LampStore
  ) {
    this.slingshot = slingshot;
    this.projectileSystem = projectileSystem;
    this.store = store;
    this.currentLocalPouch.copy(this.slingshot.restPouchPos);
  }

  /**
   * Tests if ray intersects slingshot leather pouch or resting stone
   */
  public checkHover(raycaster: THREE.Raycaster): boolean {
    if (this.isDragging) return true;

    const targets = [
      this.slingshot.restingStone.mesh,
      this.slingshot.pouchMesh,
    ];
    const intersects = raycaster.intersectObjects(targets, true);
    this.isHovering = intersects.length > 0;
    return this.isHovering;
  }

  /**
   * Initiates slingshot drag if pointer hits the resting stone or pouch
   */
  public startDrag(raycaster: THREE.Raycaster): boolean {
    // If a stone is already in mid-air ballistic flight, disallow grabbing until it lands/resets
    if (this.projectileSystem.active) {
      return false;
    }

    const targets = [
      this.slingshot.restingStone.mesh,
      this.slingshot.pouchMesh,
    ];
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      this.isDragging = true;
      this.drawPower = 0.0;
      this.store.setDragging(true, 0);

      // Create interaction plane aligned with current world Z of the slingshot pouch
      const worldPouch = this.slingshot.getRestingPouchWorldPosition();
      this.interactionPlane.set(new THREE.Vector3(0, 0, 1), -worldPouch.z);
      this.currentLocalPouch.copy(this.slingshot.restPouchPos);
      return true;
    }

    return false;
  }

  /**
   * Tracks pointer drag, calculates constrained pull vector and deforms elastic bands
   */
  public handleMove(raycaster: THREE.Raycaster): void {
    if (!this.isDragging) return;

    const targetWorld = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(this.interactionPlane, targetWorld)) {
      return;
    }

    // Convert world target to local slingshot coordinate space
    const localTarget = this.slingshot.group.worldToLocal(targetWorld.clone());
    const rest = this.slingshot.restPouchPos;

    // Vector from resting pouch to pointer
    const pullVector = new THREE.Vector3().subVectors(localTarget, rest);
    pullVector.z = 0; // Constrain to XY plane

    // Pull direction constraint: allow pulling backwards/downwards, clamp forward overextension
    if (pullVector.y > 0.08) {
      pullVector.y = 0.08;
    }

    // Clamp to maximum draw distance
    const dist = pullVector.length();
    const maxDist = CONFIG.slingshot.pullRadiusMax;
    const clampedDist = Math.min(dist, maxDist);

    if (dist > 0.001) {
      pullVector.setLength(clampedDist);
    }

    // Normalized draw power [0.0 to 1.0]
    this.drawPower = Math.min(1.0, clampedDist / maxDist);
    this.store.setDragging(true, this.drawPower);

    // Update pouch & dynamically stretch elastic bands
    this.currentLocalPouch.copy(rest).add(pullVector);
    this.slingshot.updateBands(this.currentLocalPouch);
  }

  /**
   * Releases projectile, triggers launch physics and springs elastic bands back to rest
   */
  public release(): boolean {
    if (!this.isDragging) return false;
    this.isDragging = false;

    const rest = this.slingshot.restPouchPos;
    const pullVector = new THREE.Vector3().subVectors(this.currentLocalPouch, rest);
    const pullDist = pullVector.length();

    // Check minimum pull distance to avoid zero-length or accidental misfires
    if (pullDist >= CONFIG.slingshot.minPullDistance) {
      // 1. Calculate launch direction (opposite of pull vector)
      const localLaunchDir = pullVector.clone().negate().normalize();

      // Convert local launch direction to world coordinate space
      const worldStart = this.slingshot.group.localToWorld(this.currentLocalPouch.clone());
      const worldTarget = this.slingshot.group.localToWorld(
        this.currentLocalPouch.clone().add(localLaunchDir)
      );
      const worldLaunchDir = worldTarget.sub(worldStart).normalize();

      // 2. Calculate launch velocity based on draw power
      const speed = this.drawPower * CONFIG.slingshot.power;
      const velocity = worldLaunchDir.multiplyScalar(speed);

      // 3. Launch projectile via ProjectileSystem
      this.projectileSystem.launch(worldStart, velocity);

      // 4. Temporarily hide resting stone in pouch while projectile is airborne
      this.slingshot.setStoneVisible(false);

      // 5. Spring elastic bands back to resting position with rapid damped bounce
      this.slingshot.snapToRest(CONFIG.slingshot.snapDuration);

      // 6. Increment shot counter in store
      this.store.incrementShots();
      this.store.setDragging(false, 0);
      return true;
    } else {
      // Below threshold: gentle release without launching
      this.slingshot.snapToRest(0.12);
      this.store.setDragging(false, 0);
      return false;
    }
  }

  /**
   * Safely cancels any active drag (e.g. pointer cancel or window blur)
   */
  public cancel(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.slingshot.snapToRest(0.12);
      this.store.setDragging(false, 0);
    }
  }
}

