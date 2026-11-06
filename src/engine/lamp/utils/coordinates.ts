import * as THREE from "three";
import { CONFIG } from "../config";
import { SceneDimensions } from "../types";

export class CoordinateUtils {
  /**
   * Computes scene dimensions and world extents based on viewport container size
   */
  public static calculateDimensions(width: number, height: number): SceneDimensions {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    const worldHeight = CONFIG.viewport.worldHeight;
    const worldWidth = worldHeight * aspect;
    const isMobile = width < CONFIG.viewport.mobileBreakpoint || aspect < 1.0;

    return {
      width,
      height,
      aspect,
      isMobile,
      worldWidth,
      worldHeight,
    };
  }

  /**
   * Converts normalized viewport coordinates (nx: [-1, 1], ny: [-1, 1])
   * into 2D world space coordinates for the Orthographic camera.
   */
  public static normalizedToWorld(
    nx: number,
    ny: number,
    dims: SceneDimensions
  ): { x: number; y: number } {
    const halfWidth = dims.worldWidth / 2;
    const halfHeight = dims.worldHeight / 2;
    return {
      x: nx * halfWidth,
      y: ny * halfHeight,
    };
  }

  /**
   * Retrieves world positions for all primary scene anchors (lamp, switch, slingshot)
   * adjusting automatically for desktop vs mobile breakpoints.
   */
  public static getAnchors(dims: SceneDimensions): {
    lamp: { x: number; y: number };
    switch: { x: number; y: number };
    slingshot: { x: number; y: number };
  } {
    const configAnchors = dims.isMobile ? CONFIG.anchors.mobile : CONFIG.anchors.desktop;

    return {
      lamp: this.normalizedToWorld(configAnchors.lamp.nx, configAnchors.lamp.ny, dims),
      switch: this.normalizedToWorld(configAnchors.switch.nx, configAnchors.switch.ny, dims),
      slingshot: this.normalizedToWorld(configAnchors.slingshot.nx, configAnchors.slingshot.ny, dims),
    };
  }

  /**
   * Projects a 3D world coordinate to 2D CSS screen pixels (relative to container)
   */
  public static worldToScreen(
    worldPos: THREE.Vector3 | { x: number; y: number; z?: number },
    camera: THREE.Camera,
    containerWidth: number,
    containerHeight: number
  ): { x: number; y: number } {
    const v = new THREE.Vector3(
      worldPos.x,
      worldPos.y,
      "z" in worldPos && typeof worldPos.z === "number" ? worldPos.z : 0
    );
    v.project(camera);

    const x = ((v.x + 1) / 2) * containerWidth;
    const y = ((-v.y + 1) / 2) * containerHeight;

    return { x, y };
  }

  /**
   * Unprojects screen client coordinates (relative to container) into 2D world coordinates (z = 0)
   */
  public static screenToWorld(
    screenX: number,
    screenY: number,
    containerWidth: number,
    containerHeight: number,
    camera: THREE.OrthographicCamera
  ): { x: number; y: number } {
    const ndcX = (screenX / containerWidth) * 2 - 1;
    const ndcY = -(screenY / containerHeight) * 2 + 1;

    const vec = new THREE.Vector3(ndcX, ndcY, 0);
    vec.unproject(camera);

    return { x: vec.x, y: vec.y };
  }
}
