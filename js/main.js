import { AssetLoader } from './assets.js';
import { Animal } from './animal.js';
import { SplatEffect } from './splat.js';
import { Scene } from './scene.js';
import { AudioManager } from './audio.js';

// Only use portrait layout on actual phones (short side ≤ 500px)
const IS_PORTRAIT = Math.min(window.innerWidth, window.innerHeight) <= 500
  && window.innerHeight > window.innerWidth;
const CANVAS_WIDTH  = IS_PORTRAIT ? 562  : 1200;
const CANVAS_HEIGHT = IS_PORTRAIT ? 1000 : 750;
const GAME_DURATION = 60;
const MAX_ANIMALS = 8;
const SPAWN_INTERVAL = 3;

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.assets = new AssetLoader();
    this.audio = new AudioManager();
    this.scene = null;
    this.animals = [];
    this.splatEffects = [];
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.gameStarted = false;
    this.spawnTimer = 0;
    this.lastTime = 0;
    this.shotsFired = 0;
    this.hits = 0;

    // Muzzle flash
    this.flashTimer = 0;
    this.flashPos = { x: 0, y: 0 };

    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());
  }

  fitCanvas() {
    const maxW = window.innerWidth - 20;
    const maxH = window.innerHeight - 20;
    const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT);
    this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  async handleClick(e) {
    // Init audio on first click (browser requires user gesture)
    if (!this.audio.ctx) {
      this.audio.init();
    }
    await this.audio.resume();

    if (this.gameOver) {
      this.restart();
      return;
    }
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.audio.startMusic();
      return;
    }

    const { x, y } = this.getCanvasCoords(e);
    this.shotsFired++;
    this.flashTimer = 0.15;
    this.flashPos = { x, y };

    // Check hits (front-to-back, highest footY first = closest to camera)
    const sorted = [...this.animals].sort((a, b) => b.footY - a.footY);
    let hit = false;
    for (const animal of sorted) {
      if (animal.hitTest(x, y)) {
        animal.splat();
        this.score += 100;
        this.hits++;
        hit = true;

        // Create splat overlay effect
        const splatType = SplatEffect.randomType();
        this.splatEffects.push(new SplatEffect(
          animal.x + animal.width / 2,
          animal.y + animal.height / 2,
          splatType,
          this.assets
        ));
        break; // Only hit one animal per click
      }
    }

    if (hit) {
      this.audio.playHit();
    } else {
      this.audio.playMiss();
    }
  }

  spawnAnimal() {
    const bounds = this.scene.walkBounds;
    const x = bounds.left + Math.random() * (bounds.right - bounds.left - 70);
    const y = bounds.top + Math.random() * (bounds.bottom - bounds.top - 70);
    const type = Animal.randomType();
    this.animals.push(new Animal(x, y, type, this.assets, CANVAS_HEIGHT));
  }

  update(dt) {
    if (!this.gameStarted || this.gameOver) return;

    // Game timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver = true;
      this.audio.stopMusic();
      return;
    }

    // Spawn animals
    this.spawnTimer += dt;
    if (this.spawnTimer >= SPAWN_INTERVAL && this.animals.length < MAX_ANIMALS) {
      this.spawnTimer = 0;
      this.spawnAnimal();
    }

    // Update animals
    const bounds = this.scene.walkBounds;
    for (const animal of this.animals) {
      animal.update(dt, bounds);
    }

    // Remove dead animals
    this.animals = this.animals.filter(a => !a.isDead);

    // Update splat effects
    for (const effect of this.splatEffects) {
      effect.update(dt);
    }
    this.splatEffects = this.splatEffects.filter(e => !e.done);

    // Flash timer
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  draw() {
    const ctx = this.ctx;

    // Draw static background
    this.scene.drawBackground(ctx);

    // Depth-sort animals (back to front) and draw
    const sorted = [...this.animals].sort((a, b) => a.footY - b.footY);
    for (const animal of sorted) {
      animal.draw(ctx);
    }

    // Draw splat effects on top
    for (const effect of this.splatEffects) {
      effect.draw(ctx);
    }

    // Muzzle flash
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashTimer / 0.15;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.flashPos.x, this.flashPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // HUD
    this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    // Semi-transparent bar at top
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';

    // Score
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 Score: ${this.score}`, 15, 28);

    // Timer
    ctx.textAlign = 'center';
    const timeColor = this.timeLeft <= 10 ? '#ff4444' : '#fff';
    ctx.fillStyle = timeColor;
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, CANVAS_WIDTH / 2, 28);

    // Accuracy
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    const accuracy = this.shotsFired > 0 ? Math.round((this.hits / this.shotsFired) * 100) : 0;
    ctx.fillText(`🎯 ${accuracy}% (${this.hits}/${this.shotsFired})`, CANVAS_WIDTH - 15, 28);

    ctx.restore();

    // Start screen
    if (!this.gameStarted) {
      this.drawOverlay(ctx, '🎮 Animal Splat!', 'Click anywhere to start hunting!', '#4ecca3');
    }

    // Game over screen
    if (this.gameOver) {
      this.drawOverlay(
        ctx,
        '⏱️ Time\'s Up!',
        `Final Score: ${this.score} | Accuracy: ${accuracy}% | Click to play again`,
        '#ff6b6b'
      );
    }
  }

  drawOverlay(ctx, title, subtitle, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#ccc';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.restore();
  }

  restart() {
    this.animals = [];
    this.splatEffects = [];
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.gameStarted = false;
    this.spawnTimer = 0;
    this.shotsFired = 0;
    this.hits = 0;
    this.audio.stopMusic();
    // Pre-spawn some animals
    for (let i = 0; i < 4; i++) this.spawnAnimal();
  }

  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap delta
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  async start() {
    const loadBar = document.getElementById('loadBar');
    const loadingEl = document.getElementById('loading');

    await this.assets.loadAll((progress) => {
      loadBar.style.width = `${progress * 100}%`;
    });

    loadingEl.style.display = 'none';

    this.scene = new Scene(CANVAS_WIDTH, CANVAS_HEIGHT, this.assets);

    // Pre-spawn animals
    for (let i = 0; i < 4; i++) this.spawnAnimal();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

const game = new Game();
game.start().catch(console.error);
