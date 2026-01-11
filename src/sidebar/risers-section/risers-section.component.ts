import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelStateService } from '../../services/model-state.service';
import {
  RiserConfig,
  RiserType,
  CatenaryConfig,
  LazyWaveConfig,
  ConnectionPoint,
  ContentConfig,
  DEFAULT_CONTENTS,
} from '../../types';

// Predefined colors for contents
const CONTENT_COLORS = [
  0x4a90d9, // Blue (empty/air)
  0x2e7d32, // Green (seawater)
  0x8b4513, // Brown (oil)
  0xf57c00, // Orange
  0x9c27b0, // Purple
  0x00bcd4, // Cyan
];

@Component({
  selector: 'orcaflex-risers-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-content">
      <div class="toolbar">
        <button class="add-btn" (click)="addRiser()">
          <span class="icon">+</span> Add Riser
        </button>
      </div>

      @for (riser of risers(); track riser.id) {
        <div
          class="riser-item"
          [class.selected]="selectedRiserId() === riser.id"
        >
          <div class="riser-header" (click)="selectRiser(riser.id)">
            <span class="riser-name">{{ riser.name }}</span>
            <div class="header-right">
              <span class="riser-type" [class.catenary]="riser.geometry.type === 'catenary'"
                [class.lazy-wave]="riser.geometry.type === 'lazy-wave'">
                {{ riser.geometry.type }}
              </span>
              <button class="delete-btn" (click)="deleteRiser(riser.id); $event.stopPropagation()">×</button>
            </div>
          </div>

          <div class="riser-info">
            <span class="info-item">
              {{ riser.geometry.departureAngle }}° | {{ riser.geometry.azimuth }}°
            </span>
            @if (riser.calculationResults) {
              <span class="info-item calculated">
                {{ riser.calculationResults.totalLength | number:'1.0-0' }}m
              </span>
            } @else {
              <span class="info-item pending">Not calculated</span>
            }
          </div>

          @if (selectedRiserId() === riser.id) {
            <div class="riser-editor" (click)="$event.stopPropagation()">
              <!-- Basic Info -->
              <div class="form-group">
                <label>Name</label>
                <input type="text" [ngModel]="riser.name"
                  (ngModelChange)="updateRiserName(riser, $event)" />
              </div>

              <!-- Connection -->
              <div class="subsection-title">Connection</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Vessel</label>
                  <select [ngModel]="riser.vesselId"
                    (ngModelChange)="updateRiserVessel(riser, $event)">
                    @for (vessel of vessels(); track vessel.id) {
                      <option [value]="vessel.id">{{ vessel.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group half">
                  <label>Connection Point</label>
                  <select [ngModel]="riser.connectionPointId"
                    (ngModelChange)="updateRiserConnectionPoint(riser, $event)">
                    @for (cp of getConnectionPoints(riser.vesselId); track cp.id) {
                      <option [value]="cp.id">{{ cp.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Line Type -->
              <div class="form-group">
                <label>Line Type</label>
                <select [ngModel]="riser.lineTypeId"
                  (ngModelChange)="updateRiserLineType(riser, $event)">
                  @for (lt of lineTypes(); track lt.id) {
                    <option [value]="lt.id">{{ lt.name }}</option>
                  }
                </select>
              </div>

              <!-- Contents Section -->
              <div class="subsection-title">Contents</div>
              <div class="contents-list">
                @for (content of riser.contents; track content.id; let i = $index) {
                  <div class="content-item" [class.active]="riser.activeContentId === content.id">
                    <div class="content-color" [style.background-color]="getColorHex(content.color)"></div>
                    <div class="content-info">
                      <input type="text" class="content-name" [ngModel]="content.name"
                        (ngModelChange)="updateContentName(riser, content.id, $event)" />
                      <div class="content-density">
                        <input type="number" [ngModel]="content.density"
                          (ngModelChange)="updateContentDensity(riser, content.id, $event)"
                          step="1" min="0" />
                        <span class="unit">kg/m³</span>
                      </div>
                    </div>
                    <div class="content-actions">
                      <button class="select-btn"
                        [class.selected]="riser.activeContentId === content.id"
                        (click)="selectContent(riser, content.id)"
                        title="Use for calculation">
                        {{ riser.activeContentId === content.id ? '✓' : '○' }}
                      </button>
                      <button class="remove-btn"
                        (click)="removeContent(riser, content.id)"
                        [disabled]="riser.contents.length <= 1"
                        title="Remove content">×</button>
                    </div>
                  </div>
                }
                <button class="add-content-btn" (click)="addContent(riser)">
                  + Add Content
                </button>
              </div>

              <!-- Riser Type -->
              <div class="subsection-title">Geometry</div>
              <div class="type-selector">
                <button
                  class="type-btn"
                  [class.active]="riser.geometry.type === 'catenary'"
                  (click)="setRiserType(riser, 'catenary'); $event.stopPropagation()"
                >
                  Catenary
                </button>
                <button
                  class="type-btn"
                  [class.active]="riser.geometry.type === 'lazy-wave'"
                  (click)="setRiserType(riser, 'lazy-wave'); $event.stopPropagation()"
                >
                  Lazy Wave
                </button>
              </div>

              <!-- Common Geometry -->
              <div class="form-row">
                <div class="form-group half">
                  <label>Azimuth (°)</label>
                  <input type="number" [ngModel]="riser.geometry.azimuth"
                    (ngModelChange)="updateGeometry(riser, 'azimuth', $event)"
                    min="0" max="360" step="5" />
                </div>
                <div class="form-group half">
                  <label>Departure Angle (°)</label>
                  <input type="number" [ngModel]="riser.geometry.departureAngle"
                    (ngModelChange)="updateGeometry(riser, 'departureAngle', $event)"
                    min="0" max="90" step="1" />
                </div>
              </div>

              <!-- Catenary-specific -->
              @if (riser.geometry.type === 'catenary') {
                <div class="form-group">
                  <label>Layback (m) - optional</label>
                  <input type="number" [ngModel]="asCatenary(riser.geometry).layback"
                    (ngModelChange)="updateGeometry(riser, 'layback', $event)"
                    min="0" step="10" />
                </div>
              }

              <!-- Lazy Wave-specific -->
              @if (riser.geometry.type === 'lazy-wave') {
                <div class="form-row">
                  <div class="form-group half">
                    <label>Sag Bend (m)</label>
                    <input type="number" [ngModel]="asLazyWave(riser.geometry).sagBend"
                      (ngModelChange)="updateGeometry(riser, 'sagBend', $event)"
                      min="0" step="1" />
                  </div>
                  <div class="form-group half">
                    <label>Hog Bend (m)</label>
                    <input type="number" [ngModel]="asLazyWave(riser.geometry).hogBend"
                      (ngModelChange)="updateGeometry(riser, 'hogBend', $event)"
                      min="0" step="1" />
                  </div>
                </div>

                <div class="form-group">
                  <label>Buoyancy Module</label>
                  <select [ngModel]="riser.buoyancyModuleId"
                    (ngModelChange)="updateRiserBuoyancy(riser, $event)">
                    <option [value]="undefined">None</option>
                    @for (bm of buoyancyModules(); track bm.id) {
                      <option [value]="bm.id">{{ bm.name }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Results Summary -->
              @if (riser.calculationResults) {
                <div class="results-summary">
                  <div class="result-row">
                    <span class="label">Total Length:</span>
                    <span class="value">{{ riser.calculationResults.totalLength | number:'1.1-1' }} m</span>
                  </div>
                  <div class="result-row">
                    <span class="label">TDP Position:</span>
                    <span class="value">
                      ({{ riser.calculationResults.tdpPosition.x | number:'1.0-0' }},
                       {{ riser.calculationResults.tdpPosition.y | number:'1.0-0' }})
                    </span>
                  </div>
                  <div class="result-row">
                    <span class="label">Max Tension:</span>
                    <span class="value">{{ riser.calculationResults.maxTension | number:'1.0-0' }} N</span>
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="riser-actions">
                <button class="action-btn primary" (click)="calculateRiser(riser); $event.stopPropagation()">
                  Calculate
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (risers().length === 0) {
        <div class="empty-state">
          <p>No risers defined</p>
          <p class="hint">Click "Add Riser" to create one</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .section-content {
      padding: 8px;
    }

    .toolbar {
      margin-bottom: 12px;
    }

    .add-btn {
      width: 100%;
      padding: 8px 12px;
      background: var(--oc-primary, #1976d2);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .add-btn:hover {
      background: var(--oc-primary-dark, #1565c0);
    }

    .icon {
      font-weight: bold;
    }

    .riser-item {
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      margin-bottom: 8px;
      transition: all 0.2s;
      overflow: hidden;
    }

    .riser-item:hover {
      border-color: var(--oc-primary, #1976d2);
    }

    .riser-item.selected {
      border-color: var(--oc-primary, #1976d2);
      background: var(--oc-bg-selected, #e3f2fd);
    }

    .riser-header {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .riser-header:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .riser-name {
      font-weight: 500;
      font-size: 12px;
    }

    .riser-type {
      font-size: 9px;
      padding: 2px 6px;
      background: var(--oc-bg-subtle, #f0f0f0);
      border-radius: 10px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .riser-type.catenary {
      background: #e3f2fd;
      color: #1976d2;
    }

    .riser-type.lazy-wave {
      background: #fff3e0;
      color: #f57c00;
    }

    .delete-btn {
      width: 18px;
      height: 18px;
      border: none;
      background: transparent;
      color: var(--oc-text-tertiary, #bbb);
      font-size: 16px;
      cursor: pointer;
      border-radius: 3px;
    }

    .delete-btn:hover {
      background: #ffebee;
      color: var(--oc-error, #f44336);
    }

    .riser-info {
      padding: 4px 12px 8px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--oc-text-secondary, #666);
    }

    .info-item.calculated {
      color: var(--oc-success, #4caf50);
      font-weight: 500;
    }

    .info-item.pending {
      color: var(--oc-text-tertiary, #999);
      font-style: italic;
    }

    .riser-editor {
      padding: 12px;
      border-top: 1px solid var(--oc-border-light, #eee);
      background: var(--oc-bg-subtle, #fafafa);
    }

    .form-group {
      margin-bottom: 10px;
    }

    .form-group label {
      display: block;
      font-size: 10px;
      color: var(--oc-text-secondary, #666);
      margin-bottom: 2px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 5px 6px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      font-size: 11px;
      background: white;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--oc-primary, #1976d2);
    }

    .form-row {
      display: flex;
      gap: 8px;
    }

    .form-group.half {
      flex: 1;
    }

    .subsection-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--oc-text-secondary, #666);
      margin: 12px 0 8px 0;
      padding-top: 8px;
      border-top: 1px solid var(--oc-border-light, #eee);
    }

    /* Contents section styles */
    .contents-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .content-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: white;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
    }

    .content-item.active {
      border-color: var(--oc-primary, #1976d2);
      background: #e3f2fd;
    }

    .content-color {
      width: 12px;
      height: 24px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .content-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .content-name {
      border: none !important;
      background: transparent !important;
      padding: 2px 4px !important;
      font-size: 11px !important;
      font-weight: 500;
    }

    .content-name:focus {
      background: white !important;
      border: 1px solid var(--oc-primary, #1976d2) !important;
    }

    .content-density {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .content-density input {
      width: 60px !important;
      padding: 2px 4px !important;
      font-size: 10px !important;
      text-align: right;
    }

    .content-density .unit {
      font-size: 9px;
      color: var(--oc-text-tertiary, #999);
    }

    .content-actions {
      display: flex;
      gap: 4px;
    }

    .select-btn {
      width: 20px;
      height: 20px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 50%;
      background: white;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .select-btn.selected {
      background: var(--oc-primary, #1976d2);
      color: white;
      border-color: var(--oc-primary, #1976d2);
    }

    .remove-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--oc-text-tertiary, #bbb);
      font-size: 14px;
      cursor: pointer;
      border-radius: 3px;
    }

    .remove-btn:hover:not(:disabled) {
      background: #ffebee;
      color: var(--oc-error, #f44336);
    }

    .remove-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .add-content-btn {
      padding: 6px;
      border: 1px dashed var(--oc-border-light, #ccc);
      border-radius: 4px;
      background: transparent;
      font-size: 10px;
      color: var(--oc-text-secondary, #666);
      cursor: pointer;
    }

    .add-content-btn:hover {
      border-color: var(--oc-primary, #1976d2);
      color: var(--oc-primary, #1976d2);
    }

    .type-selector {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }

    .type-btn {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      background: white;
      font-size: 11px;
      cursor: pointer;
    }

    .type-btn:hover {
      background: var(--oc-bg-hover, #f0f0f0);
    }

    .type-btn.active {
      background: var(--oc-primary, #1976d2);
      color: white;
      border-color: var(--oc-primary, #1976d2);
    }

    .results-summary {
      margin-top: 12px;
      padding: 10px;
      background: white;
      border: 1px solid var(--oc-border-light, #eee);
      border-radius: 4px;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 3px 0;
    }

    .result-row .label {
      color: var(--oc-text-secondary, #666);
    }

    .result-row .value {
      font-weight: 500;
      font-family: monospace;
    }

    .riser-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
    }

    .action-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      background: white;
      font-size: 11px;
      cursor: pointer;
    }

    .action-btn:hover {
      background: var(--oc-bg-subtle, #f5f5f5);
    }

    .action-btn.primary {
      background: var(--oc-primary, #1976d2);
      color: white;
      border-color: var(--oc-primary, #1976d2);
    }

    .action-btn.primary:hover {
      background: var(--oc-primary-dark, #1565c0);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--oc-text-secondary, #999);
    }

    .empty-state p {
      margin: 0 0 4px 0;
      font-size: 12px;
    }

    .empty-state .hint {
      font-size: 11px;
      color: var(--oc-text-tertiary, #bbb);
    }
  `]
})
export class RisersSectionComponent {
  private modelState = inject(ModelStateService);

  risers = this.modelState.risers;
  vessels = this.modelState.vessels;
  lineTypes = this.modelState.lineTypes;
  buoyancyModules = this.modelState.buoyancyModules;
  selectedRiserId = this.modelState.selectedRiserId;

  @Output() onCalculateRequest = new EventEmitter<RiserConfig>();

  selectRiser(id: string): void {
    this.modelState.selectRiser(
      this.selectedRiserId() === id ? null : id
    );
  }

  getConnectionPoints(vesselId: string): ConnectionPoint[] {
    const vessel = this.vessels().find(v => v.id === vesselId);
    return vessel?.connectionPoints ?? [];
  }

  getColorHex(color: number | undefined): string {
    const c = color ?? 0x4a90d9;
    return '#' + c.toString(16).padStart(6, '0');
  }

  addRiser(): void {
    const count = this.risers().length + 1;
    const vessel = this.vessels()[0];
    const newRiser: RiserConfig = {
      id: crypto.randomUUID(),
      name: `Riser ${count}`,
      lineTypeId: this.lineTypes()[0]?.id ?? '',
      vesselId: vessel?.id ?? '',
      connectionPointId: vessel?.connectionPoints[0]?.id ?? '',
      geometry: {
        type: 'catenary',
        hangoffPoint: { x: 50, y: 0, z: -10 },
        azimuth: 180,
        departureAngle: 80,
      },
      contents: [...DEFAULT_CONTENTS],
      activeContentId: 'empty',
    };
    this.modelState.addRiser(newRiser);
    this.modelState.selectRiser(newRiser.id);
  }

  deleteRiser(id: string): void {
    this.modelState.deleteRiser(id);
  }

  updateRiserName(riser: RiserConfig, name: string): void {
    this.modelState.updateRiser({ ...riser, name });
  }

  updateRiserVessel(riser: RiserConfig, vesselId: string): void {
    const vessel = this.vessels().find(v => v.id === vesselId);
    const connectionPointId = vessel?.connectionPoints[0]?.id ?? '';
    this.modelState.updateRiser({ ...riser, vesselId, connectionPointId });
  }

  updateRiserConnectionPoint(riser: RiserConfig, connectionPointId: string): void {
    this.modelState.updateRiser({ ...riser, connectionPointId });
  }

  updateRiserLineType(riser: RiserConfig, lineTypeId: string): void {
    this.modelState.updateRiser({ ...riser, lineTypeId });
  }

  updateRiserBuoyancy(riser: RiserConfig, buoyancyModuleId: string | undefined): void {
    this.modelState.updateRiser({ ...riser, buoyancyModuleId });
  }

  // Content management
  addContent(riser: RiserConfig): void {
    const colorIndex = riser.contents.length % CONTENT_COLORS.length;
    const newContent: ContentConfig = {
      id: crypto.randomUUID(),
      name: `Content ${riser.contents.length + 1}`,
      density: 0,
      color: CONTENT_COLORS[colorIndex],
    };
    this.modelState.updateRiser({
      ...riser,
      contents: [...riser.contents, newContent],
    });
  }

  removeContent(riser: RiserConfig, contentId: string): void {
    if (riser.contents.length <= 1) return;
    const newContents = riser.contents.filter(c => c.id !== contentId);
    const activeContentId = riser.activeContentId === contentId
      ? newContents[0]?.id
      : riser.activeContentId;
    this.modelState.updateRiser({
      ...riser,
      contents: newContents,
      activeContentId,
    });
  }

  selectContent(riser: RiserConfig, contentId: string): void {
    this.modelState.updateRiser({
      ...riser,
      activeContentId: contentId,
    });
  }

  updateContentName(riser: RiserConfig, contentId: string, name: string): void {
    const contents = riser.contents.map(c =>
      c.id === contentId ? { ...c, name } : c
    );
    this.modelState.updateRiser({ ...riser, contents });
  }

  updateContentDensity(riser: RiserConfig, contentId: string, density: number): void {
    const contents = riser.contents.map(c =>
      c.id === contentId ? { ...c, density } : c
    );
    this.modelState.updateRiser({ ...riser, contents });
  }

  setRiserType(riser: RiserConfig, type: RiserType): void {
    if (type === riser.geometry.type) return;

    let geometry: RiserConfig['geometry'];
    if (type === 'catenary') {
      geometry = {
        type: 'catenary',
        hangoffPoint: riser.geometry.hangoffPoint,
        azimuth: riser.geometry.azimuth,
        departureAngle: riser.geometry.departureAngle,
      };
    } else {
      geometry = {
        type: 'lazy-wave',
        hangoffPoint: riser.geometry.hangoffPoint,
        azimuth: riser.geometry.azimuth,
        departureAngle: riser.geometry.departureAngle,
        sagBend: 30,
        hogBend: 50,
      };
    }

    this.modelState.updateRiser({
      ...riser,
      geometry,
      calculationResults: undefined,
    });
  }

  updateGeometry(riser: RiserConfig, field: string, value: number): void {
    this.modelState.updateRiser({
      ...riser,
      geometry: { ...riser.geometry, [field]: value } as any,
      calculationResults: undefined,
    });
  }

  calculateRiser(riser: RiserConfig): void {
    console.log('RiserSection: calculateRiser clicked, emitting', riser.name);
    this.onCalculateRequest.emit(riser);
  }

  // Type guards for template
  asCatenary(geometry: RiserConfig['geometry']): CatenaryConfig {
    return geometry as CatenaryConfig;
  }

  asLazyWave(geometry: RiserConfig['geometry']): LazyWaveConfig {
    return geometry as LazyWaveConfig;
  }
}
