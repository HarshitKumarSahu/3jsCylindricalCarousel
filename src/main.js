import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Get the canvas element
const canvas = document.getElementById('canvas');
if (!canvas) {
    throw new Error('Canvas element with id "canvas" not found.');
}

// Create the renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Create a camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 2, 5);

// Basic geometry to render
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// LOAD MODEL
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('/draco/');
loader.setDRACOLoader(draco);

// Load hand model
let handModel;
let scale = 2

loader.load(
  '/model/hand.glb',
  gltf => {
    handModel = gltf.scene;
    // handModel.traverse(child => {
    //   if (child.isMesh) {
    //     child.material = new THREE.MeshNormalMaterial();
    //   }
    // });
    handModel.scale.set(scale, scale, scale);
    const box = new THREE.Box3().setFromObject(handModel);
    handModel.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(handModel);
  }
);

// Some light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Responsive resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;

    controls.update();
    renderer.render(scene, camera);
}
animate();
