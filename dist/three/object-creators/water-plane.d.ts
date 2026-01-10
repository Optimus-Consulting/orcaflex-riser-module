/**
 * Water surface plane creator
 */
import * as THREE from 'three';
export interface WaterPlaneOptions {
    size?: number;
    opacity?: number;
}
/**
 * Create a water surface plane at z=0
 */
export declare function createWaterPlane(options?: WaterPlaneOptions): THREE.Mesh;
//# sourceMappingURL=water-plane.d.ts.map