// ============================================================
// 3D PINBALL
// physics.js
//
// 担当:
// ・Rapier 3D
// ・RigidBody
// ・Collider
// ・ボール
// ・壁
// ・バンパー
// ・フリッパー
// ・物理演算
// ============================================================

import RAPIER from
    "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat/+esm";


// ============================================================
// Rapier
// ============================================================

let initialized = false;

let world = null;


// ============================================================
// ゲームオブジェクト
// ============================================================

let ballBody = null;

let ballActive = false;


// ============================================================
// フリッパー
// ============================================================

const flippers = {
    left: null,
    right: null
};


// ============================================================
// 初期化
// ============================================================

export async function createPhysics() {

    if (initialized) {
        return;
    }

    await RAPIER.init();

    world = new RAPIER.World({
        x: 0,
        y: -9.81,
        z: 0
    });

    initialized = true;
}


// ============================================================
// Physics World取得
// ============================================================

export function getWorld() {

    return world;
}


// ============================================================
// ボール作成
// ============================================================

export function createBall() {

    if (!world) {
        throw new Error(
            "Physics world has not been initialized."
        );
    }


    // --------------------------------------------------------
    // RigidBody
    // --------------------------------------------------------

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(
                0,
                1,
                7
            )
            .setLinearDamping(
                0.05
            )
            .setAngularDamping(
                0.05
            );


    ballBody =
        world.createRigidBody(
            bodyDesc
        );


    // --------------------------------------------------------
    // Collider
    // --------------------------------------------------------

    const colliderDesc =
        RAPIER.ColliderDesc.ball(
            0.45
        );


    // 反発
    colliderDesc.setRestitution(
        0.85
    );


    // 摩擦
    colliderDesc.setFriction(
        0.05
    );


    world.createCollider(
        colliderDesc,
        ballBody
    );


    ballActive = false;


    return ballBody;
}


// ============================================================
// ボール取得
// ============================================================

export function getBallBody() {

    return ballBody;
}


// ============================================================
// ボール状態
// ============================================================

export function isBallActive() {

    return ballActive;
}


// ============================================================
// ボール発射
// ============================================================

export function launchBall() {

    if (
        !ballBody ||
        ballActive
    ) {
        return;
    }


    ballActive = true;


    // 発射方向
    ballBody.setLinvel(
        {
            x:
                (Math.random() - 0.5)
                * 2,

            y:
                2,

            z:
                -12
        },
        true
    );


    // 少し回転
    ballBody.setAngvel(
        {
            x: 0,
            y: 0,
            z: 5
        },
        true
    );
}


// ============================================================
// ボールリセット
// ============================================================

export function resetBall() {

    if (!ballBody) {
        return;
    }


    ballBody.setTranslation(
        {
            x: 0,
            y: 1,
            z: 7
        },
        true
    );


    ballBody.setLinvel(
        {
            x: 0,
            y: 0,
            z: 0
        },
        true
    );


    ballBody.setAngvel(
        {
            x: 0,
            y: 0,
            z: 0
        },
        true
    );


    ballActive = false;
}


// ============================================================
// ボールが落ちたか
// ============================================================

export function isBallLost() {

    if (!ballBody) {
        return false;
    }


    const position =
        ballBody.translation();


    return (
        position.z > 11 ||
        position.y < -5
    );
}


// ============================================================
// 壁作成
// ============================================================

export function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    if (!world) {
        throw new Error(
            "Physics world has not been initialized."
        );
    }


    // --------------------------------------------------------
    // Fixed RigidBody
    // --------------------------------------------------------

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .fixed()
            .setTranslation(
                x,
                y,
                z
            );


    const body =
        world.createRigidBody(
            bodyDesc
        );


    // --------------------------------------------------------
    // Collider
    // --------------------------------------------------------

    const colliderDesc =
        RAPIER.ColliderDesc.cuboid(
            width / 2,
            height / 2,
            depth / 2
        );


    colliderDesc.setRestitution(
        0.8
    );


    colliderDesc.setFriction(
        0.1
    );


    world.createCollider(
        colliderDesc,
        body
    );


    return body;
}


// ============================================================
// バンパー
// ============================================================

