/**
 * Catenary cable creator
 */

import * as THREE from 'three';
import { RISER_COLORS } from '../config';
import { CatenaryPoint } from '../../types';

export interface CatenaryOptions {
  color?: number;
  lineRadius?: number;
}

/**
 * Create a catenary cable from calculated points
 */
export function createCatenaryCable(
  points: CatenaryPoint[],
  options: CatenaryOptions = {}
): THREE.Group {
  const { color = RISER_COLORS[0], lineRadius = 0.15 } = options;

  const group = new THREE.Group();
  group.name = 'CatenaryCable';
  group.userData = {
    type: 'catenaryCable',
    pointCount: points.length,
  };

  const material = new THREE.MeshBasicMaterial({ color });

  // Create thick line using cylinders between consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    const start = new THREE.Vector3(points[i].x, 0, -points[i].y);
    const end = new THREE.Vector3(points[i + 1].x, 0, -points[i + 1].y);

    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();

    if (distance < 0.001) continue;

    const geometry = new THREE.CylinderGeometry(lineRadius, lineRadius, distance, 8);
    const cylinder = new THREE.Mesh(geometry, material);

    // Position at midpoint
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);

    // Orient along line direction
    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);

    group.add(cylinder);
  }

  return group;
}

/**
 * Create a catenary cable from 3D coordinate arrays
 */
export function createCatenaryFromCoords(
  coords: Array<[number, number, number]>,
  options: CatenaryOptions = {}
): THREE.Group {
  const { color = RISER_COLORS[0], lineRadius = 0.15 } = options;

  const group = new THREE.Group();
  group.name = 'CatenaryCable';
  group.userData = {
    type: 'catenaryCable',
    pointCount: coords.length,
  };

  const material = new THREE.MeshBasicMaterial({ color });

  for (let i = 0; i < coords.length - 1; i++) {
    const start = new THREE.Vector3(coords[i][0], coords[i][1], coords[i][2]);
    const end = new THREE.Vector3(coords[i + 1][0], coords[i + 1][1], coords[i + 1][2]);

    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();

    if (distance < 0.001) continue;

    const geometry = new THREE.CylinderGeometry(lineRadius, lineRadius, distance, 8);
    const cylinder = new THREE.Mesh(geometry, material);

    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);

    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);

    group.add(cylinder);
  }

  return group;
}

/**
 * Create TDP marker on seabed
 */
export function createTDPMarker(
  x: number,
  y: number,
  depth: number,
  color: number = 0xffeb3b
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, -depth);
  mesh.userData = {
    type: 'tdpMarker',
    name: 'Touch Down Point',
    position: { x, y, z: -depth },
  };

  return mesh;
}
