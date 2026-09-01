// ============================================================
// 2D PINBALL
// physics.js
// Lightweight 2D physics for Canvas
// ============================================================

const TABLE_WIDTH = 400;
const TABLE_HEIGHT = 900;
const BALL_RADIUS = 14;
const GRAVITY = 0.28;
const AIR_DAMPING = 0.999;
const WALL_BOUNCE = 0.82;
const MAX_SPEED = 22;

let ball = null;
let ballActive = false;

const bumpers = [];
const flippers = { left: null, right: null };

// 発射レーン。フリッパーより上にボールを置く。
const BALL_START_X = 525;
const BALL_START_Y = 700;

export async function createPhysics() {}

export function createBall() {
    ball = {
        x: BALL_START_X,
        y: BALL_START_Y,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS
    };
    ballActive = false;
    return ball;
}

export function getBallBody() { return ball; }
export function isBallActive() { return ballActive; }

export function launchBall() {
    if (!ball || ballActive) return;
    ballActive = true;
    ball.vx = (Math.random() - 0.5) * 12.0;
    ball.vy = -8;
}

export function resetBall() {
    if (!ball) return;
    ball.x = BALL_START_X;
    ball.y = BALL_START_Y;
    ball.vx = 0;
    ball.vy = 0;
    ballActive = false;
}

export function isBallLost() {
    return !!ball && ball.y > TABLE_HEIGHT + 30;
}

export function createWall(x, y, z, width, height, depth) {
    return { x, y, width, height };
}

export function createBumper(x, y) {
    const bumper = { x, y, radius: 28, flash: 0 };
    bumpers.push(bumper);
    return bumper;
}

export function getBumpers() { return bumpers; }

export function createFlipper(x, y, side) {
    const flipper = {
        x, y, side,
        length: 100,
        width: 22,
        currentAngle: 0,
        targetAngle: 0,
        speed: 0.32
    };
    flippers[side] = flipper;
    return flipper;
}

export function getFlippers() { return flippers; }

export function setFlipperTarget(side, pressed) {
    const flipper = flippers[side];
    if (!flipper) return;

    if (pressed) {
        flipper.targetAngle = side === "left" ? -0.95 : 0.95;
    } else {
        flipper.targetAngle = 0;
    }
}

export function getFlipperAngle(side) {
    const flipper = flippers[side];
    return flipper ? flipper.currentAngle : 0;
}

function updateFlippers() {
    for (const side of ["left", "right"]) {
        const flipper = flippers[side];
        if (!flipper) continue;

        const difference = flipper.targetAngle - flipper.currentAngle;
        flipper.currentAngle += difference * flipper.speed;

        if (Math.abs(difference) < 0.002) {
            flipper.currentAngle = flipper.targetAngle;
        }
    }
}

function clampSpeed() {
    if (!ball) return;

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= MAX_SPEED) return;

    const scale = MAX_SPEED / speed;
    ball.vx *= scale;
    ball.vy *= scale;
}

function collideWithWalls() {
    if (!ball) return;

    const minX = 38 + ball.radius;
    const maxX = 562 - ball.radius;
    const minY = 38 + ball.radius;

    if (ball.x < minX) {
        ball.x = minX;
        ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
    }

    if (ball.x > maxX) {
        ball.x = maxX;
        ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
    }

    if (ball.y < minY) {
        ball.y = minY;
        ball.vy = Math.abs(ball.vy) * WALL_BOUNCE;
    }
}

function collideWithBumpers() {
    if (!ball) return;

    for (const bumper of bumpers) {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.hypot(dx, dy);
        const minimum = ball.radius + bumper.radius;

        if (distance >= minimum) continue;

        const nx = distance > 0.001 ? dx / distance : 0;
        const ny = distance > 0.001 ? dy / distance : -1;

        ball.x = bumper.x + nx * minimum;
        ball.y = bumper.y + ny * minimum;

        const velocityAlongNormal = ball.vx * nx + ball.vy * ny;

        if (velocityAlongNormal < 0) {
            ball.vx -= 2 * velocityAlongNormal * nx;
            ball.vy -= 2 * velocityAlongNormal * ny;
        }

        ball.vx += nx * 4;
        ball.vy += ny * 4;
        bumper.flash = 8;
    }
}

function collideWithFlipper(flipper) {
    if (!ball || !flipper) return false;

    const direction = flipper.side === "left" ? 1 : -1;
    const angle = flipper.currentAngle;

    const dx = Math.cos(angle) * direction;
    const dy = Math.sin(angle) * direction;

    const px = ball.x - flipper.x;
    const py = ball.y - flipper.y;

    let projection = px * dx + py * dy;
    projection = Math.max(0, Math.min(flipper.length, projection));

    const closestX = flipper.x + dx * projection;
    const closestY = flipper.y + dy * projection;

    const diffX = ball.x - closestX;
    const diffY = ball.y - closestY;
    const distance = Math.hypot(diffX, diffY);
    const minimum = ball.radius + flipper.width / 2;

    if (distance >= minimum) return false;

    const nx = distance > 0.001 ? diffX / distance : 0;
    const ny = distance > 0.001 ? diffY / distance : -1;

    ball.x = closestX + nx * minimum;
    ball.y = closestY + ny * minimum;

    const velocityAlongNormal = ball.vx * nx + ball.vy * ny;

    if (velocityAlongNormal < 0) {
        ball.vx -= 2 * velocityAlongNormal * nx;
        ball.vy -= 2 * velocityAlongNormal * ny;
    }

    if (flipper.targetAngle !== 0) {
        ball.vy -= 7;
        ball.vx += nx * 2;
    }

    return true;
}

function collideWithBottom() {
    if (!ball) return;
    if (ball.y < 820) return;

    // 中央はドレイン。左右のポケットだけ底壁を作る。
    if (ball.x < 120 || ball.x > 480) {
        const bottom = 880 - ball.radius;
        if (ball.y > bottom) {
            ball.y = bottom;
            ball.vy = -Math.abs(ball.vy) * WALL_BOUNCE;
        }
    }
}

export function stepPhysics() {
    if (!ball) return;

    updateFlippers();

    for (const bumper of bumpers) {
        if (bumper.flash > 0) bumper.flash--;
    }

    if (!ballActive) return;

    ball.vy += GRAVITY;
    ball.vx *= AIR_DAMPING;
    ball.vy *= AIR_DAMPING;

    ball.x += ball.vx;
    ball.y += ball.vy;

    collideWithWalls();
    collideWithBottom();
    collideWithBumpers();
    collideWithFlipper(flippers.left);
    collideWithFlipper(flippers.right);

    clampSpeed();
}
