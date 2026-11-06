import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config";

interface ShardParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  angVel: THREE.Vector3;
  scale: THREE.Vector3;
  isResting: boolean;
  bounceCount: number;
}

export class ShardsSystem {
  private scene: THREE.Scene;
  private count: number = CONFIG.shards.count;

  // Three.js instances
  public instancedMesh: THREE.InstancedMesh;
  private shardGeom: THREE.BufferGeometry;
  private shardMat: THREE.MeshStandardMaterial;

  // Electrical spark flash
  private sparkLight: THREE.PointLight;
  private sparkMesh: THREE.Mesh;
  private sparkMat: THREE.MeshBasicMaterial;

  // Physics state
  private particles: ShardParticle[] = [];
  public isActive: boolean = false;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private settleTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Construct irregular 3D glass shard geometry
    this.shardGeom = this.createShardGeometry();

    // 2. High-specular translucent glass material
    this.shardMat = new THREE.MeshStandardMaterial({
      color: 0xffeed1,
      emissive: 0x443311,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });

    // 3. InstancedMesh for zero draw-call overhead
    this.instancedMesh = new THREE.InstancedMesh(
      this.shardGeom,
      this.shardMat,
      this.count
    );
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = false;
    this.instancedMesh.visible = false;
    this.scene.add(this.instancedMesh);

    // 4. Electrical rupture spark flash (PointLight + glowing billboard)
    this.sparkLight = new THREE.PointLight(CONFIG.colors.bulbWarm, 0, 5, 2.0);
    this.scene.add(this.sparkLight);

    const sparkGeom = new THREE.PlaneGeometry(0.75, 0.75);
    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sparkMesh = new THREE.Mesh(sparkGeom, this.sparkMat);
    this.sparkMesh.visible = false;
    this.scene.add(this.sparkMesh);

