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

// Default scene bounds for FPSO/riser visualization
export const DEFAULT_SCENE_BOUNDS: SceneBounds = {
  min: { x: -200, y: -100, z: -300 },
  max: { x: 400, y: 100, z: 50 }
};

// Camera positions for different views
export const DEFAULT_CAMERA_POSITIONS: CameraPositions = {
  side: { position: { x: 500, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
  top: { position: { x: 0, y: 0, z: 500 }, up: { x: 0, y: 1, z: 0 } },
  front: { position: { x: 0, y: -500, z: 0 }, up: { x: 0, y: 0, z: 1 } },
  iso: { position: { x: 400, y: -400, z: 300 }, up: { x: 0, y: 0, z: 1 } }
};

// Default scene configuration
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  waterDepth: 100,
  vesselPosition: { x: 0, y: 0, z: 0 },
  vesselDimensions: {
    length: 280,
    breadth: 60,
    depth: 30,
    draft: 22
  },
  sceneBounds: DEFAULT_SCENE_BOUNDS,
  backgroundColor: 0x1a237e // Deep blue gradient start
};

// Color palette for risers
export const RISER_COLORS = [
  0xff6b35, // Orange
  0x00bcd4, // Cyan
  0x4caf50, // Green
  0xff9800, // Amber
  0x9c27b0, // Purple
  0x2196f3, // Blue
];

// Material colors
export const COLORS = {
  water: 0x006994,
  seabed: 0x8b7355,
  vessel: 0x808080,
  vesselCOG: 0xff3366,
  cdp: 0x0000ff,
  tdp: 0xffeb3b,
  grid: 0x888888,
  catenary: 0xff0000,
  buoyancy: 0x00ff00,
};
