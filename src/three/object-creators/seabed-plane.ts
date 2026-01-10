/**
 * Seabed plane creator
 */

import * as THREE from 'three';
import { COLORS } from '../config';

export interface SeabedOptions {
  size?: number;
  addNoise?: boolean;
}

/**
 * Create a seabed plane at specified depth
 */
export function createSeabed(depth: number, options: SeabedOptions = {}): THREE.Mesh {
  const { size = 2000, addNoise = true } = options;

  const geometry = new THREE.PlaneGeometry(size, size, 64, 64);

  // Add subtle noise for realistic seabed appearance
  if (addNoise) {
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      positions.setZ(i, z + (Math.random() - 0.5) * 0.5);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  const material = new THREE.MeshLambertMaterial({
    color: COLORS.seabed,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, -depth);
  mesh.receiveShadow = true;
  mesh.userData = {
    type: 'seabed',
    name: `Seabed at ${depth}m`,
    depth: depth,
  };

  return mesh;
}

/**
 * Create a seabed reference line at specified depth
 */
export function createSeabedLine(depth: number, color: number = 0xff6b35): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(2000, 2, 0.5);
  const material = new THREE.MeshBasicMaterial({ color });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, -depth);
  mesh.userData = {
    type: 'seabedLine',
    name: `Seabed Line ${depth}m`,
    depth: depth,
  };

  return mesh;
}
