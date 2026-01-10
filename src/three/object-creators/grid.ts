/**
 * Grid helper creator
 */

import * as THREE from 'three';
import { COLORS } from '../config';

export interface GridOptions {
  size?: number;
  divisions?: number;
  colorCenter?: number;
  colorGrid?: number;
}

/**
 * Create a grid on the XY plane (water surface)
 */
export function createGrid(options: GridOptions = {}): THREE.GridHelper {
  const {
    size = 1000,
    divisions = 20,
    colorCenter = COLORS.grid,
    colorGrid = 0xcccccc,
  } = options;

  const grid = new THREE.GridHelper(size, divisions, colorCenter, colorGrid);
  // Rotate to lie on XY plane (water surface)
  grid.rotation.x = Math.PI / 2;
  grid.position.set(0, 0, 0);

  return grid;
}

/**
 * Create axis arrows for coordinate system visualization
 */
export function createAxisArrows(
  length: number = 20,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'AxisArrows';

  const headLength = length * 0.2;
  const headWidth = length * 0.1;

  // X axis (red)
  const xArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    length,
    0xff0000,
    headLength,
    headWidth
  );
  group.add(xArrow);

  // Y axis (green)
  const yArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    length,
    0x00ff00,
    headLength,
    headWidth
  );
  group.add(yArrow);

  // Z axis (blue)
  const zArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    length,
    0x0000ff,
    headLength,
    headWidth
  );
  group.add(zArrow);

  group.position.set(position.x, position.y, position.z);

  return group;
}
