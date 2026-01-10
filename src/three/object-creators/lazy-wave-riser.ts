/**
 * Lazy wave riser creator
 */

import * as THREE from 'three';
import { RISER_COLORS } from '../config';
import { RiserSegment } from '../../types';

export interface BuoyancyModuleVizConfig {
  outerDiameter: number;    // m
  length: number;           // m
  numberOfModules: number;
  spacing: number;          // m (center-to-center)
}

export interface LazyWaveOptions {
  color?: number;
  normalRadius?: number;
  buoyancyStartX?: number;
  buoyancyEndX?: number;
  buoyancyStart?: { x: number; z: number };
  buoyancyEnd?: { x: number; z: number };
  buoyancyModule?: BuoyancyModuleVizConfig;
}

/**
 * Create a lazy wave riser from segments
 */
export function createLazyWaveRiser(
  segments: RiserSegment[],
  options: LazyWaveOptions = {}
): THREE.Group {
  const {
    color = RISER_COLORS[0],
    normalRadius = 0.2,
  } = options;

  const buoyancyRadius = options.buoyancyModule
    ? options.buoyancyModule.outerDiameter / 2
    : 0.7;

  const group = new THREE.Group();
  group.name = 'LazyWaveRiser';
  group.userData = {
    type: 'lazyWaveRiser',
    segmentCount: segments.length,
  };

  const normalMaterial = new THREE.MeshBasicMaterial({ color });
  const buoyancyMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(1.3).getHex(),
  });

  segments.forEach((segment) => {
    const isBuoyancy = segment.type === 'buoyancy';
    const radius = isBuoyancy ? buoyancyRadius : normalRadius;
    const material = isBuoyancy ? buoyancyMaterial : normalMaterial;

    // Create line from segment points
    for (let i = 0; i < segment.points.length - 1; i++) {
      const p1 = segment.points[i];
      const p2 = segment.points[i + 1];

      const start = new THREE.Vector3(p1.x, 0, -p1.y);
      const end = new THREE.Vector3(p2.x, 0, -p2.y);

      const direction = new THREE.Vector3().subVectors(end, start);
      const distance = direction.length();

      if (distance < 0.001) continue;

      const geometry = new THREE.CylinderGeometry(radius, radius, distance, 8);
      const cylinder = new THREE.Mesh(geometry, material);

      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      cylinder.position.copy(midpoint);

      cylinder.lookAt(end);
      cylinder.rotateX(Math.PI / 2);

      group.add(cylinder);
    }
  });

  return group;
}

/**
 * Create a lazy wave riser from 3D points with buoyancy section
 */
export function createLazyWaveFromPoints(
  points: Array<{ x: number; y: number; z: number }>,
  options: LazyWaveOptions = {}
): THREE.Group {
  const {
    color = RISER_COLORS[0],
    normalRadius = 0.5,
    buoyancyStartX = 0,
    buoyancyEndX = 0,
    buoyancyStart,
    buoyancyEnd,
    buoyancyModule,
  } = options;

  const group = new THREE.Group();
  group.name = 'LazyWaveRiser';
  group.userData = {
    type: 'lazyWaveRiser',
    pointCount: points.length,
    buoyancySection: { start: buoyancyStart, end: buoyancyEnd },
  };

  // Normal riser material
  const normalMaterial = new THREE.MeshPhongMaterial({
    color,
    shininess: 30,
  });

  // Buoyancy section pipe - slightly thicker
  const buoyancyPipeRadius = normalRadius * 1.2;
  const buoyancyPipeMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(color).offsetHSL(0, 0.1, -0.15).getHex(),
    shininess: 40,
  });

  // Determine buoyancy section bounds from API result or fallback to X positions
  let buoyMinX: number, buoyMaxX: number;
  if (buoyancyStart && buoyancyEnd) {
    buoyMinX = Math.min(buoyancyStart.x, buoyancyEnd.x);
    buoyMaxX = Math.max(buoyancyStart.x, buoyancyEnd.x);
  } else {
    buoyMinX = Math.min(buoyancyStartX, buoyancyEndX);
    buoyMaxX = Math.max(buoyancyStartX, buoyancyEndX);
  }

  // Store buoyancy section points for module placement
  const buoyancySectionPoints: Array<{ x: number; y: number; z: number }> = [];

  // Create riser pipe segments
  for (let i = 0; i < points.length - 1; i++) {
    const start = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
    const end = new THREE.Vector3(points[i + 1].x, points[i + 1].y, points[i + 1].z);

    const midX = (start.x + end.x) / 2;
    const isBuoyancy = buoyMaxX > buoyMinX && midX >= buoyMinX && midX <= buoyMaxX;

    const radius = isBuoyancy ? buoyancyPipeRadius : normalRadius;
    const material = isBuoyancy ? buoyancyPipeMaterial : normalMaterial;

    // Collect buoyancy section points
    if (isBuoyancy) {
      if (buoyancySectionPoints.length === 0) {
        buoyancySectionPoints.push(points[i]);
      }
      buoyancySectionPoints.push(points[i + 1]);
    }

    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();

    if (distance < 0.001) continue;

    const geometry = new THREE.CylinderGeometry(radius, radius, distance, 12);
    const cylinder = new THREE.Mesh(geometry, material);

    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);

    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);

    group.add(cylinder);
  }

  // Add individual buoyancy modules if configuration provided
  if (buoyancyModule && buoyancyModule.numberOfModules > 0 && buoyancySectionPoints.length > 1) {
    const modules = createBuoyancyModulesAlongPath(
      buoyancySectionPoints,
      buoyancyModule
    );
    modules.forEach(m => group.add(m));
  }

  return group;
}

