
// ============================================================
// 3D PINBALL
// game.js
//
// 担当:
// ・Three.js
// ・3Dオブジェクト
// ・カメラ
// ・ライト
// ・UI
// ・入力
// ・ゲームループ
// ・physics.jsとの同期
// ============================================================


// ============================================================
// Three.js
// ============================================================

import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ============================================================
// Physics
// ============================================================

import {
    createPhysics,
    stepPhysics,
    getBallBody,
    createWall,
    createBumper,
    createFlipper,
    setFlipperTarget,
    launchBall,
    resetBall,
    isBallActive,
    isBallLost
} from "./physics.js";


// ============================================================
// Three.js Scene
// ============================================================

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(
        0x050505
    );


// ============================================================
// Camera
// ============================================================

const camera =
    new THREE.PerspectiveCamera(
        55,
        window.innerWidth /
        window.innerHeight,
        0.1,
        1000
    );

camera.position.set(
    0,
    18,
    18
);

camera.lookAt(
    0,
    0,
    0
);


// ============================================================
// Renderer
// ============================================================

const renderer =
    new THREE.WebGLRenderer({
        antialias: true
    });

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled =
    true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


document
    .getElementById("game")
    .appendChild(
        renderer.domElement
    );


// ============================================================
// ライト
// ============================================================

const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        1.5
    );

scene.add(
    ambientLight
);


const directionalLight =
    new THREE.DirectionalLight(
        0xffffff,
        2.5
    );

directionalLight.position.set(
    0,
    15,
    5
);

directionalLight.castShadow =
    true;

scene.add(
    directionalLight
);


// ============================================================
// 補助ライト
// ============================================================

const pointLight =
    new THREE.PointLight(
        0xffffff,
        80,
        30
    );

pointLight.position.set(
    0,
    8,
    0
);

scene.add(
    pointLight
);


// ============================================================
// マテリアル
// ============================================================

const tableMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x151515,
        metalness: 0.3,
        roughness: 0.7
    });


const wallMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
    });


const ballMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.15
    });


const bumperMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0x442200,
        metalness: 0.5,
        roughness: 0.3
    });


const flipperMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0x330000,
        metalness: 0.4,
        roughness: 0.3
    });


// ============================================================
// ゲーム設定
// ============================================================

const TABLE_WIDTH =
    12;

const TABLE_LENGTH =
    20;

const BALL_RADIUS =
    0.45;


// ============================================================
// ゲーム状態
// ============================================================

let score = 0;

let gameOver = false;

let balls = 3;


// ============================================================
// UI
// ============================================================

const scoreElement =
    document.getElementById(
        "score"
    );


// ============================================================
// スコア
// ============================================================

function addScore(
    value
) {

    score += value;

    if (
        scoreElement
    ) {

        scoreElement.textContent =
            score;
    }
}


// ============================================================
// 台
// ============================================================

const tableGeometry =
    new THREE.BoxGeometry(
        TABLE_WIDTH,
        0.5,
        TABLE_LENGTH
    );


const tableMesh =
    new THREE.Mesh(
        tableGeometry,
        tableMaterial
    );

tableMesh.position.set(
    0,
    -0.25,
    0
);

tableMesh.receiveShadow =
    true;

scene.add(
    tableMesh
);


// ============================================================
// 壁
// ============================================================

function createVisualWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            wallMaterial
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow =
        true;

    mesh.receiveShadow =
        true;

    scene.add(
        mesh
    );

    return mesh;
}


// 左壁
createVisualWall(
    -6,
    0.5,
    0,
    0.5,
    1,
    20
);


// 右壁
createVisualWall(
    6,
    0.5,
    0,
    0.5,
    1,
    20
);


// 奥壁
createVisualWall(
    0,
    0.5,
    -10,
    12,
    1,
    0.5
);


// ============================================================
// Rapier物理世界を初期化
// ============================================================

await createPhysics();


// ============================================================
// 物理壁を作成
// ============================================================

createWall(
    -6,
    0.5,
    0,
    0.5,
    1,
    20
);

createWall(
    6,
    0.5,
    0,
    0.5,
    1,
    20
);

createWall(
    0,
    0.5,
    -10,
    12,
    1,
    0.5
);


// ============================================================
// ボール
// ============================================================

const ballGeometry =
    new THREE.SphereGeometry(
        BALL_RADIUS,
        32,
        32
    );


const ballMesh =
    new THREE.Mesh(
        ballGeometry,
        ballMaterial
    );

ballMesh.castShadow =
    true;

ballMesh.receiveShadow =
    true;

scene.add(
    ballMesh
);


// 物理ボール
createBall();

const ballBody =
    getBallBody();


// ============================================================
// ボール位置同期
// ============================================================

