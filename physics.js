// ============================================================
// 3D PINBALL - physics.js
// ============================================================

import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat/+esm";

let initialized = false;
let world = null;
let ballBody = null;
let ballActive = false;

const flippers = { left: null, right: null };

// Three.js側の台の上面は y = 0
// ボール・バンパー・フリッパーをこの高さ基準で統一する。
const TABLE_TOP = 0;
const BALL_RADIUS = 0.45;

export async function createPhysics() {
    if (initialized) return;
    await RAPIER.init();
    world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    initialized = true;
}

export function getWorld() {
    return world;
}

export function createBall() {
    if (!world) throw new Error("Physics world has not been initialized.");

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, TABLE_TOP + BALL_RADIUS + 0.05, 7)
        .setLinearDamping(0.05)
        .setAngularDamping(0.05);

    ballBody = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS);
    colliderDesc.setRestitution(0.85);
    colliderDesc.setFriction(0.05);

    world.createCollider(colliderDesc, ballBody);
    ballActive = false;

    return ballBody;
}

export function getBallBody() {
    return ballBody;
}

export function isBallActive() {
    return ballActive;
}

export function launchBall() {
    if (!ballBody || ballActive) return;

    ballActive = true;

    ballBody.setLinvel({
        x: (Math.random() - 0.5) * 2,
        y: 2,
        z: -12
    }, true);

    ballBody.setAngvel({ x: 0, y: 0, z: 5 }, true);
}

export function resetBall() {
    if (!ballBody) return;

    ballBody.setTranslation({
        x: 0,
        y: TABLE_TOP + BALL_RADIUS + 0.05,
        z: 7
    }, true);

    ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    ballActive = false;
}

export function isBallLost() {
    if (!ballBody) return false;

    const position = ballBody.translation();

    return position.z > 11 || position.y < -3;
}

export function createWall(x, y, z, width, height, depth) {
    if (!world) throw new Error("Physics world has not been initialized.");

    const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
    );

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
        width / 2,
        height / 2,
        depth / 2
    );

    colliderDesc.setRestitution(0.8);
    colliderDesc.setFriction(0.1);

    world.createCollider(colliderDesc, body);
    return body;
}

export function createBumper(x, z) {
    if (!world) throw new Error("Physics world has not been initialized.");

    // 見た目のバンパーは高さ0.8、中心0.4。
    // 台面(y=0)に底面を合わせ、Colliderが台の下へ潜らないようにする。
    const bodyY = TABLE_TOP + 0.4;

    const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x, bodyY, z)
    );

    const colliderDesc = RAPIER.ColliderDesc.cylinder(0.4, 0.9);
    colliderDesc.setRestitution(1.0);
    colliderDesc.setFriction(0.05);

    world.createCollider(colliderDesc, body);
    return body;
}

export function createFlipper(x, z, side) {
    if (!world) throw new Error("Physics world has not been initialized.");

    const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(x, TABLE_TOP + 0.45, z)
    );

    const colliderDesc = RAPIER.ColliderDesc.cuboid(1.5, 0.175, 0.325);

    colliderDesc.setTranslation(
        side === "left" ? 1.5 : -1.5,
        0,
        0
    );

    colliderDesc.setRestitution(0.4);
    colliderDesc.setFriction(0.4);

    world.createCollider(colliderDesc, body);

    const flipper = {
        body,
        side,
        x,
        z,
        currentAngle: 0,
        targetAngle: 0,
        speed: 0.35
    };

    flippers[side] = flipper;
    return flipper;
}

export function setFlipperTarget(side, pressed) {
    const flipper = flippers[side];
    if (!flipper) return;

    if (pressed) {
        flipper.targetAngle = side === "left" ? -0.8 : 0.8;
    } else {
        flipper.targetAngle = 0;
    }
}

export function getFlipperAngle(side) {
    const flipper = flippers[side];
    return flipper ? flipper.currentAngle : 0;
}

function updateFlipper(flipper) {
    if (!flipper) return;

    const difference = flipper.targetAngle - flipper.currentAngle;
    let next = flipper.currentAngle + difference * flipper.speed;

    if (Math.abs(difference) < 0.001) next = flipper.targetAngle;

    flipper.currentAngle = next;

    const half = next / 2;

    flipper.body.setNextKinematicRotation({
        x: 0,
        y: Math.sin(half),
        z: 0,
        w: Math.cos(half)
    }, true);
}

function updateFlippers() {
    updateFlipper(flippers.left);
    updateFlipper(flippers.right);
}

export function stepPhysics() {
    if (!world) return;
    updateFlippers();
    world.step();
}

export function getFlippers() {
    return flippers;
}
