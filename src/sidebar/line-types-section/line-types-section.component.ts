import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelStateService } from '../../services/model-state.service';
import {
  LineTypeConfig,
  BuoyancyModuleConfig,
  calculateWetMass,
  calculatePipeDensity,
  calculateDryMass,
  calculateDryMassFromDensity,
  calculateModuleBuoyancy,
  calculateBuoyancySectionLength,
  calculateBuoyancyWeightPerMeter,
} from '../../types';
import { LineTypesImportDialogComponent } from './line-types-import-dialog.component';
import { BuoyancyModulesImportDialogComponent } from './buoyancy-modules-import-dialog.component';

@Component({
  selector: 'orcaflex-line-types-section',
  standalone: true,
  imports: [CommonModule, FormsModule, LineTypesImportDialogComponent, BuoyancyModulesImportDialogComponent],
  template: `
    <div class="section-content">
      <!-- Line Types -->
      <div class="subsection-header">
        <span>Line Types</span>
        <div class="header-actions">
          <button class="import-btn" (click)="showLineTypesImportDialog = true" title="Import from Excel">Import</button>
          <button class="add-btn" (click)="startAddLineType()">+</button>
        </div>
      </div>

      @for (lineType of lineTypes(); track lineType.id) {
        <div
          class="line-type-item"
          [class.selected]="selectedLineTypeId() === lineType.id"
        >
          <div class="line-type-header" (click)="selectLineType(lineType.id)">
            <span class="line-type-name">{{ lineType.name }}</span>
            <button class="delete-btn" (click)="deleteLineType(lineType.id); $event.stopPropagation()">×</button>
          </div>
          <div class="line-type-summary">
            OD: {{ formatDiameter(lineType.outerDiameter) }} | Dry Mass: {{ lineType.dryMass.toFixed(1) }} kg/m
          </div>

          @if (selectedLineTypeId() === lineType.id) {
            <div class="line-type-editor" (click)="$event.stopPropagation()">
              <div class="form-group">
                <label>Name</label>
                <input type="text" [ngModel]="lineType.name"
                  (ngModelChange)="updateLineType(lineType, 'name', $event)" />
              </div>

              <!-- Geometry -->
              <div class="section-title">Geometry</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Outer Diameter (mm)</label>
                  <input type="number" [ngModel]="lineType.outerDiameter * 1000"
                    (ngModelChange)="updateLineType(lineType, 'outerDiameter', $event / 1000)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Inner Diameter (mm)</label>
                  <input type="number" [ngModel]="lineType.innerDiameter * 1000"
                    (ngModelChange)="updateLineType(lineType, 'innerDiameter', $event / 1000)" step="0.1" />
                </div>
              </div>

              <!-- Mass Properties -->
              <div class="section-title">Mass Properties</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Dry Mass (kg/m)</label>
                  <input type="number" [ngModel]="lineType.dryMass"
                    (ngModelChange)="updateDryMass(lineType, $event)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Wet Mass (kg/m)</label>
                  <input type="number" [ngModel]="getWetMass(lineType)"
                    (ngModelChange)="updateWetMass(lineType, $event)" step="0.1" />
                </div>
              </div>
              <div class="form-group">
                <label>Pipe Density (kg/m³)</label>
                <input type="number" [ngModel]="getPipeDensity(lineType)"
                  (ngModelChange)="updatePipeDensity(lineType, $event)" step="1"
                  class="calculated-input" />
                <span class="calc-hint">Auto-calculated from mass & geometry</span>
              </div>

              <!-- Stiffness Properties -->
              <div class="section-title">Stiffness Properties</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Bending EI (kN·m²)</label>
                  <input type="number" [ngModel]="lineType.bendingStiffness"
                    (ngModelChange)="updateLineType(lineType, 'bendingStiffness', $event)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Axial EA (kN)</label>
                  <input type="number" [ngModel]="lineType.axialStiffness"
                    (ngModelChange)="updateLineType(lineType, 'axialStiffness', $event)" step="100" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Torsional GJ (kN·m²)</label>
                  <input type="number" [ngModel]="lineType.torsionalStiffness ?? 10"
                    (ngModelChange)="updateLineType(lineType, 'torsionalStiffness', $event)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Poisson Ratio</label>
                  <input type="number" [ngModel]="lineType.poissonRatio ?? 0.5"
                    (ngModelChange)="updateLineType(lineType, 'poissonRatio', $event)" step="0.01" min="0" max="0.5" />
                </div>
              </div>

              <!-- Limits -->
              <div class="section-title">Limits</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Allowable Tension (kN)</label>
                  <input type="number" [ngModel]="lineType.allowableTension ?? 5000"
                    (ngModelChange)="updateLineType(lineType, 'allowableTension', $event)" step="100" />
                </div>
                <div class="form-group half">
                  <label>Min Bend Radius (m)</label>
                  <input type="number" [ngModel]="lineType.minBendRadius ?? 3"
                    (ngModelChange)="updateLineType(lineType, 'minBendRadius', $event)" step="0.1" />
                </div>
              </div>

              <!-- Coefficients -->
              <div class="section-title">Drag Coefficients</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Normal</label>
                  <input type="number" [ngModel]="lineType.dragCoefficients.normal"
                    (ngModelChange)="updateDragCoeff(lineType, 'normal', $event)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Axial</label>
                  <input type="number" [ngModel]="lineType.dragCoefficients.axial"
                    (ngModelChange)="updateDragCoeff(lineType, 'axial', $event)" step="0.001" />
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (addingLineType()) {
        <div class="line-type-item new-item">
          <div class="line-type-editor">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="newLineType.name" placeholder="Line type name" />
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>OD (mm)</label>
                <input type="number" [(ngModel)]="newLineTypeODmm" step="0.1" />
              </div>
              <div class="form-group half">
                <label>ID (mm)</label>
                <input type="number" [(ngModel)]="newLineTypeIDmm" step="0.1" />
              </div>
            </div>
            <div class="form-group">
              <label>Dry Mass (kg/m)</label>
              <input type="number" [(ngModel)]="newLineType.dryMass" step="0.1" />
            </div>
            <div class="action-buttons">
              <button class="btn save" (click)="saveNewLineType()">Add</button>
              <button class="btn cancel" (click)="cancelAddLineType()">Cancel</button>
            </div>
          </div>
        </div>
      }

      <!-- Buoyancy Modules -->
      <div class="subsection-header buoyancy">
        <span>Buoyancy Modules</span>
        <div class="header-actions">
          <button class="import-btn" (click)="showBuoyancyImportDialog = true" title="Import from Excel">Import</button>
          <button class="add-btn" (click)="startAddBuoyancy()">+</button>
        </div>
      </div>

      @for (buoyancy of buoyancyModules(); track buoyancy.id) {
        <div
          class="buoyancy-item"
          [class.selected]="selectedBuoyancyId() === buoyancy.id"
        >
          <div class="buoyancy-header" (click)="selectBuoyancy(buoyancy.id)">
            <span class="buoyancy-name">{{ buoyancy.name }}</span>
            <button class="delete-btn small" (click)="deleteBuoyancy(buoyancy.id); $event.stopPropagation()">×</button>
          </div>
          <div class="buoyancy-summary">
            {{ buoyancy.numberOfModules }}x {{ (buoyancy.length * 1000).toFixed(0) }}mm @ {{ buoyancy.spacing }}m
          </div>

          @if (selectedBuoyancyId() === buoyancy.id) {
            <div class="buoyancy-editor" (click)="$event.stopPropagation()">
              <div class="form-group">
                <label>Name</label>
                <input type="text" [ngModel]="buoyancy.name"
                  (ngModelChange)="updateBuoyancy(buoyancy, 'name', $event)" />
              </div>

              <div class="section-title">Module Dimensions</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>OD (mm)</label>
                  <input type="number" [ngModel]="buoyancy.outerDiameter * 1000"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'outerDiameter', $event / 1000)" step="1" />
                </div>
                <div class="form-group half">
                  <label>Length (mm)</label>
                  <input type="number" [ngModel]="buoyancy.length * 1000"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'length', $event / 1000)" step="10" />
                </div>
              </div>

              <div class="section-title">Mass Properties (per module)</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Mass in Air (kg)</label>
                  <input type="number" [ngModel]="buoyancy.dryMass"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'dryMass', $event)" step="0.1" />
                </div>
                <div class="form-group half">
                  <label>Apparent Mass in Water (kg)</label>
                  <input type="number" [ngModel]="buoyancy.apparentMassInWater"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'apparentMassInWater', $event)" step="1" />
                </div>
              </div>
              <div class="form-group">
                <label>Net Buoyancy (N/module)</label>
                <input type="number" [value]="getModuleBuoyancy(buoyancy)" disabled class="calculated-input" />
                <span class="calc-hint">Calculated from apparent mass</span>
              </div>

              <div class="section-title">Installation</div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Number of Modules</label>
                  <input type="number" [ngModel]="buoyancy.numberOfModules"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'numberOfModules', $event)" min="1" step="1" />
                </div>
                <div class="form-group half">
                  <label>Spacing (m)</label>
                  <input type="number" [ngModel]="buoyancy.spacing"
                    (ngModelChange)="updateBuoyancy(buoyancy, 'spacing', $event)" step="0.5" min="0" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Section Length (m)</label>
                  <input type="number" [value]="getSectionLength(buoyancy)" disabled class="calculated-input" />
                </div>
                <div class="form-group half">
                  <label>Buoyancy/m (N/m)</label>
                  <input type="number" [value]="getBuoyancyPerMeter(buoyancy)" disabled class="calculated-input" />
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (addingBuoyancy()) {
        <div class="buoyancy-item new-item">
          <div class="buoyancy-editor">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="newBuoyancy.name" placeholder="Module name" />
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>OD (mm)</label>
                <input type="number" [(ngModel)]="newBuoyancyODmm" step="1" />
              </div>
              <div class="form-group half">
                <label>Length (mm)</label>
                <input type="number" [(ngModel)]="newBuoyancyLengthmm" step="10" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>Number of Modules</label>
                <input type="number" [(ngModel)]="newBuoyancy.numberOfModules" min="1" step="1" />
              </div>
              <div class="form-group half">
                <label>Spacing (m)</label>
                <input type="number" [(ngModel)]="newBuoyancy.spacing" step="0.5" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn save" (click)="saveNewBuoyancy()">Add</button>
              <button class="btn cancel" (click)="cancelAddBuoyancy()">Cancel</button>
            </div>
          </div>
        </div>
      }

      <!-- Import Dialogs -->
      <orcaflex-line-types-import-dialog
        [(visible)]="showLineTypesImportDialog"
        (import)="handleLineTypesImport($event)"
      />
      <orcaflex-buoyancy-modules-import-dialog
        [(visible)]="showBuoyancyImportDialog"
        (import)="handleBuoyancyModulesImport($event)"
      />
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
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--caris-text-secondary, #666);
    }

    .subsection-header.buoyancy {
      margin-top: 8px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .import-btn {
      padding: 2px 6px;
      border: 1px solid var(--caris-primary, #1976d2);
      border-radius: 3px;
      background: transparent;
      color: var(--caris-primary, #1976d2);
      font-size: 9px;
      cursor: pointer;
      text-transform: none;
      font-weight: 500;
    }

    .import-btn:hover {
      background: var(--caris-primary, #1976d2);
      color: white;
    }

    .section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--caris-text-secondary, #666);
      margin: 12px 0 8px;
      padding-top: 8px;
      border-top: 1px solid var(--caris-border-light, #eee);
    }

    .section-title:first-of-type {
      margin-top: 8px;
      padding-top: 0;
      border-top: none;
    }

    .add-btn {
      width: 20px;
      height: 20px;
      border: 1px dashed var(--caris-border-light, #ccc);
      border-radius: 3px;
      background: transparent;
      color: var(--caris-text-secondary, #666);
      font-size: 14px;
      cursor: pointer;
    }

    .add-btn:hover {
      border-color: var(--caris-primary, #1976d2);
      color: var(--caris-primary, #1976d2);
    }

    .line-type-item,
    .buoyancy-item {
      margin: 8px;
      border: 1px solid var(--caris-border-light, #ddd);
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
    }

    .line-type-item:hover,
    .buoyancy-item:hover {
      border-color: var(--caris-primary, #1976d2);
    }

    .line-type-item.selected,
    .buoyancy-item.selected {
      border-color: var(--caris-primary, #1976d2);
      background: var(--caris-bg-selected, #e3f2fd);
    }

    .line-type-item.new-item,
    .buoyancy-item.new-item {
      border-style: dashed;
      cursor: default;
    }

    .line-type-header,
    .buoyancy-header {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .line-type-name,
    .buoyancy-name {
      font-weight: 500;
      font-size: 12px;
    }

    .line-type-summary,
    .buoyancy-summary {
      padding: 0 12px 8px;
      font-size: 11px;
      color: var(--caris-text-secondary, #666);
    }

    .delete-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--caris-text-secondary, #999);
      font-size: 16px;
      cursor: pointer;
      border-radius: 3px;
    }

    .delete-btn:hover {
      background: #ffebee;
      color: var(--caris-error, #f44336);
    }

    .delete-btn.small {
      width: 18px;
      height: 18px;
      font-size: 14px;
    }

    .line-type-editor,
    .buoyancy-editor {
      padding: 12px;
      border-top: 1px solid var(--caris-border-light, #eee);
      background: var(--caris-bg-subtle, #fafafa);
    }

    .form-group {
      margin-bottom: 10px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 10px;
      color: var(--caris-text-secondary, #666);
      margin-bottom: 2px;
    }

    .form-group input {
      width: 100%;
      padding: 5px 6px;
      border: 1px solid var(--caris-border-light, #ddd);
      border-radius: 4px;
      font-size: 11px;
      background: white;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--caris-primary, #1976d2);
    }

    .form-group input.calculated-input {
      background: var(--caris-bg-subtle, #f9f9f9);
    }

    .calc-hint {
      display: block;
      font-size: 9px;
      color: var(--caris-text-tertiary, #999);
      margin-top: 2px;
      font-style: italic;
    }

    .form-row {
      display: flex;
      gap: 8px;
    }

    .form-group.half {
      flex: 1;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .btn {
      flex: 1;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }

    .btn.save {
      background: var(--caris-primary, #1976d2);
      color: white;
      border: none;
    }

    .btn.save:hover {
      background: var(--caris-primary-dark, #1565c0);
    }

    .btn.cancel {
      background: white;
      border: 1px solid var(--caris-border-light, #ddd);
      color: var(--caris-text-secondary, #666);
    }

    .btn.cancel:hover {
      background: var(--caris-bg-subtle, #f5f5f5);
    }
  `]
})
export class LineTypesSectionComponent {
  private modelState = inject(ModelStateService);

