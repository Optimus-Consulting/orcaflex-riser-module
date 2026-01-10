import { EventEmitter } from '@angular/core';
import { ConnectionPoint } from '../../types';
interface ConnectionPointRow {
    name: string;
    x: number;
    y: number;
    z: number;
}
export declare class ConnectionPointsImportDialogComponent {
    visible: boolean;
    visibleChange: EventEmitter<boolean>;
    import: EventEmitter<ConnectionPoint[]>;
    rows: import("@angular/core").WritableSignal<ConnectionPointRow[]>;
    handlePaste(event: ClipboardEvent): void;
    handleKeydown(event: KeyboardEvent): void;
    parseExcelData(text: string): ConnectionPointRow[];
    addRow(): void;
    clearRows(): void;
    hasValidData(): boolean;
    getValidRowCount(): number;
    onImport(): void;
    onCancel(): void;
    private close;
}
export {};
//# sourceMappingURL=connection-points-import-dialog.component.d.ts.map