    // 5. Initialize particles pool
    for (let i = 0; i < this.count; i++) {
      const s = 0.5 + Math.random() * 0.9;
      this.particles.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        angVel: new THREE.Vector3(),
        scale: new THREE.Vector3(s, s * (0.7 + Math.random() * 0.6), s),
        isResting: false,
        bounceCount: 0,
      });

      // Hide off-screen initially
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Builds an irregular faceted glass shard geometry
   */
  private createShardGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    // 3D convex shard with sharp corners and varied facet angles
    const positions = new Float32Array([
      // Facet A
      0.0, 0.0, 0.0,
      0.08, 0.16, 0.02,
      0.16, 0.04, -0.02,

      // Facet B
      0.0, 0.0, 0.0,
      0.16, 0.04, -0.02,
      0.09, -0.08, 0.03,

      // Facet C (back thickness)
      0.08, 0.16, 0.02,
      0.09, -0.08, 0.03,
      0.16, 0.04, -0.02,

      // Facet D (reverse side)
      0.0, 0.0, 0.0,
      0.09, -0.08, 0.03,
      0.08, 0.16, 0.02,
    ]);

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Triggers glass shard particle explosion with physical velocities and spark arc flash
   */
  public explode(origin: THREE.Vector3, stoneVelocity: THREE.Vector3): void {
    this.isActive = true;
    this.settleTimer = 0;
    this.instancedMesh.visible = true;
    this.shardMat.opacity = 0.88;

    // 1. Spark Flash Animation (rapid single-frame electrical arc flash)
    this.sparkLight.position.copy(origin);
    this.sparkLight.intensity = 4.2;
    this.sparkMesh.position.set(origin.x, origin.y, origin.z + 0.05);
    this.sparkMesh.visible = true;
    this.sparkMat.opacity = 1.0;

    gsap.killTweensOf(this.sparkLight);
    gsap.killTweensOf(this.sparkMat);

    gsap.to(this.sparkLight, {
      intensity: 0,
      duration: CONFIG.shards.sparkDuration,
      ease: "power2.out",
    });

    gsap.to(this.sparkMat, {
      opacity: 0,
      duration: CONFIG.shards.sparkDuration,
      ease: "power2.out",
      onComplete: () => {
        this.sparkMesh.visible = false;
      },
    });

    // 2. Initialize particles with radial velocities and stone momentum transfer
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      p.pos.copy(origin);
      p.isResting = false;
      p.bounceCount = 0;

      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;
      const speed =
        CONFIG.shards.explosionMinSpeed +
        Math.random() * (CONFIG.shards.explosionMaxSpeed - CONFIG.shards.explosionMinSpeed);

      // Radial outward explosion vector
      p.vel.set(
        Math.cos(phi) * Math.sin(theta) * speed,
        Math.sin(phi) * speed,
        Math.cos(phi) * Math.cos(theta) * speed * 0.45 // confined mostly to 2.5D plane
      );

      // Impart stone forward momentum
      p.vel.addScaledVector(stoneVelocity, CONFIG.shards.stoneMomentumFactor);

      // Random tumbling spin
      p.rot.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      p.angVel.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22
      );

      // Apply initial matrix
      this.dummy.position.copy(p.pos);
      this.dummy.rotation.copy(p.rot);
      this.dummy.scale.copy(p.scale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Physics update step: integrates gravity, ground bounces, friction, and tumbling
   */
  public update(dt: number, floorY: number): void {
    if (!this.isActive) return;

    let allResting = true;
    const clampedDt = Math.min(dt, 0.033);

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      if (!p.isResting) {
        allResting = false;

        // Gravity & aerodynamic drag
        p.vel.y += CONFIG.shards.gravity * clampedDt;
        p.vel.multiplyScalar(0.995);

        // Position integration
        p.pos.addScaledVector(p.vel, clampedDt);

        // Rotation integration
        p.rot.x += p.angVel.x * clampedDt;
        p.rot.y += p.angVel.y * clampedDt;
        p.rot.z += p.angVel.z * clampedDt;

        // Floor collision & bounce
        const shardFloorLevel = floorY + 0.04;
        if (p.pos.y <= shardFloorLevel) {
          p.pos.y = shardFloorLevel;
          p.bounceCount++;

          // Invert vertical velocity with restitution
          p.vel.y = -p.vel.y * CONFIG.shards.floorRestitution;
          p.vel.x *= CONFIG.shards.friction;
          p.vel.z *= CONFIG.shards.friction;

          // Dampen angular tumbling on impact
          p.angVel.multiplyScalar(0.65);

          // Rest when energy drops below threshold or max bounces reached
          const horizontalSpeed = Math.hypot(p.vel.x, p.vel.z);
          if (
            (Math.abs(p.vel.y) < 0.35 && horizontalSpeed < 0.35) ||
            p.bounceCount >= 4
          ) {
            p.isResting = true;
            p.vel.set(0, 0, 0);
            p.angVel.set(0, 0, 0);
          }
        }
      }

      // Update instance matrix
      this.dummy.position.copy(p.pos);
      this.dummy.rotation.copy(p.rot);
      this.dummy.scale.copy(p.scale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Fade out and auto-recycle after resting
    if (allResting) {
      this.settleTimer += clampedDt;
      if (this.settleTimer >= CONFIG.shards.settleDuration) {
        this.clearShards();
      }
    }
  }

  /**
   * Smoothly fades and clears glass shards
   */
  public clearShards(duration = 0.45): void {
    if (!this.isActive) return;

    gsap.killTweensOf(this.shardMat);
    gsap.to(this.shardMat, {
      opacity: 0,
      duration,
      ease: "power2.out",
      onComplete: () => {
        this.isActive = false;
        this.instancedMesh.visible = false;
        for (let i = 0; i < this.count; i++) {
          this.dummy.position.set(0, -999, 0);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      },
    });
  }

  public dispose(): void {
    gsap.killTweensOf(this.sparkLight);
    gsap.killTweensOf(this.sparkMat);
    gsap.killTweensOf(this.shardMat);

    this.scene.remove(this.instancedMesh);
    this.scene.remove(this.sparkLight);
    this.scene.remove(this.sparkMesh);

    this.shardGeom.dispose();
    this.shardMat.dispose();
    this.sparkMesh.geometry.dispose();
    this.sparkMat.dispose();
  }
}

