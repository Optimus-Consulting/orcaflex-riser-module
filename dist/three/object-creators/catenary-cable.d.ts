/**
 * Catenary cable creator
 */
import * as THREE from 'three';
import { CatenaryPoint } from '../../types';
export interface CatenaryOptions {
    color?: number;
    lineRadius?: number;
}
/**
 * Create a catenary cable from calculated points
 */
export declare function createCatenaryCable(points: CatenaryPoint[], options?: CatenaryOptions): THREE.Group;
/**
 * Create a catenary cable from 3D coordinate arrays
 */
export declare function createCatenaryFromCoords(coords: Array<[number, number, number]>, options?: CatenaryOptions): THREE.Group;
/**
 * Create TDP marker on seabed
 */
export declare function createTDPMarker(x: number, y: number, depth: number, color?: number): THREE.Mesh;
//# sourceMappingURL=catenary-cable.d.ts.map