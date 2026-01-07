// import * as THREE from 'three';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// const canvas = document.getElementById('canvas');
// const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.setSize(window.innerWidth, window.innerHeight);

// // Match the background color to the fog color for seamless blending
// const backgroundColor = 0x121212;
// renderer.setClearColor(backgroundColor);

// const scene = new THREE.Scene();
// // --- Added Deep Fog ---
// // Density 0.02 creates a nice fade; adjust higher (0.04) for closer fog
// scene.fog = new THREE.FogExp2(backgroundColor, 0.035);

// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
// camera.position.set(0, 0, 18);

// // --- Lighting ---
// scene.add(new THREE.AmbientLight(0xffffff, 0.8));
// // const dirLight = new THREE.DirectionalLight(0x4444ff, 2);
// // dirLight.position.set(5, 5, 10);
// // scene.add(dirLight);

// // --- Config ---
// const config = {
//     radius: 12,
//     slideHeight: 4,
//     segmentsX: 64,
//     segmentsY: 64,
//     verticalSpacing: 6,
//     totalRows: 6,
//     cardsPerRow: 10,
//     images: [
//         "/projects/1.jpg", 
//         "/projects/2.jpg", 
//         "/projects/3.jpg", 
//         "/projects/4.jpg",
//         "/projects/5.jpg", 
//         "/projects/6.jpg", 
//         "/projects/7.jpg", 
//         "/projects/8.jpg",
//         "/projects/9.jpg", 
//         "/projects/10.jpg",
//         "/projects/11.jpg",
//         "/projects/12.jpg",
//         "/projects/13.jpg",
//         "/projects/14.jpg",
//         "/projects/15.jpg",
//     ]
// };

// // --- Shaders (For Images Only) ---
// const vertexShader = `
//     varying vec2 vUv;
//     varying float vDist;
//     uniform float uRadius;
//     uniform float uTime;
//     uniform float uRandom;
//     uniform float uVelocity;

//     // Simplex 2D noise
//     vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
//     float snoise(vec2 v){
//         const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
//         vec2 i  = floor(v + dot(v, C.yy) );
//         vec2 x0 = v -   i + dot(i, C.xx);
//         vec2 i1;
//         i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
//         vec4 x12 = x0.xyxy + C.xxzz;
//         x12.xy -= i1;
//         i = mod(i, 289.0);
//         vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
//         vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
//         m = m*m ; m = m*m ;
//         vec3 x = 2.0 * fract(p * C.www) - 1.0;
//         vec3 h = abs(x) - 0.5;
//         vec3 ox = floor(x + 0.5);
//         vec3 a0 = x - ox;
//         m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
//         vec3 g;
//         g.x  = a0.x  * x0.x  + h.x  * x0.y;
//         g.yz = a0.yz * x12.xz + h.yz * x12.yw;
//         return 130.0 * dot(m, g);
//     }

//     void main() {
//         vUv = uv;
//         vec3 pos = position;

//         pos.y *= 1.0 + abs(uVelocity) * 0.3;

//         float angle = pos.x / uRadius;
//         vec3 bentPos;
//         bentPos.x = uRadius * sin(angle);
//         bentPos.y = pos.y;
//         bentPos.z = uRadius * (cos(angle) - 1.0); 

//         float floatFreq = 0.5 + uRandom;
//         bentPos.y += sin(uTime * floatFreq + uRandom * 10.0) * 0.25;
//         bentPos.z += cos(uTime * floatFreq * 0.5) * 0.15;

//         float noiseVal = snoise(pos.xy * 0.5 + uTime) * abs(uVelocity);
//         bentPos.x += noiseVal;
//         bentPos.y += noiseVal * 0.5;

//         float distortion = sin(pos.y * 5.0 + uTime * 3.0) * 0.05 * abs(uVelocity);
//         bentPos.x += distortion;
//         bentPos.z += distortion * 0.5;

//         vec4 worldPosition = modelMatrix * vec4(bentPos, 1.0);
//         vDist = length(worldPosition.xyz - cameraPosition);
//         gl_Position = projectionMatrix * viewMatrix * worldPosition;
//     }
// `;

// const fragmentShader = `
//     varying vec2 vUv;
//     varying float vDist;
//     uniform sampler2D uTexture;
//     uniform float uOpacity;
//     uniform float uVelocity;

