import * as THREE from 'three';
import * as handpose from '@tensorflow-models/handpose';

let scene, camera, renderer, character;
let model, videoElement;
let handX = 0, handY = 0;

async function init() {
  try {
    setupScene();
    await setupWebcam();
    await loadHandPoseModel();
    animate();
    window.addEventListener('resize', onWindowResize);
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

function setupScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 2, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  character = new THREE.Mesh(geometry, material);
  scene.add(character);
}

async function setupWebcam() {
  videoElement = document.getElementById('webcam');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        resolve(videoElement);
      };
    });
  } catch (err) {
    console.error("Webcam access denied:", err);
    throw err;
  }
}

async function loadHandPoseModel() {
  try {
    model = await handpose.load();
    console.log("HandPose model loaded.");
    detectHands();
  } catch (err) {
    console.error("Error loading HandPose model:", err);
    throw err;
  }
}

function detectHands() {
  const detectHand = async () => {
    if (videoElement.readyState === 4) {
      const predictions = await model.estimateHands(videoElement);
      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        handX = (landmarks[9][0] - videoElement.videoWidth / 2) / (videoElement.videoWidth / 10);
        handY = -(landmarks[9][1] - videoElement.videoHeight / 2) / (videoElement.videoHeight / 10);
      }
    }
    requestAnimationFrame(detectHand);
  };
  detectHand();
}

function animate() {
  requestAnimationFrame(animate);
  character.position.x = handX;
  character.position.y = handY;
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();