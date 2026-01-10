/**
 * Model state and API types for OrcaFlex module
 */
import { EnvironmentConfig } from './environment.types';
import { VesselConfig } from './vessel.types';
import { LineTypeConfig, BuoyancyModuleConfig } from './line-type.types';
import { RiserConfig } from './riser.types';
export interface OrcaFlexModel {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    environment: EnvironmentConfig;
    vessels: VesselConfig[];
    lineTypes: LineTypeConfig[];
    buoyancyModules: BuoyancyModuleConfig[];
    risers: RiserConfig[];
    metadata?: Record<string, unknown>;
}
export interface ModelValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface ModelValidationResult {
    valid: boolean;
    errors: ModelValidationError[];
    warnings: ModelValidationError[];
}
export interface ParseYamlRequest {
    content: string;
}
export interface ParseYamlResponse {
    success: boolean;
    model?: Partial<OrcaFlexModel>;
    errors?: string[];
}
export interface GenerateYamlRequest {
    model: OrcaFlexModel;
    options?: {
        includeComments?: boolean;
        prettyPrint?: boolean;
    };
}
export interface GenerateYamlResponse {
    success: boolean;
    yaml?: string;
    errors?: string[];
}
export type UndoableAction = {
    type: 'UPDATE_ENVIRONMENT';
    previous: EnvironmentConfig;
    current: EnvironmentConfig;
} | {
    type: 'ADD_VESSEL';
    vessel: VesselConfig;
} | {
    type: 'UPDATE_VESSEL';
    previous: VesselConfig;
    current: VesselConfig;
} | {
    type: 'DELETE_VESSEL';
    vessel: VesselConfig;
} | {
    type: 'ADD_LINE_TYPE';
    lineType: LineTypeConfig;
} | {
    type: 'UPDATE_LINE_TYPE';
    previous: LineTypeConfig;
    current: LineTypeConfig;
} | {
    type: 'DELETE_LINE_TYPE';
    lineType: LineTypeConfig;
} | {
    type: 'ADD_RISER';
    riser: RiserConfig;
} | {
    type: 'UPDATE_RISER';
    previous: RiserConfig;
    current: RiserConfig;
} | {
    type: 'DELETE_RISER';
    riser: RiserConfig;
};
export interface ModelHistory {
    undoStack: UndoableAction[];
    redoStack: UndoableAction[];
    maxHistorySize: number;
}
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    details?: string;
}
//# sourceMappingURL=model.types.d.ts.map