import * as Phaser from 'phaser';
import {
  GameAudioGroups,
  GameAudioKey,
  GameAudioMetadata,
  GameAudioProfiles,
  Stage1SfxKey
} from '../data/audioAssets';
import type { GameAudioGroupKey, GameAudioProfileKey } from '../data/audioAssets';
import type { Stage1Settings } from './SaveSystem';
import {
  DefaultAudioPanDistance,
  DefaultAudioSpatialDistance,
  resolveAudioMixDelta,
  resolveFootstepInterval,
  resolveSpatialMix
} from './audioMix';

export { resolveAudioMixDelta, resolveFootstepInterval, resolveSpatialMix } from './audioMix';

export const Stage1SfxEvent = 'stage1:sfx';
export const GameAudioSettingsEvent = 'game:audio-settings';

export type GameAudioVariationMode = 'random' | 'cycle';

export type Stage1SfxOptions = {
  /** Multiplier applied after the authored per-sound and user SFX volumes. */
  readonly volume?: number;
  readonly detune?: number;
  readonly rate?: number;
  readonly minGapMs?: number;
  /** World X position. Supplying this enables stereo pan and distance attenuation. */
  readonly sourceX?: number;
  readonly maxDistance?: number;
  readonly panDistance?: number;
  readonly pan?: number;
  readonly priority?: number;
  /** 0..1 music reduction. `true` uses the authored metadata value. */
  readonly duckMusic?: number | boolean;
  /** `false` forces the exact key; otherwise matching variation groups are selected automatically. */
  readonly variation?: GameAudioVariationMode | false;
  readonly detuneVariance?: number;
};

export type GameAudioUpdateState = {
  readonly listenerX?: number;
  /** A scalar is treated as horizontal speed; a vector also enables landing-weight detection. */
  readonly velocity?: number | Readonly<{ x: number; y?: number }>;
  readonly velocityX?: number;
  readonly velocityY?: number;
  readonly onGround?: boolean;
  readonly wallSliding?: boolean;
  readonly bossIntensity?: number;
  readonly updraftActive?: boolean;
  readonly paused?: boolean;
  readonly gameOver?: boolean;
};

export type GameAudioSettings = Pick<Stage1Settings, 'masterVolume' | 'sfxVolume'> & {
  readonly musicVolume?: number;
};

type ManagedSound =
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.HTML5AudioSound
  | Phaser.Sound.NoAudioSound;

type ProfileRole = 'ambience' | 'musicBase' | 'musicCombat';

type ProfileVoice = {
  readonly key: GameAudioKey;
  readonly profile: GameAudioProfileKey;
  readonly role: ProfileRole;
  readonly sound: ManagedSound;
  readonly looping: boolean;
  currentGain: number;
  outgoing: boolean;
  completed: boolean;
};

type OneShotVoice = {
  readonly key: GameAudioKey;
  readonly sound: ManagedSound;
  readonly owner: GameAudio;
  readonly priority: number;
  readonly startedAt: number;
  cleanup: () => void;
};

type PendingOneShot = {
  readonly key: GameAudioKey;
  readonly options: Stage1SfxOptions;
  readonly gapToken: string;
  readonly queuedAt: number;
};

type SharedAudioState = {
  readonly manager: Phaser.Sound.BaseSoundManager;
  readonly outputLimiter?: DynamicsCompressorNode;
  profile: GameAudioProfileKey | undefined;
  profileVoices: ProfileVoice[];
  readonly completedProfileKeys: Set<GameAudioKey>;
  readonly oneShots: Set<OneShotVoice>;
  controller: GameAudio | undefined;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  combatMix: number;
  duckGain: number;
  duckDepth: number;
  duckUntilMs: number;
  paused: boolean;
  gameOver: boolean;
};

type LocalLoopVoice = {
  readonly key: GameAudioKey;
  readonly sound: ManagedSound;
  currentGain: number;
  active: boolean;
};

const MAX_ONE_SHOT_VOICES = 18;
const DEFAULT_SPATIAL_DISTANCE = DefaultAudioSpatialDistance;
const DEFAULT_PAN_DISTANCE = DefaultAudioPanDistance;
const EPSILON = 0.001;

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

const smooth = (current: number, target: number, deltaMs: number, timeConstantMs: number): number => {
  if (deltaMs <= 0 || timeConstantMs <= 0) return target;
  const alpha = 1 - Math.exp(-deltaMs / timeConstantMs);
  return current + (target - current) * alpha;
};

const asManagedSound = (sound: Phaser.Sound.BaseSound): ManagedSound => sound as ManagedSound;

const safeDestroySound = (sound: Phaser.Sound.BaseSound): void => {
  if (sound.pendingRemove) return;
  sound.stop();
  sound.destroy();
};

