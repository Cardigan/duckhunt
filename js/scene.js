// Scene builder - creates a 3/4 perspective background
// ═══════════════════════════════════════════════════════
// EDITABLE SCALE — adjust this to resize all background objects quickly
// ═══════════════════════════════════════════════════════
const BG_SCALE = 0.12;
// All background objects derive their size from this value.
// Source sprites are 1254×1254. At 0.12 → ground tiles ~150px.
// Increase for bigger objects, decrease for smaller.
// ═══════════════════════════════════════════════════════

const SRC = 1254;

export class Scene {
  constructor(width, height, assets) {
    this.width = width;
    this.height = height;
    this.assets = assets;

    // Derived sizes from BG_SCALE
    this.groundSize = Math.round(SRC * BG_SCALE);       // ~150
    this.houseSize  = Math.round(SRC * BG_SCALE * 2.2); // ~330
    this.treeSize   = Math.round(SRC * BG_SCALE * 1.6); // ~240
    this.bushSize   = Math.round(SRC * BG_SCALE * 0.7); // ~105

    // Walkable area for animals
    this.walkBounds = {
      left: 40,
      right: width - 40,
      top: 180,
      bottom: height - 60,
    };

    // Depth-sorted props (trees/bushes that animals walk behind/in front of)
    this.frontProps = [];

    this.buildScene();
    this.bgCanvas = null;
  }

  buildScene() {
    const ts = this.treeSize;
    const bs = this.bushSize;

    this.frontProps = [
      // Trees scattered around the scene
      { key: 'bg_tree', x: 50,   y: 100, w: ts, h: ts, footY: 100 + ts * 0.9 },
      { key: 'bg_tree', x: 500,  y: 60,  w: ts, h: ts, footY: 60  + ts * 0.9 },
      { key: 'bg_tree', x: 950,  y: 120, w: ts, h: ts, footY: 120 + ts * 0.9 },
      { key: 'bg_tree', x: 300,  y: 350, w: ts, h: ts, footY: 350 + ts * 0.9 },
      { key: 'bg_tree', x: 1050, y: 400, w: ts, h: ts, footY: 400 + ts * 0.9 },

      // Bushes
      { key: 'bg_bush', x: 200,  y: 280, w: bs, h: bs, footY: 280 + bs * 0.9 },
      { key: 'bg_bush', x: 700,  y: 350, w: bs, h: bs, footY: 350 + bs * 0.9 },
      { key: 'bg_bush', x: 400,  y: 500, w: bs, h: bs, footY: 500 + bs * 0.9 },
      { key: 'bg_bush', x: 1100, y: 250, w: bs, h: bs, footY: 250 + bs * 0.9 },
    ];
  }

  renderBackground() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.width;
    this.bgCanvas.height = this.height;
    const ctx = this.bgCanvas.getContext('2d');

    // Layer 1: Tile the ground with random ground tiles
    const gs = this.groundSize;
    const groundKeys = ['bg_ground1', 'bg_ground2', 'bg_ground3', 'bg_ground4', 'bg_ground5'];
    const step = Math.round(gs * 0.85); // slight overlap to avoid seams

    // Seeded pseudo-random for consistent layout
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    for (let y = -gs / 4; y < this.height + gs; y += step) {
      for (let x = -gs / 4; x < this.width + gs; x += step) {
        const key = groundKeys[Math.floor(rand() * groundKeys.length)];
        const img = this.assets.get(key);
        if (img) {
          ctx.drawImage(img, x, y, gs, gs);
        }
      }
    }

    // Scatter some grass patches for variety
    const grassImg = this.assets.get('bg_grass');
    if (grassImg) {
      for (let i = 0; i < 15; i++) {
        const gx = rand() * this.width - gs / 4;
        const gy = rand() * this.height - gs / 4;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(grassImg, gx, gy, gs, gs);
      }
      ctx.globalAlpha = 1.0;
    }

    // Layer 2: Houses (max 3, along the back/top area)
    const hs = this.houseSize;
    const houses = [
      { key: 'bg_house1', x: 20,  y: -20 },
      { key: 'bg_house2', x: 430, y: -30 },
      { key: 'bg_house1', x: 870, y: -15 },
    ];
    for (const h of houses) {
      const img = this.assets.get(h.key);
      if (img) {
        ctx.drawImage(img, h.x, h.y, hs, hs);
      }
    }

    return this.bgCanvas;
  }

  drawBackground(ctx) {
    if (!this.bgCanvas) this.renderBackground();
    ctx.drawImage(this.bgCanvas, 0, 0);
  }

  drawProp(ctx, prop) {
    const img = this.assets.get(prop.key);
    if (img) {
      ctx.drawImage(img, prop.x, prop.y, prop.w, prop.h);
    }
  }
}
