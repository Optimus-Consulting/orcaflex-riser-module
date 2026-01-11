/**
 * Bootstrap file for Angular Elements
 * This creates a standalone Angular environment and registers the component as a Web Component
 */
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { ApplicationRef } from '@angular/core';
import { OrcaFlexRiserComponent } from './components/orcaflex-riser.component';

// Track if we've already bootstrapped
let bootstrapped = false;
let appRef: ApplicationRef | null = null;

/**
 * Bootstrap Angular and register the custom element
 */
export async function bootstrapModule(): Promise<void> {
  if (bootstrapped) {
    console.log('[OrcaFlex Module] Already bootstrapped');
    return;
  }

  console.log('[OrcaFlex Module] Bootstrapping Angular application...');

  try {
    // Create a minimal Angular application
    appRef = await createApplication({
      providers: [
        // Add any global providers here if needed
      ]
    });

    // Create the custom element
    const OrcaFlexElement = createCustomElement(OrcaFlexRiserComponent, {
      injector: appRef.injector
    });

    // Register the custom element if not already registered
    if (!customElements.get('orcaflex-riser-module')) {
      customElements.define('orcaflex-riser-module', OrcaFlexElement);
      console.log('[OrcaFlex Module] Custom element registered: orcaflex-riser-module');
    }

    bootstrapped = true;
    console.log('[OrcaFlex Module] Bootstrap complete');
  } catch (error) {
    console.error('[OrcaFlex Module] Bootstrap failed:', error);
    throw error;
  }
}

/**
 * Destroy the Angular application
 */
export function destroyModule(): void {
  if (appRef) {
    appRef.destroy();
    appRef = null;
    bootstrapped = false;
    console.log('[OrcaFlex Module] Destroyed');
  }
}

// Export the custom element tag name for the host to use
export const CUSTOM_ELEMENT_TAG = 'orcaflex-riser-module';
