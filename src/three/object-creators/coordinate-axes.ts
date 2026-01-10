/**
 * Coordinate system axes creator
 * Creates visual coordinate axes for global and local reference frames
 */

import * as THREE from 'three';

export interface CoordinateAxesOptions {
  size?: number;
  labelSize?: number;
  showLabels?: boolean;
}

/**
 * Create coordinate axes (X=red, Y=green, Z=blue)
 */
export function createCoordinateAxes(
  options: CoordinateAxesOptions = {}
): THREE.Group {
  const { size = 20, showLabels = true } = options;

  const group = new THREE.Group();
  group.name = 'CoordinateAxes';
  group.userData = { type: 'coordinateAxes' };

  // Create arrow helpers for each axis
  const origin = new THREE.Vector3(0, 0, 0);

  // X axis - Red
  const xDir = new THREE.Vector3(1, 0, 0);
  const xArrow = new THREE.ArrowHelper(xDir, origin, size, 0xff0000, size * 0.15, size * 0.08);
  xArrow.name = 'X-axis';
  group.add(xArrow);

  // Y axis - Green
  const yDir = new THREE.Vector3(0, 1, 0);
  const yArrow = new THREE.ArrowHelper(yDir, origin, size, 0x00ff00, size * 0.15, size * 0.08);
  yArrow.name = 'Y-axis';
  group.add(yArrow);

  // Z axis - Blue
  const zDir = new THREE.Vector3(0, 0, 1);
  const zArrow = new THREE.ArrowHelper(zDir, origin, size, 0x0088ff, size * 0.15, size * 0.08);
  zArrow.name = 'Z-axis';
  group.add(zArrow);

  // Add axis labels using sprites
  if (showLabels) {
    const xLabel = createAxisLabel('X', 0xff0000);
    xLabel.position.set(size + 3, 0, 0);
    group.add(xLabel);

    const yLabel = createAxisLabel('Y', 0x00ff00);
    yLabel.position.set(0, size + 3, 0);
    group.add(yLabel);

    const zLabel = createAxisLabel('Z', 0x0088ff);
    zLabel.position.set(0, 0, size + 3);
    group.add(zLabel);
  }

  return group;
}

/**
 * Create global coordinate system at origin
 */
export function createGlobalCoordinateSystem(size: number = 30): THREE.Group {
  const axes = createCoordinateAxes({ size, showLabels: true });
  axes.name = 'GlobalCoordinateSystem';
  axes.userData = { type: 'globalCoordinates' };

  // Add origin sphere
  const originGeometry = new THREE.SphereGeometry(1.5, 16, 16);
  const originMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const originSphere = new THREE.Mesh(originGeometry, originMaterial);
  originSphere.name = 'GlobalOrigin';
  axes.add(originSphere);

  // Add "Global" label
  const globalLabel = createAxisLabel('GLOBAL', 0xffffff);
  globalLabel.position.set(0, 0, size + 8);
  axes.add(globalLabel);

  return axes;
}

/**
 * Create vessel local coordinate system
 */
export function createVesselCoordinateSystem(size: number = 15): THREE.Group {
  const axes = createCoordinateAxes({ size, showLabels: true });
  axes.name = 'VesselCoordinateSystem';
  axes.userData = { type: 'vesselCoordinates' };

  // Add origin sphere
  const originGeometry = new THREE.SphereGeometry(1, 16, 16);
  const originMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const originSphere = new THREE.Mesh(originGeometry, originMaterial);
  originSphere.name = 'VesselOrigin';
  axes.add(originSphere);

  // Add "Vessel" label
  const vesselLabel = createAxisLabel('VESSEL', 0xffff00);
  vesselLabel.position.set(0, 0, size + 5);
  axes.add(vesselLabel);

  return axes;
}

/**
 * Create a text label sprite for axis
 */
function createAxisLabel(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 128;
  canvas.height = 64;

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw text
  context.font = 'Bold 48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Convert hex color to CSS
  const hexColor = '#' + color.toString(16).padStart(6, '0');
  context.fillStyle = hexColor;
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(8, 4, 1);
  sprite.name = `Label-${text}`;

  return sprite;
}
