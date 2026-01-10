import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelStateService } from '../../services/model-state.service';
import {
  SceneManager,
  CameraView,
  createWaterPlane,
  createSeabed,
  createGrid,
  createVesselGroup,
  createConnectionPoint,
  createCatenaryCable,
  createLazyWaveFromPoints,
  createTDPMarker,
  createGlobalCoordinateSystem,
  createVesselCoordinateSystem,
  ViewHelper,
  RISER_COLORS,
} from '../../three';
import * as THREE from 'three';

@Component({
  selector: 'orcaflex-three-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="three-view-container" #container>
      <canvas #threeCanvas class="three-canvas"></canvas>

      <div class="view-controls">
        <button
          [class.active]="currentView === 'iso'"
          (click)="setView('iso')"
          title="Isometric View"
        >
          3D
        </button>
        <button
          [class.active]="currentView === 'side'"
          (click)="setView('side')"
          title="Side View"
        >
          Side
        </button>
        <button
          [class.active]="currentView === 'top'"
          (click)="setView('top')"
          title="Top View"
        >
          Top
        </button>
        <button
          [class.active]="currentView === 'front'"
          (click)="setView('front')"
          title="Front View"
        >
          Front
        </button>
        <button (click)="zoomToFit()" title="Zoom to Fit (F)">Fit</button>

        <!-- Display options dropdown -->
        <div class="dropdown">
          <button (click)="toggleDisplayMenu()" title="Display Options">
            View
          </button>
          @if (displayMenuOpen()) {
            <div class="dropdown-menu">
              <label class="menu-item">
                <input type="checkbox" [checked]="showCoordinateSystems()" (change)="toggleVisibility('coordinates')" />
                <span>Coordinate Systems</span>
              </label>
              <label class="menu-item">
                <input type="checkbox" [checked]="showVessel()" (change)="toggleVisibility('vessel')" />
                <span>Vessel</span>
              </label>
              <label class="menu-item">
                <input type="checkbox" [checked]="showConnectionPoints()" (change)="toggleVisibility('connectionPoints')" />
                <span>Connection Points</span>
              </label>
              <label class="menu-item">
                <input type="checkbox" [checked]="showWater()" (change)="toggleVisibility('water')" />
                <span>Water Surface</span>
              </label>
              <label class="menu-item">
                <input type="checkbox" [checked]="showSeabed()" (change)="toggleVisibility('seabed')" />
                <span>Seabed</span>
              </label>
              <label class="menu-item">
                <input type="checkbox" [checked]="showGrid()" (change)="toggleVisibility('grid')" />
                <span>Grid</span>
              </label>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .three-view-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .three-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .view-controls {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.9);
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .view-controls button {
      padding: 6px 10px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-controls button:hover {
      background: #f0f0f0;
    }

    .view-controls button.active {
      background: var(--caris-primary, #1976d2);
      color: white;
      border-color: var(--caris-primary, #1976d2);
    }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 160px;
      z-index: 100;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 11px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #eee;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-item:hover {
      background: #f5f5f5;
    }

    .menu-item input {
      cursor: pointer;
    }

    .menu-item span {
      color: #333;
    }
  `]
})
export class ThreeViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private modelState = inject(ModelStateService);
  private sceneManager: SceneManager | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // ViewHelper for orientation indicator
  private viewHelper: ViewHelper | null = null;
  private clock = new THREE.Clock();

  // Scene object references for visibility toggling
  private globalCoordSystem: THREE.Group | null = null;
  private vesselCoordSystems: THREE.Group[] = [];
  private vesselGroups: THREE.Group[] = [];
  private connectionPointGroups: THREE.Group[] = [];
  private waterPlane: THREE.Mesh | null = null;
  private seabedPlane: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  currentView: CameraView = 'iso';

  // Display options
  displayMenuOpen = signal<boolean>(false);
  showCoordinateSystems = signal<boolean>(true);
  showVessel = signal<boolean>(true);
  showConnectionPoints = signal<boolean>(true);
  showWater = signal<boolean>(true);
  showSeabed = signal<boolean>(true);
  showGrid = signal<boolean>(true);

  constructor() {
    // React to model state changes
    effect(() => {
      // Access signals to register as dependencies
      void this.modelState.environment();
      void this.modelState.vessels();
      void this.modelState.risers();

      // Rebuild scene when model changes
      if (this.sceneManager) {
        this.rebuildScene();
      }
    });
  }

  ngOnInit(): void {
    // Initialize scene manager
    this.sceneManager = new SceneManager();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    // Initialize Three.js scene
    this.sceneManager!.initialize(canvas);

    // Setup resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.sceneManager?.onResize();
    });
    this.resizeObserver.observe(canvas.parentElement!);

    // Setup ViewHelper for orientation indicator
    this.setupViewHelper();

    // Build initial scene
    this.rebuildScene();

    // Start render loop with ViewHelper update
    this.sceneManager!.startRenderLoop(() => {
      this.updateViewHelper();
    });

    // Handle keyboard shortcuts
    window.addEventListener('keydown', this.handleKeydown.bind(this));

    // Handle ViewHelper clicks
    container.addEventListener('pointerup', this.handleViewHelperClick.bind(this));

    // Close dropdown when clicking outside
    document.addEventListener('click', this.closeMenuOnOutsideClick.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeydown.bind(this));
    document.removeEventListener('click', this.closeMenuOnOutsideClick.bind(this));
    this.containerRef?.nativeElement.removeEventListener('pointerup', this.handleViewHelperClick.bind(this));
    this.resizeObserver?.disconnect();
    this.sceneManager?.dispose();
    this.viewHelper?.dispose();
  }

  /**
   * Setup the ViewHelper for orientation indicator
   */
  private setupViewHelper(): void {
    if (!this.sceneManager) return;

    const camera = this.sceneManager.getCamera();
    this.viewHelper = new ViewHelper(camera);
    this.viewHelper.controls = {
      center: this.sceneManager.getControlsTarget()
    };
    this.viewHelper.setDimension(128);
  }

  /**
   * Handle click on ViewHelper
   */
  private handleViewHelperClick(event: MouseEvent): void {
    if (!this.viewHelper || !this.sceneManager) return;

    const container = this.containerRef.nativeElement;
    this.viewHelper.handleClick(event, container);
  }

  /**
   * Update the ViewHelper (called in render loop)
   */
  private updateViewHelper(): void {
    if (!this.viewHelper || !this.sceneManager) return;

    const renderer = this.sceneManager.getRenderer();
    const canvas = renderer.domElement;

    // Update animation if active
    if (this.viewHelper.animating) {
      const delta = this.clock.getDelta();
      this.viewHelper.update(delta);
    }

    // Render ViewHelper only if coordinate systems are visible
    if (this.showCoordinateSystems()) {
      this.viewHelper.render(renderer, canvas.clientWidth, canvas.clientHeight);
    }
  }

  /**
   * Close dropdown menu when clicking outside
   */
  private closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.displayMenuOpen.set(false);
    }
  }

  /**
   * Rebuild the 3D scene from current model state
   */
  private rebuildScene(): void {
    if (!this.sceneManager) return;

    // Clear existing objects and reset arrays
    this.sceneManager.clearObjects();
    this.vesselCoordSystems = [];
    this.vesselGroups = [];
    this.connectionPointGroups = [];

    const env = this.modelState.environment();
    const vessels = this.modelState.vessels();
    const risers = this.modelState.risers();

    // Add water surface
    this.waterPlane = createWaterPlane() as THREE.Mesh;
    this.waterPlane.visible = this.showWater();
    this.sceneManager.add(this.waterPlane);

    // Add seabed
    this.seabedPlane = createSeabed(env.sea.waterDepth) as THREE.Mesh;
    this.seabedPlane.visible = this.showSeabed();
    this.sceneManager.add(this.seabedPlane);

    // Add grid
    this.gridHelper = createGrid() as THREE.GridHelper;
    this.gridHelper.visible = this.showGrid();
    this.sceneManager.add(this.gridHelper);

    // Add global coordinate system at origin
    this.globalCoordSystem = createGlobalCoordinateSystem(30);
    this.globalCoordSystem.visible = this.showCoordinateSystems();
    this.sceneManager.add(this.globalCoordSystem);

    // Add vessels
    vessels.forEach((vessel) => {
      const vesselGroup = createVesselGroup(
        {
          length: vessel.length,
          breadth: vessel.breadth,
          depth: vessel.depth,
          draft: vessel.draft,
        },
        vessel.position
      );
      // Apply vessel heading rotation
      vesselGroup.rotation.z = (vessel.orientation?.heading ?? 0) * Math.PI / 180;
      vesselGroup.visible = this.showVessel();
      this.sceneManager!.add(vesselGroup);
      this.vesselGroups.push(vesselGroup);

      // Add vessel local coordinate system
      const vesselCoordSys = createVesselCoordinateSystem(15);
      vesselCoordSys.position.set(vessel.position.x, vessel.position.y, vessel.position.z);
      vesselCoordSys.rotation.z = (vessel.orientation?.heading ?? 0) * Math.PI / 180;
      vesselCoordSys.visible = this.showCoordinateSystems();
      this.sceneManager!.add(vesselCoordSys);
      this.vesselCoordSystems.push(vesselCoordSys);

      // Add connection points (separate visibility from vessel)
      vessel.connectionPoints.forEach((cp) => {
        // Transform connection point by vessel heading
        const headingRad = (vessel.orientation?.heading ?? 0) * Math.PI / 180;
        const cosH = Math.cos(headingRad);
        const sinH = Math.sin(headingRad);
        const cpX = vessel.position.x + (cp.x * cosH - cp.y * sinH);
        const cpY = vessel.position.y + (cp.x * sinH + cp.y * cosH);
        const cpZ = vessel.position.z + cp.z;

        const cpGroup = createConnectionPoint({ x: cpX, y: cpY, z: cpZ }, cp.name);
        cpGroup.visible = this.showConnectionPoints();
        this.sceneManager!.add(cpGroup);
        this.connectionPointGroups.push(cpGroup);
      });
    });

    // Add risers with calculation results
    console.log('Rendering risers:', risers.length, risers.map(r => ({ name: r.name, hasResults: !!r.calculationResults, pointsCount: r.calculationResults?.points?.length })));
    risers.forEach((riser, index) => {
      if (!riser.calculationResults) {
        console.log(`Riser ${riser.name}: no calculation results, skipping`);
        return;
      }

      console.log(`Riser ${riser.name}: rendering with ${riser.calculationResults.points?.length || 0} points`);
      // Use active content color, or fallback to default riser colors
      const activeContent = riser.contents?.find(c => c.id === riser.activeContentId);
      const color = activeContent?.color ?? RISER_COLORS[index % RISER_COLORS.length];

      // Find vessel and connection point
      const vessel = vessels.find((v) => v.id === riser.vesselId);
      const cp = vessel?.connectionPoints.find((c) => c.id === riser.connectionPointId);

      // Calculate vessel heading and riser azimuth
      const vesselHeadingDeg = vessel?.orientation?.heading ?? 0;
      const riserAzimuthDeg = riser.geometry.azimuth ?? 0;
      // Total rotation: vessel heading + riser azimuth
      // Azimuth 0° = vessel's local X direction, 90° = vessel's local Y direction
      const totalRotationDeg = vesselHeadingDeg + riserAzimuthDeg;
      const totalRotationRad = totalRotationDeg * Math.PI / 180;

      // Calculate hangoff position in global coordinates
      const vesselHeadingRad = vesselHeadingDeg * Math.PI / 180;
      const cosH = Math.cos(vesselHeadingRad);
      const sinH = Math.sin(vesselHeadingRad);
      const hangoffX = (vessel?.position.x ?? 0) + ((cp?.x ?? 0) * cosH - (cp?.y ?? 0) * sinH);
      const hangoffY = (vessel?.position.y ?? 0) + ((cp?.x ?? 0) * sinH + (cp?.y ?? 0) * cosH);
      const hangoffZ = (vessel?.position.z ?? 0) + (cp?.z ?? 0);

      if (riser.geometry.type === 'catenary' && riser.calculationResults.points.length > 0) {
        // Create catenary cable
        const cable = createCatenaryCable(riser.calculationResults.points, { color });
        cable.position.set(hangoffX, hangoffY, hangoffZ);
        // Rotate cable according to azimuth (0° = X direction, 90° = Y direction)
        cable.rotation.z = totalRotationRad;
        this.sceneManager!.add(cable);

        // Add TDP marker at rotated position
        if (riser.calculationResults.tdpPosition) {
          const tdpLocalX = riser.calculationResults.tdpPosition.x;
          const tdpLocalY = riser.calculationResults.tdpPosition.y;
          const cosTot = Math.cos(totalRotationRad);
          const sinTot = Math.sin(totalRotationRad);
          const tdpGlobalX = hangoffX + (tdpLocalX * cosTot - tdpLocalY * sinTot);
          const tdpGlobalY = hangoffY + (tdpLocalX * sinTot + tdpLocalY * cosTot);

          const tdp = createTDPMarker(tdpGlobalX, tdpGlobalY, env.sea.waterDepth, color);
          this.sceneManager!.add(tdp);
        }
      } else if (riser.geometry.type === 'lazy-wave' && riser.calculationResults.points && riser.calculationResults.points.length > 0) {
        // Create lazy wave riser from points
        // API returns points as {x, y, z} where z is depth (negative)
        const allPoints = riser.calculationResults.points.map((p: any) => ({
          x: p.x,
          y: 0,
          z: p.z, // z is already negative depth from API
        }));

        // Get buoyancy module configuration for visualization
        const buoyancyModule = this.modelState.buoyancyModules().find(
          bm => bm.id === riser.buoyancyModuleId
        );

        console.log('Rendering lazy wave with', allPoints.length, 'points');
        const lazyWave = createLazyWaveFromPoints(allPoints, {
          color,
          buoyancyStartX: riser.geometry.buoyancyStart,
          buoyancyEndX: riser.geometry.buoyancyEnd,
          buoyancyStart: riser.calculationResults.buoyancyStart,
          buoyancyEnd: riser.calculationResults.buoyancyEnd,
          buoyancyModule: buoyancyModule ? {
            outerDiameter: buoyancyModule.outerDiameter,
            length: buoyancyModule.length,
            numberOfModules: buoyancyModule.numberOfModules,
            spacing: buoyancyModule.spacing,
          } : undefined,
        });
        lazyWave.position.set(hangoffX, hangoffY, hangoffZ);
        // Rotate lazy wave according to azimuth
        lazyWave.rotation.z = totalRotationRad;
        this.sceneManager!.add(lazyWave);

        // Add TDP marker for lazy wave at rotated position
        if (riser.calculationResults.tdpPosition) {
          const tdpLocalX = riser.calculationResults.tdpPosition.x;
          const tdpLocalY = riser.calculationResults.tdpPosition.y;
          const cosTot = Math.cos(totalRotationRad);
          const sinTot = Math.sin(totalRotationRad);
          const tdpGlobalX = hangoffX + (tdpLocalX * cosTot - tdpLocalY * sinTot);
          const tdpGlobalY = hangoffY + (tdpLocalX * sinTot + tdpLocalY * cosTot);

          const tdp = createTDPMarker(tdpGlobalX, tdpGlobalY, env.sea.waterDepth, color);
          this.sceneManager!.add(tdp);
        }
      }
    });

    // Update scene bounds based on water depth
    this.sceneManager.updateSceneBounds({
      min: { x: -100, y: -100, z: -env.sea.waterDepth - 50 },
      max: { x: 400, y: 100, z: 50 },
    });
  }

  /**
   * Set camera view
   */
  setView(view: CameraView): void {
    this.currentView = view;
    this.sceneManager?.setCamera(view);
  }

  /**
   * Zoom to fit all objects
   */
  zoomToFit(): void {
    this.sceneManager?.zoomToFit();
  }

  /**
   * Toggle display options menu
   */
  toggleDisplayMenu(): void {
    this.displayMenuOpen.set(!this.displayMenuOpen());
  }

  /**
   * Toggle visibility of scene elements
   */
  toggleVisibility(element: 'coordinates' | 'vessel' | 'connectionPoints' | 'water' | 'seabed' | 'grid'): void {
    switch (element) {
      case 'coordinates':
        const coordVisible = !this.showCoordinateSystems();
        this.showCoordinateSystems.set(coordVisible);
        if (this.globalCoordSystem) {
          this.globalCoordSystem.visible = coordVisible;
        }
        this.vesselCoordSystems.forEach(vcs => {
          vcs.visible = coordVisible;
        });
        break;

      case 'vessel':
        const vesselVisible = !this.showVessel();
        this.showVessel.set(vesselVisible);
        this.vesselGroups.forEach(vg => {
          vg.visible = vesselVisible;
        });
        break;

      case 'connectionPoints':
        const cpVisible = !this.showConnectionPoints();
        this.showConnectionPoints.set(cpVisible);
        this.connectionPointGroups.forEach(cp => {
          cp.visible = cpVisible;
        });
        break;

      case 'water':
        const waterVisible = !this.showWater();
        this.showWater.set(waterVisible);
        if (this.waterPlane) {
          this.waterPlane.visible = waterVisible;
        }
        break;

      case 'seabed':
        const seabedVisible = !this.showSeabed();
        this.showSeabed.set(seabedVisible);
        if (this.seabedPlane) {
          this.seabedPlane.visible = seabedVisible;
        }
        break;

      case 'grid':
        const gridVisible = !this.showGrid();
        this.showGrid.set(gridVisible);
        if (this.gridHelper) {
          this.gridHelper.visible = gridVisible;
        }
        break;
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeydown(event: KeyboardEvent): void {
    // Only handle if canvas is focused or no input is focused
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'f':
        this.zoomToFit();
        break;
      case '1':
        this.setView('iso');
        break;
      case '2':
        this.setView('side');
        break;
      case '3':
        this.setView('top');
        break;
      case '4':
        this.setView('front');
        break;
    }
  }
}