//     void main() {
//         vec4 tex = texture2D(uTexture, vUv);
//         float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
//         vec3 finalColor = vec3(gray * 0.25); // Dark Grey
        
//         // Fog logic inside shader (optional, but Scene Fog usually handles this better globally)
//         // We will rely on scene.fog for the main fade, but keep this for opacity fade
//         float fade = 1.0 - smoothstep(12.0, 35.0, vDist);
//         vec3 dynamicColor = finalColor * (1.0 + 0.3 * abs(uVelocity));
        
//         gl_FragColor = vec4(dynamicColor, uOpacity * fade);
//     }
// `;

// // --- Central Model (Keeping your NormalMaterial as placeholder) ---
// const dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); 
// const gltfLoader = new GLTFLoader();
// gltfLoader.setDRACOLoader(dracoLoader);

// let centralModel;
// gltfLoader.load('/model/hand.glb', (gltf) => {
//     centralModel = gltf.scene;
//     centralModel.traverse((child) => {
//         if (child.isMesh) {
//             // Right now: Normal Material (Rainbow)
//             child.material = new THREE.MeshNormalMaterial();
//         }
//     });
//     centralModel.scale.set(6, 6, 6);
//     const box = new THREE.Box3().setFromObject(centralModel);
//     centralModel.position.sub(box.getCenter(new THREE.Vector3()));
//     scene.add(centralModel);
// });

// // --- Create Slides ---
// const slides = [];
// const textureLoader = new THREE.TextureLoader();
// const circumference = 2 * Math.PI * config.radius;
// const exactWidth = (circumference / config.cardsPerRow) * 0.85; 

// const imageGeometry = new THREE.PlaneGeometry(exactWidth, config.slideHeight, config.segmentsX, config.segmentsY);
// const wireframeGeometry = new THREE.PlaneGeometry(exactWidth, config.slideHeight, 1, 1);

// const loadedTextures = config.images.map(path => {
//     const t = textureLoader.load(path);
//     t.colorSpace = THREE.SRGBColorSpace;
//     return t;
// });

// for (let r = 0; r < config.totalRows; r++) {
//     for (let c = 0; c < config.cardsPerRow; c++) {
//         const cardRandom = Math.random();
//         // const tex = textureLoader.load(config.images[(r * config.cardsPerRow + c) % config.images.length]);
//         const tex = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
//         tex.colorSpace = THREE.SRGBColorSpace;

//         const baseY = (r - config.totalRows / 2 + 0.5) * config.verticalSpacing;
//         const angle = (c / config.cardsPerRow) * Math.PI * 2;

//         // Function to position meshes (used for both Image and Wireframe)
//         const positionMesh = (mesh, zOffset, yRandom) => {
//             mesh.userData = { 
//                 baseY: baseY + yRandom,
//                 zOffset: zOffset
//             };
//             const radiusOffset = config.radius + mesh.userData.zOffset;
//             mesh.position.x = Math.cos(angle) * radiusOffset;
//             mesh.position.z = Math.sin(angle) * radiusOffset;
//             mesh.position.y = mesh.userData.baseY;
//             mesh.lookAt(0, mesh.position.y, 0);
//             mesh.rotateY(Math.PI);
//             mesh.rotation.z += (Math.random() - 0.5) * 0.15;
//             scene.add(mesh);
//             slides.push(mesh);
//         }

//         // 1. Create Main Image (Using Shader)
//         const imgMat = new THREE.ShaderMaterial({
//             uniforms: {
//                 uTexture: { value: tex },
//                 uOpacity: { value: 5 },
//                 uRadius: { value: config.radius },
//                 uTime: { value: 0 },
//                 uRandom: { value: cardRandom },
//                 uVelocity: { value: 0 }
//             },
//             vertexShader, fragmentShader,
//             transparent: true, side: THREE.DoubleSide,
//             blending: THREE.AdditiveBlending, depthWrite: false
//         });
//         const imgMesh = new THREE.Mesh(imageGeometry, imgMat);
//         const imgYNoise = (Math.random() - 0.5) * 2.0;
//         positionMesh(imgMesh, 0, imgYNoise);


