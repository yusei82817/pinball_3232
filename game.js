// ============================================================
// 2D PINBALL
// game.js
// Canvas 2D rendering + game loop
// ============================================================

import { createPhysics, stepPhysics, createBall, getBallBody, createWall, createBumper, createFlipper, setFlipperTarget, getFlipperAngle, launchBall, resetBall, isBallActive, isBallLost, getBumpers, getFlippers } from "./physics.js";

const canvas = document.getElementById("game");
if (!canvas) throw new Error("#game canvas was not found.");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D context is not available.");

const scoreElement = document.getElementById("score");
const ballsElement = document.getElementById("balls");
const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 900;
const BALL_RADIUS = 14;
let score = 0;
let balls = 3;
let gameOver = false;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 24, TABLE_WIDTH);
    const maxHeight = Math.min(window.innerHeight - 24, TABLE_HEIGHT);
    const scale = Math.min(maxWidth / TABLE_WIDTH, maxHeight / TABLE_HEIGHT);
    canvas.style.width = `${TABLE_WIDTH * scale}px`;
    canvas.style.height = `${TABLE_HEIGHT * scale}px`;
    canvas.width = TABLE_WIDTH * dpr;
    canvas.height = TABLE_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function updateUI() {
    if (scoreElement) scoreElement.textContent = score;
    if (ballsElement) ballsElement.textContent = balls;
}

await createPhysics();
createWall(20, 450, 0, 40, 900, 40);
createWall(580, 450, 0, 40, 900, 40);
createWall(300, 20, 0, 560, 40, 40);
createBall();
const ballBody = getBallBody();

for (const [x, y] of [[180, 250], [300, 200], [420, 250], [220, 360], [380, 360]]) createBumper(x, y);
createFlipper(220, 760, "left");
createFlipper(380, 760, "right");

const keys = Object.create(null);
window.addEventListener("keydown", event => {
    keys[event.code] = true;
    if (event.code === "Space") {
        event.preventDefault();
        if (!gameOver && !isBallActive()) launchBall();
    }
    if (event.code === "KeyR") resetGame();
});
window.addEventListener("keyup", event => { keys[event.code] = false; });
function updateInput() {
    setFlipperTarget("left", !!keys.KeyA);
    setFlipperTarget("right", !!keys.KeyD);
}

function drawTable() {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    ctx.fillStyle = "#07110b";
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    ctx.fillStyle = "#102b1b";
    ctx.fillRect(20, 20, 560, 860);
    ctx.strokeStyle = "rgba(100,255,150,0.08)";
    ctx.lineWidth = 1;
    for (let x = 40; x < 580; x += 40) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 880); ctx.stroke(); }
    for (let y = 40; y < 880; y += 40) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(580, y); ctx.stroke(); }
    ctx.strokeStyle = "#d8d8d8";
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 560, 860);
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, 536, 836);

    // 中央240pxのドレイン表示
    ctx.fillStyle = "#030303";
    ctx.fillRect(180, 820, 240, 60);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(180, 820); ctx.lineTo(420, 820); ctx.stroke();
}

function drawBumpers() {
    for (const bumper of getBumpers()) {
        const { x, y, radius, flash } = bumper;
        ctx.beginPath(); ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = flash > 0 ? "#fff6a0" : "#4d3500"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = flash > 0 ? "#ffffff" : "#ffd21a"; ctx.fill();
        ctx.strokeStyle = "#fff3a0"; ctx.lineWidth = 3; ctx.stroke();
    }
}

function drawFlipper(flipper) {
    if (!flipper) return;
    const angle = getFlipperAngle(flipper.side);
    const length = flipper.length;
    const direction = flipper.side === "left" ? 1 : -1;
    ctx.save();
    ctx.translate(flipper.x, flipper.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(direction === 1 ? 0 : -length, -flipper.width / 2, length, flipper.width, flipper.width / 2);
    ctx.fillStyle = "#e33"; ctx.fill();
    ctx.strokeStyle = "#ff9999"; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ddd"; ctx.fill();
    ctx.restore();
}

function drawFlippers() {
    const flippers = getFlippers();
    drawFlipper(flippers.left);
    drawFlipper(flippers.right);
}

function drawBall() {
    if (!ballBody) return;
    const p = ballBody;
    ctx.beginPath(); ctx.arc(p.x, p.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#eeeeee"; ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x - 4, p.y - 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
}

function drawGameOver() {
    if (!gameOver) return;
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(60, 350, 480, 180);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.strokeRect(60, 350, 480, 180);
    ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif"; ctx.fillText("GAME OVER", 300, 425);
    ctx.font = "20px sans-serif"; ctx.fillText("Press R to restart", 300, 475);
    ctx.textAlign = "left";
}

function render() { drawTable(); drawBumpers(); drawFlippers(); drawBall(); drawGameOver(); }

function updateBallState() {
    if (!isBallActive() || !isBallLost()) return;
    balls--;
    updateUI();
    if (balls <= 0) { gameOver = true; return; }
    resetBall();
}

function resetGame() {
    score = 0; balls = 3; gameOver = false; resetBall(); updateUI();
}

function animate() {
    requestAnimationFrame(animate);
    updateInput();
    stepPhysics();
    updateBallState();
    render();
}

resetGame();
animate();