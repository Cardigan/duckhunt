// Scene builder - procedural 3/4 perspective background
// ═══════════════════════════════════════════════════════
// EDITABLE SCALE — adjust this to resize all background objects quickly
// ═══════════════════════════════════════════════════════
const BG_SCALE = 1.0;
// Multiplier for all procedural background elements.
// 1.0 = default. Increase for bigger objects, decrease for smaller.
// ═══════════════════════════════════════════════════════

// Color palette
const COLORS = {
  grassLight: '#7ec850',
  grassMid: '#6ab840',
  grassDark: '#5aa835',
  dirtLight: '#c4a46c',
  dirtMid: '#b08c56',
  dirtDark: '#9a7a4a',
  pathStone: '#a09888',
  pathStoneLight: '#b8ad9e',
  wallLight: '#f5e6d0',
  wallMid: '#e8d5b8',
  wallShadow: '#c4a882',
  roofRed: '#c0503a',
  roofRedDark: '#a0403a',
  roofBrown: '#8b6b4a',
  roofBrownDark: '#6b4b3a',
  roofBlue: '#5a7a9a',
  roofBlueDark: '#4a6a8a',
  woodDoor: '#8b6b3a',
  windowBlue: '#88c8e8',
  windowFrame: '#6a5a4a',
  trunkBrown: '#6b4a2a',
  trunkDark: '#5a3a1a',
  canopyGreen: '#4a9a3a',
  canopyLight: '#6ab84a',
  canopyDark: '#3a8a2a',
  canopyPink: '#e8a0b0',
  canopyPinkLight: '#f0b8c4',
  canopyOrange: '#d4903a',
  canopyOrangeLight: '#e4a84a',
  bushGreen: '#5aaa44',
  bushDark: '#4a9a34',
  flowerRed: '#e04040',
  flowerYellow: '#f0d040',
  flowerWhite: '#f8f0e8',
  flowerPink: '#f0a0c0',
  waterBlue: '#68b8d8',
  waterLight: '#88d0e8',
};

export class Scene {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Walkable area for animals
    this.walkBounds = {
      left: 40,
      right: width - 40,
      top: 200,
      bottom: height - 60,
    };

    // Depth-sorted props that participate in rendering with animals
    this.frontProps = [];