//         // 2. Create Wireframe (Using Standard Material) - 40% Chance
//         if (Math.random() < 0.40) {
//             // Using MeshBasicMaterial for a clean, white wireframe look
//             // If you actually meant "MeshNormalMaterial" (Rainbow wires), change this line!
//             const wireMat = new THREE.MeshBasicMaterial({ 
//                 color: 0xffffff, 
//                 wireframe: true,
//                 transparent: true,
//                 opacity: 0.3
//             });
            
//             const wireMesh = new THREE.Mesh(wireframeGeometry, wireMat);
            
//             const direction = Math.random() > 0.5 ? 1 : -1;
//             const zOffset = (direction * 0.3) + (Math.random() - 0.5) * 0.1;
//             const wireYNoise = (Math.random() - 0.5) * 2.0 + (Math.random() - 0.5) * 0.5;
            
//             positionMesh(wireMesh, zOffset, wireYNoise);
//         }
//     }
// }

// // --- Post Processing ---
// const composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(scene, camera));

// const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0125, 0.125, 0.075);
// composer.addPass(bloomPass);

// const rgbShiftPass = new ShaderPass(RGBShiftShader);
// rgbShiftPass.uniforms['amount'].value = 0.00225;
// composer.addPass(rgbShiftPass);

// // --- Interaction State ---
// let scrollY = 0;
// let targetScrollY = 0;
// let prevScrollY = 0;
// let velocity = 0;

// const mouse = { x: 0, y: 0 };
// const targetMouse = { x: 0, y: 0 };

// window.addEventListener('wheel', (e) => {
//     targetScrollY += e.deltaY * 0.005;
// });

// window.addEventListener('mousemove', (e) => {
//     targetMouse.x = (e.clientX / window.innerWidth) - 0.5;
//     targetMouse.y = (e.clientY / window.innerHeight) - 0.5;
// });

// const totalHeight = config.totalRows * config.verticalSpacing;
// const clock = new THREE.Clock();

// function animate() {
//     requestAnimationFrame(animate);
//     const elapsedTime = clock.getElapsedTime();

//     prevScrollY = scrollY;
//     scrollY += (targetScrollY - scrollY) * 0.05;
//     velocity = scrollY - prevScrollY;

//     bloomPass.strength = 0.0125 + Math.abs(velocity) * 0.125; 
//     // rgbShiftPass.uniforms['amount'].value = 0.001 + Math.abs(velocity) * 0.01125;
//     rgbShiftPass.uniforms['amount'].value = 0.00225 + (Math.abs(velocity) * 0.01);

//     mouse.x += (targetMouse.x - mouse.x) * 0.05;
//     mouse.y += (targetMouse.y - mouse.y) * 0.05;

//     scene.rotation.y = scrollY * 0.1 + (mouse.x * 0.2);
//     scene.rotation.x = mouse.y * 0.1;
//     if (centralModel) centralModel.rotation.y -= 0.005;

//     // Update Slides
//     slides.forEach(slide => {
//         // Only update shader uniforms if it is the ShaderMaterial (Image)
//         if (slide.material.uniforms) {
//             slide.material.uniforms.uTime.value = elapsedTime;
//             slide.material.uniforms.uVelocity.value = velocity;
//         }
        
//         let y = slide.userData.baseY - scrollY;
//         const halfHeight = totalHeight / 2;
//         y = ((y + halfHeight) % totalHeight + totalHeight) % totalHeight - halfHeight;
//         slide.position.y = y;
//     });

//     composer.render();
// }

// animate();

// window.addEventListener('resize', () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     composer.setSize(window.innerWidth, window.innerHeight);
//     bloomPass.setSize(window.innerWidth, window.innerHeight);
// });



import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Match the background color to the fog color for seamless blending
const backgroundColor = 0x121212;
renderer.setClearColor(backgroundColor);

const scene = new THREE.Scene();
// --- Added Deep Fog ---
// Density 0.02 creates a nice fade; adjust higher (0.04) for closer fog
scene.fog = new THREE.FogExp2(backgroundColor, 0.035);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 18);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
// const dirLight = new THREE.DirectionalLight(0x4444ff, 2);
// dirLight.position.set(5, 5, 10);
// scene.add(dirLight);

