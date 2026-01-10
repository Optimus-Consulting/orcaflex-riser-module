import { Type, Injector, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { OrcaFlexRiserComponent } from './components/orcaflex-riser.component';
/**
 * CarisModule interface implementation for OrcaFlex Riser Module.
 * This is the entry point that CARIS Pro uses to load and manage the module.
 */
export interface CarisModuleContext {
    injector: Injector;
    environmentInjector: EnvironmentInjector;
    applicationRef: ApplicationRef;
    services: {
        api: any;
        storage: any;
        notifications: any;
        dialogs: any;
    };
    config?: Record<string, any>;
}
export interface CarisModule {
    readonly name: string;
    readonly version: string;
    readonly component: Type<any>;
    onInit(context: CarisModuleContext): Promise<void>;
    onDestroy(): Promise<void>;
    onActivate?(): void;
    onDeactivate?(): void;
    onRibbonAction?(action: string): void;
    onSidebarAction?(section: string, action: string): void;
}
export declare class OrcaFlexRiserModule implements CarisModule {
    readonly name = "orcaflex-riser-module";
    readonly version = "1.0.0";
    readonly component: typeof OrcaFlexRiserComponent;
    private context;
    private modelState;
    private apiService;
    onInit(context: CarisModuleContext): Promise<void>;
    onDestroy(): Promise<void>;
    onActivate(): void;
    onDeactivate(): void;
    onRibbonAction(action: string): void;
    onSidebarAction(section: string, action: string): void;
    private applyConfig;
    private handleImportYaml;
    private handleExportYaml;
    private handleCalculateAll;
    private handleValidateModel;
    private handleGoalSeek;
    private showAboutDialog;
}
export default OrcaFlexRiserModule;
//# sourceMappingURL=module.d.ts.map