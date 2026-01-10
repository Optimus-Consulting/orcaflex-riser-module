import { EventEmitter } from '@angular/core';
import { LineTypeConfig } from '../../types';
interface LineTypeRow {
    name: string;
    outerDiameter: number;
    innerDiameter: number;
    dryMass: number;
    bendingStiffness: number;
    axialStiffness: number;
    torsionalStiffness: number;
    allowableTension: number;
    minBendRadius: number;
}
export declare class LineTypesImportDialogComponent {
    visible: boolean;
    visibleChange: EventEmitter<boolean>;
    import: EventEmitter<LineTypeConfig[]>;
    private getDefaultRow;
    rows: import("@angular/core").WritableSignal<LineTypeRow[]>;
    handlePaste(event: ClipboardEvent): void;
    handleKeydown(event: KeyboardEvent): void;
    parseExcelData(text: string): LineTypeRow[];
    addRow(): void;
    clearRows(): void;
    hasValidData(): boolean;
    getValidRowCount(): number;
    onImport(): void;
    onCancel(): void;
    private close;
}
export {};
//# sourceMappingURL=line-types-import-dialog.component.d.ts.map