// --- Config ---
const config = {
    radius: 12,
    slideHeight: 4,
    segmentsX: 64,
    segmentsY: 64,
    verticalSpacing: 6,
    totalRows: 6,
    cardsPerRow: 10,
    images: [
        "/projects/1.jpg", 
        "/projects/2.jpg", 
        "/projects/3.jpg", 
        "/projects/4.jpg",
        "/projects/5.jpg", 
        "/projects/6.jpg", 
        "/projects/7.jpg", 
        "/projects/8.jpg",
        "/projects/9.jpg", 
        "/projects/10.jpg",
        "/projects/11.jpg",
        "/projects/12.jpg",
        "/projects/13.jpg",
        "/projects/14.jpg",
        "/projects/15.jpg",
    ]
};

// --- Shaders (For Images Only) ---
const vertexShader = `
    varying vec2 vUv;
    varying float vDist;
    uniform float uRadius;
    uniform float uTime;
    uniform float uRandom;
    uniform float uVelocity;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vUv = uv;
        vec3 pos = position;

        pos.y *= 1.0 + abs(uVelocity) * 0.3;

        float angle = pos.x / uRadius;
        vec3 bentPos;
        bentPos.x = uRadius * sin(angle);
        bentPos.y = pos.y;
        bentPos.z = uRadius * (cos(angle) - 1.0); 

        float floatFreq = 0.5 + uRandom;
        bentPos.y += sin(uTime * floatFreq + uRandom * 10.0) * 0.25;
        bentPos.z += cos(uTime * floatFreq * 0.5) * 0.15;

        float noiseVal = snoise(pos.xy * 0.5 + uTime) * abs(uVelocity);
        bentPos.x += noiseVal;
        bentPos.y += noiseVal * 0.5;

        float distortion = sin(pos.y * 5.0 + uTime * 3.0) * 0.05 * abs(uVelocity);
        bentPos.x += distortion;
        bentPos.z += distortion * 0.5;

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
    uniform float uVelocity;

    void main() {
        vec4 tex = texture2D(uTexture, vUv);
        float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        vec3 finalColor = vec3(gray * 0.25); // Dark Grey
        
        // Fog logic inside shader (optional, but Scene Fog usually handles this better globally)
        // We will rely on scene.fog for the main fade, but keep this for opacity fade
        float fade = 1.0 - smoothstep(12.0, 35.0, vDist);
        vec3 dynamicColor = finalColor * (1.0 + 0.3 * abs(uVelocity));
        
        gl_FragColor = vec4(dynamicColor, uOpacity * fade);
    }
`;

// --- Central Model (Keeping your NormalMaterial as placeholder) ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); 
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let centralModel;
gltfLoader.load('/model/hand.glb', (gltf) => {
    centralModel = gltf.scene;
    centralModel.traverse((child) => {
        if (child.isMesh) {
            // Right now: Normal Material (Rainbow)
            child.material = new THREE.MeshNormalMaterial();
        }
    });
    centralModel.scale.set(6, 6, 6);
    const box = new THREE.Box3().setFromObject(centralModel);
    centralModel.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(centralModel);
});

// --- Create Slides ---
const slides = [];
const textureLoader = new THREE.TextureLoader();
const circumference = 2 * Math.PI * config.radius;
const exactWidth = (circumference / config.cardsPerRow) * 0.85; 

const imageGeometry = new THREE.PlaneGeometry(exactWidth, config.slideHeight, config.segmentsX, config.segmentsY);
const wireframeGeometry = new THREE.PlaneGeometry(exactWidth, config.slideHeight, 1, 1);

const loadedTextures = config.images.map(path => {
    const t = textureLoader.load(path);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
});

