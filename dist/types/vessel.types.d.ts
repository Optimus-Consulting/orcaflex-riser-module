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
export declare const DEFAULT_VESSEL: VesselConfig;
//# sourceMappingURL=vessel.types.d.ts.map