import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture,
} from 'pixi.js';

import { GAME_ASSETS } from './assets';
import { GAME_CONFIG } from './config';

export class Game {
  private app: Application | null = null;
  private world: Container | null = null;
  private player: Sprite | null = null;

  private readonly pressedKeys = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const gameKeys = [
      'KeyW',
      'KeyA',
      'KeyD',
      'ArrowUp',
      'ArrowLeft',
      'ArrowRight',
    ];

    if (gameKeys.includes(event.code)) {
      event.preventDefault();
    }

    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.code);
  };

  async init(host: HTMLDivElement): Promise<void> {
    const app = new Application();

    await app.init({
      resizeTo: host,
      background: '#071820',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });

    this.app = app;

    host.appendChild(app.canvas);

    const world = new Container();
    this.world = world;

    app.stage.addChild(world);

    await this.loadAssets();

    this.createWater();
    this.createPlayer();
    this.layoutWorld();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.layoutWorld);

    app.ticker.add(this.update);
  }

  private async loadAssets(): Promise<void> {
    await Promise.all([
      Assets.load(GAME_ASSETS.water),
      Assets.load(GAME_ASSETS.playerShip),
    ]);
  }

  private createWater(): void {
    if (!this.world) {
      return;
    }

    const texture = Texture.from(GAME_ASSETS.water);

    const tileSize = 64;

    const columns = Math.ceil(
      GAME_CONFIG.arena.width / tileSize,
    );

    const rows = Math.ceil(
      GAME_CONFIG.arena.height / tileSize,
    );

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tile = new Sprite(texture);

        tile.x = column * tileSize;
        tile.y = row * tileSize;
        tile.width = tileSize;
        tile.height = tileSize;

        this.world.addChild(tile);
      }
    }
  }

  private createPlayer(): void {
    if (!this.world) {
      return;
    }

    const texture = Texture.from(GAME_ASSETS.playerShip);
    const player = new Sprite(texture);

    player.anchor.set(0.5);

    player.position.set(
      GAME_CONFIG.arena.width / 2,
      GAME_CONFIG.arena.height / 2,
    );

    /*
     * The original sprite points upward.
     * rotation = 0 therefore means north.
     */
    player.scale.set(0.65);

    this.player = player;
    this.world.addChild(player);
  }

  private readonly update = (): void => {
    if (!this.app || !this.player) {
      return;
    }

    const deltaSeconds = this.app.ticker.deltaMS / 1000;

    const rotateLeft =
      this.pressedKeys.has('KeyA') ||
      this.pressedKeys.has('ArrowLeft');

    const rotateRight =
      this.pressedKeys.has('KeyD') ||
      this.pressedKeys.has('ArrowRight');

    const moveForward =
      this.pressedKeys.has('KeyW') ||
      this.pressedKeys.has('ArrowUp');

    if (rotateLeft) {
      this.player.rotation -=
        GAME_CONFIG.player.rotationSpeed * deltaSeconds;
    }

    if (rotateRight) {
      this.player.rotation +=
        GAME_CONFIG.player.rotationSpeed * deltaSeconds;
    }

    if (moveForward) {
      const distance =
        GAME_CONFIG.player.moveSpeed * deltaSeconds;

      /*
       * The ship artwork points upward,
       * so rotation zero moves toward -Y.
       */
      this.player.x +=
        Math.sin(this.player.rotation) * distance;

      this.player.y -=
        Math.cos(this.player.rotation) * distance;
    }

    this.keepPlayerInsideArena();
  };

  private keepPlayerInsideArena(): void {
    if (!this.player) {
      return;
    }

    const radius = GAME_CONFIG.player.radius;

    this.player.x = Math.max(
      radius,
      Math.min(
        GAME_CONFIG.arena.width - radius,
        this.player.x,
      ),
    );

    this.player.y = Math.max(
      radius,
      Math.min(
        GAME_CONFIG.arena.height - radius,
        this.player.y,
      ),
    );
  }

  private readonly layoutWorld = (): void => {
    if (!this.app || !this.world) {
      return;
    }

    const scale = Math.min(
      this.app.screen.width / GAME_CONFIG.arena.width,
      this.app.screen.height / GAME_CONFIG.arena.height,
    );

    this.world.scale.set(scale);

    this.world.x =
      (this.app.screen.width -
        GAME_CONFIG.arena.width * scale) /
      2;

    this.world.y =
      (this.app.screen.height -
        GAME_CONFIG.arena.height * scale) /
      2;
  };

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.layoutWorld);

    this.pressedKeys.clear();

    if (this.app) {
      this.app.ticker.remove(this.update);

      this.app.destroy(
        true,
        {
          children: true,
          texture: false,
        },
      );

      this.app = null;
    }

    this.world = null;
    this.player = null;
  }
}