import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelStateService } from '../services/model-state.service';
import { OrcaFlexApiService } from '../services/orcaflex-api.service';
import {
  EnvironmentSectionComponent,
  VesselSectionComponent,
  LineTypesSectionComponent,
  RisersSectionComponent,
  ResultsSectionComponent,
  LogsSectionComponent,
} from '../sidebar';
import { ThreeViewComponent } from './three-view';
import { GenerateOrcaflexDialogComponent } from './generate-orcaflex-dialog/generate-orcaflex-dialog.component';
import { RiserConfig, CatenaryRequest, LazyWaveRequest, calculateEffectiveWeight, calculateBuoyancyWeightPerMeter } from '../types';

@Component({
  selector: 'orcaflex-riser-module',
  standalone: true,
  imports: [
    CommonModule,
    EnvironmentSectionComponent,
    VesselSectionComponent,
    LineTypesSectionComponent,
    RisersSectionComponent,
    ResultsSectionComponent,
    LogsSectionComponent,
    ThreeViewComponent,
    GenerateOrcaflexDialogComponent,
  ],
  // Provide services at component level for module federation compatibility
  providers: [
    ModelStateService,
    OrcaFlexApiService,
  ],
  template: `
    <div class="orcaflex-workspace">
      <!-- Left Sidebar -->
      <aside class="sidebar left">
        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('environment')">
            <span class="section-title">Environment</span>
            <span class="toggle-icon">{{ expandedSections.environment ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.environment) {
            <orcaflex-environment-section />
          }
        </div>

        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('vessel')">
            <span class="section-title">Vessel</span>
            <span class="toggle-icon">{{ expandedSections.vessel ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.vessel) {
            <orcaflex-vessel-section />
          }
        </div>

        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('lineTypes')">
            <span class="section-title">Line Types</span>
            <span class="toggle-icon">{{ expandedSections.lineTypes ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.lineTypes) {
            <orcaflex-line-types-section />
          }
        </div>
      </aside>

      <!-- Main Content - 3D View -->
      <main class="main-content">
        <div class="view-container">
          <orcaflex-three-view />
        </div>

        <!-- Status bar -->
        <div class="status-bar">
          <div class="status-left">
            <span class="status-item">
              Water Depth: {{ modelState.environment().sea.waterDepth }}m
            </span>
            <span class="status-item">
              Risers: {{ modelState.riserCount() }}
            </span>
            @if (modelState.isCalculating()) {
              <span class="status-item calculating">
                Calculating...
              </span>
            }
            @if (modelState.isDirty()) {
              <span class="status-item modified">
                Modified
              </span>
            }
          </div>
          <div class="status-right">
            <button class="generate-btn" (click)="showGenerateDialog = true">
              Generate OrcaFlex Models
            </button>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside class="sidebar right">
        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('risers')">
            <span class="section-title">Risers</span>
            <span class="toggle-icon">{{ expandedSections.risers ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.risers) {
            <orcaflex-risers-section (onCalculateRequest)="calculateRiser($event)" />
          }
        </div>

        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('results')">
            <span class="section-title">Results</span>
            <span class="toggle-icon">{{ expandedSections.results ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.results) {
            <orcaflex-results-section />
          }
        </div>

        <div class="sidebar-section">
          <div class="section-header" (click)="toggleSection('logs')">
            <span class="section-title">Logs</span>
            <span class="toggle-icon">{{ expandedSections.logs ? '−' : '+' }}</span>
          </div>
          @if (expandedSections.logs) {
            <orcaflex-logs-section />
          }
        </div>
      </aside>

      <!-- Generate OrcaFlex Dialog -->
      <orcaflex-generate-dialog
        [(visible)]="showGenerateDialog"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .orcaflex-workspace {
      display: flex;
      height: 100%;
      background: var(--oc-bg-workspace, #f5f5f5);
    }

    .sidebar {
      width: 280px;
      background: var(--oc-bg-sidebar, #fff);
      border-right: 1px solid var(--oc-border-light, #e0e0e0);
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar.right {
      border-right: none;
      border-left: 1px solid var(--oc-border-light, #e0e0e0);
    }

    .sidebar-section {
      border-bottom: 1px solid var(--oc-border-light, #e0e0e0);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--oc-bg-section-header, #fafafa);
      cursor: pointer;
      user-select: none;
    }

    .section-header:hover {
      background: var(--oc-bg-hover, #f0f0f0);
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--oc-text-secondary, #666);
    }

    .toggle-icon {
      color: var(--oc-text-tertiary, #999);
      font-weight: bold;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .view-container {
      flex: 1;
      position: relative;
      min-height: 0;
      overflow: hidden;
    }

    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: var(--oc-bg-statusbar, #263238);
      color: var(--oc-text-statusbar, #b0bec5);
      font-size: 11px;
    }

    .status-left {
      display: flex;
      gap: 16px;
    }

    .status-right {
      display: flex;
      gap: 8px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-item.calculating {
      color: var(--oc-warning, #ffc107);
    }

    .status-item.modified {
      color: var(--oc-accent, #ff9800);
    }

    .generate-btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      background: #4caf50;
      color: white;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .generate-btn:hover {
      background: #43a047;
    }
  `]
})
export class OrcaFlexRiserComponent implements OnInit, OnDestroy {
  modelState = inject(ModelStateService);
  private apiService = inject(OrcaFlexApiService);

  showGenerateDialog = false;

  expandedSections: Record<string, boolean> = {
    environment: true,
    vessel: true,
    lineTypes: false,
    risers: true,
    results: true,
    logs: false,
  };

  ngOnInit(): void {
    this.modelState.addLog('info', 'OrcaFlex Riser Module initialized');
  }