const profileForScene = (scene: Phaser.Scene): GameAudioProfileKey => {
  const sceneKey = String(scene.sys.settings.key).toLowerCase();
  if (sceneKey.includes('title') || sceneKey.includes('menu')) return 'menu';
  if (sceneKey.includes('stage2')) return 'stage2';
  if (sceneKey.includes('clear')) return 'clear';
  return 'stage1';
};

/**
 * Runtime audio director shared by every playable scene.
 *
 * Music/profile voices live on the game sound manager and intentionally survive a
 * Scene shutdown. Instance-owned one-shots and movement loops are always removed
 * during shutdown, so a scene transition cannot leak voices.
 */
export class GameAudio {
  private static readonly sharedByManager = new WeakMap<Phaser.Sound.BaseSoundManager, SharedAudioState>();

  private readonly lastPlayedMs = new Map<string, number>();
  private readonly variationCursor = new Map<GameAudioGroupKey, number>();
  private readonly lastVariationIndex = new Map<GameAudioGroupKey, number>();
  private readonly localLoops = new Map<GameAudioKey, LocalLoopVoice>();
  private readonly pendingOneShots: PendingOneShot[] = [];
  private readonly shared: SharedAudioState;
  private destroyed = false;
  private listenerX = 0;
  private velocityX = 0;
  private velocityY = 0;
  private onGround: boolean | undefined;
  private wallSliding = false;
  private updraftActive = false;
  private bossIntensity = 0;
  private paused = false;
  private gameOver = false;
  private nextFootstepMs = 0;
  private lastMixWallMs = GameAudio.wallClockNow();

  private readonly handleSfxEvent = (key: Stage1SfxKey, options: Stage1SfxOptions = {}) => this.play(key, options);
  private readonly handleSettingsEvent = (settings: GameAudioSettings) => this.updateSettings(settings);
  private readonly handleSceneShutdown = () => this.destroy();
  private readonly handleAudioUnlocked = () => {
    if (this.destroyed || this.shared.controller !== this) return;
    this.resumeProfileAfterUnlock();
    this.flushPendingOneShots();
    this.publishDebugState();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    settings: GameAudioSettings,
    profile: GameAudioProfileKey = profileForScene(scene)
  ) {
    this.shared = GameAudio.getSharedState(scene.sound);
    this.scene.events.on(Stage1SfxEvent, this.handleSfxEvent);
    this.scene.game.events.on(GameAudioSettingsEvent, this.handleSettingsEvent);
    this.scene.sound.on(Phaser.Sound.Events.UNLOCKED, this.handleAudioUnlocked);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
    this.updateSettings(settings);
    this.startProfile(profile);
  }

  /** Keeps the legacy Stage1 call path while automatically using authored variations. */
  play(key: Stage1SfxKey, options: Stage1SfxOptions = {}): void {
    if (this.destroyed) return;

    const automaticGroup = options.variation === false ? undefined : this.findAutomaticGroup(key);
    if (automaticGroup) {
      this.playGroup(automaticGroup, options);
      return;
    }

    this.playResolved(key, options, `key:${key}`);
  }

  playAt(key: GameAudioKey, sourceX: number, options: Stage1SfxOptions = {}): void {
    this.play(key, { ...options, sourceX });
  }

  playGroup(group: GameAudioGroupKey, options: Stage1SfxOptions = {}): void {
    if (this.destroyed) return;
    const keys = GameAudioGroups[group] as readonly GameAudioKey[];
    if (keys.length === 0) return;
    const mode = options.variation === false ? 'cycle' : options.variation ?? 'random';
    const key = this.selectVariation(group, keys, mode);
    this.playResolved(key, { ...options, variation: false }, `group:${group}`);
  }

