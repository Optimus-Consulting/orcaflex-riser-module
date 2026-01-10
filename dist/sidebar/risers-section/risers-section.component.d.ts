import { EventEmitter } from '@angular/core';
import { RiserConfig, RiserType, CatenaryConfig, LazyWaveConfig, ConnectionPoint } from '../../types';
export declare class RisersSectionComponent {
    private modelState;
    risers: import("@angular/core").Signal<RiserConfig[]>;
    vessels: import("@angular/core").Signal<import("../..").VesselConfig[]>;
    lineTypes: import("@angular/core").Signal<import("../..").LineTypeConfig[]>;
    buoyancyModules: import("@angular/core").Signal<import("../..").BuoyancyModuleConfig[]>;
    selectedRiserId: import("@angular/core").Signal<string | null>;
    onCalculateRequest: EventEmitter<RiserConfig>;
    selectRiser(id: string): void;
    getConnectionPoints(vesselId: string): ConnectionPoint[];
    getColorHex(color: number | undefined): string;
    addRiser(): void;
    deleteRiser(id: string): void;
    updateRiserName(riser: RiserConfig, name: string): void;
    updateRiserVessel(riser: RiserConfig, vesselId: string): void;
    updateRiserConnectionPoint(riser: RiserConfig, connectionPointId: string): void;
    updateRiserLineType(riser: RiserConfig, lineTypeId: string): void;
    updateRiserBuoyancy(riser: RiserConfig, buoyancyModuleId: string | undefined): void;
    addContent(riser: RiserConfig): void;
    removeContent(riser: RiserConfig, contentId: string): void;
    selectContent(riser: RiserConfig, contentId: string): void;
    updateContentName(riser: RiserConfig, contentId: string, name: string): void;
    updateContentDensity(riser: RiserConfig, contentId: string, density: number): void;
    setRiserType(riser: RiserConfig, type: RiserType): void;
    updateGeometry(riser: RiserConfig, field: string, value: number): void;
    calculateRiser(riser: RiserConfig): void;
    asCatenary(geometry: RiserConfig['geometry']): CatenaryConfig;
    asLazyWave(geometry: RiserConfig['geometry']): LazyWaveConfig;
}
//# sourceMappingURL=risers-section.component.d.ts.map