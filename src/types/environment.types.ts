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

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  sea: {
    waterDepth: 100,
    waterDensity: 1025,
    seabedType: 'elastic',
    seabedFriction: 0.3,
  },
  currentProfiles: [
    { depth: 0, speed: 0.5, direction: 0 },
    { depth: 100, speed: 0.2, direction: 0 },
  ],
  wave: {
    type: 'none',
  },
};
