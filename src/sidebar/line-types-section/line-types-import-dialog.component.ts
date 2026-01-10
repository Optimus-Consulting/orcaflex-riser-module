import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LineTypeConfig } from '../../types';

interface LineTypeRow {
  name: string;
  outerDiameter: number;     // mm
  innerDiameter: number;     // mm
  dryMass: number;           // kg/m
  bendingStiffness: number;  // kN·m² (EI)
  axialStiffness: number;    // kN (EA)
  torsionalStiffness: number; // kN·m² (GJ)
  allowableTension: number;  // kN
  minBendRadius: number;     // m
}

@Component({
  selector: 'orcaflex-line-types-import-dialog',
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
      header="Import Line Types"
      [visible]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '1000px' }"
      styleClass="import-dialog"
      (onHide)="onCancel()"
    >
      <div class="dialog-content">
        <div class="paste-instructions">
          <p>Paste data from Excel with columns: <strong>Name, OD (mm), ID (mm), Dry Mass (kg/m), EI (kN·m²), EA (kN), GJ (kN·m²), Tension (kN), MBR (m)</strong></p>
          <p class="hint">Click in the table and press Ctrl+V (Cmd+V on Mac) to paste</p>
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
                <th style="width: 14%">Name</th>
                <th style="width: 10%">OD (mm)</th>
                <th style="width: 10%">ID (mm)</th>
                <th style="width: 11%">Dry Mass</th>
                <th style="width: 11%">EI (kN·m²)</th>
                <th style="width: 11%">EA (kN)</th>
                <th style="width: 11%">GJ (kN·m²)</th>
                <th style="width: 11%">Tension (kN)</th>
                <th style="width: 11%">MBR (m)</th>
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
                    placeholder="355.6"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.innerDiameter"
                    placeholder="254"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.dryMass"
                    placeholder="184.2"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.bendingStiffness"
                    placeholder="124.87"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.axialStiffness"
                    placeholder="711200"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.torsionalStiffness"
                    placeholder="10"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.allowableTension"
                    placeholder="5000"
                    class="table-input coord"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    pInputText
                    [(ngModel)]="row.minBendRadius"
                    placeholder="3.675"
                    class="table-input coord"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="9" class="empty-message">
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
            Import {{ getValidRowCount() }} Line Type{{ getValidRowCount() !== 1 ? 's' : '' }}
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
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      padding: 8px 2px;
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
export class LineTypesImportDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() import = new EventEmitter<LineTypeConfig[]>();

  private getDefaultRow(): LineTypeRow {
    return {
      name: '',
      outerDiameter: 355.6,
      innerDiameter: 254,
      dryMass: 184.2,
      bendingStiffness: 124.87,
      axialStiffness: 711200,
      torsionalStiffness: 10,
      allowableTension: 5000,
      minBendRadius: 3.675
    };
  }

  rows = signal<LineTypeRow[]>([this.getDefaultRow()]);

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

  parseExcelData(text: string): LineTypeRow[] {
    const rows: LineTypeRow[] = [];
    const lines = text.trim().split('\n');

    for (const line of lines) {
      const cells = line.split(/\t|(?:  +)/);

      if (cells.length >= 1 && cells[0]?.trim()) {
        rows.push({
          name: cells[0]?.trim() || '',
          outerDiameter: parseFloat(cells[1]) || 355.6,
          innerDiameter: parseFloat(cells[2]) || 254,
          dryMass: parseFloat(cells[3]) || 184.2,
          bendingStiffness: parseFloat(cells[4]) || 124.87,
          axialStiffness: parseFloat(cells[5]) || 711200,
          torsionalStiffness: parseFloat(cells[6]) || 10,
          allowableTension: parseFloat(cells[7]) || 5000,
          minBendRadius: parseFloat(cells[8]) || 3.675,
        });
      }
    }

    return rows;
  }

  addRow(): void {
    const currentRows = this.rows();
    this.rows.set([...currentRows, this.getDefaultRow()]);
  }

  clearRows(): void {
    this.rows.set([this.getDefaultRow()]);
  }

  hasValidData(): boolean {
    return this.rows().some(row => row.name.trim() !== '');
  }

  getValidRowCount(): number {
    return this.rows().filter(row => row.name.trim() !== '').length;
  }

  onImport(): void {
    const validRows = this.rows().filter(row => row.name.trim() !== '');

    const lineTypes: LineTypeConfig[] = validRows.map(row => ({
      id: crypto.randomUUID(),
      name: row.name.trim(),
      outerDiameter: row.outerDiameter / 1000,  // mm to m
      innerDiameter: row.innerDiameter / 1000,  // mm to m
      dryMass: row.dryMass,
      bendingStiffness: row.bendingStiffness,
      axialStiffness: row.axialStiffness,
      torsionalStiffness: row.torsionalStiffness,
      poissonRatio: 0.5,
      allowableTension: row.allowableTension,
      minBendRadius: row.minBendRadius,
      dragCoefficients: { normal: 1.2, axial: 0.008 },
      addedMassCoefficients: { normal: 1.0, axial: 0.0 },
    }));

    this.import.emit(lineTypes);
    this.close();
  }

  onCancel(): void {
    this.close();
  }

  private close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.rows.set([this.getDefaultRow()]);
  }
}
