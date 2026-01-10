import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BuoyancyModuleConfig } from '../../types';

interface BuoyancyModuleRow {
  name: string;
  outerDiameter: number;      // mm
  length: number;             // mm
  dryMass: number;            // kg
  apparentMassInWater: number; // kg
  numberOfModules: number;
  spacing: number;            // m
}

@Component({
  selector: 'orcaflex-buoyancy-modules-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TableModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `
    <p-dialog
      header="Import Buoyancy Modules"
      [visible]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '900px' }"
      styleClass="import-dialog"
      (onHide)="onCancel()"
    >
      <div class="dialog-content">
        <div class="paste-instructions">
          <p>Paste data from Excel with columns: <strong>Name, OD (mm), Length (mm), Mass in Air (kg), Apparent Mass (kg), Count, Spacing (m)</strong></p>
          <p class="hint">Click in the table and press Ctrl+V (Cmd+V on Mac) to paste. Apparent mass is negative for buoyant modules.</p>
        </div>

        <div
          class="table-container"
          tabindex="0"
          (paste)="handlePaste($event)"
          (keydown)="handleKeydown($event)"
        >
          <p-table [value]="rows()" [tableStyle]="{ 'min-width': '100%' }" [scrollable]="true" scrollHeight="300px">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 16%">Name</th>
                <th style="width: 12%">OD (mm)</th>
                <th style="width: 12%">Length (mm)</th>
                <th style="width: 14%">Mass Air (kg)</th>
                <th style="width: 14%">Apparent (kg)</th>
                <th style="width: 10%">Count</th>
                <th style="width: 12%">Spacing (m)</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr>
                <td>
                  <input
                    type="text"
                    pInputText
                    [(ngModel)]="row.name"
                    placeholder="Name"
                    class="table-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.outerDiameter"
                    placeholder="1450"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.length"
                    placeholder="1600"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.dryMass"
                    placeholder="855.7"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.apparentMassInWater"
                    placeholder="-1220"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.numberOfModules"
                    placeholder="6"
                    class="table-input coord"
                    min="1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.spacing"
                    placeholder="12"
                    class="table-input coord"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="empty-message">
                  Paste Excel data here or add rows manually
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <div class="row-actions">
          <button class="action-btn add" (click)="addRow()">+ Add Row</button>
          <button class="action-btn clear" (click)="clearRows()">Clear All</button>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button class="btn-secondary" (click)="onCancel()">Cancel</button>
          <button class="btn-primary" (click)="onImport()" [disabled]="!hasValidData()">
            Import {{ getValidRowCount() }} Module{{ getValidRowCount() !== 1 ? 's' : '' }}
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .import-dialog .p-dialog {
      background: white;
    }

    :host ::ng-deep .import-dialog .p-dialog-header {
      background: white;
      border-bottom: 1px solid #eee;
      padding: 16px 20px;
    }

    :host ::ng-deep .import-dialog .p-dialog-content {
      background: white;
      padding: 20px;
    }

    :host ::ng-deep .import-dialog .p-dialog-footer {
      background: white;
      border-top: 1px solid #eee;
      padding: 16px 20px;
    }

    :host ::ng-deep .p-dialog-mask {
      background: rgba(0, 0, 0, 0.5);
    }

    .dialog-content {
      padding: 0;
    }

    .paste-instructions {
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .paste-instructions p {
      margin: 0;
      font-size: 12px;
      color: #333;
    }

    .paste-instructions .hint {
      margin-top: 4px;
      font-size: 11px;
      color: #666;
    }

    .table-container {
      border: 2px dashed #ddd;
      border-radius: 4px;
      padding: 4px;
      outline: none;
      transition: border-color 0.2s;
      background: white;
    }

    .table-container:focus {
      border-color: #1976d2;
    }

    :host ::ng-deep .p-datatable {
      background: white;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: #fafafa;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      padding: 8px 4px;
      border: none;
      border-bottom: 1px solid #eee;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      background: white;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 4px 2px;
      border: none;
      border-bottom: 1px solid #f0f0f0;
      background: white;
    }

    .table-input {
      width: 100%;
      padding: 6px 4px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 11px;
      background: white;
    }

    .table-input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .table-input.coord {
      text-align: right;
    }

    .empty-message {
      text-align: center;
      padding: 24px;
      color: #999;
      font-style: italic;
      background: white;
    }

    .row-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .action-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 11px;
      cursor: pointer;
    }

    .action-btn:hover {
      background: #f5f5f5;
    }

    .action-btn.add {
      color: #1976d2;
      border-color: #1976d2;
    }

    .action-btn.clear {
      color: #666;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
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
export class BuoyancyModulesImportDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() import = new EventEmitter<BuoyancyModuleConfig[]>();

  rows = signal<BuoyancyModuleRow[]>([
    { name: '', outerDiameter: 1450, length: 1600, dryMass: 855.7, apparentMassInWater: -1220, numberOfModules: 6, spacing: 12 }
  ]);

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const text = clipboardData.getData('text');
    if (!text) return;

    const parsedRows = this.parseExcelData(text);
    if (parsedRows.length > 0) {
      this.rows.set(parsedRows);
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      return;
    }
  }

  parseExcelData(text: string): BuoyancyModuleRow[] {
    const rows: BuoyancyModuleRow[] = [];
    const lines = text.trim().split('\n');

    for (const line of lines) {
      const cells = line.split(/\t|(?:  +)/);

      if (cells.length >= 1 && cells[0]?.trim()) {
        rows.push({
          name: cells[0]?.trim() || '',
          outerDiameter: parseFloat(cells[1]) || 1450,
          length: parseFloat(cells[2]) || 1600,
          dryMass: parseFloat(cells[3]) || 855.7,
          apparentMassInWater: parseFloat(cells[4]) || -1220,
          numberOfModules: parseInt(cells[5]) || 6,
          spacing: parseFloat(cells[6]) || 12,
        });
      }
    }

    return rows;
  }

  addRow(): void {
    const currentRows = this.rows();
    this.rows.set([
      ...currentRows,
      { name: '', outerDiameter: 1450, length: 1600, dryMass: 855.7, apparentMassInWater: -1220, numberOfModules: 6, spacing: 12 }
    ]);
  }

  clearRows(): void {
    this.rows.set([{ name: '', outerDiameter: 1450, length: 1600, dryMass: 855.7, apparentMassInWater: -1220, numberOfModules: 6, spacing: 12 }]);
  }

  hasValidData(): boolean {
    return this.rows().some(row => row.name.trim() !== '');
  }

  getValidRowCount(): number {
    return this.rows().filter(row => row.name.trim() !== '').length;
  }

  onImport(): void {
    const validRows = this.rows().filter(row => row.name.trim() !== '');

    const modules: BuoyancyModuleConfig[] = validRows.map(row => ({
      id: crypto.randomUUID(),
      name: row.name.trim(),
      outerDiameter: row.outerDiameter / 1000,  // mm to m
      length: row.length / 1000,                // mm to m
      dryMass: row.dryMass,
      apparentMassInWater: row.apparentMassInWater,
      dragCoefficient: 0.8,
      numberOfModules: row.numberOfModules,
      spacing: row.spacing,
    }));

    this.import.emit(modules);
    this.close();
  }

  onCancel(): void {
    this.close();
  }

  private close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.rows.set([{ name: '', outerDiameter: 1450, length: 1600, dryMass: 855.7, apparentMassInWater: -1220, numberOfModules: 6, spacing: 12 }]);
  }
}