function syncBall() {

    if (
        !ballBody
    ) {
        return;
    }

    const position =
        ballBody.translation();

    const rotation =
        ballBody.rotation();


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


// ============================================================
// バンパー
// ============================================================

const bumperPositions = [

    [-3, -2],

    [0, -3],

    [3, -2],

    [-2, 1],

    [2, 1]

];


const bumperMeshes = [];


for (
    const [
        x,
        z
    ]
    of bumperPositions
) {

    // Three.js
    const geometry =
        new THREE.CylinderGeometry(
            0.9,
            0.9,
            0.8,
            32
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            bumperMaterial
        );

    mesh.position.set(
        x,
        0.5,
        z
    );

    mesh.castShadow =
        true;

    mesh.receiveShadow =
        true;

    scene.add(
        mesh
    );

    bumperMeshes.push(
        mesh
    );


    // Rapier
    createBumper(
        x,
        z
    );
}


// ============================================================
// バンパー演出
// ============================================================

function updateBumpers() {

    for (
        const mesh
        of bumperMeshes
    ) {

        mesh.rotation.y +=
            0.01;
    }
}


// ============================================================
// フリッパー
// ============================================================

const flipperMeshes = [];


// 左フリッパー
const leftFlipperGeometry =
    new THREE.BoxGeometry(
        3,
        0.35,
        0.65
    );


const leftFlipper =
    new THREE.Mesh(
        leftFlipperGeometry,
        flipperMaterial
    );


leftFlipper.position.set(
    -2.2,
    0.7,
    7
);

leftFlipper.castShadow =
    true;

leftFlipper.receiveShadow =
    true;

scene.add(
    leftFlipper
);

flipperMeshes.push(
    leftFlipper
);


// 右フリッパー
const rightFlipper =
    new THREE.Mesh(
        leftFlipperGeometry,
        flipperMaterial
    );


rightFlipper.position.set(
    2.2,
    0.7,
    7
);

rightFlipper.castShadow =
    true;

rightFlipper.receiveShadow =
    true;

scene.add(
    rightFlipper
);

flipperMeshes.push(
    rightFlipper
);


// Rapier側
createFlipper(
    -2.2,
    7,
    "left"
);


createFlipper(
    2.2,
    7,
    "right"
);


// ============================================================
// キー入力
// ============================================================

const keys = {};


window.addEventListener(
    "keydown",
    event => {

        keys[event.code] =
            true;


        // Space
        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            if (
                !gameOver &&
                !isBallActive()
            ) {

                launchBall();
            }
        }


        // R
        if (
            event.code ===
            "KeyR"
        ) {

            resetGame();
        }
    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
    }
);


// ============================================================
// フリッパー入力
// ============================================================

function updateFlippers() {

    const leftPressed =
        !!keys["KeyA"];

    const rightPressed =
        !!keys["KeyD"];


    setFlipperTarget(
        "left",
        leftPressed
    );


    setFlipperTarget(
        "right",
        rightPressed
    );
}


// ============================================================
// フリッパー表示同期
// ============================================================

function updateFlipperVisuals() {

    /*
     * physics.js側で計算された
     * フリッパーの角度を取得して
     * Three.js Meshに反映する。
     *
     * 今の段階ではphysics.js側の
     * getFlipperAngle()を使用する。
     */

    if (
        typeof window
            .getFlipperAngle !==
        "function"
    ) {

        return;
    }


    const leftAngle =
        window.getFlipperAngle(
            "left"
        );

    const rightAngle =
        window.getFlipperAngle(
            "right"
        );


    if (
        leftAngle !==
        undefined
    ) {

        leftFlipper.rotation.y =
            leftAngle;
    }


    if (
        rightAngle !==
        undefined
    ) {

        rightFlipper.rotation.y =
            rightAngle;
    }
}


// ============================================================
// ボールロスト
// ============================================================

function updateBallState() {

    if (
        !isBallActive()
    ) {

        return;
    }


    if (
        isBallLost()
    ) {

        balls--;


        if (
            balls <= 0
        ) {

            gameOver = true;

            return;
        }


        resetBall();
    }
}


// ============================================================
// ゲームリセット
// ============================================================

function resetGame() {

    score = 0;

    balls = 3;

    gameOver = false;


    if (
        scoreElement
    ) {

        scoreElement.textContent =
            score;
    }


    resetBall();
}


// ============================================================
// カメラ
// ============================================================

function updateCamera() {

    camera.lookAt(
        0,
        0,
        0
    );
}


// ============================================================
// ゲームループ
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // --------------------------------------------------------
    // 入力
    // --------------------------------------------------------

    updateFlippers();


    // --------------------------------------------------------
    // 物理演算
    // --------------------------------------------------------

    stepPhysics();


    // --------------------------------------------------------
    // Three.jsとの同期
    // --------------------------------------------------------

    syncBall();

    updateFlipperVisuals();


    // --------------------------------------------------------
    // ゲーム状態
    // --------------------------------------------------------

    updateBallState();


    // --------------------------------------------------------
    // 演出
    // --------------------------------------------------------

    updateBumpers();

    updateCamera();


    // --------------------------------------------------------
    // 描画
    // --------------------------------------------------------

    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// リサイズ
// ============================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


// ============================================================
// ゲーム開始
// ============================================================

resetGame();

animate();