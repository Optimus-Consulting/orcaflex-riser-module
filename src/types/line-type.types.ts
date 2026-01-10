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

  // Geometry (stored in meters)
  outerDiameter: number;  // m
  innerDiameter: number;  // m

  // Mass properties (kg/m)
  dryMass: number;        // Mass per unit length in air (kg/m)
  wetMass?: number;       // Apparent mass in water (kg/m) - calculated or input
  pipeDensity?: number;   // Material density (kg/m³) - calculated or input

  // Stiffness properties
  bendingStiffness: number;    // EI (kN·m²)
  axialStiffness: number;      // EA (kN)
  torsionalStiffness?: number; // GJ (kN·m²)
  poissonRatio?: number;

  // Limits
  allowableTension?: number;   // kN
  minBendRadius?: number;      // m

  // Hydrodynamic coefficients
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
  outerDiameter: number;     // m (outer diameter of module)
  length: number;            // m (length of single module)
  dryMass: number;           // kg (mass in air per module)
  apparentMassInWater: number; // kg (negative = buoyant, per module)
  dragCoefficient: number;
  // Installation configuration
  numberOfModules: number;   // Number of modules installed
  spacing: number;           // m (center-to-center spacing between modules)
}

/**
 * Calculate net buoyancy force per module in Newtons
 * Negative apparent mass = positive buoyancy
 */
export function calculateModuleBuoyancy(module: BuoyancyModuleConfig): number {
  return -module.apparentMassInWater * 9.81; // N per module
}

/**
 * Calculate total buoyancy section length
 * Length = (n-1) * spacing + n * module_length
 * But typically spacing is center-to-center, so:
 * Length = (n-1) * spacing + module_length (first to last module end)
 */
export function calculateBuoyancySectionLength(module: BuoyancyModuleConfig): number {
  if (module.numberOfModules <= 0) return 0;
  if (module.numberOfModules === 1) return module.length;
  // Center-to-center: first module starts at 0, last module center at (n-1)*spacing
  // Total length from first module start to last module end
  return (module.numberOfModules - 1) * module.spacing + module.length;
}

/**
 * Calculate effective buoyancy weight per meter for API
 * This is the net upward force per unit length in the buoyancy section
 */
export function calculateBuoyancyWeightPerMeter(module: BuoyancyModuleConfig): number {
  const totalBuoyancy = module.numberOfModules * calculateModuleBuoyancy(module);
  const sectionLength = calculateBuoyancySectionLength(module);
  if (sectionLength <= 0) return 0;
  return totalBuoyancy / sectionLength; // N/m
}

/**
 * Calculate wet mass from dry mass and geometry
 * wetMass = dryMass - displaced_water_mass
 * displaced_water_mass = π/4 * OD² * waterDensity
 */
export function calculateWetMass(
  lineType: LineTypeConfig,
  waterDensity: number = 1025
): number {
  const outerArea = Math.PI * Math.pow(lineType.outerDiameter / 2, 2);
  const displacedMass = outerArea * waterDensity; // kg/m
  return lineType.dryMass - displacedMass;
}

/**
 * Calculate dry mass from wet mass and geometry
 * dryMass = wetMass + displaced_water_mass
 */
export function calculateDryMass(
  wetMass: number,
  outerDiameter: number,
  waterDensity: number = 1025
): number {
  const outerArea = Math.PI * Math.pow(outerDiameter / 2, 2);
  const displacedMass = outerArea * waterDensity; // kg/m
  return wetMass + displacedMass;
}

/**
 * Calculate pipe material density from dry mass and geometry
 * density = dryMass / cross_section_area
 */
export function calculatePipeDensity(lineType: LineTypeConfig): number {
  const outerArea = Math.PI * Math.pow(lineType.outerDiameter / 2, 2);
  const innerArea = Math.PI * Math.pow(lineType.innerDiameter / 2, 2);
  const crossSectionArea = outerArea - innerArea;
  if (crossSectionArea <= 0) return 0;
  return lineType.dryMass / crossSectionArea;
}

/**
 * Calculate dry mass from density and geometry
 */
export function calculateDryMassFromDensity(
  density: number,
  outerDiameter: number,
  innerDiameter: number
): number {
  const outerArea = Math.PI * Math.pow(outerDiameter / 2, 2);
  const innerArea = Math.PI * Math.pow(innerDiameter / 2, 2);
  const crossSectionArea = outerArea - innerArea;
  return density * crossSectionArea;
}

/**
 * Calculate submerged weight (N/m) from wet mass
 */
export function calculateSubmergedWeight(
  lineType: LineTypeConfig,
  waterDensity: number = 1025
): number {
  const wetMass = calculateWetMass(lineType, waterDensity);
  return wetMass * 9.81; // Convert kg/m to N/m
}

/**
 * Calculate effective weight with content
 * Includes pipe weight, content weight, and buoyancy
 */
export function calculateEffectiveWeight(
  lineType: LineTypeConfig,
  contentDensity: number,
  waterDensity: number = 1025
): number {
  const innerArea = Math.PI * Math.pow(lineType.innerDiameter / 2, 2);
  const outerArea = Math.PI * Math.pow(lineType.outerDiameter / 2, 2);

  // Weight of pipe
  const pipeWeight = lineType.dryMass * 9.81;

  // Weight of content
  const contentMass = innerArea * contentDensity;
  const contentWeight = contentMass * 9.81;

  // Buoyancy (based on outer diameter)
  const displacedMass = outerArea * waterDensity;
  const buoyancy = displacedMass * 9.81;

  return pipeWeight + contentWeight - buoyancy;
}

// Default 10" Flexible Riser based on OrcaFlex specs
export const DEFAULT_LINE_TYPES: LineTypeConfig[] = [
  {
    id: 'flexible-riser',
    name: '10" Flexible Riser',
    category: 'General',
    outerDiameter: 0.3556,      // 355.6 mm
    innerDiameter: 0.254,        // 254 mm (10")
    dryMass: 184.2262,           // kg/m
    bendingStiffness: 124.87,    // kN·m² (EI)
    axialStiffness: 711200,      // kN (EA = 711.2e3)
    torsionalStiffness: 10,      // kN·m² (GJ)
    poissonRatio: 0.5,
    allowableTension: 5000,      // kN
    minBendRadius: 3.675,        // m
    dragCoefficients: { normal: 1.2, axial: 0.008 },
    addedMassCoefficients: { normal: 1.0, axial: 0.0 },
  },
];

// 10" Buoyancy Module based on reference specifications
export const DEFAULT_BUOYANCY_MODULE: BuoyancyModuleConfig = {
  id: 'buoyancy-1',
  name: '10" Buoyancy Module',
  outerDiameter: 1.45,           // 1450 mm
  length: 1.6,                   // 1600 mm
  dryMass: 855.7,                // kg (mass in air)
  apparentMassInWater: -1220,    // kg (negative = buoyant)
  dragCoefficient: 0.8,
  numberOfModules: 6,            // Default 6 modules
  spacing: 12,                   // 12m center-to-center spacing
};
