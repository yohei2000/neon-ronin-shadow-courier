import * as Phaser from 'phaser';
import './styles.css';
import { gameConfig } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

(window as Window & { __NEON_RONIN_GAME__?: Phaser.Game }).__NEON_RONIN_GAME__ = game;
