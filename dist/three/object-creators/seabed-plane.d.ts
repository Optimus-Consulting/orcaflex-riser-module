/**
 * Seabed plane creator
 */
import * as THREE from 'three';
export interface SeabedOptions {
    size?: number;
    addNoise?: boolean;
}
/**
 * Create a seabed plane at specified depth
 */
export declare function createSeabed(depth: number, options?: SeabedOptions): THREE.Mesh;
/**
 * Create a seabed reference line at specified depth
 */
export declare function createSeabedLine(depth: number, color?: number): THREE.Mesh;
//# sourceMappingURL=seabed-plane.d.ts.map