  ngOnDestroy(): void {
    // Cleanup will be handled here
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  async calculateRiser(riser: RiserConfig): Promise<void> {
    console.log('calculateRiser called', riser);
    this.modelState.setCalculating(true);
    this.modelState.addLog('info', `Calculating riser "${riser.name}"...`);

    try {
      if (riser.geometry.type === 'catenary') {
        const lineType = this.modelState.lineTypes().find(lt => lt.id === riser.lineTypeId);
        if (!lineType) {
          throw new Error('Line type not found');
        }

        const env = this.modelState.environment();
        const waterDepth = env.sea.waterDepth;
        const hangoffZ = Math.abs(riser.geometry.hangoffPoint.z);
        const height = waterDepth - hangoffZ;

        // Get active content density for wet weight calculation
        const activeContent = riser.contents?.find(c => c.id === riser.activeContentId);
        const contentDensity = activeContent?.density ?? 0;

        // Calculate effective weight (wet weight with content)
        const effectiveWeight = calculateEffectiveWeight(lineType, contentDensity, env.sea.waterDensity);

        // Send snake_case field names to backend
        const request = {
          method: 'point_angle',
          weight: effectiveWeight,  // Wet weight with content (N/m)
          height: height,
          departure_angle: riser.geometry.departureAngle,
          num_points: 100,
        };

        const result = await this.apiService.calculateCatenary(request as CatenaryRequest);

        // Map snake_case backend response to frontend model
        const apiResult = result as any;
        // Map API points {x, y, z} to frontend format {x, y} where y is vertical (API's z)
        const mappedPoints = (apiResult.points || []).map((p: any) => ({
          x: p.x,
          y: p.z,  // API's z is vertical height
          s: 0,
          angle: 0,
        }));
        console.log('Catenary result:', apiResult);
        console.log('Mapped points:', mappedPoints.length, mappedPoints.slice(0, 3));

        this.modelState.updateRiser({
          ...riser,
          calculationResults: {
            totalLength: apiResult.arc_length,
            tdpPosition: { x: apiResult.horizontal_distance, y: 0, z: -waterDepth },
            maxTension: apiResult.horizontal_tension / Math.cos(apiResult.end_angle_rad),
            minTension: apiResult.horizontal_tension,
            points: mappedPoints,
          },
        });

        this.modelState.addLog('success', `Riser "${riser.name}" calculated successfully`);
      } else if (riser.geometry.type === 'lazy-wave') {
        const lineType = this.modelState.lineTypes().find(lt => lt.id === riser.lineTypeId);
        const buoyancyModule = this.modelState.model().buoyancyModules.find(
          bm => bm.id === riser.buoyancyModuleId
        );

        if (!lineType) {
          throw new Error('Line type not found');
        }

        const env = this.modelState.environment();
        const geom = riser.geometry;

        // Get connection point z to calculate effective water depth
        const vessel = this.modelState.vessels().find(v => v.id === riser.vesselId);
        const connectionPoint = vessel?.connectionPoints.find(cp => cp.id === riser.connectionPointId);
        const hangoffZ = Math.abs(connectionPoint?.z ?? 0);
        const effectiveWaterDepth = env.sea.waterDepth - hangoffZ;

        // Get active content density for wet weight calculation
        const activeContent = riser.contents?.find(c => c.id === riser.activeContentId);
        const contentDensity = activeContent?.density ?? 0;

        // Calculate effective weight (wet weight with content)
        const effectiveWeight = calculateEffectiveWeight(lineType, contentDensity, env.sea.waterDensity);

        // Calculate buoyancy weight per meter from module configuration
        const buoyancyWeightPerMeter = buoyancyModule
          ? calculateBuoyancyWeightPerMeter(buoyancyModule)
          : 0;

        // Send snake_case field names to backend
        const request = {
          water_depth: effectiveWaterDepth,
          line_weight: effectiveWeight,  // Wet weight with content (N/m)
          buoyancy_weight: buoyancyWeightPerMeter,  // Buoyancy per meter (N/m)
          sag: geom.sagBend,
          hog: geom.hogBend,
          departure_angle: geom.departureAngle,
        };

        console.log('Lazy wave request:', request);
        const result = await this.apiService.calculateLazyWave(request as unknown as LazyWaveRequest);

        // Map snake_case backend response to frontend model
        const apiResult = result as any;
        console.log('Lazy wave API result:', apiResult);
        console.log('Lazy wave points count:', apiResult.points?.length || 0);

        // Extract buoyancy section info from API result
        const buoyancySectionStart = apiResult.buoyancy_section_start || apiResult.results?.buoyancy_section_start;
        const buoyancySectionEnd = apiResult.buoyancy_section_end || apiResult.results?.buoyancy_section_end;

        this.modelState.updateRiser({
          ...riser,
          calculationResults: {
            totalLength: apiResult.tdp_length || 500,
            tdpPosition: { x: apiResult.tdp_horizontal_distance || 200, y: 0, z: -env.sea.waterDepth },
            maxTension: apiResult.horizontal_tension || 50000,
            minTension: (apiResult.horizontal_tension || 50000) * 0.3,
            sagBendRadius: 100,
            hogBendRadius: 100,
            points: apiResult.points || [],
            buoyancyStart: buoyancySectionStart,
            buoyancyEnd: buoyancySectionEnd,
          },
        });

        this.modelState.addLog('success', `Lazy wave riser "${riser.name}" calculated with ${apiResult.points?.length || 0} points`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.modelState.addLog('error', `Calculation failed: ${message}`);
    } finally {
      this.modelState.setCalculating(false);
    }
  }
}