  lineTypes = this.modelState.lineTypes;
  buoyancyModules = this.modelState.buoyancyModules;

  selectedLineTypeId = signal<string | null>(null);
  selectedBuoyancyId = signal<string | null>(null);

  addingLineType = signal(false);
  addingBuoyancy = signal(false);

  newLineType: Partial<LineTypeConfig> = this.getDefaultNewLineType();
  newLineTypeODmm = 355.6;
  newLineTypeIDmm = 254;

  newBuoyancy: Partial<BuoyancyModuleConfig> = this.getDefaultNewBuoyancy();
  newBuoyancyODmm = 1450;
  newBuoyancyLengthmm = 1600;

  // Import dialog state
  showLineTypesImportDialog = false;
  showBuoyancyImportDialog = false;

  formatDiameter(meters: number): string {
    const mm = meters * 1000;
    const inches = meters * 39.37;
    return `${mm.toFixed(1)}mm (${inches.toFixed(1)}")`;
  }

  getWetMass(lineType: LineTypeConfig): number {
    const waterDensity = this.modelState.environment().sea.waterDensity;
    return Math.round(calculateWetMass(lineType, waterDensity) * 100) / 100;
  }

  getPipeDensity(lineType: LineTypeConfig): number {
    return Math.round(calculatePipeDensity(lineType));
  }