export function createBumper(
    x,
    z
) {

    if (!world) {
        throw new Error(
            "Physics world has not been initialized."
        );
    }


    // --------------------------------------------------------
    // Fixed Body
    // --------------------------------------------------------

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .fixed()
            .setTranslation(
                x,
                0.5,
                z
            );


    const body =
        world.createRigidBody(
            bodyDesc
        );


    // --------------------------------------------------------
    // Collider
    // --------------------------------------------------------

    const colliderDesc =
        RAPIER.ColliderDesc.cylinder(
            0.4,
            0.9
        );


    colliderDesc.setRestitution(
        1.3
    );


    colliderDesc.setFriction(
        0.05
    );


    world.createCollider(
        colliderDesc,
        body
    );


    return body;
}


// ============================================================
// フリッパー作成
// ============================================================

export function createFlipper(
    x,
    z,
    side
) {

    if (!world) {
        throw new Error(
            "Physics world has not been initialized."
        );
    }


    // --------------------------------------------------------
    // 初期角度
    // --------------------------------------------------------

    let initialAngle = 0;


    // --------------------------------------------------------
    // RigidBody
    // --------------------------------------------------------

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .kinematicPositionBased()
            .setTranslation(
                x,
                0.7,
                z
            );


    const body =
        world.createRigidBody(
            bodyDesc
        );


    // --------------------------------------------------------
    // Collider
    // --------------------------------------------------------

    const colliderDesc =
        RAPIER.ColliderDesc.cuboid(
            1.5,
            0.175,
            0.325
        );


    // フリッパーの中心を
    // ピボットからずらす
    colliderDesc.setTranslation(
        side === "left"
            ? 1.5
            : -1.5,

        0,

        0
    );


    colliderDesc.setRestitution(
        0.4
    );


    colliderDesc.setFriction(
        0.4
    );


    world.createCollider(
        colliderDesc,
        body
    );


    // --------------------------------------------------------
    // フリッパー情報
    // --------------------------------------------------------

    const flipper = {

        body,

        side,

        x,

        z,

        currentAngle:
            initialAngle,

        targetAngle:
            initialAngle,

        speed:
            0.25
    };


    flippers[side] =
        flipper;


    return flipper;
}


// ============================================================
// フリッパー入力
// ============================================================

export function setFlipperTarget(
    side,
    pressed
) {

    const flipper =
        flippers[side];


    if (!flipper) {
        return;
    }


    if (pressed) {

        if (
            side === "left"
        ) {

            flipper.targetAngle =
                -0.8;

        } else {

            flipper.targetAngle =
                0.8;
        }

    } else {

        flipper.targetAngle =
            0;
    }
}


// ============================================================
// フリッパー角度取得
// ============================================================

export function getFlipperAngle(
    side
) {

    const flipper =
        flippers[side];


    if (!flipper) {
        return 0;
    }


    return flipper.currentAngle;
}


// ============================================================
// フリッパー物理更新
// ============================================================

function updateFlipper(
    flipper
) {

    if (!flipper) {
        return;
    }


    // 現在角度
    const current =
        flipper.currentAngle;


    // 目標角度
    const target =
        flipper.targetAngle;


    // 補間
    const difference =
        target - current;


    let next =
        current +
        difference *
        flipper.speed;


    // 小さな誤差を除去
    if (
        Math.abs(
            difference
        ) < 0.001
    ) {

        next = target;
    }


    flipper.currentAngle =
        next;


    // --------------------------------------------------------
    // Quaternion
    // --------------------------------------------------------

    const half =
        next / 2;


    const quaternion = {

        x: 0,

        y:
            Math.sin(half),

        z: 0,

        w:
            Math.cos(half)
    };


    // --------------------------------------------------------
    // Kinematic Body
    // --------------------------------------------------------

    flipper.body
        .setNextKinematicRotation(
            quaternion,
            true
        );
}


// ============================================================
// 全フリッパー更新
// ============================================================

function updateFlippers() {

    updateFlipper(
        flippers.left
    );

    updateFlipper(
        flippers.right
    );
}


// ============================================================
// 物理演算
// ============================================================

export function stepPhysics() {

    if (!world) {
        return;
    }


    // フリッパー更新
    updateFlippers();


    // Rapier
    world.step();
}


// ============================================================
// フリッパー情報
// ============================================================

export function getFlippers() {

    return flippers;
}