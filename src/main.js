import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Post Processing Imports
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x050505);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 18);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0x4444ff, 2);
dirLight.position.set(5, 5, 10);
scene.add(dirLight);

const redLight = new THREE.PointLight(0xff0000, 1, 20);
redLight.position.set(-5, 0, 5);
scene.add(redLight);

// --- Central Wireframe Model ---
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/model/hand.glb', (gltf) => {
    const model = gltf.scene;
    // model.traverse((child) => {
    //     if (child.isMesh) {
    //         child.material = new THREE.MeshBasicMaterial({
    //             color: 0x444444,
    //             wireframe: true,
    //             transparent: true,
    //             // opacity: 0.3
    //         });
    //     }
    // });
    model.scale.set(4, 4, 4);
    
    const box = new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    
    scene.add(model);
    
    function animateModel() {
        requestAnimationFrame(animateModel);
        model.rotation.y -= 0.002;
    }
    animateModel();
});

// --- Config ---
const config = {
    radius: 10,
    slideWidth: 6,
    slideHeight: 4,
    segmentsX: 32,
    verticalSpacing: 5,
    totalRows: 6,
    cardsPerRow: 8,
    images: [
        "/projects/1.png",
        "/projects/2.png",
        "/projects/3.png",
        "/projects/4.png",
        "/projects/5.png",
        "/projects/6.png",
        "/projects/7.png",
        "/projects/8.png",
        "/projects/9.png",
        "/projects/10.png",
    ]
};

// --- Shader Material ---
// const vertexShader = `
//     varying vec2 vUv;
//     varying float vDist;
    
//     void main() {
//         vUv = uv;
        
//         vec4 worldPosition = modelMatrix * vec4(position, 1.0);
//         vDist = length(worldPosition.xyz - cameraPosition);
        
//         gl_Position = projectionMatrix * viewMatrix * worldPosition;
//     }
// `;

// --- Shader Material ---
const vertexShader = `
    varying vec2 vUv;
    varying float vDist;
    
    uniform float uRadius;

    void main() {
        vUv = uv;
        vec3 pos = position;

        // --- BENDING LOGIC ---
        // Calculate the angle this vertex covers based on the circle radius
        // This bends the flat plane into a curved arc locally
        float angle = pos.x / uRadius;
        
        vec3 bentPos;
        bentPos.x = uRadius * sin(angle);
        bentPos.y = pos.y;
        // (cos(angle) - 1.0) offsets the curve so the center remains at z=0
        bentPos.z = uRadius * (cos(angle) - 1.0); 

        // Apply the model matrix to place the curved mesh into the world
        vec4 worldPosition = modelMatrix * vec4(bentPos, 1.0);
        
        vDist = length(worldPosition.xyz - cameraPosition);
        
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    varying float vDist;
    uniform sampler2D uTexture;
    uniform float uOpacity;

    void main() {
        vec4 tex = texture2D(uTexture, vUv);
        float fade = 1.0 - smoothstep(10.0, 30.0, vDist);
        gl_FragColor = vec4(tex.rgb, uOpacity * fade);
    }
`;

// // --- Create Slides ---
// const slides = [];
// const textureLoader = new THREE.TextureLoader();

// const getTexture = (index) => {
//     const path = config.images[index % config.images.length];
//     const tex = textureLoader.load(path);
//     tex.colorSpace = THREE.SRGBColorSpace;
//     return tex;
// };

// const geometry = new THREE.PlaneGeometry(config.slideWidth, config.slideHeight, config.segmentsX, 1);

// for (let r = 0; r < config.totalRows; r++) {
//     for (let c = 0; c < config.cardsPerRow; c++) {
//         const material = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: getTexture(r * config.cardsPerRow + c) },
//                 uOpacity: { value: 0.9 }
//             },
//             vertexShader,
//             fragmentShader,
//             transparent: true,
//             side: THREE.DoubleSide,
//             blending: THREE.AdditiveBlending,
//             depthWrite: false
//         });

//         const mesh = new THREE.Mesh(geometry, material);
        
//         mesh.userData = { 
//             rowIndex: r, 
//             colIndex: c,
//             baseY: (r - config.totalRows / 2 + 0.5) * config.verticalSpacing 
//         };

//         // Position on cylinder
//         const angle = (c / config.cardsPerRow) * Math.PI * 2;
        
//         mesh.position.x = Math.cos(angle) * config.radius;
//         mesh.position.z = Math.sin(angle) * config.radius;
//         mesh.position.y = mesh.userData.baseY;

//         // Orient to face outward
//         mesh.rotation.y = Math.PI;      // Rotate around Y to point outward
//         mesh.rotation.x = Math.PI;    // Flip so front faces camera (texture visible)

//         scene.add(mesh);
//         slides.push(mesh);
//     }
// }

// --- Create Slides ---
const slides = [];
const textureLoader = new THREE.TextureLoader();

const getTexture = (index) => {
    const path = config.images[index % config.images.length];
    const tex = textureLoader.load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

// 1. Calculate Exact Width for Seamless Ring
// Circumference = 2 * PI * Radius
const circumference = 2 * Math.PI * config.radius;
// We subtract a tiny amount (0.05) to prevent Z-fighting at the edges
const exactWidth = (circumference / config.cardsPerRow) - 0.05;

// Update Geometry with new width and segments
const geometry = new THREE.PlaneGeometry(exactWidth, config.slideHeight, config.segmentsX, 1);

for (let r = 0; r < config.totalRows; r++) {
    for (let c = 0; c < config.cardsPerRow; c++) {
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: getTexture(r * config.cardsPerRow + c) },
                uOpacity: { value: 0.9 },
                uRadius: { value: config.radius } // Pass radius to shader
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,     // Draw both sides
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.userData = { 
            rowIndex: r, 
            colIndex: c,
            baseY: (r - config.totalRows / 2 + 0.5) * config.verticalSpacing 
        };

        // 2. Position on Cylinder Ring
        const angle = (c / config.cardsPerRow) * Math.PI * 2;
        
        mesh.position.x = Math.cos(angle) * config.radius;
        mesh.position.z = Math.sin(angle) * config.radius;
        mesh.position.y = mesh.userData.baseY;

        // 3. Rotation Logic (The Fix)
        // Make the mesh look at the center of the cylinder
        mesh.lookAt(0, mesh.position.y, 0);
        
        // lookAt points the "back" (positive Z) towards the target
        // We flip it 180 degrees (Math.PI) so the front texture faces inward/outward correctly
        mesh.rotateY(Math.PI);

        scene.add(mesh);
        slides.push(mesh);
    }
}

// --- Post Processing ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0025;
composer.addPass(rgbShiftPass);

// --- Animation & Scroll ---
let scrollY = 0;
let targetScrollY = 0;

window.addEventListener('wheel', (e) => {
    targetScrollY += e.deltaY * 0.005;
});

const totalHeight = config.totalRows * config.verticalSpacing;

function animate() {
    requestAnimationFrame(animate);

    // Smooth scroll
    scrollY += (targetScrollY - scrollY) * 0.05;

    // Optional: gentle scene rotation
    scene.rotation.y = scrollY * 0.1;

    // Infinite vertical loop
    slides.forEach(slide => {
        let y = slide.userData.baseY - scrollY; // Note: inverted direction for natural scroll feel
        y = ((y + totalHeight * 100) % totalHeight) - (totalHeight / 2);
        slide.position.y = y;
    });

    composer.render();
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});