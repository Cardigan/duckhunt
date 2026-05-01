// Asset loader - preloads all game images
export class AssetLoader {
  constructor() {
    this.images = {};
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }

  async loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        this.loadedAssets++;
        this.onProgress?.(this.loadedAssets / this.totalAssets);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  async loadAll(onProgress) {
    this.onProgress = onProgress;
    const manifest = this.buildManifest();
    this.totalAssets = manifest.length;

    await Promise.all(manifest.map(({ key, src }) => this.loadImage(key, src)));
    return this.images;
  }

  buildManifest() {
    const manifest = [];

    // Animated animals: walking (8), sitting (8), splat (4)
    const animals = ['apple', 'bear', 'beverKing', 'mushroom', 'mushroom2', 'shrimp'];
    for (const animal of animals) {
      for (let i = 1; i <= 8; i++) {
        const frame = String(i).padStart(2, '0');
        manifest.push({ key: `${animal}_walk_${i}`, src: `sprites/${animal}/walking/${frame}.png` });
        manifest.push({ key: `${animal}_sit_${i}`, src: `sprites/${animal}/sitting/${frame}.png` });
      }
      for (let i = 1; i <= 4; i++) {
        const frame = String(i).padStart(2, '0');
        manifest.push({ key: `${animal}_splat_${i}`, src: `sprites/${animal}/splat/${frame}.png` });
      }
    }

    // Splat overlays (3 types x 4 frames)
    for (let type = 1; type <= 3; type++) {
      for (let i = 1; i <= 4; i++) {
        const frame = String(i).padStart(2, '0');
        manifest.push({ key: `splat_${type}_${i}`, src: `sprites/splat/splat_type_${type}/${frame}.png` });
      }
    }

    // Background objects
    const bgObjects = [
      'grass', 'ground1', 'ground2', 'ground3', 'ground4', 'ground5',
      'house1', 'house2', 'tree', 'bush',
    ];
    for (const obj of bgObjects) {
      manifest.push({ key: `bg_${obj}`, src: `sprites/background/${obj}.png` });
    }

    return manifest;
  }

  get(key) {
    return this.images[key];
  }
}