for (let r = 0; r < config.totalRows; r++) {
    for (let c = 0; c < config.cardsPerRow; c++) {
        const cardRandom = Math.random();
        // const tex = textureLoader.load(config.images[(r * config.cardsPerRow + c) % config.images.length]);
        const tex = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
        tex.colorSpace = THREE.SRGBColorSpace;

        const baseY = (r - config.totalRows / 2 + 0.5) * config.verticalSpacing;
        const angle = (c / config.cardsPerRow) * Math.PI * 2;

        // Function to position meshes (used for both Image and Wireframe)
        const positionMesh = (mesh, zOffset, yRandom) => {
            mesh.userData = { 
                baseY: baseY + yRandom,
                zOffset: zOffset
            };
            const radiusOffset = config.radius + mesh.userData.zOffset;
            mesh.position.x = Math.cos(angle) * radiusOffset;
            mesh.position.z = Math.sin(angle) * radiusOffset;
            mesh.position.y = mesh.userData.baseY;
            mesh.lookAt(0, mesh.position.y, 0);
            mesh.rotateY(Math.PI);
            mesh.rotation.z += (Math.random() - 0.5) * 0.15;
            scene.add(mesh);
            slides.push(mesh);
        }

        // 1. Create Main Image (Using Shader)
        const imgMat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uOpacity: { value: 5 },
                uRadius: { value: config.radius },
                uTime: { value: 0 },
                uRandom: { value: cardRandom },
                uVelocity: { value: 0 }
            },
            vertexShader, fragmentShader,
            transparent: true, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const imgMesh = new THREE.Mesh(imageGeometry, imgMat);
        const imgYNoise = (Math.random() - 0.5) * 2.0;
        positionMesh(imgMesh, 0, imgYNoise);


        // 2. Create Wireframe (Using Standard Material) - 40% Chance
        if (Math.random() < 0.40) {
            // Using MeshBasicMaterial for a clean, white wireframe look
            // If you actually meant "MeshNormalMaterial" (Rainbow wires), change this line!
            const wireMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            const wireMesh = new THREE.Mesh(wireframeGeometry, wireMat);
            
            const direction = Math.random() > 0.5 ? 1 : -1;
            const zOffset = (direction * 0.3) + (Math.random() - 0.5) * 0.1;
            const wireYNoise = (Math.random() - 0.5) * 2.0 + (Math.random() - 0.5) * 0.5;
            
            positionMesh(wireMesh, zOffset, wireYNoise);
        }
    }
}

// --- Post Processing ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0125, 0.125, 0.075);
composer.addPass(bloomPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.00225;
composer.addPass(rgbShiftPass);

// ... existing imports and setup ...

// --- Interaction State ---
let scrollY = 0;
let targetScrollY = 0;
let prevScrollY = 0;
let velocity = 0;

const mouse = { x: 0, y: 0 };
const targetMouse = { x: 0, y: 0 };

// 1. Desktop: Wheel
window.addEventListener('wheel', (e) => {
    targetScrollY += e.deltaY * 0.005;
});

// 2. Desktop: Mouse movement for Parallax
window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) - 0.5;
    targetMouse.y = (e.clientY / window.innerHeight) - 0.5;
});

// ---------------------------------------------------------
// 3. Mobile: Touch Logic (THE FIX)
// ---------------------------------------------------------
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

window.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    // Calculate difference
    const deltaY = touchStartY - touchY; 
    
    // Update targetScrollY (adjust sensitivity with the multiplier)
    targetScrollY += deltaY * 0.015; 
    
    // Update start position for continuous scrolling
    touchStartY = touchY;
});
// ---------------------------------------------------------

// ... rest of your animate function ...

const totalHeight = config.totalRows * config.verticalSpacing;
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    prevScrollY = scrollY;
    scrollY += (targetScrollY - scrollY) * 0.05;
    velocity = scrollY - prevScrollY;

    bloomPass.strength = 0.0125 + Math.abs(velocity) * 0.125; 
    // rgbShiftPass.uniforms['amount'].value = 0.001 + Math.abs(velocity) * 0.01125;
    rgbShiftPass.uniforms['amount'].value = 0.00225 + (Math.abs(velocity) * 0.01);

    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    scene.rotation.y = scrollY * 0.1 + (mouse.x * 0.2);
    scene.rotation.x = mouse.y * 0.1;
    if (centralModel) centralModel.rotation.y -= 0.005;

    // Update Slides
    slides.forEach(slide => {
        // Only update shader uniforms if it is the ShaderMaterial (Image)
        if (slide.material.uniforms) {
            slide.material.uniforms.uTime.value = elapsedTime;
            slide.material.uniforms.uVelocity.value = velocity;
        }
        
        let y = slide.userData.baseY - scrollY;
        const halfHeight = totalHeight / 2;
        y = ((y + halfHeight) % totalHeight + totalHeight) % totalHeight - halfHeight;
        slide.position.y = y;
    });

    composer.render();
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.setSize(window.innerWidth, window.innerHeight);
});



