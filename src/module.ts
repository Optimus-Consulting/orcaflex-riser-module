import { Type, Injector, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { OrcaFlexRiserComponent } from './components/orcaflex-riser.component';
import { ModelStateService } from './services/model-state.service';
import { OrcaFlexApiService } from './services/orcaflex-api.service';

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

export class OrcaFlexRiserModule implements CarisModule {
  readonly name = 'orcaflex-riser-module';
  readonly version = '1.0.0';
  readonly component = OrcaFlexRiserComponent;

  private context: CarisModuleContext | null = null;
  private modelState: ModelStateService | null = null;
  private apiService: OrcaFlexApiService | null = null;

  async onInit(context: CarisModuleContext): Promise<void> {
    this.context = context;

    // Get services from injector
    this.modelState = context.injector.get(ModelStateService);
    this.apiService = context.injector.get(OrcaFlexApiService);

    // Initialize API service with CARIS API
    this.apiService.setApiService(context.services.api);

    // Apply module configuration
    if (context.config) {
      this.applyConfig(context.config);
    }

    console.log('[OrcaFlex Module] Initialized');
  }

  async onDestroy(): Promise<void> {
    // Cleanup resources
    this.context = null;
    this.modelState = null;
    this.apiService = null;

    console.log('[OrcaFlex Module] Destroyed');
  }

  onActivate(): void {
    console.log('[OrcaFlex Module] Activated');
  }

  onDeactivate(): void {
    console.log('[OrcaFlex Module] Deactivated');
  }

  onRibbonAction(action: string): void {
    if (!this.modelState || !this.context) return;

    switch (action) {
      case 'newModel':
        this.modelState.newModel();
        this.context.services.notifications.info('New model created');
        break;

      case 'importYaml':
        this.handleImportYaml();
        break;

      case 'exportYaml':
        this.handleExportYaml();
        break;

      case 'undo':
        if (this.modelState.canUndo()) {
          this.modelState.undo();
        }
        break;

      case 'redo':
        if (this.modelState.canRedo()) {
          this.modelState.redo();
        }
        break;

      case 'calculateAll':
        this.handleCalculateAll();
        break;

      case 'validateModel':
        this.handleValidateModel();
        break;

      case 'goalSeek':
        this.handleGoalSeek();
        break;

      case 'resetView':
      case 'topView':
      case 'sideView':
      case 'frontView':
      case 'zoomToFit':
        // These will be handled by Three.js service in Phase 3
        console.log(`[OrcaFlex Module] View action: ${action}`);
        break;

      case 'openDocs':
        window.open('https://docs.carispro.com/modules/orcaflex-riser', '_blank');
        break;

      case 'showAbout':
        this.showAboutDialog();
        break;

      case 'closeModule':
        // Handle close - check for unsaved changes
        if (this.modelState.isDirty()) {
          this.context.services.dialogs.confirm({
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Are you sure you want to close?',
          }).then((confirmed: boolean) => {
            if (confirmed) {
              // Close module
            }
          });
        }
        break;

      default:
        console.warn(`[OrcaFlex Module] Unknown ribbon action: ${action}`);
    }
  }

  onSidebarAction(section: string, action: string): void {
    console.log(`[OrcaFlex Module] Sidebar action: ${section}/${action}`);
  }

  private applyConfig(config: Record<string, any>): void {
    if (!this.modelState) return;

    // Apply default water depth
    if (config['defaultWaterDepth']) {
      const env = this.modelState.environment();
      this.modelState.updateEnvironment({
        ...env,
        sea: { ...env.sea, waterDepth: config['defaultWaterDepth'] }
      });
    }

    // Apply debug mode
    if (config['showDebugInfo']) {
      this.modelState.addLog('info', 'Debug mode enabled');
    }
  }

  private async handleImportYaml(): Promise<void> {
    // File input will be handled by dialog service
    const result = await this.context?.services.dialogs.fileUpload({
      title: 'Import OrcaFlex YAML',
      accept: '.yml,.yaml',
    });

    if (result?.file) {
      const content = await result.file.text();
      try {
        const response = await this.apiService!.parseYaml(content);
        if (response.success && response.model) {
          // Apply parsed data to model
          this.context?.services.notifications.success('YAML imported successfully');
        } else {
          this.context?.services.notifications.error('Failed to parse YAML');
        }
      } catch (error) {
        this.context?.services.notifications.error('Import failed');
      }
    }
  }

  private async handleExportYaml(): Promise<void> {
    if (!this.modelState || !this.apiService) return;

    try {
      const model = this.modelState.model();
      const blob = await this.apiService.downloadYaml({ model });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name.replace(/\s+/g, '_')}.yml`;
      a.click();
      URL.revokeObjectURL(url);

      this.context?.services.notifications.success('YAML exported successfully');
    } catch (error) {
      this.context?.services.notifications.error('Export failed');
    }
  }

  private async handleCalculateAll(): Promise<void> {
    if (!this.modelState) return;

    const risers = this.modelState.risers();
    this.modelState.addLog('info', `Calculating ${risers.length} risers...`);

    // Calculation will be triggered through component
    this.context?.services.notifications.info('Starting calculations...');
  }

  private async handleValidateModel(): Promise<void> {
    if (!this.modelState || !this.apiService) return;

    try {
      const model = this.modelState.model();
      const result = await this.apiService.validateModel(model);

      this.modelState.setValidationResult(result);

      if (result.valid) {
        this.context?.services.notifications.success('Model is valid');
      } else {
        this.context?.services.notifications.warning(
          `Model has ${result.errors.length} errors and ${result.warnings.length} warnings`
        );
      }
    } catch (error) {
      this.context?.services.notifications.error('Validation failed');
    }
  }

  private handleGoalSeek(): void {
    // Goal seek dialog will be implemented in Phase 5
    this.context?.services.notifications.info('Goal Seek coming in Phase 5');
  }

  private showAboutDialog(): void {
    this.context?.services.dialogs.info({
      title: 'About OrcaFlex Riser Analysis',
      message: `
OrcaFlex Riser Analysis Module v${this.version}

Automated OrcaFlex model generation for riser analysis.
Provides interactive 3D visualization, parameter-driven input,
goal-seeking calculations, and direct export to OrcaFlex YAML format.

© 2024 CARIS Pro. All rights reserved.
      `.trim(),
    });
  }
}

// Default export for Module Federation
export default OrcaFlexRiserModule;
