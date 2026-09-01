// ============================================================
// 3D PINBALL
// game.js
// ============================================================

import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
    createPhysics,
    stepPhysics,
    createBall,
    getBallBody,
    createWall,
    createBumper,
    createFlipper,
    setFlipperTarget,
    getFlipperAngle,
    launchBall,
    resetBall,
    isBallActive,
    isBallLost
} from "./physics.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 18, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const gameElement = document.getElementById("game");

if (!gameElement) {
    throw new Error("#game element was not found.");
}

gameElement.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(0, 15, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 80, 30);
pointLight.position.set(0, 8, 0);
scene.add(pointLight);

const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515,
    metalness: 0.3,
    roughness: 0.7
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.7,
    roughness: 0.3
});

const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.15
});

const bumperMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0x442200,
    metalness: 0.5,
    roughness: 0.3
});

const flipperMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0x330000,
    metalness: 0.4,
    roughness: 0.3
});

const TABLE_WIDTH = 12;
const TABLE_LENGTH = 20;
const BALL_RADIUS = 0.45;

let score = 0;
let gameOver = false;
let balls = 3;

const scoreElement = document.getElementById("score");

function updateScoreUI() {
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

function addScore(value) {
    score += value;
    updateScoreUI();
}

const tableGeometry = new THREE.BoxGeometry(
    TABLE_WIDTH,
    0.5,
    TABLE_LENGTH
);

const tableMesh = new THREE.Mesh(
    tableGeometry,
    tableMaterial
);

tableMesh.position.set(0, -0.25, 0);
tableMesh.receiveShadow = true;
scene.add(tableMesh);

function createVisualWall(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, wallMaterial);

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
    return mesh;
}

createVisualWall(-6, 0.5, 0, 0.5, 1, 20);
createVisualWall(6, 0.5, 0, 0.5, 1, 20);
createVisualWall(0, 0.5, -10, 12, 1, 0.5);

await createPhysics();

createWall(-6, 0.5, 0, 0.5, 1, 20);
createWall(6, 0.5, 0, 0.5, 1, 20);
createWall(0, 0.5, -10, 12, 1, 0.5);

const ballGeometry = new THREE.SphereGeometry(
    BALL_RADIUS,
    32,
    32
);

const ballMesh = new THREE.Mesh(
    ballGeometry,
    ballMaterial
);

ballMesh.castShadow = true;
ballMesh.receiveShadow = true;
scene.add(ballMesh);

// physics.jsからボールのRigidBodyを作成
createBall();
const ballBody = getBallBody();

function syncBall() {
    if (!ballBody) {
        return;
    }

    const position = ballBody.translation();
    const rotation = ballBody.rotation();

    ballMesh.position.set(
        position.x,
        position.y,
        position.z
    );

    ballMesh.quaternion.set(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
    );
}

const bumperPositions = [
    [-3, -2],
    [0, -3],
    [3, -2],
    [-2, 1],
    [2, 1]
];

const bumperMeshes = [];

for (const [x, z] of bumperPositions) {
    const geometry = new THREE.CylinderGeometry(
        0.9,
        0.9,
        0.8,
        32
    );

    const mesh = new THREE.Mesh(
        geometry,
        bumperMaterial
    );

    mesh.position.set(x, 0.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
    bumperMeshes.push(mesh);

    createBumper(x, z);
}

function updateBumpers() {
    for (const mesh of bumperMeshes) {
        mesh.rotation.y += 0.01;
    }
}

const flipperGeometry = new THREE.BoxGeometry(
    3,
    0.35,
    0.65
);

const leftFlipper = new THREE.Mesh(
    flipperGeometry,
    flipperMaterial
);

leftFlipper.position.set(-2.2, 0.7, 7);
leftFlipper.castShadow = true;
leftFlipper.receiveShadow = true;
scene.add(leftFlipper);

const rightFlipper = new THREE.Mesh(
    flipperGeometry,
    flipperMaterial
);

rightFlipper.position.set(2.2, 0.7, 7);
rightFlipper.castShadow = true;
rightFlipper.receiveShadow = true;
scene.add(rightFlipper);

createFlipper(-2.2, 7, "left");
createFlipper(2.2, 7, "right");

const keys = {};

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (event.code === "Space") {
        event.preventDefault();

        if (!gameOver && !isBallActive()) {
            launchBall();
        }
    }

    if (event.code === "KeyR") {
        resetGame();
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

function updateFlippers() {
    setFlipperTarget("left", !!keys["KeyA"]);
    setFlipperTarget("right", !!keys["KeyD"]);
}

function updateFlipperVisuals() {
    leftFlipper.rotation.y = getFlipperAngle("left");
    rightFlipper.rotation.y = getFlipperAngle("right");
}

function updateBallState() {
    if (!isBallActive()) {
        return;
    }

    if (!isBallLost()) {
        return;
    }

    balls--;

    if (balls <= 0) {
        gameOver = true;
        return;
    }

    resetBall();
}

function resetGame() {
    score = 0;
    balls = 3;
    gameOver = false;

    updateScoreUI();
    resetBall();
}

window.addEventListener("resize", () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

function animate() {
    requestAnimationFrame(animate);

    updateFlippers();
    stepPhysics();

    syncBall();
    updateFlipperVisuals();
    updateBallState();
    updateBumpers();

    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

resetGame();
animate();
