import document from “document”;
import { display } from “display”;
import fs from “fs”;

// ── Screen size (Versa 4 is 336×336) ──────────────────────────────────────
const W = 336;
const H = 336;

// ── Game constants ─────────────────────────────────────────────────────────
const GRAVITY      = 0.5;
const JUMP_FORCE   = -8;
const PIPE_SPEED   = 3;
const PIPE_WIDTH   = 40;
const PIPE_GAP     = 90;       // vertical gap between top/bottom pipe
const PIPE_SPAWN_X = W + 10;   // pipes start just off-screen right
const PIPE_INTERVAL= 90;       // frames between new pipes

const BIRD_X  = 80;            // bird stays at fixed X
const BIRD_W  = 28;
const BIRD_H  = 20;

// ── High score file ────────────────────────────────────────────────────────
const HS_FILE = “highscore.txt”;

function loadHighScore() {
try {
const data = fs.readFileSync(HS_FILE, “ascii”);
return parseInt(data) || 0;
} catch (e) {
return 0;
}
}

function saveHighScore(score) {
try {
fs.writeFileSync(HS_FILE, String(score), “ascii”);
} catch (e) {}
}

// ── SVG element references ─────────────────────────────────────────────────
const birdEl        = document.getElementById(“bird”);
const pipe1Top      = document.getElementById(“pipe1top”);
const pipe1Bot      = document.getElementById(“pipe1bot”);
const pipe2Top      = document.getElementById(“pipe2top”);
const pipe2Bot      = document.getElementById(“pipe2bot”);
const scoreTxt      = document.getElementById(“score”);
const hsTxt         = document.getElementById(“highscore”);
const screenGame    = document.getElementById(“screen-game”);
const screenStart   = document.getElementById(“screen-start”);
const screenOver    = document.getElementById(“screen-over”);
const finalScoreTxt = document.getElementById(“final-score”);
const finalHsTxt    = document.getElementById(“final-hs”);
const newBestTxt    = document.getElementById(“new-best”);

// ── Game state ─────────────────────────────────────────────────────────────
let birdY, birdVel;
let pipes;          // array of {x, gapY, scored}
let score, highScore;
let frameCount;
let gameLoop;
let state; // “start” | “playing” | “over”

function initGame() {
birdY    = H / 2;
birdVel  = 0;
pipes    = [];
score    = 0;
frameCount = 0;
highScore  = loadHighScore();
hsTxt.text = “Best: “ + highScore;
}

// ── Pipe helpers ───────────────────────────────────────────────────────────
const pipeEls = [
{ top: pipe1Top, bot: pipe1Bot },
{ top: pipe2Top, bot: pipe2Bot },
];

function spawnPipe() {
const minGapY = 60;
const maxGapY = H - 60 - PIPE_GAP;
const gapY = minGapY + Math.random() * (maxGapY - minGapY);
pipes.push({ x: PIPE_SPAWN_X, gapY, scored: false });
}

function updatePipeEl(idx, pipe) {
if (idx >= pipeEls.length) return;
const el = pipeEls[idx];
const topH = pipe.gapY;
const botY = pipe.gapY + PIPE_GAP;
const botH = H - botY;

el.top.setAttribute(“x”, pipe.x);
el.top.setAttribute(“y”, 0);
el.top.setAttribute(“width”, PIPE_WIDTH);
el.top.setAttribute(“height”, topH);

el.bot.setAttribute(“x”, pipe.x);
el.bot.setAttribute(“y”, botY);
el.bot.setAttribute(“width”, PIPE_WIDTH);
el.bot.setAttribute(“height”, botH);
}

function hidePipeEl(idx) {
if (idx >= pipeEls.length) return;
pipeEls[idx].top.setAttribute(“width”, 0);
pipeEls[idx].bot.setAttribute(“width”, 0);
}

// ── Collision detection ────────────────────────────────────────────────────
function checkCollision() {
// Floor / ceiling
if (birdY - BIRD_H / 2 < 0 || birdY + BIRD_H / 2 > H) return true;

for (const pipe of pipes) {
const bLeft  = BIRD_X - BIRD_W / 2 + 4;  // +4 for a little forgiveness
const bRight = BIRD_X + BIRD_W / 2 - 4;
const bTop   = birdY  - BIRD_H / 2 + 4;
const bBot   = birdY  + BIRD_H / 2 - 4;

```
const pLeft  = pipe.x;
const pRight = pipe.x + PIPE_WIDTH;

if (bRight > pLeft && bLeft < pRight) {
  // Inside horizontal range of pipe — check vertical
  if (bTop < pipe.gapY || bBot > pipe.gapY + PIPE_GAP) {
    return true;
  }
}
```

}
return false;
}

// ── Main update loop ───────────────────────────────────────────────────────
function update() {
frameCount++;

// Spawn pipes on interval
if (frameCount % PIPE_INTERVAL === 0) spawnPipe();

// Move bird
birdVel += GRAVITY;
birdY   += birdVel;

// Update bird element
birdEl.setAttribute(“cy”, birdY);

// Move pipes & score
for (let i = pipes.length - 1; i >= 0; i–) {
pipes[i].x -= PIPE_SPEED;

```
// Score when bird passes pipe center
if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
  pipes[i].scored = true;
  score++;
  scoreTxt.text = score;
}

// Remove pipes that scrolled off screen
if (pipes[i].x + PIPE_WIDTH < 0) {
  pipes.splice(i, 1);
}
```

}

// Render pipes (max 2 visible at once with our interval)
for (let i = 0; i < pipeEls.length; i++) {
if (i < pipes.length) {
updatePipeEl(i, pipes[i]);
} else {
hidePipeEl(i);
}
}

// Collision check
if (checkCollision()) {
endGame();
}
}

// ── State transitions ──────────────────────────────────────────────────────
function showStart() {
state = “start”;
screenStart.style.display = “inline”;
screenGame.style.display  = “none”;
screenOver.style.display  = “none”;
initGame();
}

function startGame() {
state = “playing”;
screenStart.style.display = “none”;
screenGame.style.display  = “inline”;
screenOver.style.display  = “none”;

scoreTxt.text = “0”;
hsTxt.text    = “Best: “ + highScore;

// Reset pipe elements
hidePipeEl(0);
hidePipeEl(1);

gameLoop = setInterval(update, 33); // ~30fps
}

function endGame() {
clearInterval(gameLoop);
state = “over”;

// Update high score
let newBest = false;
if (score > highScore) {
highScore = score;
saveHighScore(highScore);
newBest = true;
}

finalScoreTxt.text = “Score: “ + score;
finalHsTxt.text    = “Best: “ + highScore;
newBestTxt.style.display = newBest ? “inline” : “none”;

screenGame.style.display = “none”;
screenOver.style.display = “inline”;
}

// ── Button input ───────────────────────────────────────────────────────────
document.onkeypress = function(evt) {
if (evt.key === “back”) {
if (state === “start”) {
startGame();
} else if (state === “playing”) {
birdVel = JUMP_FORCE;  // flap!
} else if (state === “over”) {
showStart();
}
}
};

// ── Keep display on while playing ──────────────────────────────────────────
display.addEventListener(“change”, () => {
if (!display.on && state === “playing”) {
endGame();
}
});

// ── Boot ───────────────────────────────────────────────────────────────────
showStart();
