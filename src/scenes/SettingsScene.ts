import * as Phaser from 'phaser';
import { SceneKey, type SceneKey as SceneKeyType } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { MenuList, type MenuItemDefinition } from '../systems/MenuList';
import type { GameSettings, TouchUiMode } from '../types/save';
import { clamp } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

interface SettingsSceneData {
  readonly returnScene?: SceneKeyType;
}

export class SettingsScene extends Phaser.Scene {
  private menu: MenuList | null = null;
  private returnScene: SceneKeyType = SceneKey.Title;

  constructor() {
    super(SceneKey.Settings);
  }

  init(data: SettingsSceneData): void {
    this.returnScene = data.returnScene ?? SceneKey.Title;
  }

  create(): void {
    markSceneStatus(SceneKey.Settings);
    this.render();
  }

  update(): void {
    this.menu?.update();
  }

  private render(): void {
    this.children.removeAll();
    this.cameras.main.setBackgroundColor(Palette.ink0);
    const save = getSaveSystem(this);
    const settings = save.data.settings;
    this.add
      .text(480, 36, 'Settings', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5);
    const items: MenuItemDefinition[] = [
      { label: `Master Volume ${Math.round(settings.masterVolume * 100)}%`, action: () => this.stepVolume('masterVolume', 0.1) },
      { label: `SFX Volume ${Math.round(settings.sfxVolume * 100)}%`, action: () => this.stepVolume('sfxVolume', 0.1) },
      { label: `Mute ${settings.muted ? 'On' : 'Off'}`, action: () => this.toggle('muted') },
      { label: `Reduced Shake ${settings.reducedShake ? 'On' : 'Off'}`, action: () => this.toggle('reducedShake') },
      { label: `Reduced Particles ${settings.reducedParticles ? 'On' : 'Off'}`, action: () => this.toggle('reducedParticles') },
      { label: `High Contrast ${settings.highContrast ? 'On' : 'Off'}`, action: () => this.toggle('highContrast') },
      { label: `Touch UI ${settings.touchUiMode}`, action: () => this.cycleTouchMode(settings.touchUiMode) },
      { label: `Touch Opacity ${Math.round(settings.touchUiOpacity * 100)}%`, action: () => this.stepVolume('touchUiOpacity', 0.1) },
      {
        label: `Assist: Longer Invulnerability ${settings.assist.longerInvulnerability ? 'On' : 'Off'}`,
        action: () => this.toggleAssist('longerInvulnerability')
      },
      {
        label: `Assist: Reduced Damage ${settings.assist.reducedDamage ? 'On' : 'Off'}`,
        action: () => this.toggleAssist('reducedDamage')
      },
      {
        label: `Assist: Fall Rescue ${settings.assist.fallRescue ? 'On' : 'Off'}`,
        action: () => this.toggleAssist('fallRescue')
      },
      {
        label: `Assist: Checkpoint Heal ${settings.assist.checkpointHeal ? 'On' : 'Off'}`,
        action: () => this.toggleAssist('checkpointHeal')
      },
      { label: 'Back', action: () => this.scene.start(this.returnScene) }
    ];
    this.menu?.destroy();
    this.menu = new MenuList(this, 480, 86, items, 19);
    this.add
      .text(480, 515, 'Click or use Up/Down + Enter. Volume and opacity wrap at 100%.', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: PaletteCss.smoke
      })
      .setOrigin(0.5);
  }

  private stepVolume(field: 'masterVolume' | 'sfxVolume' | 'touchUiOpacity', amount: number): void {
    const save = getSaveSystem(this);
    const current = save.data.settings[field];
    const next = current >= 0.99 ? 0 : clamp(current + amount, 0, 1);
    save.updateSettings({ [field]: next } as Partial<GameSettings>);
    getAudioSystem(this).play('confirm');
    this.render();
  }

  private toggle(field: 'muted' | 'reducedShake' | 'reducedParticles' | 'highContrast'): void {
    const save = getSaveSystem(this);
    save.updateSettings({ [field]: !save.data.settings[field] } as Partial<GameSettings>);
    getAudioSystem(this).play('confirm');
    this.render();
  }

  private toggleAssist(field: keyof GameSettings['assist']): void {
    const save = getSaveSystem(this);
    save.updateSettings({
      assist: {
        ...save.data.settings.assist,
        [field]: !save.data.settings.assist[field]
      }
    });
    getAudioSystem(this).play('confirm');
    this.render();
  }

  private cycleTouchMode(current: TouchUiMode): void {
    const next: TouchUiMode = current === 'auto' ? 'on' : current === 'on' ? 'off' : 'auto';
    getSaveSystem(this).updateSettings({ touchUiMode: next });
    getAudioSystem(this).play('confirm');
    this.render();
  }
}