  // Line type selection
  selectLineType(id: string): void {
    this.selectedLineTypeId.set(this.selectedLineTypeId() === id ? null : id);
    this.selectedBuoyancyId.set(null);
  }

  selectBuoyancy(id: string): void {
    this.selectedBuoyancyId.set(this.selectedBuoyancyId() === id ? null : id);
    this.selectedLineTypeId.set(null);
  }

  // Line type updates
  updateLineType(lineType: LineTypeConfig, field: keyof LineTypeConfig, value: any): void {
    this.modelState.updateLineType({ ...lineType, [field]: value });
  }

  updateDryMass(lineType: LineTypeConfig, dryMass: number): void {
    this.modelState.updateLineType({ ...lineType, dryMass });
  }

  updateWetMass(lineType: LineTypeConfig, wetMass: number): void {
    const waterDensity = this.modelState.environment().sea.waterDensity;
    const dryMass = calculateDryMass(wetMass, lineType.outerDiameter, waterDensity);
    this.modelState.updateLineType({ ...lineType, dryMass });
  }

  updatePipeDensity(lineType: LineTypeConfig, density: number): void {
    const dryMass = calculateDryMassFromDensity(
      density,
      lineType.outerDiameter,
      lineType.innerDiameter
    );
    this.modelState.updateLineType({ ...lineType, dryMass, pipeDensity: density });
  }

