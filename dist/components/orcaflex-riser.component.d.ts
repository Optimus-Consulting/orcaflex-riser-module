import { OnInit, OnDestroy } from '@angular/core';
import { ModelStateService } from '../services/model-state.service';
import { RiserConfig } from '../types';
export declare class OrcaFlexRiserComponent implements OnInit, OnDestroy {
    modelState: ModelStateService;
    private apiService;
    showGenerateDialog: boolean;
    expandedSections: Record<string, boolean>;
    ngOnInit(): void;
    ngOnDestroy(): void;
    toggleSection(section: string): void;
    calculateRiser(riser: RiserConfig): Promise<void>;
}
//# sourceMappingURL=orcaflex-riser.component.d.ts.map