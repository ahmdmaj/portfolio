import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "./config";
import { LampStore } from "./state/LampStore";
import { EngineCallbacks, LampState, LampStateListener, SceneDimensions } from "./types";
import { CoordinateUtils } from "./utils/coordinates";
import { Wall } from "./objects/Wall";
import { Lamp } from "./objects/Lamp";
import { Switch } from "./objects/Switch";
import { Slingshot } from "./objects/Slingshot";
import { LightingSystem } from "./systems/LightingSystem";
import { EffectsSystem } from "./systems/EffectsSystem";
import { ProjectileSystem } from "./systems/ProjectileSystem";
import { SlingshotInteractionSystem } from "./systems/SlingshotInteractionSystem";

export class LampScene {
  // Core Three.js instances
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private container: HTMLElement | null = null;

  // Physical Scene Objects
  public wall: Wall | null = null;
  public lamp: Lamp | null = null;
  public wallSwitch: Switch | null = null;
  public slingshot: Slingshot | null = null;

  // Lighting & Atmospheric Systems (Phase 3)
  public lightingSystem: LightingSystem | null = null;
  public effectsSystem: EffectsSystem | null = null;

  // Slingshot & Projectile Systems (Phase 5)
  public projectileSystem: ProjectileSystem | null = null;
  public slingshotInteraction: SlingshotInteractionSystem | null = null;

  // Interaction & Raycasting (Phase 4 & 5)
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointer: THREE.Vector2 = new THREE.Vector2();
  private isHoveringRocker: boolean = false;
  private isHoveringSlingshot: boolean = false;
  private pointerDownPos: THREE.Vector2 = new THREE.Vector2();
  private pointerDownTarget: THREE.Object3D | null = null;
  private lightTransition = { factor: 1.0 };
  private unsubscribeStore: (() => void) | null = null;

  // Animation & Lifecycle
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private resizeObserver: ResizeObserver | null = null;
  private visibilityHandler: (() => void) | null = null;

  // Viewport dimensions & anchors
  private dimensions: SceneDimensions = {
    width: 0,
    height: 0,
    aspect: 1,
    isMobile: false,
    worldWidth: 10,
    worldHeight: 10,
  };

  // State store
  public readonly store: LampStore;
  private callbacks: EngineCallbacks;

  constructor(callbacks: EngineCallbacks = {}) {
    this.store = new LampStore();
    this.callbacks = callbacks;

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.colors.bg);

