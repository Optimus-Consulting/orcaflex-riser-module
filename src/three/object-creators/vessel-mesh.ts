/**
 * Vessel mesh creator
 */

import * as THREE from 'three';
import { VesselDimensions, COLORS } from '../config';

export interface VesselOptions {
  color?: number;
  opacity?: number;
}

/**
 * Create a simple box vessel representation
 */
export function createVesselMesh(
  dimensions: VesselDimensions,
  options: VesselOptions = {}
): THREE.Mesh {
  const { color = COLORS.vessel, opacity = 1 } = options;

  const geometry = new THREE.BoxGeometry(
    dimensions.length,
    dimensions.breadth,
    dimensions.depth
  );

  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    type: 'vessel',
    name: 'Vessel',
    dimensions,
  };

  return mesh;
}

/**
 * Create a vessel group with hull and indicators
 */
export function createVesselGroup(
  dimensions: VesselDimensions,
  position: { x: number; y: number; z: number }
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VesselGroup';
  group.userData = { type: 'vesselGroup' };

  // Create hull
  const hull = createVesselMesh(dimensions);
  // Position hull so waterline is at z=0
  hull.position.set(0, 0, dimensions.depth / 2 - dimensions.draft);
  group.add(hull);

  // Create COG indicator
  const cogGeometry = new THREE.SphereGeometry(1, 16, 16);
  const cogMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.vesselCOG,
    emissive: 0xff1122,
    emissiveIntensity: 0.3,
  });
  const cog = new THREE.Mesh(cogGeometry, cogMaterial);
  cog.userData = { type: 'vesselCOG', name: 'Center of Gravity' };
  group.add(cog);

  // Position the group
  group.position.set(position.x, position.y, position.z);

  return group;
}

/**
 * Create a connection point indicator with label
 */
export function createConnectionPoint(
  position: { x: number; y: number; z: number },
  name: string,
  color: number = COLORS.cdp
): THREE.Group {
  const group = new THREE.Group();
  group.name = `ConnectionPoint-${name}`;

  // Create sphere for the connection point
  const geometry = new THREE.SphereGeometry(2, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  // Create ring around the sphere for better visibility
  const ringGeometry = new THREE.RingGeometry(2.5, 3, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2; // Make ring horizontal
  group.add(ring);

  // Create text label
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'Bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const label = new THREE.Sprite(labelMaterial);
  label.position.set(0, 0, 8); // Position label above the point
  label.scale.set(16, 4, 1);
  group.add(label);

  group.position.set(position.x, position.y, position.z);
  group.userData = {
    type: 'connectionPoint',
    name,
    position,
  };

  return group;
}
