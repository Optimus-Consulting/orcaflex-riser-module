import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import JSZip from 'jszip';
import { ModelStateService } from '../../services/model-state.service';
import { RiserConfig, ContentConfig } from '../../types';

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

@Component({
  selector: 'orcaflex-generate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `
    <p-dialog
      header="Generate OrcaFlex Models"
      [visible]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '900px', maxHeight: '90vh' }"
      styleClass="generate-dialog"
      (onHide)="onCancel()"
    >
      <div class="dialog-content">
        <div class="config-panels">
          <!-- Left Panel: Riser/Content Selection -->
          <div class="panel risers-panel">
            <div class="panel-header">
              <span>Risers & Contents</span>
              <div class="select-actions">
                <button class="link-btn" (click)="selectAllContents()">Select All</button>
                <button class="link-btn" (click)="deselectAllContents()">Deselect All</button>
              </div>
            </div>
            <div class="panel-body">
              @for (riser of riserSelections(); track riser.riserId) {
                <div class="riser-group">
                  <div class="riser-name">{{ riser.riserName }}</div>
                  <div class="content-list">
                    @for (content of riser.contents; track content.contentId) {
                      <label class="content-item">
                        <input
                          type="checkbox"
                          [(ngModel)]="content.selected"
                          (ngModelChange)="updateModelList()"
                        />
                        <span class="content-name">{{ content.contentName }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
              @if (riserSelections().length === 0) {
                <div class="empty-state">No risers defined</div>
              }
            </div>
          </div>

          <!-- Right Panel: Vessel Conditions -->
          <div class="panel conditions-panel">
            <div class="panel-header">
              <span>Vessel Conditions</span>
              <button class="add-btn" (click)="addCondition()">+ Add</button>
            </div>
            <div class="panel-body">
              <div class="conditions-table">
                <div class="table-header">
                  <span class="col-heading">Heading (°)</span>
                  <span class="col-offset">Offset (m)</span>
                  <span class="col-actions"></span>
                </div>
                @for (condition of vesselConditions(); track condition.id; let idx = $index) {
                  <div class="table-row">
                    <input
                      type="number"
                      class="condition-input"
                      [(ngModel)]="condition.heading"
                      (ngModelChange)="updateModelList()"
                      placeholder="0"
                    />
                    <input
                      type="number"
                      class="condition-input"
                      [(ngModel)]="condition.offset"
                      (ngModelChange)="updateModelList()"
                      placeholder="0"
                    />
                    <button
                      class="remove-btn"
                      (click)="removeCondition(idx)"
                      [disabled]="vesselConditions().length <= 1"
                    >×</button>
                  </div>
                }
              </div>
            </div>

            <!-- Options -->
            <div class="options-section">
              <label class="option-item">
                <input
                  type="checkbox"
                  [(ngModel)]="oneRiserPerModel"
                  (ngModelChange)="updateModelList()"
                />
                <span>One riser per model</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Model Preview -->
        <div class="model-preview">
          <div class="preview-header">
            <span>Models to Generate ({{ generatedModels().length }})</span>
          </div>
          <div class="preview-body">
            @if (generatedModels().length > 0) {
              <div class="model-list">
                @for (model of generatedModels(); track model.name) {
                  <div class="model-item">
                    <span class="model-name">{{ model.name }}.yml</span>
                    <span class="model-info">{{ model.risers.length }} riser(s) - {{ model.condition }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-preview">
                Select risers and contents to generate models
              </div>
            }
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <div class="footer-info">
            @if (isGenerating()) {
              <span class="generating">Generating models...</span>
            }
          </div>
          <div class="footer-actions">
            <button class="btn-secondary" (click)="onCancel()">Cancel</button>
            <button
              class="btn-primary"
              (click)="onGenerate()"
              [disabled]="generatedModels().length === 0 || isGenerating()"
            >
              Generate {{ generatedModels().length }} Model{{ generatedModels().length !== 1 ? 's' : '' }}
            </button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .generate-dialog .p-dialog {
      background: white;
    }

    :host ::ng-deep .generate-dialog .p-dialog-header {
      background: white;
      border-bottom: 1px solid #eee;
      padding: 16px 20px;
    }

    :host ::ng-deep .generate-dialog .p-dialog-content {
      background: white;
      padding: 20px;
      overflow-y: auto;
    }

    :host ::ng-deep .generate-dialog .p-dialog-footer {
      background: white;
      border-top: 1px solid #eee;
      padding: 16px 20px;
    }

    :host ::ng-deep .p-dialog-mask {
      background: rgba(0, 0, 0, 0.5);
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .config-panels {
      display: flex;
      gap: 16px;
    }

    .panel {
      flex: 1;
      border: 1px solid #eee;
      border-radius: 6px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #fafafa;
      border-bottom: 1px solid #eee;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
    }

    .select-actions {
      display: flex;
      gap: 8px;
    }

    .link-btn {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 10px;
      cursor: pointer;
      text-transform: none;
      font-weight: 500;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .add-btn {
      padding: 2px 8px;
      border: 1px solid #1976d2;
      border-radius: 3px;
      background: transparent;
      color: #1976d2;
      font-size: 10px;
      cursor: pointer;
      text-transform: none;
      font-weight: 500;
    }

    .add-btn:hover {
      background: #1976d2;
      color: white;
    }

    .panel-body {
      padding: 12px;
      max-height: 200px;
      overflow-y: auto;
      background: white;
    }

    .riser-group {
      margin-bottom: 12px;
    }

    .riser-group:last-child {
      margin-bottom: 0;
    }

    .riser-name {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .content-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-left: 12px;
    }

    .content-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 11px;
      color: #555;
    }

    .content-item input[type="checkbox"] {
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .conditions-table {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .table-header {
      display: flex;
      gap: 8px;
      padding: 0 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
    }

    .col-heading, .col-offset {
      flex: 1;
    }

    .col-actions {
      width: 24px;
    }

    .table-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .condition-input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      text-align: right;
      background: white;
    }

    .condition-input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #999;
      font-size: 16px;
      cursor: pointer;
      border-radius: 3px;
    }

    .remove-btn:hover:not(:disabled) {
      background: #ffebee;
      color: #f44336;
    }

    .remove-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .options-section {
      padding: 12px;
      border-top: 1px solid #eee;
      background: white;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 12px;
      color: #333;
    }

    .option-item input[type="checkbox"] {
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .model-preview {
      border: 1px solid #eee;
      border-radius: 6px;
      overflow: hidden;
    }

    .preview-header {
      padding: 10px 12px;
      background: #fafafa;
      border-bottom: 1px solid #eee;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
    }

    .preview-body {
      max-height: 150px;
      overflow-y: auto;
      background: white;
    }

    .model-list {
      padding: 8px;
    }

    .model-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      border-radius: 4px;
      background: #f9f9f9;
      margin-bottom: 4px;
    }

    .model-item:last-child {
      margin-bottom: 0;
    }

    .model-name {
      font-size: 12px;
      font-weight: 500;
      color: #333;
      font-family: monospace;
    }

    .model-info {
      font-size: 10px;
      color: #999;
    }

    .empty-state, .empty-preview {
      padding: 24px;
      text-align: center;
      color: #999;
      font-size: 12px;
      font-style: italic;
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-info {
      font-size: 12px;
    }

    .generating {
      color: #1976d2;
    }

    .footer-actions {
      display: flex;
      gap: 8px;
    }

    .btn-secondary {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #f5f5f5;
    }

    .btn-primary {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #1976d2;
      color: white;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1565c0;
    }

    .btn-primary:disabled {
      background: #ddd;
      cursor: not-allowed;
    }
  `]
})
export class GenerateOrcaflexDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() generate = new EventEmitter<GeneratedModel[]>();

  private modelState = inject(ModelStateService);

  // Riser/content selections
  riserSelections = signal<RiserContentSelection[]>([]);

  // Vessel conditions (heading + offset)
  vesselConditions = signal<VesselCondition[]>([
    { id: crypto.randomUUID(), heading: 25, offset: 40 }
  ]);

  // Options
  oneRiserPerModel = false;

  // State
  isGenerating = signal(false);

  // Computed model list
  generatedModels = signal<GeneratedModel[]>([]);

  ngOnInit(): void {
    this.initializeSelections();
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.initializeSelections();
    }
  }

  private initializeSelections(): void {
    const risers = this.modelState.risers();
    const selections: RiserContentSelection[] = risers.map(riser => ({
      riserId: riser.id,
      riserName: riser.name,
      contents: (riser.contents || []).map(content => ({
        contentId: content.id,
        contentName: content.name,
        selected: true, // Default all selected
      }))
    }));
    this.riserSelections.set(selections);
    this.updateModelList();
  }

  selectAllContents(): void {
    const selections = this.riserSelections();
    for (const riser of selections) {
      for (const content of riser.contents) {
        content.selected = true;
      }
    }
    this.riserSelections.set([...selections]);
    this.updateModelList();
  }

  deselectAllContents(): void {
    const selections = this.riserSelections();
    for (const riser of selections) {
      for (const content of riser.contents) {
        content.selected = false;
      }
    }
    this.riserSelections.set([...selections]);
    this.updateModelList();
  }

  addCondition(): void {
    const conditions = this.vesselConditions();
    this.vesselConditions.set([
      ...conditions,
      { id: crypto.randomUUID(), heading: 0, offset: 0 }
    ]);
    this.updateModelList();
  }

  removeCondition(index: number): void {
    const conditions = this.vesselConditions();
    if (conditions.length > 1) {
      conditions.splice(index, 1);
      this.vesselConditions.set([...conditions]);
      this.updateModelList();
    }
  }

  updateModelList(): void {
    const models: GeneratedModel[] = [];
    const selections = this.riserSelections();
    const conditions = this.vesselConditions();

    // Get selected risers with their selected contents
    const selectedRisers: { riserId: string; riserName: string; contentId: string; contentName: string }[] = [];
    for (const riser of selections) {
      for (const content of riser.contents) {
        if (content.selected) {
          selectedRisers.push({
            riserId: riser.riserId,
            riserName: riser.riserName,
            contentId: content.contentId,
            contentName: content.contentName,
          });
        }
      }
    }

    if (selectedRisers.length === 0 || conditions.length === 0) {
      this.generatedModels.set([]);
      return;
    }

    // Generate model names based on options
    for (const condition of conditions) {
      const conditionStr = `H${condition.heading}_O${condition.offset}`;
      const conditionLabel = `Heading ${condition.heading}°, Offset ${condition.offset}m`;

      if (this.oneRiserPerModel) {
        // Each riser/content combination gets its own file
        for (const riser of selectedRisers) {
          const modelName = `${this.sanitizeName(riser.riserName)}_${this.sanitizeName(riser.contentName)}_${conditionStr}`;
          models.push({
            name: modelName,
            risers: [`${riser.riserName} (${riser.contentName})`],
            condition: conditionLabel,
          });
        }
      } else {
        // All risers in one file per condition
        const riserNames = selectedRisers.map(r => `${r.riserName} (${r.contentName})`);
        const modelName = `Model_${conditionStr}`;
        models.push({
          name: modelName,
          risers: riserNames,
          condition: conditionLabel,
        });
      }
    }

    this.generatedModels.set(models);
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  }

  async onGenerate(): Promise<void> {
    this.isGenerating.set(true);

    try {
      const selections = this.riserSelections();
      const conditions = this.vesselConditions();

      // Generate YAML files
      const files: { name: string; content: string }[] = [];

      for (const condition of conditions) {
        const conditionStr = `H${condition.heading}_O${condition.offset}`;

        // Get selected risers for this model
        const selectedRisers: { riser: RiserConfig; content: ContentConfig }[] = [];
        const risers = this.modelState.risers();

        for (const selection of selections) {
          const riser = risers.find(r => r.id === selection.riserId);
          if (!riser) continue;

          for (const contentSel of selection.contents) {
            if (contentSel.selected) {
              const content = riser.contents.find(c => c.id === contentSel.contentId);
              if (content) {
                selectedRisers.push({ riser, content });
              }
            }
          }
        }

        if (this.oneRiserPerModel) {
          // Each riser gets its own file
          for (const { riser, content } of selectedRisers) {
            const modelName = `${this.sanitizeName(riser.name)}_${this.sanitizeName(content.name)}_${conditionStr}`;
            const yaml = this.generateOrcaFlexYaml([{ riser, content }], condition);
            files.push({ name: `${modelName}.yml`, content: yaml });
          }
        } else {
          // All risers in one file
          const modelName = `Model_${conditionStr}`;
          const yaml = this.generateOrcaFlexYaml(selectedRisers, condition);
          files.push({ name: `${modelName}.yml`, content: yaml });
        }
      }

      // Create and download ZIP
      await this.downloadAsZip(files);

      this.modelState.addLog('success', `Generated ${files.length} OrcaFlex model(s)`);
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.modelState.addLog('error', `Failed to generate models: ${message}`);
    } finally {
      this.isGenerating.set(false);
    }
  }

  private generateOrcaFlexYaml(
    risers: { riser: RiserConfig; content: ContentConfig }[],
    condition: VesselCondition
  ): string {
    const env = this.modelState.environment();
    const vessels = this.modelState.vessels();
    const lineTypes = this.modelState.lineTypes();
    const buoyancyModules = this.modelState.buoyancyModules();

    // Build YAML structure
    const yaml: string[] = [];

    // General section
    yaml.push('General:');
    yaml.push('  StageDuration:');
    yaml.push('    - 8');
    yaml.push('    - ~');
    yaml.push('  TargetLogSampleInterval: 0.2');
    yaml.push('  ImplicitConstantTimeStep: 0.02');
    yaml.push('');

    // Environment section
    yaml.push('Environment:');
    yaml.push(`  WaterDepth: ${env.sea.waterDepth}`);
    yaml.push(`  SeaDensity: ${env.sea.waterDensity}`);
    yaml.push('  WaveType: Airy');
    yaml.push('  WaveHeight: 0');
    yaml.push('  WavePeriod: 10');
    yaml.push('');

    // Line Types section
    yaml.push('LineTypes:');
    for (const lt of lineTypes) {
      yaml.push(`  - Name: ${lt.name}`);
      yaml.push(`    OD: ${lt.outerDiameter}`);
      yaml.push(`    ID: ${lt.innerDiameter}`);
      yaml.push(`    MassPerUnitLength: ${lt.dryMass}`);
      yaml.push(`    EI: ${lt.bendingStiffness}`);
      yaml.push(`    EA: ${lt.axialStiffness}`);
      yaml.push(`    GJ: ${lt.torsionalStiffness || 10}`);
      yaml.push(`    PoissonRatio: ${lt.poissonRatio || 0.5}`);
      yaml.push(`    Cdx: ${lt.dragCoefficients.axial}`);
      yaml.push(`    Cdn: ${lt.dragCoefficients.normal}`);
      yaml.push(`    Cax: ${lt.addedMassCoefficients.axial}`);
      yaml.push(`    Can: ${lt.addedMassCoefficients.normal}`);
    }
    yaml.push('');

    // Vessels section
    yaml.push('Vessels:');
    for (const vessel of vessels) {
      yaml.push(`  - Name: ${vessel.name}`);
      yaml.push(`    Length: ${vessel.length}`);
      yaml.push(`    InitialX: ${vessel.position.x + condition.offset}`);
      yaml.push(`    InitialY: ${vessel.position.y}`);
      yaml.push(`    InitialZ: ${vessel.position.z}`);
      yaml.push(`    InitialHeading: ${vessel.orientation.heading + condition.heading}`);
      yaml.push(`    InitialHeel: ${vessel.orientation.roll}`);
      yaml.push(`    InitialTrim: ${vessel.orientation.pitch}`);
      yaml.push('    Connection:');
      for (const cp of vessel.connectionPoints) {
        yaml.push(`      - Name: ${cp.name}`);
        yaml.push(`        X: ${cp.x}`);
        yaml.push(`        Y: ${cp.y}`);
        yaml.push(`        Z: ${cp.z}`);
      }
    }
    yaml.push('');

    // Buoyancy Modules section (if any)
    if (buoyancyModules.length > 0) {
      yaml.push('BuoyancyModules:');
      for (const bm of buoyancyModules) {
        yaml.push(`  - Name: ${bm.name}`);
        yaml.push(`    OD: ${bm.outerDiameter}`);
        yaml.push(`    Length: ${bm.length}`);
        yaml.push(`    Mass: ${bm.dryMass}`);
        yaml.push(`    ApparentMass: ${bm.apparentMassInWater}`);
        yaml.push(`    NumberOfModules: ${bm.numberOfModules}`);
        yaml.push(`    Spacing: ${bm.spacing}`);
      }
      yaml.push('');
    }

    // Lines section
    yaml.push('Lines:');
    for (const { riser, content } of risers) {
      const lineType = lineTypes.find(lt => lt.id === riser.lineTypeId);
      const vessel = vessels.find(v => v.id === riser.vesselId);
      const cp = vessel?.connectionPoints.find(c => c.id === riser.connectionPointId);

      const lineName = `${riser.name}_${content.name}`.replace(/[^a-zA-Z0-9]/g, '_');

      yaml.push(`  - Name: ${lineName}`);
      yaml.push(`    LineType: ${lineType?.name || 'Unknown'}`);
      yaml.push(`    ContentsDensity: ${content.density}`);
      yaml.push('    EndAConnection: Vessel');
      yaml.push(`    EndAVessel: ${vessel?.name || 'Unknown'}`);
      yaml.push(`    EndAConnectionPoint: ${cp?.name || 'CP1'}`);
      yaml.push('    EndBConnection: Anchored');
      yaml.push(`    EndBX: ${riser.calculationResults?.tdpPosition?.x || 200}`);
      yaml.push(`    EndBY: 0`);
      yaml.push(`    EndBZ: ${-env.sea.waterDepth}`);

      if (riser.geometry.type === 'lazy-wave') {
        const geom = riser.geometry;
        yaml.push(`    TargetSegmentLength: 5`);
        yaml.push(`    # Lazy wave configuration`);
        yaml.push(`    # SagBend: ${geom.sagBend}`);
        yaml.push(`    # HogBend: ${geom.hogBend}`);
      }

      yaml.push(`    TotalLength: ${riser.calculationResults?.totalLength || 500}`);
    }
    yaml.push('');

    return yaml.join('\n');
  }

  private async downloadAsZip(files: { name: string; content: string }[]): Promise<void> {
    const zip = new JSZip();

    // Add all YAML files to the ZIP
    for (const file of files) {
      zip.file(file.name, file.content);
    }

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download the ZIP file
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFilename = `OrcaFlex_Models_${timestamp}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onCancel(): void {
    this.close();
  }

  private close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
