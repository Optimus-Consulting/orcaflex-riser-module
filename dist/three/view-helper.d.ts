import * as THREE from 'three';
/**
 * ViewHelper - Interactive orientation indicator based on Three.js editor ViewHelper
 * Displays an interactive 3D axes indicator that shows camera orientation
 * and allows clicking on axes to snap to standard views
 */
export declare class ViewHelper extends THREE.Object3D {
    animating: boolean;
    controls: {
        center: THREE.Vector3;
    } | null;
    private camera;
    private dim;
    private turnRate;
    private interactiveObjects;
    private raycaster;
    private mouse;
    private dummy;
    private posXAxisHelper;
    private posYAxisHelper;
    private posZAxisHelper;
    private negXAxisHelper;
    private negYAxisHelper;
    private negZAxisHelper;
    private point;
    private targetPosition;
    private targetQuaternion;
    private q1;
    private q2;
    private radius;
    private editorCamera;
    constructor(editorCamera: THREE.Camera);
    /**
     * Render the view helper to a viewport in the main renderer
     */
    render(renderer: THREE.WebGLRenderer, containerWidth: number, _containerHeight: number): void;
    /**
     * Render the view helper to a separate canvas/renderer
     */
    renderToCanvas(renderer: THREE.WebGLRenderer): void;
    /**
     * Update opacity based on camera orientation
     */
    private updateOpacity;
    /**
     * Handle click on the view helper
     * Returns true if a click was handled
     */
    handleClick(event: MouseEvent, container: HTMLElement): boolean;
    /**
     * Update animation (call in render loop)
     */
    update(delta: number): void;
    /**
     * Set the dimension of the helper
     */
    setDimension(dim: number): void;
    private prepareAnimationData;
    private getAxisMaterial;
    private getSpriteMaterial;
    dispose(): void;
}
//# sourceMappingURL=view-helper.d.ts.map