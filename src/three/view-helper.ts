import * as THREE from 'three';

/**
 * ViewHelper - Interactive orientation indicator based on Three.js editor ViewHelper
 * Displays an interactive 3D axes indicator that shows camera orientation
 * and allows clicking on axes to snap to standard views
 */
export class ViewHelper extends THREE.Object3D {
  animating = false;
  controls: { center: THREE.Vector3 } | null = null;

  private camera: THREE.OrthographicCamera;
  private dim = 128;
  private turnRate = 2 * Math.PI;

  private interactiveObjects: THREE.Sprite[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private dummy = new THREE.Object3D();

  private posXAxisHelper: THREE.Sprite;
  private posYAxisHelper: THREE.Sprite;
  private posZAxisHelper: THREE.Sprite;
  private negXAxisHelper: THREE.Sprite;
  private negYAxisHelper: THREE.Sprite;
  private negZAxisHelper: THREE.Sprite;

  private point = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private targetQuaternion = new THREE.Quaternion();
  private q1 = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private radius = 0;

  private editorCamera: THREE.Camera;

  constructor(editorCamera: THREE.Camera) {
    super();

    this.editorCamera = editorCamera;

    // Axis colors
    const color1 = new THREE.Color('#ff3653'); // X - Red
    const color2 = new THREE.Color('#8adb00'); // Y - Green
    const color3 = new THREE.Color('#2c8fff'); // Z - Blue

    // Create orthographic camera for the helper
    this.camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4);
    this.camera.position.set(0, 0, 2);

    // Create axis geometry
    const geometry = new THREE.BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);

