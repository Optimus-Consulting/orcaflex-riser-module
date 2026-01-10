/**
 * Coordinate system axes creator
 * Creates visual coordinate axes for global and local reference frames
 */
import * as THREE from 'three';
export interface CoordinateAxesOptions {
    size?: number;
    labelSize?: number;
    showLabels?: boolean;
}
/**
 * Create coordinate axes (X=red, Y=green, Z=blue)
 */
export declare function createCoordinateAxes(options?: CoordinateAxesOptions): THREE.Group;
/**
 * Create global coordinate system at origin
 */
export declare function createGlobalCoordinateSystem(size?: number): THREE.Group;
/**
 * Create vessel local coordinate system
 */
export declare function createVesselCoordinateSystem(size?: number): THREE.Group;
//# sourceMappingURL=coordinate-axes.d.ts.map