import * as THREE from "three";
import { CONFIG } from "./config";
import { LampStore } from "./state/LampStore";
import { EngineCallbacks, LampState, LampStateListener, SceneDimensions } from "./types";
import { CoordinateUtils } from "./utils/coordinates";
import { Wall } from "./objects/Wall";
import { Lamp } from "./objects/Lamp";
import { Switch } from "./objects/Switch";
import { Slingshot } from "./objects/Slingshot";

export class LampScene {
  // Core Three.js instances
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private container: HTMLElement | null = null;

  // Scene Objects
  public wall: Wall | null = null;
  public lamp: Lamp | null = null;
  public wallSwitch: Switch | null = null;
  public slingshot: Slingshot | null = null;

  // Scene Lights (Static environment illumination for Phase 2)
  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;

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

    // Initialize Orthographic Camera (units will be updated upon mount & resize)
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

    // 1. Initialize WebGL Renderer
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

    const canvas = this.renderer.domElement;
    canvas.className = "three-canvas w-full h-full absolute inset-0";
    canvas.setAttribute("touch-action", "none");
    this.container.appendChild(canvas);

    // 2. Setup static 3D environment & physical objects (Phase 2)
    this.setupEnvironment();

    // 3. Setup initial sizing, camera & object positions
    this.handleResize();

    // 4. Setup ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    // 5. Visibility change handler (pauses loop when tab is backgrounded)
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);

    // 6. Start the render loop
    this.start();
  }

  /**
   * Constructs the physical 3D environment: Wall, Lamp, Switch, Slingshot, and balanced lighting
   */
  private setupEnvironment(): void {
    // 1. Balanced ambient and directional lighting for material definition
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    // Key directional light creating soft specular glints on brushed metal and wood
    this.keyLight = new THREE.DirectionalLight(0xffeedd, 1.15);
    this.keyLight.position.set(-3.5, 6, 7);
    this.scene.add(this.keyLight);

    // Soft warm fill light from lower right
    this.fillLight = new THREE.DirectionalLight(CONFIG.colors.accent, 0.45);
    this.fillLight.position.set(4, -2, 5);
    this.scene.add(this.fillLight);

    // Top rim light to sculpt the metallic lamp shade silhouette
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 7, 1);
    this.scene.add(rimLight);

    // 2. Wall background
    this.wall = new Wall(30, 20);
    this.scene.add(this.wall.group);

    // 3. Hanging Industrial Lamp (with socket and bulb)
    this.lamp = new Lamp(CONFIG.lamp.cordLength);
    this.scene.add(this.lamp.group);

    // 4. Wall Switch
    this.wallSwitch = new Switch();
    this.scene.add(this.wallSwitch.group);

    // 5. Wooden Slingshot with Pebble
    this.slingshot = new Slingshot();
    this.scene.add(this.slingshot.group);
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
    this.lastTime = now;

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

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
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

    // Clear lights
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight.dispose();
      this.ambientLight = null;
    }
    if (this.keyLight) {
      this.scene.remove(this.keyLight);
      this.keyLight.dispose();
      this.keyLight = null;
    }
    if (this.fillLight) {
      this.scene.remove(this.fillLight);
      this.fillLight.dispose();
      this.fillLight = null;
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
