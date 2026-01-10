import { EventEmitter } from '@angular/core';
import { BuoyancyModuleConfig } from '../../types';
interface BuoyancyModuleRow {
    name: string;
    outerDiameter: number;
    length: number;
    dryMass: number;
    apparentMassInWater: number;
    numberOfModules: number;
    spacing: number;
}
export declare class BuoyancyModulesImportDialogComponent {
    visible: boolean;
    visibleChange: EventEmitter<boolean>;
    import: EventEmitter<BuoyancyModuleConfig[]>;
    rows: import("@angular/core").WritableSignal<BuoyancyModuleRow[]>;
    handlePaste(event: ClipboardEvent): void;
    handleKeydown(event: KeyboardEvent): void;
    parseExcelData(text: string): BuoyancyModuleRow[];
    addRow(): void;
    clearRows(): void;
    hasValidData(): boolean;
    getValidRowCount(): number;
    onImport(): void;
    onCancel(): void;
    private close;
}
export {};
//# sourceMappingURL=buoyancy-modules-import-dialog.component.d.ts.map