/**
 * Create individual buoyancy module meshes along the path
 */
function createBuoyancyModulesAlongPath(
  pathPoints: Array<{ x: number; y: number; z: number }>,
  config: BuoyancyModuleVizConfig
): THREE.Mesh[] {
  const modules: THREE.Mesh[] = [];

  if (pathPoints.length < 2 || config.numberOfModules <= 0) return modules;

  // Calculate arc length along the path
  const arcLengths: number[] = [0];
  for (let i = 1; i < pathPoints.length; i++) {
    const dx = pathPoints[i].x - pathPoints[i - 1].x;
    const dy = pathPoints[i].y - pathPoints[i - 1].y;
    const dz = pathPoints[i].z - pathPoints[i - 1].z;
    arcLengths.push(arcLengths[i - 1] + Math.sqrt(dx * dx + dy * dy + dz * dz));
  }
  const totalLength = arcLengths[arcLengths.length - 1];

  // Calculate module positions based on spacing
  // First module starts at beginning, then spaced by config.spacing
  const modulePositions: number[] = [];
  for (let i = 0; i < config.numberOfModules; i++) {
    const pos = i * config.spacing;
    if (pos <= totalLength) {
      modulePositions.push(pos);
    }
  }

  // Buoyancy module material - bright orange/yellow for visibility
  const moduleMaterial = new THREE.MeshPhongMaterial({
    color: 0xff8c00, // Dark orange
    shininess: 60,
  });

  // Create each module
  for (const targetArcLength of modulePositions) {
    // Find position and direction on path
    const { position, direction } = getPointOnPath(pathPoints, arcLengths, targetArcLength);

    // Create cylinder for module
    const moduleRadius = config.outerDiameter / 2;
    const geometry = new THREE.CylinderGeometry(moduleRadius, moduleRadius, config.length, 16);
    const cylinder = new THREE.Mesh(geometry, moduleMaterial);

    cylinder.position.copy(position);

    // Orient along the path direction
    if (direction.lengthSq() > 0.0001) {
      const target = position.clone().add(direction);
      cylinder.lookAt(target);
      cylinder.rotateX(Math.PI / 2);
    }

    cylinder.userData = {
      type: 'buoyancyModule',
      name: 'Buoyancy Module',
    };

    modules.push(cylinder);
  }

  return modules;
}

/**
 * Get position and direction on path at given arc length
 */
function getPointOnPath(
  pathPoints: Array<{ x: number; y: number; z: number }>,
  arcLengths: number[],
  targetArcLength: number
): { position: THREE.Vector3; direction: THREE.Vector3 } {
  // Find segment containing target arc length
  let segmentIndex = 0;
  for (let i = 1; i < arcLengths.length; i++) {
    if (arcLengths[i] >= targetArcLength) {
      segmentIndex = i - 1;
      break;
    }
    segmentIndex = i - 1;
  }

  const p1 = pathPoints[segmentIndex];
  const p2 = pathPoints[Math.min(segmentIndex + 1, pathPoints.length - 1)];

  const segmentStart = arcLengths[segmentIndex];
  const segmentEnd = arcLengths[Math.min(segmentIndex + 1, arcLengths.length - 1)];
  const segmentLength = segmentEnd - segmentStart;

  // Interpolate within segment
  const t = segmentLength > 0 ? (targetArcLength - segmentStart) / segmentLength : 0;

  const position = new THREE.Vector3(
    p1.x + t * (p2.x - p1.x),
    p1.y + t * (p2.y - p1.y),
    p1.z + t * (p2.z - p1.z)
  );

  const direction = new THREE.Vector3(
    p2.x - p1.x,
    p2.y - p1.y,
    p2.z - p1.z
  ).normalize();

  return { position, direction };
}

/**
 * Create sag/hog bend indicator spheres
 */
export function createBendIndicator(
  position: { x: number; y: number; z: number },
  type: 'sag' | 'hog',
  color: number = 0x00ff00
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.userData = {
    type: `${type}BendIndicator`,
    name: type === 'sag' ? 'Sag Bend' : 'Hog Bend',
    position,
  };

  return mesh;
}
