import * as THREE from 'three';

let scene, camera, renderer, particles;
let pulseFactor = 0;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

export function init3DBackground(canvasId) {
  const canvas = document.getElementById(canvasId);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.0008);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.z = 1000;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const particleCount = window.innerWidth < 768 ? 1500 : 4000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const color1 = new THREE.Color(0xFF3366); 
  const color2 = new THREE.Color(0x4ECDC4); 
  const color3 = new THREE.Color(0x8A2BE2);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;

    const r = Math.random();
    const mixedColor = r > 0.5 ? color1.clone().lerp(color2, r) : color2.clone().lerp(color3, r);
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const canvasTexture = generateCircleTexture();
  const material = new THREE.PointsMaterial({
    size: 20,
    vertexColors: true,
    map: canvasTexture,
    alphaTest: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('resize', onWindowResize);
  animate();
}

function generateCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

export function pulseBackground() {
  pulseFactor = 1.0;
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.5;
    mouseY = (event.clientY - windowHalfY) * 0.5;
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  particles.rotation.x += 0.05 * (targetY - particles.rotation.x);
  particles.rotation.y += 0.05 * (targetX - particles.rotation.y);
  
  particles.rotation.y += 0.002; // constant rotation

  if (pulseFactor > 0) {
    pulseFactor -= 0.05;
    const scl = 1.0 + (pulseFactor * 0.15);
    particles.scale.set(scl, scl, scl);
  } else {
    particles.scale.set(1, 1, 1);
  }

  renderer.render(scene, camera);
}