  updateDragCoeff(lineType: LineTypeConfig, axis: 'normal' | 'axial', value: number): void {
    this.modelState.updateLineType({
      ...lineType,
      dragCoefficients: { ...lineType.dragCoefficients, [axis]: value },
    });
  }

  deleteLineType(id: string): void {
    this.modelState.deleteLineType(id);
  }

  startAddLineType(): void {
    this.addingLineType.set(true);
    this.newLineType = this.getDefaultNewLineType();
    this.newLineTypeODmm = 355.6;
    this.newLineTypeIDmm = 254;
  }

  saveNewLineType(): void {
    if (!this.newLineType.name) return;

    const lineType: LineTypeConfig = {
      id: crypto.randomUUID(),
      name: this.newLineType.name || 'New Line Type',
      outerDiameter: this.newLineTypeODmm / 1000,
      innerDiameter: this.newLineTypeIDmm / 1000,
      dryMass: this.newLineType.dryMass || 184.23,
      bendingStiffness: 124.87,
      axialStiffness: 711200,
      torsionalStiffness: 10,
      poissonRatio: 0.5,
      allowableTension: 5000,
      minBendRadius: 3.675,
      dragCoefficients: { normal: 1.2, axial: 0.008 },
      addedMassCoefficients: { normal: 1.0, axial: 0.0 },
    };
    this.modelState.addLineType(lineType);
    this.addingLineType.set(false);
  }

