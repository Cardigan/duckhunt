// Splat overlay effect
export class SplatEffect {
  constructor(x, y, type, assets) {
    this.x = x;
    this.y = y;
    this.type = type; // 1, 2, or 3
    this.assets = assets;
    this.frame = 0;
    this.timer = 0;
    this.frameInterval = 0.15;
    this.size = 100;
    this.done = false;
    this.opacity = 0.75;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.frameInterval) {
      this.timer -= this.frameInterval;
      this.frame++;
      if (this.frame >= 4) {
        this.done = true;
      }
    }
  }

  draw(ctx) {
    if (this.done) return;
    const key = `splat_${this.type}_${Math.min(this.frame + 1, 4)}`;
    const img = this.assets.get(key);
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(
      img,
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }

  static randomType() {
    return Math.floor(Math.random() * 3) + 1;
  }
}
