/**
 * Vessel mesh creator
 */
import * as THREE from 'three';
import { VesselDimensions } from '../config';
export interface VesselOptions {
    color?: number;
    opacity?: number;
}
/**
 * Create a simple box vessel representation
 */
export declare function createVesselMesh(dimensions: VesselDimensions, options?: VesselOptions): THREE.Mesh;
/**
 * Create a vessel group with hull and indicators
 */
export declare function createVesselGroup(dimensions: VesselDimensions, position: {
    x: number;
    y: number;
    z: number;
}): THREE.Group;
/**
 * Create a connection point indicator with label
 */
export declare function createConnectionPoint(position: {
    x: number;
    y: number;
    z: number;
}, name: string, color?: number): THREE.Group;
//# sourceMappingURL=vessel-mesh.d.ts.map