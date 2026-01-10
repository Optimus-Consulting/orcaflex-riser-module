/**
 * Grid helper creator
 */
import * as THREE from 'three';
export interface GridOptions {
    size?: number;
    divisions?: number;
    colorCenter?: number;
    colorGrid?: number;
}
/**
 * Create a grid on the XY plane (water surface)
 */
export declare function createGrid(options?: GridOptions): THREE.GridHelper;
/**
 * Create axis arrows for coordinate system visualization
 */
export declare function createAxisArrows(length?: number, position?: {
    x: number;
    y: number;
    z: number;
}): THREE.Group;
//# sourceMappingURL=grid.d.ts.map