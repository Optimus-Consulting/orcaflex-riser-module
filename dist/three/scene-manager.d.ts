/**
 * Scene Manager for Three.js visualization
 * Manages scene, camera, lights, and controls
 */
import * as THREE from 'three';
import { SceneBounds } from './config';
export type CameraView = 'side' | 'top' | 'front' | 'iso';
export declare class SceneManager {
    private scene;
    private camera;
    private renderer;
    private controls;
    private animationId;
    private cameraPositions;
    private sceneBounds;
    private currentView;
    constructor();
    /**
     * Initialize the scene with a canvas element
     */
    initialize(canvas: HTMLCanvasElement): void;
    /**
     * Setup scene background with gradient
     */
    private setupBackground;
    /**
     * Setup scene lighting
     */
    private setupLights;
    /**
     * Set camera to a predefined view
     */
    setCamera(view: CameraView): void;
    /**
     * Zoom camera to fit all objects in view
     */
    zoomToFit(): void;
    /**
     * Update scene bounds
     */
    updateSceneBounds(bounds: SceneBounds): void;
    /**
     * Handle window resize
     */
    onResize(): void;
    /**
     * Start the render loop
     */
    startRenderLoop(onFrame?: () => void): void;
    /**
     * Stop the render loop
     */
    stopRenderLoop(): void;
    /**
     * Add an object to the scene
     */
    add(object: THREE.Object3D): void;
    /**
     * Remove an object from the scene
     */
    remove(object: THREE.Object3D): void;
    /**
     * Clear all objects from the scene (except lights)
     */
    clearObjects(): void;
    /**
     * Get the Three.js scene
     */
    getScene(): THREE.Scene;
    /**
     * Get the camera
     */
    getCamera(): THREE.PerspectiveCamera;
    /**
     * Get the renderer
     */
    getRenderer(): THREE.WebGLRenderer;
    /**
     * Get current camera view
     */
    getCurrentView(): CameraView;
    /**
     * Get the controls target (center point)
     */
    getControlsTarget(): THREE.Vector3;
    /**
     * Dispose of all resources
     */
    dispose(): void;
}
//# sourceMappingURL=scene-manager.d.ts.map