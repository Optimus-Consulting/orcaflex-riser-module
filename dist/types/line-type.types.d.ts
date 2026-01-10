/**
 * Line type configuration for OrcaFlex model
 *
 * Units:
 * - Diameters: stored in meters, displayed in mm
 * - Masses: kg/m (mass per unit length)
 * - Stiffnesses: stored in kN (axial) or kN·m² (bending/torsional)
 * - Density: kg/m³
 */
export interface LineTypeConfig {
    id: string;
    name: string;
    category?: string;
    outerDiameter: number;
    innerDiameter: number;
    dryMass: number;
    wetMass?: number;
    pipeDensity?: number;
    bendingStiffness: number;
    axialStiffness: number;
    torsionalStiffness?: number;
    poissonRatio?: number;
    allowableTension?: number;
    minBendRadius?: number;
    dragCoefficients: {
        normal: number;
        axial: number;
    };
    addedMassCoefficients: {
        normal: number;
        axial: number;
    };
}
export interface BuoyancyModuleConfig {
    id: string;
    name: string;
    outerDiameter: number;
    length: number;
    dryMass: number;
    apparentMassInWater: number;
    dragCoefficient: number;
    numberOfModules: number;
    spacing: number;
}
/**
 * Calculate net buoyancy force per module in Newtons
 * Negative apparent mass = positive buoyancy
 */
export declare function calculateModuleBuoyancy(module: BuoyancyModuleConfig): number;
/**
 * Calculate total buoyancy section length
 * Length = (n-1) * spacing + n * module_length
 * But typically spacing is center-to-center, so:
 * Length = (n-1) * spacing + module_length (first to last module end)
 */
export declare function calculateBuoyancySectionLength(module: BuoyancyModuleConfig): number;
/**
 * Calculate effective buoyancy weight per meter for API
 * This is the net upward force per unit length in the buoyancy section
 */
export declare function calculateBuoyancyWeightPerMeter(module: BuoyancyModuleConfig): number;
/**
 * Calculate wet mass from dry mass and geometry
 * wetMass = dryMass - displaced_water_mass
 * displaced_water_mass = π/4 * OD² * waterDensity
 */
export declare function calculateWetMass(lineType: LineTypeConfig, waterDensity?: number): number;
/**
 * Calculate dry mass from wet mass and geometry
 * dryMass = wetMass + displaced_water_mass
 */
export declare function calculateDryMass(wetMass: number, outerDiameter: number, waterDensity?: number): number;
/**
 * Calculate pipe material density from dry mass and geometry
 * density = dryMass / cross_section_area
 */
export declare function calculatePipeDensity(lineType: LineTypeConfig): number;
/**
 * Calculate dry mass from density and geometry
 */
export declare function calculateDryMassFromDensity(density: number, outerDiameter: number, innerDiameter: number): number;
/**
 * Calculate submerged weight (N/m) from wet mass
 */
export declare function calculateSubmergedWeight(lineType: LineTypeConfig, waterDensity?: number): number;
/**
 * Calculate effective weight with content
 * Includes pipe weight, content weight, and buoyancy
 */
export declare function calculateEffectiveWeight(lineType: LineTypeConfig, contentDensity: number, waterDensity?: number): number;
export declare const DEFAULT_LINE_TYPES: LineTypeConfig[];
export declare const DEFAULT_BUOYANCY_MODULE: BuoyancyModuleConfig;
//# sourceMappingURL=line-type.types.d.ts.map