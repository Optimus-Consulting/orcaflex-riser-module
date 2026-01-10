/**
 * Environment configuration types for OrcaFlex model
 */
export interface SeaConfig {
    waterDepth: number;
    waterDensity: number;
    seabedType?: string;
    seabedFriction?: number;
    seabedStiffness?: number;
}
export interface CurrentProfile {
    depth: number;
    speed: number;
    direction: number;
}
export interface WaveConfig {
    type: 'none' | 'airy' | 'dean-stream' | 'stokes-5' | 'jonswap';
    height?: number;
    period?: number;
    direction?: number;
    spectrum?: string;
    gamma?: number;
}
export interface EnvironmentConfig {
    sea: SeaConfig;
    currentProfiles: CurrentProfile[];
    wave: WaveConfig;
}
export declare const DEFAULT_ENVIRONMENT: EnvironmentConfig;
//# sourceMappingURL=environment.types.d.ts.map