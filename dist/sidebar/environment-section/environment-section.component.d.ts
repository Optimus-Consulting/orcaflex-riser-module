import { CurrentProfile, WaveConfig } from '../../types';
export declare class EnvironmentSectionComponent {
    private modelState;
    environment: import("@angular/core").Signal<import("../..").EnvironmentConfig>;
    expandedSubsections: Record<string, boolean>;
    editingCurrentIdx: import("@angular/core").WritableSignal<number | null>;
    editingDepth: number;
    editingSpeed: number;
    addingCurrent: import("@angular/core").WritableSignal<boolean>;
    newCurrentDepth: number;
    newCurrentSpeed: number;
    toggleSubsection(section: string): void;
    updateWaterDepth(value: number): void;
    updateWaterDensity(value: number): void;
    updateSeabedFriction(value: number): void;
    updateSeabedStiffness(value: number): void;
    updateSeabedType(value: string): void;
    updateWaveType(value: WaveConfig['type']): void;
    updateWaveHeight(value: number): void;
    updateWavePeriod(value: number): void;
    updateWaveDirection(value: number): void;
    updateWaveSpectrum(value: string): void;
    updateWaveGamma(value: number): void;
    startEditCurrent(idx: number, profile: CurrentProfile): void;
    saveCurrentEdit(idx: number): void;
    cancelCurrentEdit(): void;
    deleteCurrentProfile(idx: number): void;
    startAddCurrent(): void;
    addCurrentProfile(): void;
    cancelAddCurrent(): void;
}
//# sourceMappingURL=environment-section.component.d.ts.map