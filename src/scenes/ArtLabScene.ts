import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { ArtAssetKey, RuntimeAssetKeys } from '../data/artAssets';
import {
  ArtLockPhase,
  GateAApprovalStatus,
  GateAEvidenceFiles,
  GateBApprovalStatus,
  ReferenceIds,
  SelectedDirection
} from '../data/artLockGate';
import type { ArtLockQaState } from '../types/artLockQa';

type ArtLabData = {
  readonly state?: string;
};

const parallaxLayers = [
  ArtAssetKey.LayerFarSky,
  ArtAssetKey.LayerDistantSkyline,
  ArtAssetKey.LayerMidRoofsSigns,
  ArtAssetKey.LayerGameplay,
  ArtAssetKey.LayerNearProps,
  ArtAssetKey.LayerNearPropsFront,
  ArtAssetKey.LayerForegroundOcclusion
] as const;

export class ArtLabScene extends Phaser.Scene {
  private currentState = 'neutral';
  private reducedFx = false;
  private lightingPreset = 'warm-cool-alley';

  constructor() {
    super(SceneKey.ArtLab);
  }

  create(data: ArtLabData): void {
    const params = new URLSearchParams(window.location.search);
    this.currentState = data.state ?? params.get('state') ?? 'neutral';
    this.reducedFx = params.get('reducedFx') === '1' || this.currentState === 'reduced-fx';
    this.lightingPreset = params.get('preset') ?? this.resolvePreset(this.currentState);

    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawBaseEnvironment();
    this.drawStation();
    this.drawHeader();
    this.publishQaState();

    this.input.keyboard?.on('keydown-T', () => this.scene.start(SceneKey.Title));
  }

  private resolvePreset(state: string): string {
    if (state.includes('moonlight')) return 'moonlight-lantern-gold';
    if (state.includes('neon')) return 'cyan-magenta-neon';
    return 'warm-cool-alley';
  }

  private drawBaseEnvironment(): void {
    parallaxLayers.forEach((key, index) => {
      const layer = this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, key);
      layer.tilePositionX = index * 62 + this.currentState.length * 7;
      layer.setAlpha([1, 0.82, 0.74, 0.88, 0.70, 0.50, 0.36][index] ?? 1);
    });

