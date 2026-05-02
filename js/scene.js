export class Scene {
  constructor(width, height, assets) {
    this.width = width;
    this.height = height;
    this.assets = assets;

    // No procedural props — trees/bushes are baked into the background image
    this.frontProps = [];

    // Constrain animals to the open grass area, inside the border decorations
    const portrait = height > width;
    this.walkBounds = portrait
      ? { left: 65, right: width - 60, top: 185, bottom: height - 130 }
      : { left: 130, right: width - 130, top: 150, bottom: height - 75 };
  }

  drawBackground(ctx) {
    const portrait = this.height > this.width;
    const img = this.assets.get(portrait ? 'bg_phone' : 'bg_landscape');
    if (img) {
      ctx.drawImage(img, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#6ab840';
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawProp() {
    // no-op: all props are in the pre-rendered background
  }
}
