import * as Phaser from 'phaser';
import { SceneKey, type SceneKey as SceneKeyType } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import type { GameSettings, TouchUiMode } from '../types/save';
import { getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import { markSceneStatus } from '../utils/sceneStatus';

interface SettingsSceneData {
  readonly returnScene?: SceneKeyType;
}

export class SettingsScene extends Phaser.Scene {
  private returnScene: SceneKeyType = SceneKey.Title;
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Settings);
  }

  init(data: SettingsSceneData = {}): void {
    this.returnScene = data.returnScene ?? SceneKey.Title;
  }

  create(): void {
    markSceneStatus(SceneKey.Settings);
    this.draw();
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }

  private draw(): void {
    this.children.removeAll();
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.text(BASE_WIDTH / 2, 54, 'Settings', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: PaletteCss.white
    }).setOrigin(0.5);
    const save = getSaveSystem(this);
    const settings = save.data.settings;
    this.menu?.destroy();
    this.menu = new MenuList(this, BASE_WIDTH / 2, 122, [
      { label: `Master Volume ${Math.round(settings.masterVolume * 100)}%`, action: () => this.stepVolume('masterVolume') },
      { label: `SFX Volume ${Math.round(settings.sfxVolume * 100)}%`, action: () => this.stepVolume('sfxVolume') },
      { label: `Mute ${settings.muted ? 'On' : 'Off'}`, action: () => this.toggle('muted') },
      { label: `Reduced Shake ${settings.reducedShake ? 'On' : 'Off'}`, action: () => this.toggle('reducedShake') },
      { label: `Reduced Particles ${settings.reducedParticles ? 'On' : 'Off'}`, action: () => this.toggle('reducedParticles') },
      { label: `High Contrast ${settings.highContrast ? 'On' : 'Off'}`, action: () => this.toggle('highContrast') },
      { label: `Touch UI ${settings.touchUiMode}`, action: () => this.cycleTouchMode() },
      { label: `Touch Opacity ${Math.round(settings.touchUiOpacity * 100)}%`, action: () => this.stepTouchOpacity() },
      { label: `Fall Rescue ${settings.assist.fallRescue ? 'On' : 'Off'}`, action: () => this.toggleFallRescue() },
      { label: 'Back', action: () => this.goBack() }
    ], 20);
  }

  private stepVolume(field: 'masterVolume' | 'sfxVolume'): void {
    const save = getSaveSystem(this);
    const current = save.data.settings[field];
    const next = current >= 1 ? 0 : Math.min(1, current + 0.1);
    save.updateSettings({ [field]: next } as Partial<GameSettings>);
    this.draw();
  }

  private stepTouchOpacity(): void {
    const save = getSaveSystem(this);
    const current = save.data.settings.touchUiOpacity;
    const next = current >= 1 ? 0.35 : Math.min(1, current + 0.1);
    save.updateSettings({ touchUiOpacity: next });
    this.draw();
  }

  private cycleTouchMode(): void {
    const save = getSaveSystem(this);
    const modes: readonly TouchUiMode[] = ['auto', 'on', 'off'];
    const index = modes.indexOf(save.data.settings.touchUiMode);
    save.updateSettings({ touchUiMode: modes[(index + 1) % modes.length] });
    this.draw();
  }

  private toggle(field: 'muted' | 'reducedShake' | 'reducedParticles' | 'highContrast'): void {
    const save = getSaveSystem(this);
    save.updateSettings({ [field]: !save.data.settings[field] } as Partial<GameSettings>);
    this.draw();
  }

  private toggleFallRescue(): void {
    const save = getSaveSystem(this);
    save.updateSettings({ assist: { fallRescue: !save.data.settings.assist.fallRescue } });
    this.draw();
  }

  private goBack(): void {
    this.scene.start(this.returnScene);
  }
}
