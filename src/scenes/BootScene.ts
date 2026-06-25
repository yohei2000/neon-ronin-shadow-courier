import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { AudioSystem } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { setAudioSystem, setSaveSystem } from '../systems/Registry';
import { validateAllLevels } from '../utils/levelValidation';
import { Levels } from '../data/levels';
import { markSceneStatus } from '../utils/sceneStatus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    markSceneStatus(SceneKey.Boot);
    const saveSystem = new SaveSystem();
    setSaveSystem(this, saveSystem);
    setAudioSystem(this, new AudioSystem(saveSystem));
    const validation = validateAllLevels(Levels);
    if (!validation.valid) {
      console.error('Level validation failed at boot', validation.errors);
    }
    this.scene.start(SceneKey.Preload);
  }
}
