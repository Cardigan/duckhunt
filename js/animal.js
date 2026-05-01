// Animal entity with state machine
const ANIMAL_TYPES = ['apple', 'bear', 'beverKing', 'mushroom', 'mushroom2', 'shrimp'];

const STATE = {
  WALKING: 'walking',
  SITTING: 'sitting',
  SPLATTED: 'splatted',
  DEAD: 'dead',
};

export class Animal {
  constructor(x, y, type, assets, canvasHeight) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.assets = assets;
    this.canvasHeight = canvasHeight;
    this.baseWidth = 70;
    this.baseHeight = 70;

    // Hit box is smaller than drawn sprite
    this.hitBoxScale = 0.65;

    this.state = STATE.WALKING;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.12; // seconds per frame

    // Movement
    this.baseSpeed = 40 + Math.random() * 40; // pixels per second
    this.direction = Math.random() * Math.PI * 2;
    this.vx = Math.cos(this.direction) * this.baseSpeed;
    this.vy = Math.sin(this.direction) * this.baseSpeed * 0.5; // slower vertical for 3/4 view
    this.facingLeft = this.vx < 0;

    // State timers
    this.stateTimer = 2 + Math.random() * 4;
    this.splatFrame = 0;
    this.splatTimer = 0;

    // Perspective-scaled size (updated each frame)
    this.updateScale();
  }

  // Scale by Y position: 0.55 at top, 1.1 at bottom
  get perspectiveScale() {
    const t = Math.max(0, Math.min(1, this.y / this.canvasHeight));
    return 0.55 + t * 0.55;
  }

  updateScale() {
    const s = this.perspectiveScale;
    this.width = this.baseWidth * s;
    this.height = this.baseHeight * s;
    this.speed = this.baseSpeed * s;
    this.footY = this.y + this.height;
  }

  update(dt, bounds) {
    switch (this.state) {
      case STATE.WALKING:
        this.updateWalking(dt, bounds);
        break;
      case STATE.SITTING:
        this.updateSitting(dt);
        break;
      case STATE.SPLATTED:
        this.updateSplatted(dt);
        break;
    }

    this.updateScale();
  }

  updateWalking(dt, bounds) {
    // Animate
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer -= this.frameInterval;
      this.frameIndex = (this.frameIndex + 1) % 8;
    }

    // Move with perspective-adjusted speed
    const s = this.perspectiveScale;
    this.x += this.vx * s * dt;
    this.y += this.vy * s * dt;

    // Bounce off walkable bounds
    if (this.x < bounds.left) { this.x = bounds.left; this.vx = Math.abs(this.vx); }
    if (this.x + this.width > bounds.right) { this.x = bounds.right - this.width; this.vx = -Math.abs(this.vx); }
    if (this.y < bounds.top) { this.y = bounds.top; this.vy = Math.abs(this.vy); }
    if (this.y + this.height > bounds.bottom) { this.y = bounds.bottom - this.height; this.vy = -Math.abs(this.vy); }

    this.facingLeft = this.vx < 0;

    // State transition timer
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.state = STATE.SITTING;
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.stateTimer = 1.5 + Math.random() * 3;
    }
  }

  updateSitting(dt) {
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer -= this.frameInterval;
      this.frameIndex = (this.frameIndex + 1) % 8;
    }

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      // Pick new direction and start walking
      this.state = STATE.WALKING;
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.direction = Math.random() * Math.PI * 2;
      this.baseSpeed = 40 + Math.random() * 40;
      this.vx = Math.cos(this.direction) * this.baseSpeed;
      this.vy = Math.sin(this.direction) * this.baseSpeed * 0.5;
      this.facingLeft = this.vx < 0;
      this.stateTimer = 2 + Math.random() * 4;
    }
  }

  updateSplatted(dt) {
    this.splatTimer += dt;
    if (this.splatTimer >= this.frameInterval * 1.5) {
      this.splatTimer -= this.frameInterval * 1.5;
      this.splatFrame++;
      if (this.splatFrame >= 4) {
        this.state = STATE.DEAD;
      }
    }
  }

  hitTest(mx, my) {
    if (this.state === STATE.SPLATTED || this.state === STATE.DEAD) return false;
    const padX = this.width * (1 - this.hitBoxScale) / 2;
    const padY = this.height * (1 - this.hitBoxScale) / 2;
    return mx >= this.x + padX && mx <= this.x + this.width - padX &&
           my >= this.y + padY && my <= this.y + this.height - padY;
  }

  splat() {
    this.state = STATE.SPLATTED;
    this.splatFrame = 0;
    this.splatTimer = 0;
  }

  get isDead() {
    return this.state === STATE.DEAD;
  }

  getCurrentFrame() {
    let key;
    switch (this.state) {
      case STATE.WALKING:
        key = `${this.type}_walk_${this.frameIndex + 1}`;
        break;
      case STATE.SITTING:
        key = `${this.type}_sit_${this.frameIndex + 1}`;
        break;
      case STATE.SPLATTED:
        key = `${this.type}_splat_${Math.min(this.splatFrame + 1, 4)}`;
        break;
      default:
        return null;
    }
    return this.assets.get(key);
  }

  draw(ctx) {
    const img = this.getCurrentFrame();
    if (!img) return;

    ctx.save();
    if (this.facingLeft) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, this.width, this.height);
    } else {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
    ctx.restore();
  }

  static randomType() {
    return ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
  }
}
