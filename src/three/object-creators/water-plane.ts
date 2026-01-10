/**
 * Water surface plane creator
 */

import * as THREE from 'three';
import { COLORS } from '../config';

export interface WaterPlaneOptions {
  size?: number;
  opacity?: number;
}

/**
 * Create a water surface plane at z=0
 */
export function createWaterPlane(options: WaterPlaneOptions = {}): THREE.Mesh {
  const { size = 2000, opacity = 0.6 } = options;

  const geometry = new THREE.PlaneGeometry(size, size, 32, 32);

  const material = new THREE.MeshPhongMaterial({
    color: COLORS.water,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    shininess: 100,
    specular: 0x111111,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.receiveShadow = true;
  mesh.userData = {
    type: 'waterSurface',
    name: 'Sea Surface',
  };

  return mesh;
}
