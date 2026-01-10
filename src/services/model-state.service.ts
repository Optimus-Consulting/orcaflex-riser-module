import { Injectable, signal, computed } from '@angular/core';
import {
  OrcaFlexModel,
  EnvironmentConfig,
  VesselConfig,
  LineTypeConfig,
  RiserConfig,
  UndoableAction,
  LogEntry,
  ModelValidationResult,
  DEFAULT_ENVIRONMENT,
  DEFAULT_VESSEL,
  DEFAULT_LINE_TYPES,
  DEFAULT_BUOYANCY_MODULE,
} from '../types';

@Injectable({ providedIn: 'root' })
export class ModelStateService {
  // Core model state
  private readonly _model = signal<OrcaFlexModel>(this.createEmptyModel());
  private readonly _selectedRiserId = signal<string | null>(null);
  private readonly _selectedVesselId = signal<string | null>(null);
  private readonly _isCalculating = signal<boolean>(false);
  private readonly _isDirty = signal<boolean>(false);

  // Undo/Redo stacks
  private readonly _undoStack = signal<UndoableAction[]>([]);
  private readonly _redoStack = signal<UndoableAction[]>([]);
  private readonly MAX_HISTORY = 50;

  // Logs
  private readonly _logs = signal<LogEntry[]>([]);

  // Validation
  private readonly _validationResult = signal<ModelValidationResult | null>(null);

  // Public readonly signals
  readonly model = this._model.asReadonly();
  readonly selectedRiserId = this._selectedRiserId.asReadonly();
  readonly selectedVesselId = this._selectedVesselId.asReadonly();
  readonly isCalculating = this._isCalculating.asReadonly();
  readonly isDirty = this._isDirty.asReadonly();
  readonly logs = this._logs.asReadonly();
  readonly validationResult = this._validationResult.asReadonly();

  // Computed values
  readonly environment = computed(() => this._model().environment);
  readonly vessels = computed(() => this._model().vessels);
  readonly lineTypes = computed(() => this._model().lineTypes);
  readonly buoyancyModules = computed(() => this._model().buoyancyModules);
  readonly risers = computed(() => this._model().risers);

  readonly selectedRiser = computed(() => {
    const id = this._selectedRiserId();
    return id ? this._model().risers.find(r => r.id === id) ?? null : null;
  });

  readonly selectedVessel = computed(() => {
    const id = this._selectedVesselId();
    return id ? this._model().vessels.find(v => v.id === id) ?? null : null;
  });

  readonly canUndo = computed(() => this._undoStack().length > 0);
  readonly canRedo = computed(() => this._redoStack().length > 0);

  readonly riserCount = computed(() => this._model().risers.length);
  readonly vesselCount = computed(() => this._model().vessels.length);

  // Model operations
  newModel(): void {
    this._model.set(this.createEmptyModel());
    this._selectedRiserId.set(null);
    this._selectedVesselId.set(null);
    this._undoStack.set([]);
    this._redoStack.set([]);
    this._isDirty.set(false);
    this.addLog('info', 'New model created');
  }

  loadModel(model: OrcaFlexModel): void {
    this._model.set(model);
    this._selectedRiserId.set(null);
    this._selectedVesselId.set(null);
    this._undoStack.set([]);
    this._redoStack.set([]);
    this._isDirty.set(false);
    this.addLog('success', `Model "${model.name}" loaded`);
  }

  // Environment operations
  updateEnvironment(env: EnvironmentConfig): void {
    const previous = this._model().environment;
    this.pushUndoAction({ type: 'UPDATE_ENVIRONMENT', previous, current: env });
    this._model.update(m => ({ ...m, environment: env, updatedAt: new Date() }));
    this._isDirty.set(true);
  }

