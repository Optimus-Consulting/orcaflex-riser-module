// Import compiler first for JIT compilation support
import '@angular/compiler';
import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { OrcaFlexRiserComponent } from '../src/components';

bootstrapApplication(OrcaFlexRiserComponent, {
  providers: [
    provideHttpClient(),
  ],
}).then(() => {
  console.log('OrcaFlex Riser Module bootstrapped successfully');
}).catch(err => console.error('Bootstrap error:', err));
