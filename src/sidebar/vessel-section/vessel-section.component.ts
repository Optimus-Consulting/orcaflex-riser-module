import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelStateService } from '../../services/model-state.service';
import { OrcaFlexApiService } from '../../services/orcaflex-api.service';
import { VesselConfig, ConnectionPoint, DEFAULT_VESSEL } from '../../types';
import { ConnectionPointsImportDialogComponent } from './connection-points-import-dialog.component';

@Component({
  selector: 'orcaflex-vessel-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ConnectionPointsImportDialogComponent],
  template: `
    <div class="section-content">
      <!-- Toolbar -->
      <div class="toolbar">
        <button class="toolbar-btn" (click)="addVessel()" title="Add new vessel">
          <span class="icon">+</span> Add
        </button>
        <button class="toolbar-btn" (click)="fileInput.click()" title="Import vessel from OrcaFlex YAML">
          Import
        </button>
        <input
          #fileInput
          type="file"
          accept=".yml,.yaml"
          style="display: none"
          (change)="onFileSelected($event)"
        />
      </div>

      <!-- Vessel List -->
      @for (vessel of vessels(); track vessel.id) {
        <div
          class="vessel-item"
          [class.selected]="selectedVesselId() === vessel.id"
        >
          <div class="vessel-header" (click)="selectVessel(vessel.id)">
            <span class="vessel-name">{{ vessel.name }}</span>
            <button class="delete-btn" (click)="deleteVessel(vessel.id); $event.stopPropagation()" title="Delete vessel">×</button>
          </div>
          <div class="vessel-dims">
            {{ vessel.length }}m × {{ vessel.breadth }}m × {{ vessel.depth }}m
          </div>

          @if (selectedVesselId() === vessel.id) {
            <div class="vessel-details" (click)="$event.stopPropagation()">
              <!-- Name -->
              <div class="form-group">
                <label>Name</label>
                <input type="text" [ngModel]="vessel.name"
                  (ngModelChange)="updateVesselName(vessel, $event)" />
              </div>

              <!-- Dimensions -->
              <div class="form-row">
                <div class="form-group third">
                  <label>Length (m)</label>
                  <input type="number" [ngModel]="vessel.length"
                    (ngModelChange)="updateVesselDimension(vessel, 'length', $event)" />
                </div>
                <div class="form-group third">
                  <label>Breadth (m)</label>
                  <input type="number" [ngModel]="vessel.breadth"
                    (ngModelChange)="updateVesselDimension(vessel, 'breadth', $event)" />
                </div>
                <div class="form-group third">
                  <label>Depth (m)</label>
                  <input type="number" [ngModel]="vessel.depth"
                    (ngModelChange)="updateVesselDimension(vessel, 'depth', $event)" />
                </div>
              </div>

              <div class="form-group">
                <label>Draft (m)</label>
                <input type="number" [ngModel]="vessel.draft"
                  (ngModelChange)="updateVesselDimension(vessel, 'draft', $event)" />
              </div>

              <!-- Position -->
              <div class="subsection-title">Position</div>
              <div class="form-row">
                <div class="form-group third">
                  <label>X</label>
                  <input type="number" [ngModel]="vessel.position.x"
                    (ngModelChange)="updateVesselPosition(vessel, 'x', $event)" />
                </div>
                <div class="form-group third">
                  <label>Y</label>
                  <input type="number" [ngModel]="vessel.position.y"
                    (ngModelChange)="updateVesselPosition(vessel, 'y', $event)" />
                </div>
                <div class="form-group third">
                  <label>Z</label>
                  <input type="number" [ngModel]="vessel.position.z"
                    (ngModelChange)="updateVesselPosition(vessel, 'z', $event)" />
                </div>
              </div>

              <!-- Orientation -->
              <div class="subsection-title">Orientation</div>
              <div class="form-row">
                <div class="form-group third">
                  <label>Heading (°)</label>
                  <input type="number" [ngModel]="vessel.orientation.heading"
                    (ngModelChange)="updateVesselOrientation(vessel, 'heading', $event)" />
                </div>
                <div class="form-group third">
                  <label>Roll (°)</label>
                  <input type="number" [ngModel]="vessel.orientation.roll"
                    (ngModelChange)="updateVesselOrientation(vessel, 'roll', $event)" />
                </div>
                <div class="form-group third">
                  <label>Pitch (°)</label>
                  <input type="number" [ngModel]="vessel.orientation.pitch"
                    (ngModelChange)="updateVesselOrientation(vessel, 'pitch', $event)" />
                </div>
              </div>

              <!-- Connection Points -->
              <div class="connection-points">
                <div class="cp-header">
                  <span>Connection Points</span>
                  <div class="cp-actions">
                    <button class="import-cp-btn" (click)="openImportDialog(vessel); $event.stopPropagation()" title="Import from Excel">
                      Import
                    </button>
                    <button class="add-cp-btn" (click)="addConnectionPoint(vessel); $event.stopPropagation()">+</button>
                  </div>
                </div>
                @for (cp of vessel.connectionPoints; track cp.id; let idx = $index) {
                  <div class="cp-row" [class.editing]="editingCpIdx() === idx">
                    @if (editingCpIdx() === idx) {
                      <input type="text" class="cp-input name" [(ngModel)]="editingCp.name" placeholder="Name" />
                      <input type="number" class="cp-input coord" [(ngModel)]="editingCp.x" placeholder="X" />
                      <input type="number" class="cp-input coord" [(ngModel)]="editingCp.y" placeholder="Y" />
                      <input type="number" class="cp-input coord" [(ngModel)]="editingCp.z" placeholder="Z" />
                      <button class="icon-btn save" (click)="saveCpEdit(vessel, idx); $event.stopPropagation()">✓</button>
                      <button class="icon-btn cancel" (click)="cancelCpEdit(); $event.stopPropagation()">✕</button>
                    } @else {
                      <span class="cp-name">{{ cp.name }}</span>
                      <span class="cp-coords">({{ cp.x }}, {{ cp.y }}, {{ cp.z }})</span>
                      <button class="icon-btn edit" (click)="startCpEdit(idx, cp); $event.stopPropagation()">✎</button>
                      <button class="icon-btn delete" (click)="deleteCp(vessel, idx); $event.stopPropagation()">×</button>
                    }
                  </div>
                }
                @if (vessel.connectionPoints.length === 0) {
                  <div class="no-cp">No connection points defined</div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (vessels().length === 0) {
        <div class="empty-state">
          <p>No vessels defined</p>
          <p class="hint">Add a vessel or import from OrcaFlex YAML</p>
        </div>
      }

      <!-- Import status -->
      @if (importing()) {
        <div class="import-status">
          Importing vessel from YAML...
        </div>
      }

      <!-- Connection Points Import Dialog -->
      <orcaflex-connection-points-import-dialog
        [(visible)]="showImportDialog"
        (import)="handleConnectionPointsImport($event)"
      />
    </div>
  `,
  styles: [`
    .section-content {
      padding: 8px;
    }

    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .toolbar-btn {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      background: white;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .toolbar-btn:hover {
      background: var(--oc-bg-subtle, #f5f5f5);
      border-color: var(--oc-primary, #1976d2);
    }

    .toolbar-btn .icon {
      font-weight: bold;
    }

    .vessel-item {
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
      overflow: hidden;
    }

    .vessel-item:hover {
      border-color: var(--oc-primary, #1976d2);
    }

    .vessel-item.selected {
      border-color: var(--oc-primary, #1976d2);
      background: var(--oc-bg-selected, #e3f2fd);
    }

    .vessel-header {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .vessel-name {
      font-weight: 500;
      font-size: 12px;
    }

    .delete-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--oc-text-secondary, #999);
      font-size: 16px;
      cursor: pointer;
      border-radius: 3px;
    }

    .delete-btn:hover {
      background: #ffebee;
      color: var(--oc-error, #f44336);
    }

    .vessel-dims {
      padding: 0 12px 8px;
      font-size: 11px;
      color: var(--oc-text-secondary, #666);
    }

    .vessel-details {
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

    .form-group input {
      width: 100%;
      padding: 5px 6px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 4px;
      font-size: 12px;
      background: white;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--oc-primary, #1976d2);
    }

    .form-row {
      display: flex;
      gap: 6px;
    }

    .form-group.third {
      flex: 1;
    }

    .subsection-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--oc-text-secondary, #666);
      margin: 12px 0 6px 0;
      padding-top: 8px;
      border-top: 1px solid var(--oc-border-light, #eee);
    }

    .connection-points {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--oc-border-light, #eee);
    }

    .cp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--oc-text-secondary, #666);
      margin-bottom: 8px;
    }

    .cp-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .import-cp-btn {
      padding: 2px 6px;
      border: 1px solid var(--oc-primary, #1976d2);
      border-radius: 3px;
      background: transparent;
      color: var(--oc-primary, #1976d2);
      font-size: 9px;
      cursor: pointer;
      text-transform: none;
      font-weight: 500;
    }

    .import-cp-btn:hover {
      background: var(--oc-primary, #1976d2);
      color: white;
    }

    .add-cp-btn {
      width: 20px;
      height: 20px;
      border: 1px dashed var(--oc-border-light, #ddd);
      border-radius: 3px;
      background: transparent;
      color: var(--oc-text-secondary, #666);
      font-size: 14px;
      cursor: pointer;
    }

    .add-cp-btn:hover {
      border-color: var(--oc-primary, #1976d2);
      color: var(--oc-primary, #1976d2);
    }

    .cp-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 11px;
    }

    .cp-row.editing {
      padding: 6px 0;
    }

    .cp-name {
      flex: 1;
      font-weight: 500;
    }

    .cp-coords {
      color: var(--oc-text-secondary, #666);
      font-family: monospace;
      font-size: 10px;
    }

    .cp-input {
      padding: 3px 4px;
      border: 1px solid var(--oc-border-light, #ddd);
      border-radius: 3px;
      font-size: 10px;
    }

    .cp-input.name {
      width: 60px;
    }

    .cp-input.coord {
      width: 40px;
      text-align: right;
    }

    .icon-btn {
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      border-radius: 3px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
    }

    .icon-btn:hover {
      background: var(--oc-bg-hover, #f0f0f0);
    }

    .icon-btn.edit {
      color: var(--oc-primary, #1976d2);
    }

    .icon-btn.delete {
      color: var(--oc-error, #f44336);
    }

    .icon-btn.save {
      color: var(--oc-success, #4caf50);
    }

    .icon-btn.cancel {
      color: var(--oc-text-secondary, #666);
    }

    .no-cp {
      font-size: 11px;
      color: var(--oc-text-tertiary, #999);
      font-style: italic;
      padding: 4px 0;
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

    .import-status {
      text-align: center;
      padding: 8px;
      background: var(--oc-bg-subtle, #f5f5f5);
      border-radius: 4px;
      font-size: 11px;
      color: var(--oc-text-secondary, #666);
    }
  `]
})
export class VesselSectionComponent {
  private modelState = inject(ModelStateService);
  private apiService = inject(OrcaFlexApiService);

