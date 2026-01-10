/**
 * OrcaFlex Riser Module Entry Point
 *
 * This file is the main entry for Webpack Module Federation.
 * It bootstraps Angular and exports the module class.
 */

// Export the module class
export { OrcaFlexRiserModule, default } from './module';

// Export component for direct usage
export { OrcaFlexRiserComponent } from './components/orcaflex-riser.component';

// Export services
export { ModelStateService } from './services/model-state.service';
export { OrcaFlexApiService } from './services/orcaflex-api.service';

// Export types
export * from './types';
