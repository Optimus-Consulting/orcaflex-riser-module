import { VesselConfig, ConnectionPoint } from '../../types';
export declare class VesselSectionComponent {
    private modelState;
    private apiService;
    vessels: import("@angular/core").Signal<VesselConfig[]>;
    selectedVesselId: import("@angular/core").Signal<string | null>;
    importing: import("@angular/core").WritableSignal<boolean>;
    editingCpIdx: import("@angular/core").WritableSignal<number | null>;
    editingCp: ConnectionPoint;
    showImportDialog: boolean;
    importTargetVesselId: string | null;
    selectVessel(id: string): void;
    addVessel(): void;
    deleteVessel(id: string): void;
    onFileSelected(event: Event): Promise<void>;
    updateVesselName(vessel: VesselConfig, name: string): void;
    updateVesselDimension(vessel: VesselConfig, dim: 'length' | 'breadth' | 'depth' | 'draft', value: number): void;
    updateVesselPosition(vessel: VesselConfig, axis: 'x' | 'y' | 'z', value: number): void;
    updateVesselOrientation(vessel: VesselConfig, param: 'heading' | 'roll' | 'pitch', value: number): void;
    addConnectionPoint(vessel: VesselConfig): void;
    startCpEdit(idx: number, cp: ConnectionPoint): void;
    saveCpEdit(vessel: VesselConfig, idx: number): void;
    cancelCpEdit(): void;
    deleteCp(vessel: VesselConfig, idx: number): void;
    openImportDialog(vessel: VesselConfig): void;
    handleConnectionPointsImport(connectionPoints: ConnectionPoint[]): void;
}
//# sourceMappingURL=vessel-section.component.d.ts.map