    this.buildScene();
    this.bgCanvas = null;
  }

  buildScene() {
    const s = BG_SCALE;

    // Trees and bushes that animals can walk behind/in front of
    this.frontProps = [
      { type: 'tree', variant: 'green',  x: 80 * s,   y: 180, size: 80 * s },
      { type: 'tree', variant: 'pink',   x: 520 * s,  y: 150, size: 75 * s },
      { type: 'tree', variant: 'orange', x: 1000 * s, y: 190, size: 85 * s },
      { type: 'tree', variant: 'green',  x: 280 * s,  y: 380, size: 90 * s },
      { type: 'tree', variant: 'green',  x: 850 * s,  y: 420, size: 80 * s },

      { type: 'bush', x: 180 * s, y: 300, size: 35 * s },
      { type: 'bush', x: 650 * s, y: 360, size: 30 * s },
      { type: 'bush', x: 450 * s, y: 520, size: 32 * s },
      { type: 'bush', x: 1050 * s, y: 280, size: 28 * s },
      { type: 'bush', x: 750 * s, y: 550, size: 34 * s },
    ];

    // Compute footY for depth sorting
    for (const prop of this.frontProps) {
      prop.footY = prop.y + (prop.size || 0) * 0.5;
    }
  }

  renderBackground() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.width;
    this.bgCanvas.height = this.height;
    const ctx = this.bgCanvas.getContext('2d');
    const s = BG_SCALE;

    this.drawGround(ctx, s);
    this.drawPaths(ctx, s);
    this.drawHouses(ctx, s);
    this.drawSmallDetails(ctx, s);

    return this.bgCanvas;
  }

  drawGround(ctx, s) {
    // Base grass gradient (lighter at top = further away, darker at bottom = closer)
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#8dd860');
    grad.addColorStop(0.3, COLORS.grassLight);
    grad.addColorStop(1, COLORS.grassDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle tile grid for depth perception
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    const tileSize = 60 * s;
    for (let y = 0; y < this.height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Random grass tufts for texture
    let seed = 123;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    for (let i = 0; i < 60; i++) {
      const gx = rand() * this.width;
      const gy = rand() * this.height;
      const gs = (3 + rand() * 5) * s;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(90,170,60,0.3)' : 'rgba(110,190,70,0.25)';
      ctx.beginPath();
      ctx.ellipse(gx, gy, gs, gs * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPaths(ctx, s) {
    // Winding dirt path
    ctx.save();
    ctx.strokeStyle = COLORS.dirtLight;
    ctx.lineWidth = 40 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.bezierCurveTo(200 * s, 350, 400 * s, 450, 600 * s, 380);
    ctx.bezierCurveTo(800 * s, 310, 1000 * s, 400, this.width, 350);
    ctx.stroke();

    // Path outline/shadow
    ctx.strokeStyle = COLORS.dirtDark;
    ctx.lineWidth = 42 * s;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Stepping stones on path
    ctx.fillStyle = COLORS.pathStone;
    const stones = [
      [100, 395], [200, 370], [340, 400], [480, 425],
      [600, 385], [720, 340], [860, 360], [1000, 380], [1120, 360],
    ];
    for (const [sx, sy] of stones) {
      ctx.beginPath();
      ctx.ellipse(sx * s, sy, 12 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.pathStoneLight;
      ctx.beginPath();
      ctx.ellipse(sx * s - 2, sy - 1, 8 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.pathStone;
    }
    ctx.restore();
  }

  drawHouses(ctx, s) {
    // House 1 — left side (red roof)
    this.drawHouse(ctx, 100 * s, 50, 160 * s, 120 * s, COLORS.roofRed, COLORS.roofRedDark);

    // House 2 — center (brown roof)
    this.drawHouse(ctx, 500 * s, 30, 170 * s, 130 * s, COLORS.roofBrown, COLORS.roofBrownDark);

    // House 3 — right side (blue roof)
    this.drawHouse(ctx, 880 * s, 55, 155 * s, 115 * s, COLORS.roofBlue, COLORS.roofBlueDark);
  }

  drawHouse(ctx, x, y, w, h, roofColor, roofDark) {
    const wallH = h * 0.55;
    const roofH = h * 0.5;
    const wallY = y + roofH;

    // Shadow under house
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, wallY + wallH + 5, w * 0.55, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front wall
    ctx.fillStyle = COLORS.wallLight;
    ctx.fillRect(x, wallY, w, wallH);

    // Wall shadow (right side for 3/4 view)
    ctx.fillStyle = COLORS.wallShadow;
    ctx.fillRect(x + w * 0.75, wallY, w * 0.25, wallH);

    // Wall base line
    ctx.strokeStyle = COLORS.wallShadow;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, wallY, w, wallH);

    // Roof (triangle)
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 10, wallY);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 10, wallY);
    ctx.closePath();
    ctx.fill();

    // Roof right half darker for 3/4 depth
    ctx.fillStyle = roofDark;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w + 10, wallY);
    ctx.lineTo(x + w / 2, wallY);
    ctx.closePath();
    ctx.fill();

    // Roof outline
    ctx.strokeStyle = roofDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, wallY);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 10, wallY);
    ctx.closePath();
    ctx.stroke();

    // Door
    const doorW = w * 0.18;
    const doorH = wallH * 0.65;
    const doorX = x + w * 0.42;
    const doorY = wallY + wallH - doorH;
    ctx.fillStyle = COLORS.woodDoor;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door knob
    ctx.fillStyle = '#c0a030';
    ctx.beginPath();
    ctx.arc(doorX + doorW * 0.75, doorY + doorH * 0.55, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Windows
    const winSize = w * 0.12;
    this.drawWindow(ctx, x + w * 0.15, wallY + wallH * 0.2, winSize);
    this.drawWindow(ctx, x + w * 0.7, wallY + wallH * 0.2, winSize);

    // Chimney
    ctx.fillStyle = roofDark;
    ctx.fillRect(x + w * 0.7, y - 5, w * 0.1, roofH * 0.4);
  }

  drawWindow(ctx, x, y, size) {
    ctx.fillStyle = COLORS.windowBlue;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = COLORS.windowFrame;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    // Cross pane
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.stroke();
  }

  drawSmallDetails(ctx, s) {
    // Flower patches
    const flowers = [
      { x: 350, y: 250, colors: [COLORS.flowerRed, COLORS.flowerYellow] },
      { x: 700, y: 480, colors: [COLORS.flowerPink, COLORS.flowerWhite] },
      { x: 1050, y: 550, colors: [COLORS.flowerYellow, COLORS.flowerRed] },
      { x: 150, y: 480, colors: [COLORS.flowerWhite, COLORS.flowerPink] },
    ];

    let seed = 456;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    for (const patch of flowers) {
      for (let i = 0; i < 6; i++) {
        const fx = (patch.x + (rand() - 0.5) * 40) * s;
        const fy = patch.y + (rand() - 0.5) * 20;
        const color = patch.colors[Math.floor(rand() * patch.colors.length)];

        // Stem
        ctx.strokeStyle = '#4a8a30';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy + 8 * s);
        ctx.stroke();

        // Petals
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5 * s, 0, Math.PI * 2);
        ctx.fill();

        // Center
        ctx.fillStyle = '#f0d040';
        ctx.beginPath();
        ctx.arc(fx, fy, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Small rocks
    const rocks = [[580, 300], [900, 500], [200, 560], [1100, 450]];
    for (const [rx, ry] of rocks) {
      ctx.fillStyle = '#9a9080';
      ctx.beginPath();
      ctx.ellipse(rx * s, ry, 8 * s, 5 * s, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b0a898';
      ctx.beginPath();
      ctx.ellipse(rx * s - 1, ry - 1, 5 * s, 3 * s, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small pond (bottom right area)
    ctx.fillStyle = COLORS.waterBlue;
    ctx.beginPath();
    ctx.ellipse(950 * s, 620, 50 * s, 25 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.waterLight;
    ctx.beginPath();
    ctx.ellipse(945 * s, 616, 30 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pond rim
    ctx.strokeStyle = '#4a9a50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(950 * s, 620, 52 * s, 27 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw a tree (called during frame render for depth sorting)
  drawTree(ctx, prop) {
    const { x, y, size, variant } = prop;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.45, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = COLORS.trunkBrown;
    ctx.fillRect(x - size * 0.06, y - size * 0.1, size * 0.12, size * 0.55);
    ctx.fillStyle = COLORS.trunkDark;
    ctx.fillRect(x, y - size * 0.1, size * 0.06, size * 0.55);

    // Canopy
    let mainColor, lightColor;
    switch (variant) {
      case 'pink':
        mainColor = COLORS.canopyPink; lightColor = COLORS.canopyPinkLight; break;
      case 'orange':
        mainColor = COLORS.canopyOrange; lightColor = COLORS.canopyOrangeLight; break;
      default:
        mainColor = COLORS.canopyGreen; lightColor = COLORS.canopyLight; break;
    }

    // Main canopy (overlapping circles for organic shape)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.05, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.2, y - size * 0.05, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y - size * 0.28, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw a bush
  drawBush(ctx, prop) {
    const { x, y, size } = prop;

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.3, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.bushDark;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y + size * 0.1, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y + size * 0.1, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.bushGreen;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.08, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Tiny flowers on bush
    const flowerColors = [COLORS.flowerRed, COLORS.flowerYellow, COLORS.flowerPink];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + 0.5;
      const fx = x + Math.cos(angle) * size * 0.22;
      const fy = y + Math.sin(angle) * size * 0.15;
      ctx.fillStyle = flowerColors[i];
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBackground(ctx) {
    if (!this.bgCanvas) this.renderBackground();
    ctx.drawImage(this.bgCanvas, 0, 0);
  }

  drawProp(ctx, prop) {
    if (prop.type === 'tree') {
      this.drawTree(ctx, prop);
    } else if (prop.type === 'bush') {
      this.drawBush(ctx, prop);
    }
  }
}