    // Initialize Orthographic Camera (units will be sized upon mount & resize)
    this.camera = new THREE.OrthographicCamera(-5, 5, 5, -5, CONFIG.viewport.near, CONFIG.viewport.far);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // Bind state changes if requested
    if (callbacks.onStateChange) {
      this.store.subscribe(callbacks.onStateChange);
    }
  }

  /**
   * Mounts the engine to the DOM container
   */
  public mount(container: HTMLElement): void {
    if (this.container) {
      this.dispose();
    }
    this.container = container;

    // 1. Initialize WebGL Renderer with High-Performance Settings and Soft Shadow Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.viewport.maxPixelRatio);
    this.renderer.setPixelRatio(dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Enable soft shadow mapping (PCFSoftShadowMap)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.className = "three-canvas w-full h-full absolute inset-0";
    canvas.setAttribute("touch-action", "none");
    this.container.appendChild(canvas);

    // 2. Setup 3D environment & physical objects
    this.setupEnvironment();

    // 3. Setup initial sizing, camera & object positions
    this.handleResize();

    // 4. Setup interaction listeners (Phase 4 & 5)
    this.setupInteraction();

    // 5. Connect authoritative store synchronization for power & switch
    let isInitial = true;
    this.unsubscribeStore = this.store.subscribe((state) => {
      const isOn = state.bulb === "on";
      this.updatePowerState(isOn, !isInitial);
      isInitial = false;
    });

    // 6. Setup ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    // 7. Visibility change handler (pauses loop when tab is backgrounded)
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);

    // 8. Start the render loop
    this.start();

    // 9. Automated verification hook for query parameters (?slingshot=draw or ?slingshot=flight)
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const slingshotParam = params.get("slingshot");
        if (slingshotParam === "draw" && this.slingshot) {
          const pullVector = new THREE.Vector3(-0.85, -0.92, 0);
          this.slingshot.updateBands(this.slingshot.restPouchPos.clone().add(pullVector));
          this.store.setDragging(true, 1.0);
        } else if (slingshotParam === "flight" && this.projectileSystem && this.slingshot) {
          this.slingshot.setStoneVisible(false);
          const anchors = CoordinateUtils.getAnchors(this.dimensions);
          const launchOrigin = new THREE.Vector3(
            anchors.slingshot.x + 0.6,
            anchors.slingshot.y + 1.2,
            0.15
          );
          const launchVel = new THREE.Vector3(8.5, 9.5, 0);
          this.projectileSystem.launch(launchOrigin, launchVel);
        }
      } catch {
        // Fallback for environments without location
      }
    }
  }

  /**
   * Constructs the physical 3D environment and initializes subsystems
   */
  private setupEnvironment(): void {
    // 1. Wall background (receives shadows & light falloff)
    this.wall = new Wall(30, 20);
    this.scene.add(this.wall.group);

    // 2. Hanging Industrial Lamp (with socket and bulb)
    this.lamp = new Lamp(CONFIG.lamp.cordLength);
    this.scene.add(this.lamp.group);

    // 3. Wall Switch
    this.wallSwitch = new Switch();
    this.scene.add(this.wallSwitch.group);

    // 4. Wooden Slingshot with Pebble
    this.slingshot = new Slingshot();
    this.scene.add(this.slingshot.group);

    // 5. Phase 3 Lighting System (SpotLight + PointLight at bulb center + key/rim/fill lights)
    this.lightingSystem = new LightingSystem({
      scene: this.scene,
      lampSocketGroup: this.lamp.socketGroup,
    });

    // 6. Phase 3 Effects System (Gaussian planar light beam on wall & incandescent bulb glow)
    this.effectsSystem = new EffectsSystem({
      scene: this.scene,
      lampSocketGroup: this.lamp.socketGroup,
    });

    // 7. Phase 5 Projectile System
    this.projectileSystem = new ProjectileSystem(this.scene);

    // 8. Phase 5 Slingshot Interaction System
    this.slingshotInteraction = new SlingshotInteractionSystem(
      this.slingshot,
      this.projectileSystem,
      this.store
    );
  }

  /**
   * Registers pointer interaction events for raycasting, switch clicks, and slingshot dragging
   */
  private setupInteraction(): void {
    if (!this.container) return;

    this.container.addEventListener("pointermove", this.onPointerMove, { passive: true });
    this.container.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    this.container.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("pointercancel", this.onPointerCancel);
  }

  private updatePointerNDC(event: PointerEvent): void {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.container) return;
    this.updatePointerNDC(event);

    // If currently dragging slingshot, update pull mechanics directly
    if (this.slingshotInteraction?.isDragging) {
      this.slingshotInteraction.handleMove(this.raycaster);
      this.container.style.cursor = "grabbing";
      return;
    }

    // Check switch hover
    let isOverRocker = false;
    if (this.wallSwitch) {
      const switchTargets = [
        this.wallSwitch.rockerMesh,
        this.wallSwitch.ledMesh,
        this.wallSwitch.labelMesh,
      ];
      const switchHits = this.raycaster.intersectObjects(switchTargets, true);
      isOverRocker = switchHits.length > 0;

      if (isOverRocker !== this.isHoveringRocker) {
        this.isHoveringRocker = isOverRocker;
        this.wallSwitch.setHovered(isOverRocker);
      }
    }

    // Check slingshot stone/pouch hover
    const isOverSlingshot =
      this.slingshotInteraction?.checkHover(this.raycaster) ?? false;
    this.isHoveringSlingshot = isOverSlingshot;

    // Set intuitive cursor based on hovered element
    if (isOverRocker) {
      this.container.style.cursor = "pointer";
    } else if (isOverSlingshot && !this.projectileSystem?.active) {
      this.container.style.cursor = "grab";
    } else {
      this.container.style.cursor = "default";
    }
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.container) return;
    this.updatePointerNDC(event);

    // 1. Try initiating slingshot drag first
    if (this.slingshotInteraction?.startDrag(this.raycaster)) {
      this.container.style.cursor = "grabbing";
      this.pointerDownTarget = null;
      return;
    }

    // 2. Check wall switch click target
    if (this.wallSwitch) {
      const switchTargets = [
        this.wallSwitch.rockerMesh,
        this.wallSwitch.ledMesh,
        this.wallSwitch.labelMesh,
      ];
      const hits = this.raycaster.intersectObjects(switchTargets, true);
      if (hits.length > 0) {
        this.pointerDownTarget = this.wallSwitch.rockerMesh;
        this.pointerDownPos.set(event.clientX, event.clientY);
        return;
      }
    }

    this.pointerDownTarget = null;
  };

  private onPointerUp = (event: PointerEvent): void => {
    // 1. If slingshot was dragging, release projectile
    if (this.slingshotInteraction?.isDragging) {
      this.slingshotInteraction.release();
      if (this.container) {
        this.container.style.cursor = "default";
      }
      this.pointerDownTarget = null;
      return;
    }

    // 2. If switch was clicked
    if (this.pointerDownTarget && this.wallSwitch) {
      const dist = Math.hypot(
        event.clientX - this.pointerDownPos.x,
        event.clientY - this.pointerDownPos.y
      );

      // Verify click without significant drag displacement
      if (dist < 8) {
        this.store.toggleSwitch();
      }
      this.pointerDownTarget = null;
    }
  };

  private onPointerLeave = (): void => {
    if (!this.slingshotInteraction?.isDragging) {
      if (this.isHoveringRocker) {
        this.isHoveringRocker = false;
        this.wallSwitch?.setHovered(false);
      }
      this.isHoveringSlingshot = false;
      if (this.container) {
        this.container.style.cursor = "default";
      }
    }
  };

  private onPointerCancel = (): void => {
    if (this.slingshotInteraction?.isDragging) {
      this.slingshotInteraction.cancel();
      if (this.container) {
        this.container.style.cursor = "default";
      }
    }
    this.pointerDownTarget = null;
  };

  /**
   * Updates rocker position, LED, and smoothly transitions lights and effects (Phase 4)
   */
  public updatePowerState(isOn: boolean, animated = true): void {
    if (this.wallSwitch) {
      this.wallSwitch.setRockerState(isOn, animated);
    }

    const targetFactor = isOn ? 1.0 : 0.0;
    if (animated) {
      gsap.to(this.lightTransition, {
        factor: targetFactor,
        duration: 0.35,
        ease: "power2.inOut",
        overwrite: "auto",
        onUpdate: () => {
          const f = this.lightTransition.factor;
          this.lightingSystem?.setIntensity(f);
          this.effectsSystem?.setIntensity(f);
          this.lamp?.bulb.setIlluminated(f);
        },
      });
    } else {
      gsap.killTweensOf(this.lightTransition);
      this.lightTransition.factor = targetFactor;
      this.lightingSystem?.setIntensity(targetFactor);
      this.effectsSystem?.setIntensity(targetFactor);
      this.lamp?.bulb.setIlluminated(targetFactor);
    }
  }

  /**
   * Handles resizing and re-aligns camera frustum and normalized anchor positions
   */
  public handleResize(): void {
    if (!this.container || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.dimensions = CoordinateUtils.calculateDimensions(width, height);
    this.renderer.setSize(width, height, false);

    // Update orthographic camera frustum
    const halfH = this.dimensions.worldHeight / 2;
    const halfW = this.dimensions.worldWidth / 2;

    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    // Re-size wall background
    if (this.wall) {
      this.wall.resize(this.dimensions.worldWidth, this.dimensions.worldHeight);
    }

    // Recompute anchor positions based on normalized coordinates
    const anchors = CoordinateUtils.getAnchors(this.dimensions);
    const scaleFactor = this.dimensions.isMobile ? 0.85 : 1.0;

    if (this.lamp) {
      this.lamp.setPosition(anchors.lamp.x, anchors.lamp.y);
    }

    if (this.wallSwitch) {
      this.wallSwitch.setPosition(anchors.switch.x, anchors.switch.y);
      this.wallSwitch.group.scale.setScalar(scaleFactor);
    }

    if (this.slingshot) {
      this.slingshot.setPosition(anchors.slingshot.x, anchors.slingshot.y, scaleFactor);
    }
  }

  /**
   * Starts the animation loop
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Stops the animation loop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Core requestAnimationFrame tick
   */
  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // 1. Sync CSS illumination variables (--light-x, --light-i) for DOM typography
    if (this.effectsSystem && this.lamp) {
      this.effectsSystem.updateDOMIllumination(
        this.lamp.getSocketWorldPosition(),
        this.camera,
        this.dimensions.width
      );
    }

    // 2. Update active projectile physics in 2.5D space (Phase 5)
    if (this.projectileSystem && this.projectileSystem.active) {
      const halfW = this.dimensions.worldWidth / 2;
      const halfH = this.dimensions.worldHeight / 2;
      this.projectileSystem.update(
        dt,
        {
          minX: -halfW,
          maxX: halfW,
          minY: -halfH,
          maxY: halfH,
        },
        () => {
          // Flight ended: respawn pebble in slingshot pouch
          this.slingshot?.resetStone();
        }
      );
    }

    // 3. Render scene
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Subscribe to state updates
   */
  public subscribe(listener: LampStateListener): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Get current state
   */
  public getState(): Readonly<LampState> {
    return this.store.getState();
  }

  /**
   * Get current dimensions
   */
  public getDimensions(): SceneDimensions {
    return this.dimensions;
  }

  /**
   * Comprehensive cleanup and GPU disposal
   */
  public dispose(): void {
    this.stop();

    // Detach pointer interaction listeners
    if (this.container) {
      this.container.removeEventListener("pointermove", this.onPointerMove);
      this.container.removeEventListener("pointerdown", this.onPointerDown);
      this.container.removeEventListener("pointerleave", this.onPointerLeave);
      this.container.style.cursor = "default";
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerCancel);
    }

    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    gsap.killTweensOf(this.lightTransition);

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose systems
    if (this.projectileSystem) {
      this.projectileSystem.dispose();
      this.projectileSystem = null;
    }

    if (this.slingshotInteraction) {
      this.slingshotInteraction.cancel();
      this.slingshotInteraction = null;
    }

    if (this.lightingSystem) {
      this.lightingSystem.dispose();
      this.lightingSystem = null;
    }

    if (this.effectsSystem) {
      this.effectsSystem.dispose();
      this.effectsSystem = null;
    }

    // Dispose physical objects
    if (this.wall) {
      this.wall.dispose();
      this.wall = null;
    }

    if (this.lamp) {
      this.lamp.dispose();
      this.lamp = null;
    }

    if (this.wallSwitch) {
      this.wallSwitch.dispose();
      this.wallSwitch = null;
    }

    if (this.slingshot) {
      this.slingshot.dispose();
      this.slingshot = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.container = null;
  }
}