  /**
   * Accepts either `update(state, deltaMs)` or Phaser-style
   * `update(time, deltaMs, state)`.
   */
  update(state: GameAudioUpdateState, deltaMs?: number): void;
  update(time: number, deltaMs: number, state: GameAudioUpdateState): void;
  update(
    stateOrTime: GameAudioUpdateState | number,
    deltaMs = 1000 / 60,
    phaserState: GameAudioUpdateState = {}
  ): void {
    if (this.destroyed) return;
    const state = typeof stateOrTime === 'number' ? phaserState : stateOrTime;
    const frameDeltaMs = clamp(Number.isFinite(deltaMs) ? deltaMs : 1000 / 60, 0, 100);
    const wallNow = GameAudio.wallClockNow();
    const wallDeltaMs = clamp(wallNow - this.lastMixWallMs, 0, 1000);
    this.lastMixWallMs = wallNow;
    const mixDeltaMs = resolveAudioMixDelta(frameDeltaMs, wallDeltaMs);

    if (state.listenerX !== undefined) this.listenerX = state.listenerX;
    this.scene.sound.setListenerPosition(this.listenerX, 0);

    if (typeof state.velocity === 'number') {
      this.velocityX = state.velocity;
    } else if (state.velocity) {
      this.velocityX = state.velocity.x;
      if (state.velocity.y !== undefined) this.velocityY = state.velocity.y;
    }
    if (state.velocityX !== undefined) this.velocityX = state.velocityX;
    if (state.velocityY !== undefined) this.velocityY = state.velocityY;

    const previousOnGround = this.onGround;
    if (state.onGround !== undefined) this.onGround = state.onGround;
    if (previousOnGround !== true && this.onGround === true) {
      this.nextFootstepMs = this.now() + 120;
    }
    if (state.wallSliding !== undefined) this.wallSliding = state.wallSliding;
    if (state.updraftActive !== undefined) this.updraftActive = state.updraftActive;
    if (state.bossIntensity !== undefined) this.bossIntensity = clamp(state.bossIntensity);
    if (state.paused !== undefined) this.setPaused(state.paused);
    if (state.gameOver !== undefined) this.setGameOver(state.gameOver);

    this.updateFootsteps();
    this.updateMovementLoops(mixDeltaMs);

    if (this.shared.controller === this) {
      this.shared.combatMix = smooth(
        this.shared.combatMix,
        this.paused || this.gameOver ? 0 : this.bossIntensity,
        mixDeltaMs,
        this.bossIntensity > this.shared.combatMix ? 180 : 620
      );
      this.shared.paused = this.paused;
      this.shared.gameOver = this.gameOver;
      this.ensureProfileVoices();
      this.updateSharedMix(wallNow, mixDeltaMs);
    }
    this.publishDebugState();
  }

  startProfile(profile: GameAudioProfileKey, restart = false): void {
    if (this.destroyed) return;
    const previousController = this.shared.controller;
    this.shared.controller = this;
    if (!restart && this.shared.profile === profile) {
      this.shared.paused = this.paused;
      this.shared.gameOver = this.gameOver;
      if (previousController !== this) this.shared.combatMix = 0;
      this.ensureProfileVoices();
      this.renderSharedVolumes();
      this.publishDebugState();
      return;
    }

    const hadVoices = this.shared.profileVoices.some((voice) => !voice.outgoing && !voice.completed);
    for (const voice of this.shared.profileVoices) voice.outgoing = true;
    this.shared.profile = profile;
    this.shared.completedProfileKeys.clear();
    this.shared.combatMix = 0;
    this.shared.paused = this.paused;
    this.shared.gameOver = this.gameOver;
    this.createProfileVoices(profile, hadVoices ? 0 : 1);
    this.updateSharedMix(GameAudio.wallClockNow(), hadVoices ? 1000 / 60 : 0);
    this.publishDebugState();
  }

  setProfile(profile: GameAudioProfileKey, restart = false): void {
    this.startProfile(profile, restart);
  }

  updateSettings(settings: GameAudioSettings): void {
    if (this.destroyed) return;
    this.shared.masterVolume = clamp(settings.masterVolume);
    this.shared.sfxVolume = clamp(settings.sfxVolume);
    const musicVolume = (settings as GameAudioSettings).musicVolume;
    this.shared.musicVolume = clamp(typeof musicVolume === 'number' ? musicVolume : settings.sfxVolume);
    this.scene.sound.volume = this.shared.masterVolume;
    this.renderSharedVolumes();
    for (const loop of this.localLoops.values()) this.renderLocalLoopVolume(loop);
    this.publishDebugState();
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.silenceLocalLoops();
    if (this.shared.controller === this) {
      this.shared.paused = paused;
      this.updateSharedMix(GameAudio.wallClockNow(), 0);
    }
    this.publishDebugState();
  }

  setGameOver(gameOver: boolean): void {
    if (this.gameOver === gameOver) return;
    if (!gameOver) this.stopOneShotsByKey(GameAudioKey.GameOver);
    this.gameOver = gameOver;
    if (gameOver) this.silenceLocalLoops();
    if (this.shared.controller === this) this.shared.gameOver = gameOver;
    if (gameOver) this.play(GameAudioKey.GameOver, { variation: false });
    if (this.shared.controller === this) this.updateSharedMix(GameAudio.wallClockNow(), 0);
    this.publishDebugState();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off(Stage1SfxEvent, this.handleSfxEvent);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
    this.scene.game.events.off(GameAudioSettingsEvent, this.handleSettingsEvent);
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.handleAudioUnlocked);

