import { EventEmitter } from '@angular/core';
interface RiserContentSelection {
    riserId: string;
    riserName: string;
    contents: {
        contentId: string;
        contentName: string;
        selected: boolean;
    }[];
}
interface VesselCondition {
    id: string;
    heading: number;
    offset: number;
}
interface GeneratedModel {
    name: string;
    risers: string[];
    condition: string;
}
export declare class GenerateOrcaflexDialogComponent {
    visible: boolean;
    visibleChange: EventEmitter<boolean>;
    generate: EventEmitter<GeneratedModel[]>;
    private modelState;
    riserSelections: import("@angular/core").WritableSignal<RiserContentSelection[]>;
    vesselConditions: import("@angular/core").WritableSignal<VesselCondition[]>;
    oneRiserPerModel: boolean;
    isGenerating: import("@angular/core").WritableSignal<boolean>;
    generatedModels: import("@angular/core").WritableSignal<GeneratedModel[]>;
    ngOnInit(): void;
    ngOnChanges(): void;
    private initializeSelections;
    selectAllContents(): void;
    deselectAllContents(): void;
    addCondition(): void;
    removeCondition(index: number): void;
    updateModelList(): void;
    private sanitizeName;
    onGenerate(): Promise<void>;
    private generateOrcaFlexYaml;
    private downloadAsZip;
    onCancel(): void;
    private close;
}
export {};
//# sourceMappingURL=generate-orcaflex-dialog.component.d.ts.map