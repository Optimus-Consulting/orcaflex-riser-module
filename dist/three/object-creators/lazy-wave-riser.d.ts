/**
 * Lazy wave riser creator
 */
import * as THREE from 'three';
import { RiserSegment } from '../../types';
export interface BuoyancyModuleVizConfig {
    outerDiameter: number;
    length: number;
    numberOfModules: number;
    spacing: number;
}
export interface LazyWaveOptions {
    color?: number;
    normalRadius?: number;
    buoyancyStartX?: number;
    buoyancyEndX?: number;
    buoyancyStart?: {
        x: number;
        z: number;
    };
    buoyancyEnd?: {
        x: number;
        z: number;
    };
    buoyancyModule?: BuoyancyModuleVizConfig;
}
/**
 * Create a lazy wave riser from segments
 */
export declare function createLazyWaveRiser(segments: RiserSegment[], options?: LazyWaveOptions): THREE.Group;
/**
 * Create a lazy wave riser from 3D points with buoyancy section
 */
export declare function createLazyWaveFromPoints(points: Array<{
    x: number;
    y: number;
    z: number;
}>, options?: LazyWaveOptions): THREE.Group;
/**
 * Create sag/hog bend indicator spheres
 */
export declare function createBendIndicator(position: {
    x: number;
    y: number;
    z: number;
}, type: 'sag' | 'hog', color?: number): THREE.Mesh;
//# sourceMappingURL=lazy-wave-riser.d.ts.map