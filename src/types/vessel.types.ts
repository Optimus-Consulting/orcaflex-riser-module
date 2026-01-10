/**
 * Vessel configuration types for OrcaFlex model
 */

export interface VesselPosition {
  x: number;
  y: number;
  z: number;
}

export interface VesselOrientation {
  heading: number;
  roll: number;
  pitch: number;
}

export interface ConnectionPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface RAOData {
  period: number[];
  heave: number[];
  surge: number[];
  sway: number[];
  roll: number[];
  pitch: number[];
  yaw: number[];
}

export interface VesselConfig {
  id: string;
  name: string;
  length: number;
  breadth: number;
  depth: number;
  draft: number;
  position: VesselPosition;
  orientation: VesselOrientation;
  connectionPoints: ConnectionPoint[];
  raoData?: RAOData;
}

export interface VesselExtractRequest {
  yamlContent: string;
}

export interface VesselExtractResponse {
  vessels: VesselConfig[];
  connectionPoints: Record<string, ConnectionPoint[]>;
}

export const DEFAULT_VESSEL: VesselConfig = {
  id: 'vessel-1',
  name: 'FPSO',
  length: 280,
  breadth: 60,
  depth: 30,
  draft: 22,
  position: { x: 0, y: 0, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  connectionPoints: [
    { id: 'cp-1', name: 'Turret Center', x: 50, y: 0, z: -10 },
  ],
};
