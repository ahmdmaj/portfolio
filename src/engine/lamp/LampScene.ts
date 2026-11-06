import * as THREE from "three";
import { CONFIG } from "./config";
import { LampStore } from "./state/LampStore";
import { EngineCallbacks, LampState, LampStateListener, SceneDimensions } from "./types";
import { CoordinateUtils } from "./utils/coordinates";

export class LampScene {
  // Core Three.js instances
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private container: HTMLElement | null = null;

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

  // Phase 1 Placeholder object to verify WebGL renderer and loop
  private placeholderGroup: THREE.Group | null = null;
  private placeholderMesh: THREE.Mesh | null = null;
  private placeholderWireframe: THREE.LineSegments | null = null;

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

    // 2. Setup initial sizing & camera
    this.handleResize();

    // 3. Create Phase 1 Verification Placeholder
    this.setupPlaceholder();

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
   * Creates an elegant placeholder object in Phase 1 to verify WebGL renderer and coordinate system
   */
  private setupPlaceholder(): void {
    this.placeholderGroup = new THREE.Group();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.placeholderGroup.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(CONFIG.colors.accent, 1.2);
    dirLight.position.set(2, 4, 5);
    this.placeholderGroup.add(dirLight);

    // Outer geometric cage (Icosahedron)
    const geometry = new THREE.IcosahedronGeometry(0.85, 0);
    const material = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.placeholder,
      roughness: 0.35,
      metalness: 0.6,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    this.placeholderMesh = new THREE.Mesh(geometry, material);

    // Wireframe overlay for technical aesthetic
    const wireframeGeom = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });
    this.placeholderWireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
    this.placeholderMesh.add(this.placeholderWireframe);

    // Position at top center lamp anchor
    const anchors = CoordinateUtils.getAnchors(this.dimensions);
    this.placeholderGroup.position.set(anchors.lamp.x, anchors.lamp.y - 1.2, 0);
    this.placeholderGroup.add(this.placeholderMesh);

    this.scene.add(this.placeholderGroup);
  }

  /**
   * Handles resizing and re-aligns camera frustum and anchor positions
   */
  public handleResize(): void {
    if (!this.container || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.dimensions = CoordinateUtils.calculateDimensions(width, height);
    this.renderer.setSize(width, height, false);

    // Update orthographic camera frustum:
    // Fixed worldHeight = 10 units
    const halfH = this.dimensions.worldHeight / 2;
    const halfW = (this.dimensions.worldHeight * this.dimensions.aspect) / 2;

    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    // Recompute anchor positions on resize
    if (this.placeholderGroup) {
      const anchors = CoordinateUtils.getAnchors(this.dimensions);
      this.placeholderGroup.position.set(anchors.lamp.x, anchors.lamp.y - 1.2, 0);
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
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Animate Phase 1 placeholder to demonstrate active rendering
    if (this.placeholderMesh) {
      this.placeholderMesh.rotation.x += dt * 0.45;
      this.placeholderMesh.rotation.y += dt * 0.7;
    }

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

    // Traverse scene and dispose of geometries, materials, and textures
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.LineSegments).isLineSegments) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.container = null;
    this.placeholderGroup = null;
    this.placeholderMesh = null;
    this.placeholderWireframe = null;
  }
}