  vessels = this.modelState.vessels;
  selectedVesselId = this.modelState.selectedVesselId;

  importing = signal(false);

  // Connection point editing state
  editingCpIdx = signal<number | null>(null);
  editingCp: ConnectionPoint = { id: '', name: '', x: 0, y: 0, z: 0 };

  // Connection points import dialog state
  showImportDialog = false;
  importTargetVesselId: string | null = null;

  selectVessel(id: string): void {
    this.modelState.selectVessel(
      this.selectedVesselId() === id ? null : id
    );
  }

  addVessel(): void {
    const count = this.vessels().length + 1;
    const newVessel: VesselConfig = {
      ...DEFAULT_VESSEL,
      id: crypto.randomUUID(),
      name: `Vessel ${count}`,
      connectionPoints: [
        { id: crypto.randomUUID(), name: 'CP1', x: 0, y: 0, z: -10 },
      ],
    };
    this.modelState.addVessel(newVessel);
    this.modelState.selectVessel(newVessel.id);
  }

  deleteVessel(id: string): void {
    this.modelState.deleteVessel(id);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.importing.set(true);

    try {
      const result = await this.apiService.parseVesselFromYaml(file);
      if (result.vessels && result.vessels.length > 0) {
        for (const vessel of result.vessels) {
          const newVessel: VesselConfig = {
            id: crypto.randomUUID(),
            name: vessel.name,
            length: vessel.length || 250,
            breadth: vessel.breadth || 50,
            depth: vessel.depth || 30,
            draft: vessel.draft || 15,
            position: {
              x: (vessel as any).initialX || 0,
              y: (vessel as any).initialY || 0,
              z: (vessel as any).initialZ || 0,
            },
            orientation: {
              heading: (vessel as any).initialHeading || 0,
              roll: (vessel as any).initialHeel || 0,
              pitch: (vessel as any).initialTrim || 0,
            },
            connectionPoints: (vessel.connectionPoints || []).map((cp: any) => ({
              id: crypto.randomUUID(),
              name: cp.name || 'CP',
              x: cp.x || 0,
              y: cp.y || 0,
              z: cp.z || 0,
            })),
          };
          this.modelState.addVessel(newVessel);
        }
        this.modelState.addLog('success', `Imported ${result.vessels.length} vessel(s) from YAML`);
      } else {
        this.modelState.addLog('warning', 'No vessels found in YAML file');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.modelState.addLog('error', `Failed to import vessel: ${message}`);
    } finally {
      this.importing.set(false);
      input.value = '';
    }
  }

  updateVesselName(vessel: VesselConfig, name: string): void {
    this.modelState.updateVessel({ ...vessel, name });
  }

  updateVesselDimension(vessel: VesselConfig, dim: 'length' | 'breadth' | 'depth' | 'draft', value: number): void {
    this.modelState.updateVessel({ ...vessel, [dim]: value });
  }

  updateVesselPosition(vessel: VesselConfig, axis: 'x' | 'y' | 'z', value: number): void {
    this.modelState.updateVessel({
      ...vessel,
      position: { ...vessel.position, [axis]: value }
    });
  }

  updateVesselOrientation(vessel: VesselConfig, param: 'heading' | 'roll' | 'pitch', value: number): void {
    this.modelState.updateVessel({
      ...vessel,
      orientation: { ...vessel.orientation, [param]: value }
    });
  }

  // Connection point management
  addConnectionPoint(vessel: VesselConfig): void {
    const count = vessel.connectionPoints.length + 1;
    const newCp: ConnectionPoint = {
      id: crypto.randomUUID(),
      name: `CP${count}`,
      x: 0,
      y: 0,
      z: -10,
    };
    this.modelState.updateVessel({
      ...vessel,
      connectionPoints: [...vessel.connectionPoints, newCp],
    });
  }

  startCpEdit(idx: number, cp: ConnectionPoint): void {
    this.editingCpIdx.set(idx);
    this.editingCp = { ...cp };
  }

  saveCpEdit(vessel: VesselConfig, idx: number): void {
    const connectionPoints = [...vessel.connectionPoints];
    connectionPoints[idx] = { ...this.editingCp };
    this.modelState.updateVessel({ ...vessel, connectionPoints });
    this.editingCpIdx.set(null);
  }

  cancelCpEdit(): void {
    this.editingCpIdx.set(null);
  }

  deleteCp(vessel: VesselConfig, idx: number): void {
    const connectionPoints = vessel.connectionPoints.filter((_, i) => i !== idx);
    this.modelState.updateVessel({ ...vessel, connectionPoints });
  }

  // Connection points import dialog methods
  openImportDialog(vessel: VesselConfig): void {
    this.importTargetVesselId = vessel.id;
    this.showImportDialog = true;
  }

  handleConnectionPointsImport(connectionPoints: ConnectionPoint[]): void {
    if (!this.importTargetVesselId) return;

    const vessel = this.vessels().find(v => v.id === this.importTargetVesselId);
    if (!vessel) return;

    // Add imported connection points to the vessel
    this.modelState.updateVessel({
      ...vessel,
      connectionPoints: [...vessel.connectionPoints, ...connectionPoints],
    });

    this.modelState.addLog('success', `Imported ${connectionPoints.length} connection point(s)`);
    this.importTargetVesselId = null;
  }
}
