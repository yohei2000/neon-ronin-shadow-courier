import * as Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';
import { AudioSystem } from './AudioSystem';

const SAVE_KEY = 'saveSystem';
const AUDIO_KEY = 'audioSystem';

export function setSaveSystem(scene: Phaser.Scene, saveSystem: SaveSystem): void {
  scene.registry.set(SAVE_KEY, saveSystem);
}

export function getSaveSystem(scene: Phaser.Scene): SaveSystem {
  return scene.registry.get(SAVE_KEY) as SaveSystem;
}

export function setAudioSystem(scene: Phaser.Scene, audioSystem: AudioSystem): void {
  scene.registry.set(AUDIO_KEY, audioSystem);
}

export function getAudioSystem(scene: Phaser.Scene): AudioSystem {
  return scene.registry.get(AUDIO_KEY) as AudioSystem;
}
