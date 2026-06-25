import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { AudioSystem } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { setAudioSystem, setSaveSystem } from '../systems/Registry';
import stage1Data from '../data/stage1.json';
import type { Stage1Definition } from '../types/stage';
import { validateStage1 } from '../utils/stageValidation';
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
    const validation = validateStage1(stage1Data as Stage1Definition);
    if (!validation.valid) {
      console.error('Stage 1 validation failed at boot', validation.errors);
    }
    this.scene.start(SceneKey.Preload);
  }
}
