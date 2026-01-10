import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelStateService } from '../../services/model-state.service';
import { CurrentProfile, WaveConfig } from '../../types';

@Component({
  selector: 'orcaflex-environment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-content">
      <!-- Sea Configuration -->
      <div class="subsection-header" (click)="toggleSubsection('sea')">
        <span>Sea</span>
        <span class="toggle">{{ expandedSubsections.sea ? '−' : '+' }}</span>
      </div>
      @if (expandedSubsections.sea) {
        <div class="subsection-content">
          <div class="form-group">
            <label>Water Depth (m)</label>
            <input
              type="number"
              [ngModel]="environment().sea.waterDepth"
              (ngModelChange)="updateWaterDepth($event)"
              min="10"
              max="3000"
              step="1"
            />
          </div>

          <div class="form-group">
            <label>Water Density (kg/m³)</label>
            <input
              type="number"
              [ngModel]="environment().sea.waterDensity"
              (ngModelChange)="updateWaterDensity($event)"
              min="1000"
              max="1100"
              step="1"
            />
          </div>

          <div class="form-group">
            <label>Seabed Friction</label>
            <input
              type="number"
              [ngModel]="environment().sea.seabedFriction"
              (ngModelChange)="updateSeabedFriction($event)"
              min="0"
              max="1"
              step="0.05"
            />
          </div>

          <div class="form-group">
            <label>Seabed Stiffness (N/m/m²)</label>
            <input
              type="number"
              [ngModel]="environment().sea.seabedStiffness"
              (ngModelChange)="updateSeabedStiffness($event)"
              min="0"
              step="100"
            />
          </div>
        </div>
      }

      <!-- Wave Configuration -->
      <div class="subsection-header" (click)="toggleSubsection('wave')">
        <span>Wave</span>
        <span class="toggle">{{ expandedSubsections.wave ? '−' : '+' }}</span>
      </div>
      @if (expandedSubsections.wave) {
        <div class="subsection-content">
          <div class="form-group">
            <label>Wave Type</label>
            <select
              [ngModel]="environment().wave.type"
              (ngModelChange)="updateWaveType($event)"
            >
              <option value="none">None</option>
              <option value="airy">Airy</option>
              <option value="dean-stream">Dean Stream</option>
              <option value="stokes-5">Stokes 5th Order</option>
              <option value="jonswap">JONSWAP Spectrum</option>
            </select>
          </div>

          @if (environment().wave.type !== 'none') {
            <div class="form-row">
              <div class="form-group half">
                <label>Hs (m)</label>
                <input
                  type="number"
                  [ngModel]="environment().wave.height"
                  (ngModelChange)="updateWaveHeight($event)"
                  min="0"
                  max="30"
                  step="0.5"
                />
              </div>
              <div class="form-group half">
                <label>Tp (s)</label>
                <input
                  type="number"
                  [ngModel]="environment().wave.period"
                  (ngModelChange)="updateWavePeriod($event)"
                  min="1"
                  max="30"
                  step="0.5"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Direction (°)</label>
              <input
                type="number"
                [ngModel]="environment().wave.direction"
                (ngModelChange)="updateWaveDirection($event)"
                min="0"
                max="360"
                step="5"
              />
            </div>

            @if (environment().wave.type === 'jonswap') {
              <div class="form-group">
                <label>Gamma</label>
                <input
                  type="number"
                  [ngModel]="environment().wave.gamma"
                  (ngModelChange)="updateWaveGamma($event)"
                  min="1"
                  max="7"
                  step="0.1"
                />
              </div>
            }
          }
        </div>
      }

      <!-- Current Profile -->
      <div class="subsection-header" (click)="toggleSubsection('current')">
        <span>Current Profile</span>
        <span class="toggle">{{ expandedSubsections.current ? '−' : '+' }}</span>
      </div>
      @if (expandedSubsections.current) {
        <div class="subsection-content">
          <div class="current-list">
            @for (profile of environment().currentProfiles; track $index; let idx = $index) {
              <div class="current-row" [class.editing]="editingCurrentIdx() === idx">
                @if (editingCurrentIdx() === idx) {
                  <input
                    type="number"
                    class="current-input depth"
                    [(ngModel)]="editingDepth"
                    placeholder="Depth"
                    min="0"
                  />
                  <input
                    type="number"
                    class="current-input speed"
                    [(ngModel)]="editingSpeed"
                    placeholder="Speed"
                    min="0"
                    step="0.1"
                  />
                  <button class="icon-btn save" (click)="saveCurrentEdit(idx)">✓</button>
                  <button class="icon-btn cancel" (click)="cancelCurrentEdit()">✕</button>
                } @else {
                  <span class="depth-val">{{ profile.depth }}m</span>
                  <span class="speed-val">{{ profile.speed }} m/s</span>
                  <button class="icon-btn edit" (click)="startEditCurrent(idx, profile)">✎</button>
                  <button class="icon-btn delete" (click)="deleteCurrentProfile(idx)">×</button>
                }
              </div>
            }
          </div>

          @if (addingCurrent()) {
            <div class="current-row add-row">
              <input
                type="number"
                class="current-input depth"
                [(ngModel)]="newCurrentDepth"
                placeholder="Depth (m)"
                min="0"
              />
              <input
                type="number"
                class="current-input speed"
                [(ngModel)]="newCurrentSpeed"
                placeholder="Speed (m/s)"
                min="0"
                step="0.1"
              />
              <button class="icon-btn save" (click)="addCurrentProfile()">✓</button>
              <button class="icon-btn cancel" (click)="cancelAddCurrent()">✕</button>
            </div>
          } @else {
            <button class="add-current-btn" (click)="startAddCurrent()">
              + Add Point
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .section-content {
      padding: 0;
    }

    .subsection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--caris-bg-subtle, #f5f5f5);
      border-bottom: 1px solid var(--caris-border-light, #eee);
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--caris-text-secondary, #666);
    }

    .subsection-header:hover {
      background: var(--caris-bg-hover, #ebebeb);
    }

    .toggle {
      font-weight: bold;
    }

    .subsection-content {
      padding: 12px;
    }

    .form-group {
      margin-bottom: 12px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 11px;
      color: var(--caris-text-secondary, #666);
      margin-bottom: 4px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--caris-border-light, #ddd);
      border-radius: 4px;
      font-size: 12px;
      background: white;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--caris-primary, #1976d2);
    }

    .form-row {
      display: flex;
      gap: 8px;
    }

    .form-group.half {
      flex: 1;
    }

    .current-list {
      margin-bottom: 8px;
    }

    .current-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 12px;
    }

    .current-row.editing,
    .current-row.add-row {
      padding: 6px 0;
    }

    .depth-val {
      width: 60px;
      color: var(--caris-text-secondary, #666);
    }

    .speed-val {
      flex: 1;
    }

    .current-input {
      padding: 4px 6px;
      border: 1px solid var(--caris-border-light, #ddd);
      border-radius: 3px;
      font-size: 11px;
    }

    .current-input.depth {
      width: 60px;
    }

    .current-input.speed {
      width: 70px;
    }

    .icon-btn {
      width: 22px;
      height: 22px;
      padding: 0;
      border: none;
      border-radius: 3px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }

    .icon-btn:hover {
      background: var(--caris-bg-hover, #f0f0f0);
    }

    .icon-btn.edit {
      color: var(--caris-primary, #1976d2);
    }

    .icon-btn.delete {
      color: var(--caris-error, #f44336);
    }

    .icon-btn.save {
      color: var(--caris-success, #4caf50);
    }

    .icon-btn.cancel {
      color: var(--caris-text-secondary, #666);
    }

    .add-current-btn {
      width: 100%;
      padding: 6px 12px;
      border: 1px dashed var(--caris-border-light, #ddd);
      border-radius: 4px;
      background: transparent;
      color: var(--caris-text-secondary, #666);
      font-size: 11px;
      cursor: pointer;
    }

    .add-current-btn:hover {
      border-color: var(--caris-primary, #1976d2);
      color: var(--caris-primary, #1976d2);
    }
  `]
})
export class EnvironmentSectionComponent {
  private modelState = inject(ModelStateService);

  environment = this.modelState.environment;

  expandedSubsections: Record<string, boolean> = {
    sea: true,
    wave: false,
    current: false,
  };

  // Current profile editing state
  editingCurrentIdx = signal<number | null>(null);
  editingDepth = 0;
  editingSpeed = 0;

  addingCurrent = signal<boolean>(false);
  newCurrentDepth = 0;
  newCurrentSpeed = 0;

  toggleSubsection(section: string): void {
    this.expandedSubsections[section] = !this.expandedSubsections[section];
  }

  // Sea updates
  updateWaterDepth(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      sea: { ...env.sea, waterDepth: value }
    });
  }

  updateWaterDensity(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      sea: { ...env.sea, waterDensity: value }
    });
  }

  updateSeabedFriction(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      sea: { ...env.sea, seabedFriction: value }
    });
  }

  updateSeabedStiffness(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      sea: { ...env.sea, seabedStiffness: value }
    });
  }

  updateSeabedType(value: string): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      sea: { ...env.sea, seabedType: value }
    });
  }

  // Wave updates
  updateWaveType(value: WaveConfig['type']): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, type: value }
    });
  }

  updateWaveHeight(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, height: value }
    });
  }

  updateWavePeriod(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, period: value }
    });
  }

  updateWaveDirection(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, direction: value }
    });
  }

  updateWaveSpectrum(value: string): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, spectrum: value }
    });
  }

  updateWaveGamma(value: number): void {
    const env = this.environment();
    this.modelState.updateEnvironment({
      ...env,
      wave: { ...env.wave, gamma: value }
    });
  }

  // Current profile management
  startEditCurrent(idx: number, profile: CurrentProfile): void {
    this.editingCurrentIdx.set(idx);
    this.editingDepth = profile.depth;
    this.editingSpeed = profile.speed;
  }

  saveCurrentEdit(idx: number): void {
    const env = this.environment();
    const profiles = [...env.currentProfiles];
    profiles[idx] = { depth: this.editingDepth, speed: this.editingSpeed, direction: profiles[idx]?.direction ?? 0 };
    profiles.sort((a, b) => a.depth - b.depth);

    this.modelState.updateEnvironment({
      ...env,
      currentProfiles: profiles
    });
    this.editingCurrentIdx.set(null);
  }

  cancelCurrentEdit(): void {
    this.editingCurrentIdx.set(null);
  }

  deleteCurrentProfile(idx: number): void {
    const env = this.environment();
    const profiles = env.currentProfiles.filter((_, i) => i !== idx);
    this.modelState.updateEnvironment({
      ...env,
      currentProfiles: profiles
    });
  }

  startAddCurrent(): void {
    this.addingCurrent.set(true);
    this.newCurrentDepth = 0;
    this.newCurrentSpeed = 0;
  }

  addCurrentProfile(): void {
    const env = this.environment();
    const profiles = [...env.currentProfiles, { depth: this.newCurrentDepth, speed: this.newCurrentSpeed, direction: 0 }];
    profiles.sort((a, b) => a.depth - b.depth);

    this.modelState.updateEnvironment({
      ...env,
      currentProfiles: profiles
    });
    this.addingCurrent.set(false);
  }

  cancelAddCurrent(): void {
    this.addingCurrent.set(false);
  }
}
