/**
 * Three.js scene configuration types and defaults for OrcaFlex module
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface SceneBounds {
    min: Vector3;
    max: Vector3;
}
export interface CameraPosition {
    position: Vector3;
    up: Vector3;
}
export interface CameraPositions {
    side: CameraPosition;
    top: CameraPosition;
    front: CameraPosition;
    iso: CameraPosition;
}
export interface VesselDimensions {
    length: number;
    breadth: number;
    depth: number;
    draft: number;
}
export interface SceneConfig {
    waterDepth: number;
    vesselPosition: Vector3;
    vesselDimensions: VesselDimensions;
    sceneBounds: SceneBounds;
    backgroundColor: number;
}
export declare const DEFAULT_SCENE_BOUNDS: SceneBounds;
export declare const DEFAULT_CAMERA_POSITIONS: CameraPositions;
export declare const DEFAULT_SCENE_CONFIG: SceneConfig;
export declare const RISER_COLORS: number[];
export declare const COLORS: {
    water: number;
    seabed: number;
    vessel: number;
    vesselCOG: number;
    cdp: number;
    tdp: number;
    grid: number;
    catenary: number;
    buoyancy: number;
};
//# sourceMappingURL=config.d.ts.map