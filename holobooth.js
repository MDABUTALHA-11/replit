let scene, camera, renderer, character;
let model, videoElement;
let handX = 0, handY = 0;  // Hand position variables

async function init() {
  // Set up the 3D scene
  scene = new THREE.Scene();
  
  // Perspective camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // WebGL renderer
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  // Create a 3D object (represents the character)
  const geometry = new THREE.BoxGeometry(1, 2, 1);  // Humanoid-like box
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  character = new THREE.Mesh(geometry, material);
  scene.add(character);

  // Start webcam and handpose model
  await setupWebcam();
  await loadHandPoseModel();

  // Start rendering
  animate();
}

async function setupWebcam() {
  videoElement = document.getElementById('webcam');
  
  // Request webcam access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (err) {
    console.error("Webcam access denied: ", err);
  }
}

async function loadHandPoseModel() {
  // Load the handpose model
  model = await handpose.load();
  console.log("HandPose model loaded.");
  
  // Start detecting hands
  detectHands();
}

async function detectHands() {
  // Continuously detect hands
  setInterval(async () => {
    const predictions = await model.estimateHands(videoElement);
    
    if (predictions.length > 0) {
      // Extract the first detected hand's landmarks (index 9 is the tip of the index finger)
      const landmarks = predictions[0].landmarks;
      
      // Update hand position variables based on the index finger
      handX = (landmarks[9][0] - videoElement.width / 2) / 100;  // X position normalized
      handY = -(landmarks[9][1] - videoElement.height / 2) / 100;  // Y position normalized (inverted)
    }
  }, 100);  // Call every 100ms
}

function animate() {
  requestAnimationFrame(animate);

  // Move the 3D character based on the hand position
  character.position.x = handX;
  character.position.y = handY;

  // Render the scene
  renderer.render(scene, camera);
}

// Adjust the renderer size when window is resized
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Initialize the holobooth
init();