    for (const loop of this.localLoops.values()) safeDestroySound(loop.sound);
    this.localLoops.clear();
    this.pendingOneShots.length = 0;

    for (const voice of Array.from(this.shared.oneShots)) {
      if (voice.owner !== this) continue;
      voice.cleanup();
      safeDestroySound(voice.sound);
    }

    if (this.shared.controller === this) this.shared.controller = undefined;
    this.publishDebugState();
  }

  private static getSharedState(manager: Phaser.Sound.BaseSoundManager): SharedAudioState {
    const existing = GameAudio.sharedByManager.get(manager);
    if (existing) return existing;

    const state: SharedAudioState = {
      manager,
      outputLimiter: GameAudio.installOutputLimiter(manager),
      profile: undefined,
      profileVoices: [],
      completedProfileKeys: new Set(),
      oneShots: new Set(),
      controller: undefined,
      masterVolume: 0.8,
      sfxVolume: 0.8,
      musicVolume: 0.8,
      combatMix: 0,
      duckGain: 1,
      duckDepth: 0,
      duckUntilMs: 0,
      paused: false,
      gameOver: false
    };
    GameAudio.sharedByManager.set(manager, state);
    manager.game.events.once(Phaser.Core.Events.DESTROY, () => {
      for (const voice of state.profileVoices) safeDestroySound(voice.sound);
      for (const voice of state.oneShots) safeDestroySound(voice.sound);
      state.profileVoices.length = 0;
      state.oneShots.clear();
      state.outputLimiter?.disconnect();
      GameAudio.sharedByManager.delete(manager);
    });
    return state;
  }

  private static wallClockNow(): number {
    return globalThis.performance?.now?.() ?? Date.now();
  }

  private static installOutputLimiter(manager: Phaser.Sound.BaseSoundManager): DynamicsCompressorNode | undefined {
    const webAudio = manager as Phaser.Sound.WebAudioSoundManager;
    if (!webAudio.context || !webAudio.masterVolumeNode) return undefined;

    const limiter = webAudio.context.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-6, webAudio.context.currentTime);
    limiter.knee.setValueAtTime(4, webAudio.context.currentTime);
    limiter.ratio.setValueAtTime(12, webAudio.context.currentTime);
    limiter.attack.setValueAtTime(0.003, webAudio.context.currentTime);
    limiter.release.setValueAtTime(0.18, webAudio.context.currentTime);

    try {
      webAudio.masterVolumeNode.disconnect();
      webAudio.masterVolumeNode.connect(limiter);
      limiter.connect(webAudio.context.destination);
      return limiter;
    } catch {
      try {
        limiter.disconnect();
        webAudio.masterVolumeNode.disconnect();
        webAudio.masterVolumeNode.connect(webAudio.context.destination);
      } catch {
        // HTML5/no-audio fallbacks and unusual host graphs keep Phaser's native path.
      }
      return undefined;
    }
  }

  private playResolved(key: GameAudioKey, options: Stage1SfxOptions, gapToken: string): boolean {
    const metadata = GameAudioMetadata[key];
    const channelVolume = metadata.category === 'music' ? this.shared.musicVolume : this.shared.sfxVolume;
    if (channelVolume <= 0 || !this.scene.cache.audio.exists(key)) return false;

    const now = this.now();
    const minGapMs = Math.max(0, options.minGapMs ?? metadata.minGapMs ?? 0);
    if (this.scene.sound.locked) {
      return this.queuePendingOneShot(key, options, gapToken, now, minGapMs);
    }
    const lastPlayedMs = this.lastPlayedMs.get(gapToken) ?? -Infinity;
    if (now - lastPlayedMs < minGapMs) return false;

    const spatial = this.getSpatialMix(options);
    if (spatial.attenuation <= EPSILON) return false;
    const priority = options.priority ?? metadata.priority ?? 2;
    if (!this.reserveOneShot(priority)) return false;

    const detuneVariance = Math.max(0, options.detuneVariance ?? 0);
    const detune = (options.detune ?? 0) + (detuneVariance > 0 ? Phaser.Math.FloatBetween(-detuneVariance, detuneVariance) : 0);
    const volume = clamp(channelVolume * metadata.volume * (options.volume ?? 1) * spatial.attenuation);
    let sound: ManagedSound;
    try {
      sound = asManagedSound(
        this.scene.sound.add(key, {
          volume,
          detune,
          rate: clamp(options.rate ?? 1, 0.25, 4),
          pan: spatial.pan,
          loop: false
        })
      );
    } catch {
      return false;
    }

    const voice: OneShotVoice = {
      key,
      sound,
      owner: this,
      priority,
      startedAt: now,
      cleanup: () => undefined
    } satisfies OneShotVoice;
    voice.cleanup = () => {
      this.shared.oneShots.delete(voice);
      if (!this.destroyed) this.publishDebugState();
    };
    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      voice.cleanup();
      safeDestroySound(sound);
    });
    sound.once(Phaser.Sound.Events.DESTROY, voice.cleanup);

    if (!sound.play()) {
      voice.cleanup();
      safeDestroySound(sound);
      return false;
    }

    this.shared.oneShots.add(voice);
    this.lastPlayedMs.set(gapToken, now);
    const authoredDuck = metadata.duckMusic ?? 0;
    const requestedDuck = options.duckMusic === true ? authoredDuck : options.duckMusic;
    const duckAmount = requestedDuck === false ? 0 : typeof requestedDuck === 'number' ? requestedDuck : authoredDuck;
    if (duckAmount > 0) this.triggerMusicDuck(duckAmount, GameAudio.wallClockNow());
    this.publishDebugState();
    return true;
  }

  private queuePendingOneShot(
    key: GameAudioKey,
    options: Stage1SfxOptions,
    gapToken: string,
    now: number,
    minGapMs: number
  ): boolean {
    const previous = [...this.pendingOneShots].reverse().find((item) => item.gapToken === gapToken);
    if (previous && now - previous.queuedAt < minGapMs) return false;
    if (this.pendingOneShots.length >= 8) this.pendingOneShots.shift();
    this.pendingOneShots.push({ key, options, gapToken, queuedAt: now });
    return true;
  }

  private flushPendingOneShots(): void {
    if (this.scene.sound.locked || this.pendingOneShots.length === 0) return;
    const now = this.now();
    const pending = this.pendingOneShots.splice(0);
    for (const request of pending) {
      if (now - request.queuedAt > 1_500) continue;
      this.playResolved(request.key, request.options, request.gapToken);
    }
  }

  private reserveOneShot(priority: number): boolean {
    if (this.shared.oneShots.size < MAX_ONE_SHOT_VOICES) return true;
    let candidate: OneShotVoice | undefined;
    for (const voice of this.shared.oneShots) {
      if (!candidate || voice.priority < candidate.priority || (voice.priority === candidate.priority && voice.startedAt < candidate.startedAt)) {
        candidate = voice;
      }
    }
    if (!candidate || candidate.priority > priority) return false;
    candidate.cleanup();
    safeDestroySound(candidate.sound);
    return true;
  }

  private stopOneShotsByKey(key: GameAudioKey): void {
    for (let index = this.pendingOneShots.length - 1; index >= 0; index -= 1) {
      if (this.pendingOneShots[index].key === key) this.pendingOneShots.splice(index, 1);
    }
    for (const voice of Array.from(this.shared.oneShots)) {
      if (voice.owner !== this || voice.key !== key) continue;
      voice.cleanup();
      safeDestroySound(voice.sound);
    }
  }

  private triggerMusicDuck(amount: number, now: number): void {
    const depth = clamp(amount, 0, 0.82);
    this.shared.duckDepth = Math.max(this.shared.duckDepth, depth);
    this.shared.duckUntilMs = Math.max(this.shared.duckUntilMs, now + 170 + depth * 340);
    this.shared.duckGain = Math.min(this.shared.duckGain, 1 - depth);
    this.renderSharedVolumes();
  }

  private getSpatialMix(options: Stage1SfxOptions): { attenuation: number; pan: number } {
    if (options.sourceX === undefined) {
      return { attenuation: 1, pan: clamp(options.pan ?? 0, -1, 1) };
    }
    const maxDistance = Math.max(1, options.maxDistance ?? DEFAULT_SPATIAL_DISTANCE);
    const resolved = resolveSpatialMix(options.sourceX, this.listenerX, maxDistance);
    const panDistance = Math.max(1, options.panDistance ?? Math.min(DEFAULT_PAN_DISTANCE, maxDistance));
    const spatialPan = options.panDistance === undefined
      ? resolved.pan
      : clamp((options.sourceX - this.listenerX) / panDistance, -1, 1) * 0.88;
    return {
      attenuation: resolved.attenuation,
      pan: clamp(spatialPan + (options.pan ?? 0), -1, 1)
    };
  }

  private findAutomaticGroup(key: GameAudioKey): GameAudioGroupKey | undefined {
    for (const [group, keys] of Object.entries(GameAudioGroups) as [GameAudioGroupKey, readonly GameAudioKey[]][]) {
      if (keys[0] === key && keys.length > 1) return group;
    }
    return undefined;
  }

  private selectVariation(group: GameAudioGroupKey, keys: readonly GameAudioKey[], mode: GameAudioVariationMode): GameAudioKey {
    if (keys.length === 1) return keys[0];
    let index: number;
    if (mode === 'cycle') {
      index = this.variationCursor.get(group) ?? 0;
      this.variationCursor.set(group, (index + 1) % keys.length);
    } else {
      const previous = this.lastVariationIndex.get(group) ?? -1;
      const offset = Phaser.Math.Between(1, keys.length - 1);
      index = previous < 0 ? Phaser.Math.Between(0, keys.length - 1) : (previous + offset) % keys.length;
    }
    this.lastVariationIndex.set(group, index);
    return keys[index];
  }

  private updateFootsteps(): void {
    const now = this.now();
    const speed = Math.abs(this.velocityX);
    const shouldStep = this.onGround === true && speed >= 52 && !this.wallSliding && !this.paused && !this.gameOver;
    if (!shouldStep || now < this.nextFootstepMs) return;

    const speedAmount = clamp((speed - 52) / 430);
    const intervalMs = resolveFootstepInterval(speed);
    this.nextFootstepMs = now + intervalMs;
    this.playGroup('footstep', {
      variation: 'cycle',
      volume: 0.72 + speedAmount * 0.34,
      detune: -18 + speedAmount * 34,
      detuneVariance: 16,
      minGapMs: Math.max(80, intervalMs * 0.65)
    });
  }

  private updateMovementLoops(deltaMs: number): void {
    const mutedByState = this.paused || this.gameOver;
    const wallSpeed = clamp((Math.max(0, this.velocityY) - 30) / 380);
    const wallTarget = !mutedByState && this.wallSliding ? 0.52 + wallSpeed * 0.48 : 0;
    const updraftTarget = !mutedByState && this.updraftActive ? 0.86 : 0;

    this.updateLocalLoop(GameAudioKey.WallSlideLoop, wallTarget, deltaMs, 70, 160, 0.9 + wallSpeed * 0.14);
    this.updateLocalLoop(GameAudioKey.UpdraftLoop, updraftTarget, deltaMs, 190, 420, 1);
  }

  private updateLocalLoop(
    key: GameAudioKey,
    targetGain: number,
    deltaMs: number,
    attackMs: number,
    releaseMs: number,
    rate: number
  ): void {
    let loop = this.localLoops.get(key);
    if (!loop && targetGain > EPSILON) loop = this.createLocalLoop(key);
    if (!loop) return;

    if (targetGain > EPSILON && loop.sound.isPaused) loop.sound.resume();
    loop.currentGain = smooth(loop.currentGain, targetGain, deltaMs, targetGain > loop.currentGain ? attackMs : releaseMs);
    loop.sound.setRate(rate);
    loop.active = targetGain > EPSILON;
    this.renderLocalLoopVolume(loop);
    if (!loop.active && loop.currentGain <= EPSILON && loop.sound.isPlaying) loop.sound.pause();
  }

  private createLocalLoop(key: GameAudioKey): LocalLoopVoice | undefined {
    if (this.scene.sound.locked || !this.scene.cache.audio.exists(key) || this.shared.sfxVolume <= 0) return undefined;
    const sound = asManagedSound(this.scene.sound.add(key, { loop: true, volume: 0 }));
    const loop: LocalLoopVoice = { key, sound, currentGain: 0, active: true };
    sound.once(Phaser.Sound.Events.DESTROY, () => this.localLoops.delete(key));
    if (!sound.play()) {
      safeDestroySound(sound);
      return undefined;
    }
    this.localLoops.set(key, loop);
    return loop;
  }

  private renderLocalLoopVolume(loop: LocalLoopVoice): void {
    if (loop.sound.pendingRemove) return;
    const metadata = GameAudioMetadata[loop.key];
    loop.sound.setVolume(clamp(this.shared.sfxVolume * metadata.volume * loop.currentGain));
  }

  private silenceLocalLoops(): void {
    for (const loop of this.localLoops.values()) {
      loop.currentGain = 0;
      loop.active = false;
      this.renderLocalLoopVolume(loop);
      if (loop.sound.isPlaying) loop.sound.pause();
    }
  }

  private createProfileVoices(profile: GameAudioProfileKey, initialGain: number): void {
    const definition = GameAudioProfiles[profile];
    const entries: [ProfileRole, GameAudioKey | undefined][] = [
      ['ambience', definition.ambience],
      ['musicBase', definition.musicBase],
      ['musicCombat', definition.musicCombat]
    ];

    // All stems are created first, then started from the same zero seek. Stage music
    // assets share an exact duration, so their loop boundaries remain phase aligned.
    const created: ProfileVoice[] = [];
    for (const [role, key] of entries) {
      if (!key || !this.scene.cache.audio.exists(key)) continue;
      const metadata = GameAudioMetadata[key];
      const sound = asManagedSound(this.scene.sound.add(key, { loop: metadata.loop ?? true, volume: 0 }));
      const voice: ProfileVoice = {
        key,
        profile,
        role,
        sound,
        looping: metadata.loop ?? true,
        currentGain: role === 'musicCombat' ? 0 : initialGain,
        outgoing: false,
        completed: false
      };
      sound.once(Phaser.Sound.Events.COMPLETE, () => {
        if (voice.looping) return;
        voice.completed = true;
        if (!voice.outgoing && this.shared.profile === profile) this.shared.completedProfileKeys.add(key);
        safeDestroySound(sound);
      });
      sound.once(Phaser.Sound.Events.DESTROY, () => {
        voice.completed = true;
      });
      created.push(voice);
    }

    if (!this.scene.sound.locked) {
      for (const voice of created) {
        if (!voice.sound.play({ seek: 0, loop: voice.looping, volume: 0 })) {
          voice.completed = true;
          safeDestroySound(voice.sound);
        }
      }
    }
    this.shared.profileVoices.push(...created.filter((voice) => !voice.completed));
  }

  private ensureProfileVoices(): void {
    const profile = this.shared.profile;
    if (!profile) return;
    const definition = GameAudioProfiles[profile];
    const required = [definition.ambience, definition.musicBase, definition.musicCombat].filter(
      (key): key is GameAudioKey => Boolean(key) && !this.shared.completedProfileKeys.has(key as GameAudioKey)
    );
    const activeKeys = new Set(
      this.shared.profileVoices
        .filter((voice) => !voice.outgoing && !voice.completed && !voice.sound.pendingRemove)
        .map((voice) => voice.key)
    );
    if (required.some((key) => !activeKeys.has(key))) this.createMissingProfileVoices(profile, activeKeys);
  }

  private createMissingProfileVoices(profile: GameAudioProfileKey, activeKeys: ReadonlySet<GameAudioKey>): void {
    const definition = GameAudioProfiles[profile];
    const missingDefinition = {
      ambience:
        definition.ambience &&
        !activeKeys.has(definition.ambience) &&
        !this.shared.completedProfileKeys.has(definition.ambience)
          ? definition.ambience
          : undefined,
      musicBase:
        definition.musicBase &&
        !activeKeys.has(definition.musicBase) &&
        !this.shared.completedProfileKeys.has(definition.musicBase)
          ? definition.musicBase
          : undefined,
      musicCombat:
        definition.musicCombat &&
        !activeKeys.has(definition.musicCombat) &&
        !this.shared.completedProfileKeys.has(definition.musicCombat)
          ? definition.musicCombat
          : undefined
    };
    if (!missingDefinition.ambience && !missingDefinition.musicBase && !missingDefinition.musicCombat) return;

    // Reuse the same creation path without mutating the exported profile table.
    const roleEntries = Object.entries(missingDefinition) as [ProfileRole, GameAudioKey | undefined][];
    const created: ProfileVoice[] = [];
    for (const [role, key] of roleEntries) {
      if (!key || !this.scene.cache.audio.exists(key)) continue;
      const metadata = GameAudioMetadata[key];
      const sound = asManagedSound(this.scene.sound.add(key, { loop: metadata.loop ?? true, volume: 0 }));
      const voice: ProfileVoice = {
        key,
        profile,
        role,
        sound,
        looping: metadata.loop ?? true,
        currentGain: 0,
        outgoing: false,
        completed: false
      };
      sound.once(Phaser.Sound.Events.COMPLETE, () => {
        if (voice.looping) return;
        voice.completed = true;
        if (!voice.outgoing && this.shared.profile === profile) this.shared.completedProfileKeys.add(key);
        safeDestroySound(sound);
      });
      sound.once(Phaser.Sound.Events.DESTROY, () => {
        voice.completed = true;
      });
      if (this.scene.sound.locked || sound.play({ seek: 0, loop: voice.looping, volume: 0 })) created.push(voice);
      else safeDestroySound(sound);
    }
    this.shared.profileVoices.push(...created);
  }

  private updateSharedMix(now: number, deltaMs: number): void {
    const duckTarget = now < this.shared.duckUntilMs ? 1 - this.shared.duckDepth : 1;
    this.shared.duckGain = smooth(
      this.shared.duckGain,
      duckTarget,
      deltaMs,
      duckTarget < this.shared.duckGain ? 28 : 520
    );
    if (duckTarget === 1 && this.shared.duckGain > 0.995) {
      this.shared.duckGain = 1;
      this.shared.duckDepth = 0;
    }

    const combat = clamp(this.shared.combatMix);
    const combatCurve = combat * combat * (3 - 2 * combat);
    for (const voice of this.shared.profileVoices) {
      if (voice.completed || voice.sound.pendingRemove) continue;
      let targetGain = 0;
      if (!voice.outgoing) {
        if (voice.role === 'ambience') targetGain = this.shared.gameOver ? 0.34 : this.shared.paused ? 0.58 : 1;
        if (voice.role === 'musicBase') targetGain = (1 - combatCurve * 0.2) * (this.shared.gameOver ? 0.16 : this.shared.paused ? 0.46 : 1);
        if (voice.role === 'musicCombat') targetGain = combatCurve * (this.shared.paused ? 0.36 : 1) * (this.shared.gameOver ? 0 : 1);
      }
      const attackMs = voice.outgoing ? 300 : voice.role === 'musicCombat' ? 210 : 420;
      const releaseMs = voice.outgoing ? 300 : voice.role === 'musicCombat' ? 680 : 520;
      voice.currentGain = smooth(
        voice.currentGain,
        targetGain,
        deltaMs,
        targetGain > voice.currentGain ? attackMs : releaseMs
      );
    }

    this.renderSharedVolumes();
    const retained: ProfileVoice[] = [];
    for (const voice of this.shared.profileVoices) {
      if (voice.completed || voice.sound.pendingRemove) continue;
      if (voice.outgoing && voice.currentGain <= EPSILON) {
        if (this.shared.manager.locked) {
          retained.push(voice);
          continue;
        }
        safeDestroySound(voice.sound);
        continue;
      }
      retained.push(voice);
    }
    this.shared.profileVoices = retained;
  }

  private renderSharedVolumes(): void {
    if (this.shared.manager.locked) return;
    for (const voice of this.shared.profileVoices) {
      if (voice.completed || voice.sound.pendingRemove) continue;
      const metadata = GameAudioMetadata[voice.key];
      const channelVolume = metadata.category === 'music' ? this.shared.musicVolume : this.shared.sfxVolume;
      const duckGain = metadata.category === 'music' ? this.shared.duckGain : 1;
      voice.sound.setVolume(clamp(channelVolume * metadata.volume * voice.currentGain * duckGain));
    }
  }

  private resumeProfileAfterUnlock(): void {
    if (this.scene.sound.locked || !this.shared.profile) return;
    for (const voice of this.shared.profileVoices) {
      if (voice.outgoing || voice.completed || voice.sound.pendingRemove) continue;
      if (voice.sound.isPaused) {
        voice.sound.resume();
        continue;
      }
      if (voice.sound.isPlaying) continue;
      if (!voice.sound.play({ seek: 0, loop: voice.looping, volume: 0 })) {
        voice.completed = true;
        safeDestroySound(voice.sound);
      }
    }
    this.shared.profileVoices = this.shared.profileVoices.filter(
      (voice) => !voice.completed && !voice.sound.pendingRemove
    );
    this.ensureProfileVoices();
    this.renderSharedVolumes();
  }

  private publishDebugState(): void {
    const controller = this.shared.controller;
    const activeLoopKeys = new Set<GameAudioKey>();
    for (const voice of this.shared.profileVoices) {
      if (!voice.outgoing && !voice.completed && !voice.sound.pendingRemove && voice.sound.isPlaying) {
        activeLoopKeys.add(voice.key);
      }
    }
    if (controller) {
      for (const loop of controller.localLoops.values()) {
        if (!loop.sound.pendingRemove && loop.sound.isPlaying && loop.currentGain > EPSILON) activeLoopKeys.add(loop.key);
      }
    }

    const target = globalThis as typeof globalThis & {
      __NEON_RONIN_AUDIO__?: {
        profile?: GameAudioProfileKey;
        locked: boolean;
        unlocked: boolean;
        activeLoopKeys: readonly GameAudioKey[];
        activeVoices: number;
        limiterActive: boolean;
        bossIntensity: number;
        paused: boolean;
        musicDuck: number;
      };
    };
    target.__NEON_RONIN_AUDIO__ = {
      profile: this.shared.profile,
      locked: this.shared.manager.locked,
      unlocked: !this.shared.manager.locked,
      activeLoopKeys: Array.from(activeLoopKeys),
      activeVoices: this.shared.oneShots.size,
      limiterActive: Boolean(this.shared.outputLimiter),
      bossIntensity: controller?.bossIntensity ?? 0,
      paused: this.shared.paused,
      musicDuck: clamp(1 - this.shared.duckGain)
    };
  }

  private now(): number {
    return Number.isFinite(this.scene.time.now) ? this.scene.time.now : 0;
  }
}

// Existing imports keep working while new code can use the product-level name.
export { GameAudio as Stage1Audio };
