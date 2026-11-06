import * as THREE from "three";
import gsap from "gsap";
import { CONFIG } from "../config";

export class Switch {
  public readonly group: THREE.Group;
  public readonly plateMesh: THREE.Mesh;
  public readonly rockerGroup: THREE.Group;
  public readonly rockerMesh: THREE.Mesh;
  public readonly ledMesh: THREE.Mesh;
  public readonly labelMesh: THREE.Mesh;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private labelTexture: THREE.CanvasTexture | null = null;
  private rockerMat: THREE.MeshStandardMaterial;
  private ledMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    // 1. Switch backplate (wall mounted plate)
    const plateWidth = 0.95;
    const plateHeight = 1.45;
    const plateDepth = 0.12;

    const plateGeom = new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth);
    this.geometries.push(plateGeom);

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.82,
      metalness: 0.15,
    });
    this.materials.push(plateMat);

    this.plateMesh = new THREE.Mesh(plateGeom, plateMat);
    this.plateMesh.castShadow = true;
    this.plateMesh.receiveShadow = true;
    this.group.add(this.plateMesh);

    // 2. Beveled inner bezel frame (recess for rocker)
    const bezelGeom = new THREE.BoxGeometry(0.52, 0.82, 0.04);
    this.geometries.push(bezelGeom);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x101113,
      roughness: 0.92,
      metalness: 0.05,
    });
    this.materials.push(bezelMat);
    const bezelMesh = new THREE.Mesh(bezelGeom, bezelMat);
    bezelMesh.position.set(0, 0, plateDepth / 2 + 0.01);
    this.group.add(bezelMesh);

    // 3. Tilting central rocker switch
    this.rockerGroup = new THREE.Group();
    this.rockerGroup.position.set(0, 0, plateDepth / 2 + 0.03);

    const rockerWidth = 0.44;
    const rockerHeight = 0.74;
    const rockerDepth = 0.15;

    const rockerGeom = new THREE.BoxGeometry(rockerWidth, rockerHeight, rockerDepth);
    this.geometries.push(rockerGeom);

    this.rockerMat = new THREE.MeshStandardMaterial({
      color: 0x25262a,
      roughness: 0.46,
      metalness: 0.35,
    });
    this.materials.push(this.rockerMat);

    this.rockerMesh = new THREE.Mesh(rockerGeom, this.rockerMat);
    this.rockerMesh.castShadow = true;
    // Pivot rocker upward for default "ON" state (-0.28 rad)
    this.rockerMesh.rotation.x = -CONFIG.wallSwitch.rockerAngleMax;
    this.rockerGroup.add(this.rockerMesh);

    // 4. Emissive status LED indicator on rocker
    const ledGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16);
    ledGeom.rotateX(Math.PI / 2);
    this.geometries.push(ledGeom);

    this.ledMat = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.ledOn,
      emissive: CONFIG.colors.ledOn,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.2,
    });
    this.materials.push(this.ledMat);

    this.ledMesh = new THREE.Mesh(ledGeom, this.ledMat);
    this.ledMesh.position.set(0, 0.22, rockerDepth / 2 + 0.01);
    this.rockerMesh.add(this.ledMesh);

    this.group.add(this.rockerGroup);

    // 5. Procedural high-DPI label texture for ON / OFF markings
    const labelGeom = new THREE.PlaneGeometry(0.5, 0.8);
    this.geometries.push(labelGeom);

    this.labelTexture = this.createLabelTexture();
    const labelMat = new THREE.MeshBasicMaterial({
      map: this.labelTexture,
      transparent: true,
      opacity: 0.85,
    });
    this.materials.push(labelMat);

    this.labelMesh = new THREE.Mesh(labelGeom, labelMat);
    this.labelMesh.position.set(0, 0, rockerDepth / 2 + 0.012);
    this.rockerMesh.add(this.labelMesh);

    // 6. Two subtle industrial wall plate mounting screws
    const screwGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    screwGeom.rotateX(Math.PI / 2);
    this.geometries.push(screwGeom);

    const screwMat = new THREE.MeshStandardMaterial({
      color: 0x3a3b40,
      roughness: 0.4,
      metalness: 0.8,
    });
    this.materials.push(screwMat);

    const topScrew = new THREE.Mesh(screwGeom, screwMat);
    topScrew.position.set(0, 0.58, plateDepth / 2 + 0.005);
    this.group.add(topScrew);

    const bottomScrew = new THREE.Mesh(screwGeom, screwMat);
    bottomScrew.position.set(0, -0.58, plateDepth / 2 + 0.005);
    this.group.add(bottomScrew);
  }

  private createLabelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#8a8176";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // "ON" at top
      ctx.fillText("ON", 128, 90);

      // "OFF" at bottom
      ctx.fillText("OFF", 128, 420);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }

  public setPosition(x: number, y: number): void {
    this.group.position.set(x, y, 0);
  }

  /**
   * Sets rocker visual state (ON = -0.28 rad, OFF = +0.28 rad) with smooth GSAP transition
   */
  public setRockerState(isOn: boolean, animated = true): void {
    const targetAngle = isOn
      ? -CONFIG.wallSwitch.rockerAngleMax
      : CONFIG.wallSwitch.rockerAngleMax;

    if (animated) {
      gsap.to(this.rockerMesh.rotation, {
        x: targetAngle,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      gsap.killTweensOf(this.rockerMesh.rotation);
      this.rockerMesh.rotation.x = targetAngle;
    }

    // Update LED status indicator
    if (isOn) {
      this.ledMat.color.setHex(CONFIG.colors.ledOn);
      this.ledMat.emissive.setHex(CONFIG.colors.ledOn);
      this.ledMat.emissiveIntensity = 1.2;
    } else {
      this.ledMat.color.setHex(CONFIG.colors.ledOff);
      this.ledMat.emissive.setHex(CONFIG.colors.ledOff);
      this.ledMat.emissiveIntensity = 0.45;
    }
  }

  /**
   * Subtle pointer hover feedback on the rocker switch
   */
  public setHovered(hovered: boolean): void {
    if (hovered) {
      this.rockerMat.emissive.setHex(0x22252c);
      this.rockerMat.emissiveIntensity = 0.85;
    } else {
      this.rockerMat.emissive.setHex(0x000000);
      this.rockerMat.emissiveIntensity = 0.0;
    }
  }

  public dispose(): void {
    gsap.killTweensOf(this.rockerMesh.rotation);
    if (this.labelTexture) {
      this.labelTexture.dispose();
      this.labelTexture = null;
    }
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.group.clear();
  }
}
