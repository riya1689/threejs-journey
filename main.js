import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. SCENE, CAMERA & RENDERER
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#080d1a');

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(10, 8, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const gridHelper = new THREE.GridHelper(25, 25, '#00d2ff', '#1e293b');
scene.add(gridHelper);

// ==========================================
// 2. MATERIALS SETUP
// ==========================================
// সাধারণ ম্যাটেরিয়াল দিয়ে স্ট্রাকচার ভিজ্যুয়ালাইজেশন
const metalMat = new THREE.MeshNormalMaterial();
const pipeMat = new THREE.MeshNormalMaterial({ wireframe: true });
const tankGlassMat = new THREE.MeshNormalMaterial({ wireframe: true });
const waterMat = new THREE.MeshBasicMaterial({ color: 0x00a8ff, transparent: true, opacity: 0.6 });

// ==========================================
// 3. WATER TANK ASSEMBLY (Reservoir)
// ==========================================
const tankGroup = new THREE.Group();

// Tank Shell (Cylinder: RadiusTop, RadiusBottom, Height, Segments, OpenEnded)
const tankGeo = new THREE.CylinderGeometry(2, 2, 5, 24, 1, true);
const tankMesh = new THREE.Mesh(tankGeo, tankGlassMat);
tankMesh.position.y = 2.5;
tankGroup.add(tankMesh);

// Water Level Inside Tank (Dynamically Scalable)
const waterGeo = new THREE.CylinderGeometry(1.95, 1.95, 1, 24);
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
// পিভট নিচে সেট করতে জিওমেট্রিকে অফসেট করা হয়েছে
waterGeo.translate(0, 0.5, 0); 
waterMesh.position.y = 0.1;
tankGroup.add(waterMesh);

tankGroup.position.set(-5, 0, 0);
scene.add(tankGroup);

// ==========================================
// 4. PUMP MOTOR ASSEMBLY (Parent-Child Hierarchy)
// ==========================================
const pumpStation = new THREE.Group();

// Pump Base Plate
const baseGeo = new THREE.BoxGeometry(3, 0.3, 2);
const baseMesh = new THREE.Mesh(baseGeo, metalMat);
baseMesh.position.y = 0.15;
pumpStation.add(baseMesh);

// Motor Main Casing (Horizontal Cylinder)
const motorCasingGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 24);
const motorCasing = new THREE.Mesh(motorCasingGeo, metalMat);
motorCasing.rotation.z = Math.PI / 2; // শোয়ানো সিলিন্ডার
motorCasing.position.set(0, 1.1, 0);
pumpStation.add(motorCasing);

// Cooling Fan Shaft & Blades (Inside / Back of Motor)
const fanGroup = new THREE.Group();
fanGroup.position.set(1.05, 1.1, 0); // মোটরের পেছনের এক্সিসে অ্যাঙ্কর

const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16);
const hubMesh = new THREE.Mesh(hubGeo, metalMat);
hubMesh.rotation.z = Math.PI / 2;
fanGroup.add(hubMesh);

// 4 Fan Blades
for (let i = 0; i < 4; i++) {
  const bladeGeo = new THREE.BoxGeometry(0.1, 0.7, 0.05);
  const bladeMesh = new THREE.Mesh(bladeGeo, metalMat);
  bladeMesh.position.y = 0.35; // সেন্টার থেকে ব্লেড বের করা
  
  const bladeHolder = new THREE.Group();
  bladeHolder.rotation.x = (i * Math.PI) / 2; // ৯০ ডিগ্রি পর পর ব্লেড
  bladeHolder.add(bladeMesh);
  
  fanGroup.add(bladeHolder);
}
pumpStation.add(fanGroup);

pumpStation.position.set(2, 0, 0);
scene.add(pumpStation);

// ==========================================
// 5. INTERCONNECTING PIPE (Tank to Pump)
// ==========================================
// Curve3 দিয়ে ৩ডি পাইপ পাথ ডিফাইন করা
const pipePath = new THREE.CurvePath();
const p1 = new THREE.Vector3(-3, 0.8, 0);
const p2 = new THREE.Vector3(0.5, 0.8, 0);
const lineCurve = new THREE.LineCurve3(p1, p2);
pipePath.add(lineCurve);

// TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
const pipeGeo = new THREE.TubeGeometry(pipePath, 20, 0.25, 16, false);
const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
scene.add(pipeMesh);

// ==========================================
// 6. SCADA TELEMETRY & RUNTIME LOOP
// ==========================================
let motorRunning = true;
let tankLevel = 0.5; // ৫০% ক্যাপাসিটি
let filling = true;

function animate() {
  requestAnimationFrame(animate);

  if (motorRunning) {
    // মোটরের ফ্যান প্রতি ফ্রেমে ঘুরবে (Local X-axis এ রোটেশন)
    fanGroup.rotation.x += 0.25;

    // সিমুলেটেড ওয়াটার লেভেল ডাইনামিক স্কেলিং
    if (filling) {
      tankLevel += 0.005;
      if (tankLevel >= 4.5) filling = false;
    } else {
      tankLevel -= 0.005;
      if (tankLevel <= 0.5) filling = true;
    }
    
    // Y-Scale দিয়ে উচ্চতা পরিবর্তন
    waterMesh.scale.y = tankLevel;
  }

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();