    const presetKey = this.lightingPreset === 'moonlight-lantern-gold'
      ? ArtAssetKey.LightingMoonlight
      : this.lightingPreset === 'cyan-magenta-neon'
        ? ArtAssetKey.LightingNeon
        : ArtAssetKey.LightingWarmCool;
    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, presetKey).setAlpha(this.reducedFx ? 0.18 : 0.28);
  }

  private drawHeader(): void {
    this.add.text(28, 28, 'ART LAB', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: PaletteHex.warmPaper
    }).setShadow(0, 0, PaletteHex.neonCyan, 8);

    this.add.text(28, 64, this.currentState, {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });

    this.add.text(620, 30, `Gate B v1 rejected / v2 approved`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
  }

  private drawStation(): void {
    switch (this.currentState) {
      case 'busy':
      case 'artlab-busy':
        this.drawBusyReadabilityStation();
        break;
      case 'player-motion':
        this.drawPlayerMotionStation();
        break;
      case 'player-contrast':
      case 'high-contrast':
        this.drawPlayerContrastStation();
        break;
      case 'player-scale':
        this.drawPlayerScaleStation();
        break;
      case 'enemy':
        this.drawEnemyStation();
        break;
      case 'kite-wraith':
        this.drawKiteWraithStation();
        break;
      case 'warden-telegraph':
      case 'telegraph-standard':
      case 'telegraph-fast':
        this.drawTelegraphStation();
        break;
      case 'slash':
      case 'slash-dark':
      case 'slash-bright':
        this.drawSlashStation();
        break;
      case 'parallax':
        this.drawParallaxStation();
        break;
      case 'sign-density':
        this.drawSignDensityStation();
        break;
      case 'hud':
      case 'ui-desktop':
        this.drawUiStation();
        break;
      case 'mobile-controls':
      case 'ui-mobile':
        this.drawMobileStation();
        break;
      case 'lighting-moonlight':
      case 'lighting-neon':
      case 'lighting-warm':
        this.drawLightingStation();
        break;
      case 'reduced-fx':
        this.drawReducedFxStation();
        break;
      case 'grayscale':
        this.drawGrayscaleStation();
        break;
      default:
        this.drawNeutralStation();
        break;
    }
  }

  private drawNeutralStation(): void {
    this.add.image(490, 300, ArtAssetKey.PlayerMaster).setScale(0.35);
    this.add.sprite(586, 344, ArtAssetKey.Slash, 3).setScale(0.8).setAlpha(0.88);
    this.add.image(768, 294, ArtAssetKey.KiteWraith).setScale(0.45).setAlpha(0.92);
    this.add.image(180, 340, ArtAssetKey.SignAtlas).setScale(0.32).setAlpha(0.74);
    this.caption('Neutral production review: final player master, motion arc, signage, and layered alley share one palette.');
  }

  private drawBusyReadabilityStation(): void {
    this.add.image(480, 270, ArtAssetKey.TitleComposition).setAlpha(0.52);
    this.add.image(318, 360, ArtAssetKey.PlayerMaster).setScale(0.31);
    this.add.sprite(608, 372, ArtAssetKey.Enemy, 1).setScale(0.82);
    this.add.sprite(770, 320, ArtAssetKey.LanternWarden, 3).setScale(0.72);
    this.add.sprite(454, 326, ArtAssetKey.Slash, 3).setScale(0.72);
    this.caption('Busy Neon Alley readability station: player cyan/magenta identity remains separated from enemy amber/vermilion threats.');
  }

  private drawPlayerMotionStation(): void {
    const anims = ['idle', 'run', 'jumpRise', 'wallSlide', 'groundSlash'];
    anims.forEach((anim, index) => {
      const sprite = this.add.sprite(150 + index * 170, 330, ArtAssetKey.Player, index * 6).setScale(0.9);
      sprite.play(`player-${anim}`);
      this.label(112 + index * 170, 436, anim);
    });
    this.caption('Animation station: stable origin and consistent scarf/satchel across core player states.');
  }

  private drawPlayerContrastStation(): void {
    const fills = ['#F3F0E8', '#B7BBC0', '#343941', PaletteHex.darkBlueGray, '#020203'];
    fills.forEach((fill, index) => {
      const x = 56 + index * 176;
      this.add.rectangle(x + 70, 258, 138, 276, Number.parseInt(fill.slice(1), 16)).setStrokeStyle(1, Palette.neutralGray, 0.55);
      this.add.sprite(x + 70, 310, ArtAssetKey.Player, index % 2 ? 7 : 0).setScale(0.86);
      this.label(x + 20, 416, `contrast ${index + 1}`);
    });
    this.caption('Contrast station: player survives white, gray, dark-blue, black, and mixed backgrounds.');
  }

  private drawPlayerScaleStation(): void {
    this.add.sprite(280, 320, ArtAssetKey.Player, 0).setScale(0.72);
    this.add.sprite(470, 334, ArtAssetKey.Player, 8).setScale(0.54);
    this.add.sprite(624, 348, ArtAssetKey.Player, 30).setScale(0.36);
    this.label(250, 420, '64px');
    this.label(444, 420, '48px');
    this.label(602, 420, '32px');
    this.caption('Scale station: silhouette, scarf, cyan eye, and satchel remain recognizable at required display sizes.');
  }

  private drawEnemyStation(): void {
    [0, 1, 2, 3].forEach((frame, index) => {
      this.add.sprite(190 + index * 170, 342, ArtAssetKey.Enemy, frame).setScale(0.9);
      this.label(148 + index * 170, 430, ['idle', 'telegraph', 'release', 'recover'][index]);
    });
    this.add.image(770, 268, ArtAssetKey.KiteWraith).setScale(0.48);
    this.caption('Enemy station: Ink Crawler states plus Kite Wraith preview use the enemy amber/vermilion group, separate from player cyan/magenta.');
  }

  private drawKiteWraithStation(): void {
    this.add.image(470, 278, ArtAssetKey.KiteWraith).setScale(0.85);
    this.add.sprite(615, 320, ArtAssetKey.Slash, 2).setScale(0.5).setTint(Palette.neonCyan);
    this.caption('Kite Wraith preview: forward hostile motion uses enemy amber/vermilion, kept distinct from player cyan/magenta identity.');
  }

  private drawTelegraphStation(): void {
    this.add.image(480, 282, ArtAssetKey.Telegraph).setScale(0.86);
    this.caption('Telegraph timeline: glow-up, aim, warning, wind-up, release, and recover use enemy amber/vermilion for heavy and fast attacks.');
  }

  private drawSlashStation(): void {
    if (this.currentState === 'slash-bright') {
      this.add.rectangle(480, 288, 820, 310, Palette.warmPaper, 0.86);
    }
    [0, 2, 4, 6].forEach((frame, index) => {
      this.add.sprite(180 + index * 188, 292, ArtAssetKey.Slash, frame).setScale(1.08);
      this.label(132 + index * 188, 424, ['anticipation', 'active', 'breakup', 'fade'][index]);
    });
    this.caption('Slash station: four-phase Reference G timing with magenta core, ink edge, cyan sparks, and bounded breakup.');
  }

  private drawParallaxStation(): void {
    parallaxLayers.forEach((key, index) => {
      this.add.image(650, 112 + index * 54, key).setDisplaySize(360, 42).setAlpha(0.82);
      this.label(62, 126 + index * 54, `${index + 1}. ${key}`);
    });
    this.caption('Parallax station: seven named depth roles are separate runtime images, not one flat background.');
  }

  private drawSignDensityStation(): void {
    this.add.image(480, 312, ArtAssetKey.SignAtlas).setScale(0.58).setAlpha(0.92);
    this.add.text(52, 122, 'Counts: hero 1 / medium 4 / small 7', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: PaletteHex.neonCyan
    });
    this.add.rectangle(340, 318, 240, 160).setStrokeStyle(3, Palette.neonMagenta, 0.76);
    this.caption('Sign density station: annotated protected readability zone remains clear of the hero sign.');
  }

  private drawUiStation(): void {
    this.add.image(482, 300, ArtAssetKey.UiKit).setScale(0.82);
    this.caption('Desktop UI station: HUD, objective panel, menu states, icons, paper/lacquer materials, and semantic accent colors.');
  }

  private drawMobileStation(): void {
    this.add.image(480, 260, ArtAssetKey.UiKit).setScale(0.48).setAlpha(0.78);
    this.add.image(480, 402, ArtAssetKey.MobileControlsKit).setScale(0.78).setAlpha(0.95);
    this.caption('Mobile controls station: visible art is smaller than the hit target and does not cover critical gameplay space.');
  }

  private drawLightingStation(): void {
    const key = this.lightingPreset === 'moonlight-lantern-gold'
      ? ArtAssetKey.LightingMoonlight
      : this.lightingPreset === 'cyan-magenta-neon'
        ? ArtAssetKey.LightingNeon
        : ArtAssetKey.LightingWarmCool;
    this.add.image(480, 288, key).setAlpha(0.88);
    this.caption(`Lighting station: ${this.lightingPreset} preset with restrained glow, wet reflections, fog depth, and readable silhouettes.`);
  }

  private drawReducedFxStation(): void {
    this.add.image(274, 300, ArtAssetKey.LightingNeon).setScale(0.48).setAlpha(0.84);
    this.add.image(686, 300, ArtAssetKey.LightingWarmCool).setScale(0.48).setAlpha(0.72);
    this.label(180, 468, 'Full FX');
    this.label(586, 468, 'Reduced FX');
    this.caption('Reduced-FX comparison: lower rain, lower fog/glow, fewer slash breakup particles, same silhouette language.');
  }

  private drawGrayscaleStation(): void {
    this.add.image(480, 292, ArtAssetKey.TitleComposition).setAlpha(0.78).setTint(0xb8b8b8);
    this.add.sprite(320, 360, ArtAssetKey.Player, 0).setScale(0.86).setTint(0xd0d0d0);
    this.add.sprite(576, 344, ArtAssetKey.Slash, 3).setScale(0.72).setTint(0xc0c0c0);
    this.caption('Grayscale review mode: value separation remains readable without relying on hue alone.');
  }

  private caption(value: string): void {
    this.add.image(480, 502, ArtAssetKey.BrushKit).setDisplaySize(900, 54).setAlpha(0.30);
    this.add.text(52, 496, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: PaletteHex.warmPaper,
      wordWrap: { width: 856 }
    });
  }

  private label(x: number, y: number, value: string): void {
    this.add.text(x, y, value, {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color: PaletteHex.paleMoonMist
    });
  }

  private publishQaState(): void {
    const state: ArtLockQaState = {
      scene: 'ArtLabScene',
      phase: ArtLockPhase,
      gateAApproval: GateAApprovalStatus,
      gateBApproval: GateBApprovalStatus,
      references: ReferenceIds,
      evidenceFiles: GateAEvidenceFiles,
      selectedDirection: SelectedDirection,
      finalProductionRuntime: true,
      state: this.currentState,
      assetKeys: RuntimeAssetKeys,
      lightingPreset: this.lightingPreset,
      reducedFx: this.reducedFx,
      mobileReviewReady: true
    };

    window.__NEON_RONIN_ART_LOCK__ = state;
  }
}
