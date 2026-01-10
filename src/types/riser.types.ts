/**
 * Riser configuration types for OrcaFlex model
 */

export type RiserType = 'catenary' | 'lazy-wave' | 'steep-wave' | 'pliant-wave';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface CatenaryPoint {
  x: number;
  y: number;
  s: number;
  angle: number;
}

export interface CatenaryConfig {
  type: 'catenary';
  hangoffPoint: Point3D;
  azimuth: number;
  departureAngle: number;
  tdpX?: number;
  tdpY?: number;
  layback?: number;
  totalLength?: number;
}

export interface LazyWaveConfig {
  type: 'lazy-wave';
  hangoffPoint: Point3D;
  azimuth: number;
  departureAngle: number;
  sagBend: number;
  hogBend: number;
  buoyancyStart?: number;
  buoyancyEnd?: number;
  tdpX?: number;
  tdpY?: number;
}

export type RiserGeometryConfig = CatenaryConfig | LazyWaveConfig;

/**
 * Content configuration for a riser
 * Each content represents a different fill state (empty, seawater, oil, etc.)
 */
export interface ContentConfig {
  id: string;
  name: string;
  density: number;  // kg/m³ (0 = empty/air, 1025 = seawater)
  color?: number;   // Optional color override for visualization
}

export interface RiserConfig {
  id: string;
  name: string;
  lineTypeId: string;
  buoyancyModuleId?: string;
  vesselId: string;
  connectionPointId: string;
  geometry: RiserGeometryConfig;
  contents: ContentConfig[];  // Multiple content configurations
  activeContentId?: string;   // Currently selected content for calculation
  calculationResults?: RiserCalculationResult;
}

export interface RiserCalculationResult {
  totalLength: number;
  tdpPosition: Point3D;
  maxTension: number;
  minTension: number;
  sagBendRadius?: number;
  hogBendRadius?: number;
  points: CatenaryPoint[];
  segments?: RiserSegment[];
  buoyancyStart?: { x: number; z: number };
  buoyancyEnd?: { x: number; z: number };
}

export interface RiserSegment {
  name: string;
  type: 'line' | 'buoyancy';
  startPoint: Point3D;
  endPoint: Point3D;
  length: number;
  points: CatenaryPoint[];
}

export interface CatenaryRequest {
  method: 'layback' | 'point_angle' | 'tdp_tension';
  weight: number;
  height: number;
  horizontalDistance?: number;
  departureAngle?: number;
  tension?: number;
  numPoints?: number;
}

export interface CatenaryResult {
  horizontalTension: number;
  totalLength: number;
  tdpPosition: { x: number; y: number };
  departureAngle: number;
  tdpAngle: number;
  points: CatenaryPoint[];
}

export interface LazyWaveRequest {
  waterDepth: number;
  lineWeight: number;
  buoyancyWeight: number;
  sag: number;
  hog: number;
  departureAngle?: number;
  tdpDistance?: number;
  pointsPerSegment?: number;
}

export interface LazyWaveResult {
  totalLength: number;
  hangoffTension: number;
  tdpPosition: { x: number; y: number };
  sagBendPosition: { x: number; y: number };
  hogBendPosition: { x: number; y: number };
  buoyancyStart: number;
  buoyancyEnd: number;
  segments: RiserSegment[];
}

/**
 * Default content configurations
 */
export const DEFAULT_CONTENTS: ContentConfig[] = [
  {
    id: 'empty',
    name: 'Empty (Air)',
    density: 0,
    color: 0x4a90d9,  // Blue
  },
  {
    id: 'seawater',
    name: 'Seawater',
    density: 1025,
    color: 0x2e7d32,  // Green
  },
];

export const DEFAULT_RISER: RiserConfig = {
  id: 'riser-1',
  name: 'Riser 1',
  lineTypeId: 'flexible-riser',
  vesselId: 'vessel-1',
  connectionPointId: 'cp-1',
  geometry: {
    type: 'catenary',
    hangoffPoint: { x: 50, y: 0, z: -10 },
    azimuth: 180,
    departureAngle: 80,
  },
  contents: DEFAULT_CONTENTS,
  activeContentId: 'empty',
};