  cancelAddLineType(): void {
    this.addingLineType.set(false);
  }

  // Buoyancy CRUD
  updateBuoyancy(buoyancy: BuoyancyModuleConfig, field: keyof BuoyancyModuleConfig, value: any): void {
    this.modelState.updateBuoyancyModule({ ...buoyancy, [field]: value });
  }

  deleteBuoyancy(buoyancyId: string): void {
    this.modelState.deleteBuoyancyModule(buoyancyId);
  }

  // Buoyancy calculation helpers
  getModuleBuoyancy(buoyancy: BuoyancyModuleConfig): number {
    return Math.round(calculateModuleBuoyancy(buoyancy));
  }

  getSectionLength(buoyancy: BuoyancyModuleConfig): number {
    return Math.round(calculateBuoyancySectionLength(buoyancy) * 10) / 10;
  }

  getBuoyancyPerMeter(buoyancy: BuoyancyModuleConfig): number {
    return Math.round(calculateBuoyancyWeightPerMeter(buoyancy));
  }

  startAddBuoyancy(): void {
    this.addingBuoyancy.set(true);
    this.newBuoyancy = this.getDefaultNewBuoyancy();
    this.newBuoyancyODmm = 1450;
    this.newBuoyancyLengthmm = 1600;
  }

  saveNewBuoyancy(): void {
    if (!this.newBuoyancy.name) return;

    const buoyancy: BuoyancyModuleConfig = {
      id: crypto.randomUUID(),
      name: this.newBuoyancy.name || 'New Buoyancy',
      outerDiameter: this.newBuoyancyODmm / 1000,
      length: this.newBuoyancyLengthmm / 1000,
      dryMass: 855.7,
      apparentMassInWater: -1220,
      dragCoefficient: 0.8,
      numberOfModules: this.newBuoyancy.numberOfModules || 6,
      spacing: this.newBuoyancy.spacing || 12,
    };
    this.modelState.addBuoyancyModule(buoyancy);
    this.addingBuoyancy.set(false);
  }

  cancelAddBuoyancy(): void {
    this.addingBuoyancy.set(false);
  }

  private getDefaultNewLineType(): Partial<LineTypeConfig> {
    return {
      name: '',
      outerDiameter: 0.3556,
      innerDiameter: 0.254,
      dryMass: 184.23,
    };
  }

  private getDefaultNewBuoyancy(): Partial<BuoyancyModuleConfig> {
    return {
      name: '',
      outerDiameter: 1.45,
      length: 1.6,
      numberOfModules: 6,
      spacing: 12,
    };
  }

  // Import handlers
  handleLineTypesImport(lineTypes: LineTypeConfig[]): void {
    for (const lineType of lineTypes) {
      this.modelState.addLineType(lineType);
    }
    this.modelState.addLog('success', `Imported ${lineTypes.length} line type(s)`);
  }

  handleBuoyancyModulesImport(modules: BuoyancyModuleConfig[]): void {
    for (const module of modules) {
      this.modelState.addBuoyancyModule(module);
    }
    this.modelState.addLog('success', `Imported ${modules.length} buoyancy module(s)`);
  }
}