    const xAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color1));
    const yAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color2));
    const zAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color3));

    yAxis.rotation.z = Math.PI / 2;
    zAxis.rotation.y = -Math.PI / 2;

    this.add(xAxis);
    this.add(zAxis);
    this.add(yAxis);

    // Create sprite helpers for positive axes (with labels)
    this.posXAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color1, 'X'));
    this.posXAxisHelper.userData.type = 'posX';
    this.posYAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color2, 'Y'));
    this.posYAxisHelper.userData.type = 'posY';
    this.posZAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color3, 'Z'));
    this.posZAxisHelper.userData.type = 'posZ';

    // Create sprite helpers for negative axes (without labels)
    this.negXAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color1));
    this.negXAxisHelper.userData.type = 'negX';
    this.negYAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color2));
    this.negYAxisHelper.userData.type = 'negY';
    this.negZAxisHelper = new THREE.Sprite(this.getSpriteMaterial(color3));
    this.negZAxisHelper.userData.type = 'negZ';

    // Position sprites
    this.posXAxisHelper.position.x = 1;
    this.posYAxisHelper.position.y = 1;
    this.posZAxisHelper.position.z = 1;
    this.negXAxisHelper.position.x = -1;
    this.negXAxisHelper.scale.setScalar(0.8);
    this.negYAxisHelper.position.y = -1;
    this.negYAxisHelper.scale.setScalar(0.8);
    this.negZAxisHelper.position.z = -1;
    this.negZAxisHelper.scale.setScalar(0.8);

    this.add(this.posXAxisHelper);
    this.add(this.posYAxisHelper);
    this.add(this.posZAxisHelper);
    this.add(this.negXAxisHelper);
    this.add(this.negYAxisHelper);
    this.add(this.negZAxisHelper);

    // Add to interactive objects for raycasting
    this.interactiveObjects.push(this.posXAxisHelper);
    this.interactiveObjects.push(this.posYAxisHelper);
    this.interactiveObjects.push(this.posZAxisHelper);
    this.interactiveObjects.push(this.negXAxisHelper);
    this.interactiveObjects.push(this.negYAxisHelper);
    this.interactiveObjects.push(this.negZAxisHelper);
  }

  /**
   * Render the view helper to a viewport in the main renderer
   */
  render(renderer: THREE.WebGLRenderer, containerWidth: number, _containerHeight: number): void {
    this.updateOpacity();

    // Render in corner - save and restore autoClear state
    const x = containerWidth - this.dim;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;

    renderer.setViewport(x, 0, this.dim, this.dim);
    renderer.clearDepth();
    renderer.render(this, this.camera);

    renderer.autoClear = autoClear;
  }

  /**
   * Render the view helper to a separate canvas/renderer
   */
  renderToCanvas(renderer: THREE.WebGLRenderer): void {
    this.updateOpacity();

    // Render to the full canvas
    renderer.render(this, this.camera);
  }

  /**
   * Update opacity based on camera orientation
   */
  private updateOpacity(): void {
    // Update orientation to match editor camera
    this.quaternion.copy(this.editorCamera.quaternion).invert();
    this.updateMatrixWorld();

    // Update opacity based on camera direction
    this.point.set(0, 0, 1);
    this.point.applyQuaternion(this.editorCamera.quaternion);

    if (this.point.x >= 0) {
      this.posXAxisHelper.material.opacity = 1;
      this.negXAxisHelper.material.opacity = 0.5;
    } else {
      this.posXAxisHelper.material.opacity = 0.5;
      this.negXAxisHelper.material.opacity = 1;
    }

    if (this.point.y >= 0) {
      this.posYAxisHelper.material.opacity = 1;
      this.negYAxisHelper.material.opacity = 0.5;
    } else {
      this.posYAxisHelper.material.opacity = 0.5;
      this.negYAxisHelper.material.opacity = 1;
    }

    if (this.point.z >= 0) {
      this.posZAxisHelper.material.opacity = 1;
      this.negZAxisHelper.material.opacity = 0.5;
    } else {
      this.posZAxisHelper.material.opacity = 0.5;
      this.negZAxisHelper.material.opacity = 1;
    }
  }

  /**
   * Handle click on the view helper
   * Returns true if a click was handled
   */
  handleClick(event: MouseEvent, container: HTMLElement): boolean {
    if (this.animating) return false;

    const rect = container.getBoundingClientRect();
    const offsetX = rect.right - this.dim;
    const offsetY = rect.bottom - this.dim;

    // Check if click is in the helper area
    if (event.clientX < offsetX || event.clientY < offsetY) {
      return false;
    }

    // Convert to normalized device coordinates for the helper viewport
    this.mouse.x = ((event.clientX - offsetX) / this.dim) * 2 - 1;
    this.mouse.y = -((event.clientY - offsetY) / this.dim) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object;

      if (this.controls) {
        this.prepareAnimationData(object, this.controls.center);
        this.animating = true;
      }

      return true;
    }

    return false;
  }

  /**
   * Update animation (call in render loop)
   */
  update(delta: number): void {
    if (!this.animating) return;

    const step = delta * this.turnRate;
    const focusPoint = this.controls?.center || new THREE.Vector3();

    this.q1.rotateTowards(this.q2, step);

    if (this.editorCamera instanceof THREE.PerspectiveCamera ||
        this.editorCamera instanceof THREE.OrthographicCamera) {
      this.editorCamera.position.set(0, 0, 1)
        .applyQuaternion(this.q1)
        .multiplyScalar(this.radius)
        .add(focusPoint);

      this.editorCamera.quaternion.rotateTowards(this.targetQuaternion, step);
    }

    if (this.q1.angleTo(this.q2) === 0) {
      this.animating = false;
    }
  }

  /**
   * Set the dimension of the helper
   */
  setDimension(dim: number): void {
    this.dim = dim;
  }

  private prepareAnimationData(object: THREE.Object3D, focusPoint: THREE.Vector3): void {
    switch (object.userData.type) {
      case 'posX':
        this.targetPosition.set(1, 0, 0);
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0));
        break;
      case 'posY':
        this.targetPosition.set(0, 1, 0);
        this.targetQuaternion.setFromEuler(new THREE.Euler(-Math.PI * 0.5, 0, 0));
        break;
      case 'posZ':
        this.targetPosition.set(0, 0, 1);
        this.targetQuaternion.setFromEuler(new THREE.Euler());
        break;
      case 'negX':
        this.targetPosition.set(-1, 0, 0);
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0));
        break;
      case 'negY':
        this.targetPosition.set(0, -1, 0);
        this.targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.5, 0, 0));
        break;
      case 'negZ':
        this.targetPosition.set(0, 0, -1);
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));
        break;
      default:
        console.error('ViewHelper: Invalid axis.');
    }

    this.radius = this.editorCamera.position.distanceTo(focusPoint);
    this.targetPosition.multiplyScalar(this.radius).add(focusPoint);

    this.dummy.position.copy(focusPoint);
    this.dummy.lookAt(this.editorCamera.position);
    this.q1.copy(this.dummy.quaternion);

    this.dummy.lookAt(this.targetPosition);
    this.q2.copy(this.dummy.quaternion);
  }

  private getAxisMaterial(color: THREE.Color): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: color, toneMapped: false });
  }

  private getSpriteMaterial(color: THREE.Color, text: string | null = null): THREE.SpriteMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext('2d')!;
    context.beginPath();
    context.arc(32, 32, 16, 0, 2 * Math.PI);
    context.closePath();
    context.fillStyle = color.getStyle();
    context.fill();

    if (text !== null) {
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillStyle = '#000000';
      context.fillText(text, 32, 41);
    }

    const texture = new THREE.CanvasTexture(canvas);

    return new THREE.SpriteMaterial({ map: texture, toneMapped: false, transparent: true });
  }

  dispose(): void {
    // Dispose of geometries and materials
    this.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
      if (object instanceof THREE.Sprite) {
        if (object.material.map) {
          object.material.map.dispose();
        }
        object.material.dispose();
      }
    });
  }
}