  // Vessel operations
  addVessel(vessel: VesselConfig): void {
    this.pushUndoAction({ type: 'ADD_VESSEL', vessel });
    this._model.update(m => ({
      ...m,
      vessels: [...m.vessels, vessel],
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
    this.addLog('info', `Vessel "${vessel.name}" added`);
  }

  updateVessel(vessel: VesselConfig): void {
    const previous = this._model().vessels.find(v => v.id === vessel.id);
    if (previous) {
      this.pushUndoAction({ type: 'UPDATE_VESSEL', previous, current: vessel });
    }
    this._model.update(m => ({
      ...m,
      vessels: m.vessels.map(v => (v.id === vessel.id ? vessel : v)),
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
  }

  deleteVessel(vesselId: string): void {
    const vessel = this._model().vessels.find(v => v.id === vesselId);
    if (vessel) {
      this.pushUndoAction({ type: 'DELETE_VESSEL', vessel });
      this._model.update(m => ({
        ...m,
        vessels: m.vessels.filter(v => v.id !== vesselId),
        updatedAt: new Date(),
      }));
      if (this._selectedVesselId() === vesselId) {
        this._selectedVesselId.set(null);
      }
      this._isDirty.set(true);
      this.addLog('info', `Vessel "${vessel.name}" deleted`);
    }
  }

  // Line type operations
  addLineType(lineType: LineTypeConfig): void {
    this.pushUndoAction({ type: 'ADD_LINE_TYPE', lineType });
    this._model.update(m => ({
      ...m,
      lineTypes: [...m.lineTypes, lineType],
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
    this.addLog('info', `Line type "${lineType.name}" added`);
  }

  updateLineType(lineType: LineTypeConfig): void {
    const previous = this._model().lineTypes.find(lt => lt.id === lineType.id);
    if (previous) {
      this.pushUndoAction({ type: 'UPDATE_LINE_TYPE', previous, current: lineType });
    }
    this._model.update(m => ({
      ...m,
      lineTypes: m.lineTypes.map(lt => (lt.id === lineType.id ? lineType : lt)),
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
  }

  deleteLineType(lineTypeId: string): void {
    const lineType = this._model().lineTypes.find(lt => lt.id === lineTypeId);
    if (lineType) {
      this.pushUndoAction({ type: 'DELETE_LINE_TYPE', lineType });
      this._model.update(m => ({
        ...m,
        lineTypes: m.lineTypes.filter(lt => lt.id !== lineTypeId),
        updatedAt: new Date(),
      }));
      this._isDirty.set(true);
      this.addLog('info', `Line type "${lineType.name}" deleted`);
    }
  }

  // Buoyancy module operations
  addBuoyancyModule(buoyancy: any): void {
    this._model.update(m => ({
      ...m,
      buoyancyModules: [...m.buoyancyModules, buoyancy],
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
    this.addLog('info', `Buoyancy module "${buoyancy.name}" added`);
  }

  updateBuoyancyModule(buoyancy: any): void {
    this._model.update(m => ({
      ...m,
      buoyancyModules: m.buoyancyModules.map(bm => (bm.id === buoyancy.id ? buoyancy : bm)),
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
  }

  deleteBuoyancyModule(buoyancyId: string): void {
    const buoyancy = this._model().buoyancyModules.find(bm => bm.id === buoyancyId);
    if (buoyancy) {
      this._model.update(m => ({
        ...m,
        buoyancyModules: m.buoyancyModules.filter(bm => bm.id !== buoyancyId),
        updatedAt: new Date(),
      }));
      this._isDirty.set(true);
      this.addLog('info', `Buoyancy module "${buoyancy.name}" deleted`);
    }
  }

  // Riser operations
  addRiser(riser: RiserConfig): void {
    this.pushUndoAction({ type: 'ADD_RISER', riser });
    this._model.update(m => ({
      ...m,
      risers: [...m.risers, riser],
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
    this.addLog('info', `Riser "${riser.name}" added`);
  }

  updateRiser(riser: RiserConfig): void {
    const previous = this._model().risers.find(r => r.id === riser.id);
    if (previous) {
      this.pushUndoAction({ type: 'UPDATE_RISER', previous, current: riser });
    }
    this._model.update(m => ({
      ...m,
      risers: m.risers.map(r => (r.id === riser.id ? riser : r)),
      updatedAt: new Date(),
    }));
    this._isDirty.set(true);
  }

  deleteRiser(riserId: string): void {
    const riser = this._model().risers.find(r => r.id === riserId);
    if (riser) {
      this.pushUndoAction({ type: 'DELETE_RISER', riser });
      this._model.update(m => ({
        ...m,
        risers: m.risers.filter(r => r.id !== riserId),
        updatedAt: new Date(),
      }));
      if (this._selectedRiserId() === riserId) {
        this._selectedRiserId.set(null);
      }
      this._isDirty.set(true);
      this.addLog('info', `Riser "${riser.name}" deleted`);
    }
  }

  // Selection
  selectRiser(riserId: string | null): void {
    this._selectedRiserId.set(riserId);
  }

  selectVessel(vesselId: string | null): void {
    this._selectedVesselId.set(vesselId);
  }

  // Undo/Redo
  undo(): void {
    const stack = this._undoStack();
    if (stack.length === 0) return;

    const action = stack[stack.length - 1];
    this._undoStack.update(s => s.slice(0, -1));
    this._redoStack.update(s => [...s, action]);

    this.applyUndoAction(action);
    this._isDirty.set(true);
    this.addLog('info', 'Undo performed');
  }

  redo(): void {
    const stack = this._redoStack();
    if (stack.length === 0) return;

    const action = stack[stack.length - 1];
    this._redoStack.update(s => s.slice(0, -1));
    this._undoStack.update(s => [...s, action]);

    this.applyRedoAction(action);
    this._isDirty.set(true);
    this.addLog('info', 'Redo performed');
  }

  // Calculation state
  setCalculating(calculating: boolean): void {
    this._isCalculating.set(calculating);
  }

  // Validation
  setValidationResult(result: ModelValidationResult | null): void {
    this._validationResult.set(result);
  }

  // Logging
  addLog(level: LogEntry['level'], message: string, details?: string): void {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      details,
    };
    this._logs.update(logs => [...logs.slice(-99), entry]);
  }

  clearLogs(): void {
    this._logs.set([]);
  }

  // Private helpers
  private createEmptyModel(): OrcaFlexModel {
    return {
      id: crypto.randomUUID(),
      name: 'New Model',
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: { ...DEFAULT_ENVIRONMENT },
      vessels: [{ ...DEFAULT_VESSEL }],
      lineTypes: DEFAULT_LINE_TYPES.map(lt => ({ ...lt })),
      buoyancyModules: [{ ...DEFAULT_BUOYANCY_MODULE }],
      risers: [],
    };
  }

  private pushUndoAction(action: UndoableAction): void {
    this._undoStack.update(stack => {
      const newStack = [...stack, action];
      if (newStack.length > this.MAX_HISTORY) {
        return newStack.slice(-this.MAX_HISTORY);
      }
      return newStack;
    });
    this._redoStack.set([]);
  }

  private applyUndoAction(action: UndoableAction): void {
    switch (action.type) {
      case 'UPDATE_ENVIRONMENT':
        this._model.update(m => ({ ...m, environment: action.previous }));
        break;
      case 'ADD_VESSEL':
        this._model.update(m => ({
          ...m,
          vessels: m.vessels.filter(v => v.id !== action.vessel.id),
        }));
        break;
      case 'UPDATE_VESSEL':
        this._model.update(m => ({
          ...m,
          vessels: m.vessels.map(v => (v.id === action.previous.id ? action.previous : v)),
        }));
        break;
      case 'DELETE_VESSEL':
        this._model.update(m => ({ ...m, vessels: [...m.vessels, action.vessel] }));
        break;
      case 'ADD_LINE_TYPE':
        this._model.update(m => ({
          ...m,
          lineTypes: m.lineTypes.filter(lt => lt.id !== action.lineType.id),
        }));
        break;
      case 'UPDATE_LINE_TYPE':
        this._model.update(m => ({
          ...m,
          lineTypes: m.lineTypes.map(lt => (lt.id === action.previous.id ? action.previous : lt)),
        }));
        break;
      case 'DELETE_LINE_TYPE':
        this._model.update(m => ({ ...m, lineTypes: [...m.lineTypes, action.lineType] }));
        break;
      case 'ADD_RISER':
        this._model.update(m => ({
          ...m,
          risers: m.risers.filter(r => r.id !== action.riser.id),
        }));
        break;
      case 'UPDATE_RISER':
        this._model.update(m => ({
          ...m,
          risers: m.risers.map(r => (r.id === action.previous.id ? action.previous : r)),
        }));
        break;
      case 'DELETE_RISER':
        this._model.update(m => ({ ...m, risers: [...m.risers, action.riser] }));
        break;
    }
  }

  private applyRedoAction(action: UndoableAction): void {
    switch (action.type) {
      case 'UPDATE_ENVIRONMENT':
        this._model.update(m => ({ ...m, environment: action.current }));
        break;
      case 'ADD_VESSEL':
        this._model.update(m => ({ ...m, vessels: [...m.vessels, action.vessel] }));
        break;
      case 'UPDATE_VESSEL':
        this._model.update(m => ({
          ...m,
          vessels: m.vessels.map(v => (v.id === action.current.id ? action.current : v)),
        }));
        break;
      case 'DELETE_VESSEL':
        this._model.update(m => ({
          ...m,
          vessels: m.vessels.filter(v => v.id !== action.vessel.id),
        }));
        break;
      case 'ADD_LINE_TYPE':
        this._model.update(m => ({ ...m, lineTypes: [...m.lineTypes, action.lineType] }));
        break;
      case 'UPDATE_LINE_TYPE':
        this._model.update(m => ({
          ...m,
          lineTypes: m.lineTypes.map(lt => (lt.id === action.current.id ? action.current : lt)),
        }));
        break;
      case 'DELETE_LINE_TYPE':
        this._model.update(m => ({
          ...m,
          lineTypes: m.lineTypes.filter(lt => lt.id !== action.lineType.id),
        }));
        break;
      case 'ADD_RISER':
        this._model.update(m => ({ ...m, risers: [...m.risers, action.riser] }));
        break;
      case 'UPDATE_RISER':
        this._model.update(m => ({
          ...m,
          risers: m.risers.map(r => (r.id === action.current.id ? action.current : r)),
        }));
        break;
      case 'DELETE_RISER':
        this._model.update(m => ({
          ...m,
          risers: m.risers.filter(r => r.id !== action.riser.id),
        }));
        break;
    }
  }
}
