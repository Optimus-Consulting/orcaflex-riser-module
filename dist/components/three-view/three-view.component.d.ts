import { ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CameraView } from '../../three';
export declare class ThreeViewComponent implements OnInit, AfterViewInit, OnDestroy {
    canvasRef: ElementRef<HTMLCanvasElement>;
    containerRef: ElementRef<HTMLDivElement>;
    private modelState;
    private sceneManager;
    private resizeObserver;
    private viewHelper;
    private clock;
    private globalCoordSystem;
    private vesselCoordSystems;
    private vesselGroups;
    private connectionPointGroups;
    private waterPlane;
    private seabedPlane;
    private gridHelper;
    currentView: CameraView;
    displayMenuOpen: import("@angular/core").WritableSignal<boolean>;
    showCoordinateSystems: import("@angular/core").WritableSignal<boolean>;
    showVessel: import("@angular/core").WritableSignal<boolean>;
    showConnectionPoints: import("@angular/core").WritableSignal<boolean>;
    showWater: import("@angular/core").WritableSignal<boolean>;
    showSeabed: import("@angular/core").WritableSignal<boolean>;
    showGrid: import("@angular/core").WritableSignal<boolean>;
    constructor();
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /**
     * Setup the ViewHelper for orientation indicator
     */
    private setupViewHelper;
    /**
     * Handle click on ViewHelper
     */
    private handleViewHelperClick;
    /**
     * Update the ViewHelper (called in render loop)
     */
    private updateViewHelper;
    /**
     * Close dropdown menu when clicking outside
     */
    private closeMenuOnOutsideClick;
    /**
     * Rebuild the 3D scene from current model state
     */
    private rebuildScene;
    /**
     * Set camera view
     */
    setView(view: CameraView): void;
    /**
     * Zoom to fit all objects
     */
    zoomToFit(): void;
    /**
     * Toggle display options menu
     */
    toggleDisplayMenu(): void;
    /**
     * Toggle visibility of scene elements
     */
    toggleVisibility(element: 'coordinates' | 'vessel' | 'connectionPoints' | 'water' | 'seabed' | 'grid'): void;
    /**
     * Handle keyboard shortcuts
     */
    private handleKeydown;
}
//# sourceMappingURL=three-view.component.d.ts.map