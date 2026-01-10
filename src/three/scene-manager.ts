/**
 * Scene Manager for Three.js visualization
 * Manages scene, camera, lights, and controls
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  SceneBounds,
  CameraPositions,
  DEFAULT_CAMERA_POSITIONS,
  DEFAULT_SCENE_BOUNDS,
} from './config';

export type CameraView = 'side' | 'top' | 'front' | 'iso';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationId: number | null = null;

  private cameraPositions: CameraPositions;
  private sceneBounds: SceneBounds;
  private currentView: CameraView = 'iso';

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null!;
    this.cameraPositions = { ...DEFAULT_CAMERA_POSITIONS };
    this.sceneBounds = { ...DEFAULT_SCENE_BOUNDS };
  }

  /**
   * Initialize the scene with a canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup scene
    this.scene = new THREE.Scene();
    this.setupBackground();

    // Setup camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 5000);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 2000;

    // Setup lights
    this.setupLights();

    // Set initial camera position
    this.setCamera('iso');
  }

  /**
   * Setup scene background with gradient
   */
  private setupBackground(): void {
    // Create gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a237e');   // Deep blue (sky)
    gradient.addColorStop(0.5, '#0d47a1'); // Medium blue
    gradient.addColorStop(1, '#01579b');   // Light blue (water)

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    this.scene.background = texture;
  }

  /**
   * Setup scene lighting
   */
  private setupLights(): void {
    // Ambient light for general illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Main directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(200, 200, 200);
    directional.castShadow = true;
    directional.shadow.camera.left = -500;
    directional.shadow.camera.right = 500;
    directional.shadow.camera.top = 500;
    directional.shadow.camera.bottom = -500;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 2000;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);

    // Fill light from opposite direction
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-200, -200, 100);
    this.scene.add(fill);
  }

  /**
   * Set camera to a predefined view
   */
  setCamera(view: CameraView): void {
    this.currentView = view;
    const pos = this.cameraPositions[view];

    this.camera.position.set(pos.position.x, pos.position.y, pos.position.z);
    this.camera.up.set(pos.up.x, pos.up.y, pos.up.z);
    this.camera.lookAt(0, 0, 0);

    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Zoom to fit after a short delay
    setTimeout(() => this.zoomToFit(), 10);
  }

  /**
   * Zoom camera to fit all objects in view
   */
  zoomToFit(): void {
    const center = new THREE.Vector3(
      (this.sceneBounds.max.x + this.sceneBounds.min.x) / 2,
      (this.sceneBounds.max.y + this.sceneBounds.min.y) / 2,
      (this.sceneBounds.max.z + this.sceneBounds.min.z) / 2
    );

    const size = new THREE.Vector3(
      this.sceneBounds.max.x - this.sceneBounds.min.x,
      this.sceneBounds.max.y - this.sceneBounds.min.y,
      this.sceneBounds.max.z - this.sceneBounds.min.z
    );

    this.controls.target.copy(center);

    const aspect = this.camera.aspect;
    const fovRadians = (this.camera.fov * Math.PI) / 180;
    const padding = 1.3;
    let distance: number;

    switch (this.currentView) {
      case 'top':
        distance = Math.max(
          (size.x / 2) / Math.tan(fovRadians / 2) / aspect,
          (size.y / 2) / Math.tan(fovRadians / 2)
        ) * padding;
        this.camera.position.set(center.x, center.y, center.z + distance);
        break;

      case 'front':
        distance = Math.max(
          (size.x / 2) / Math.tan(fovRadians / 2) / aspect,
          (size.z / 2) / Math.tan(fovRadians / 2)
        ) * padding;
        this.camera.position.set(center.x, center.y - distance, center.z);
        break;

      case 'side':
        distance = Math.max(
          (size.y / 2) / Math.tan(fovRadians / 2) / aspect,
          (size.z / 2) / Math.tan(fovRadians / 2)
        ) * padding;
        this.camera.position.set(center.x + distance, center.y, center.z);
        break;

      case 'iso':
      default:
        const maxDim = Math.max(size.x, size.y, size.z);
        distance = (maxDim * 1.4) / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
        const dir = new THREE.Vector3()
          .subVectors(this.camera.position, center)
          .normalize();
        this.camera.position.copy(center).add(dir.multiplyScalar(distance));
        break;
    }

    this.camera.lookAt(center);
    this.controls.update();
  }

  /**
   * Update scene bounds
   */
  updateSceneBounds(bounds: SceneBounds): void {
    this.sceneBounds = bounds;
  }

  /**
   * Handle window resize
   */
  onResize(): void {
    const canvas = this.renderer.domElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  /**
   * Start the render loop
   */
  startRenderLoop(onFrame?: () => void): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();

      // Reset viewport to full canvas before rendering main scene
      const canvas = this.renderer.domElement;
      this.renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
      this.renderer.setScissor(0, 0, canvas.clientWidth, canvas.clientHeight);
      this.renderer.setScissorTest(false);

      this.renderer.render(this.scene, this.camera);
      onFrame?.();
    };
    animate();
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Add an object to the scene
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Clear all objects from the scene (except lights)
   */
  clearObjects(): void {
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (!(child instanceof THREE.Light) && child !== this.scene) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => {
      if (obj.parent === this.scene) {
        this.scene.remove(obj);
      }
    });
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get current camera view
   */
  getCurrentView(): CameraView {
    return this.currentView;
  }

  /**
   * Get the controls target (center point)
   */
  getControlsTarget(): THREE.Vector3 {
    return this.controls.target;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stopRenderLoop();
    this.controls.dispose();
    this.renderer.dispose();
    this.clearObjects();
  }
}
