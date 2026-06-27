import { expect, test, type Page } from '@playwright/test';

type StageState = {
  scene?: string;
  stageClear?: boolean;
  player?: { x: number; y: number; slashing: boolean; damageTaken?: number };
  checkpointCount?: number;
  wardenDefeated?: boolean;
  touch?: { visible: boolean };
  e2eIntegrity?: { debugTeleport: boolean; hiddenClearStageCall: boolean };
};

const state = async (page: Page): Promise<StageState> => page.evaluate(() => window.__NEON_RONIN_STAGE1__ ?? {});
const menuState = async (page: Page): Promise<{ scene?: string }> => page.evaluate(() => window.__NEON_RONIN_STAGE1_MENU__ ?? {});

const waitForStage1 = async (page: Page) => {
  await expect.poll(async () => (await state(page)).scene).toBe('Stage1Scene');
};

const startStage1 = async (page: Page) => {
  await page.goto('/');
  await expect.poll(async () => (await menuState(page)).scene).toBe('TitleScene');
  await page.keyboard.press('Enter');
  await waitForStage1(page);
};

const jump = async (page: Page, holdMs = 95) => {
  await page.keyboard.down('Space');
  await page.waitForTimeout(holdMs);
  await page.keyboard.up('Space');
};

const slash = async (page: Page) => {
  await page.keyboard.press('J');
};

const gamePoint = async (page: Page, x: number, y: number) => {
  const rect = await page.locator('canvas').boundingBox();
  if (!rect) throw new Error('Canvas not found');
  return {
    x: rect.x + (x / 960) * rect.width,
    y: rect.y + (y / 540) * rect.height
  };
};

const runKeyboardRouteToClear = async (page: Page) => {
  const started = Date.now();
  let rightDown = false;
  let lastJump = 0;
  let lastSlash = 0;

  const setRight = async (down: boolean) => {
    rightDown = down;
    if (down) await page.keyboard.down('ArrowRight');
    else await page.keyboard.up('ArrowRight');
  };

  await setRight(true);
  while (Date.now() - started < 115_000) {
    const current = await state(page);
    if (current.scene === 'StageClearScene' || current.stageClear) {
      await setRight(false);
      return current;
    }
    const player = current.player;
    if (!player) {
      await page.waitForTimeout(50);
      continue;
    }

    if (player.x >= 5580 && !current.wardenDefeated) {
      await setRight(false);
    } else {
      await setRight(true);
    }

    const now = Date.now();
    const jumpZones = [
      player.x > 1120 && player.x < 1700 && player.y > 280,
      player.x > 2040 && player.x < 2305,
      player.x > 4080 && player.x < 4385,
      player.x > 4440 && player.x < 4760,
      player.x > 4760 && player.x < 4895
    ];
    if (jumpZones.some(Boolean) && now - lastJump > 360) {
      lastJump = now;
      await jump(page, player.x > 1120 && player.x < 1700 ? 145 : player.x > 4000 ? 180 : 110);
    }

    const attackZones = [
      player.x > 760 && player.x < 1060,
      player.x > 1880 && player.x < 2180,
      player.x > 2820 && player.x < 3060,
      player.x > 4300 && player.x < 4840,
      player.x > 5520 && !current.wardenDefeated
    ];
    if (attackZones.some(Boolean) && now - lastSlash > 300) {
      lastSlash = now;
      await slash(page);
    }

    await page.waitForTimeout(50);
  }

  await setRight(false);
  throw new Error(`Stage1 keyboard route timed out at ${JSON.stringify(await state(page))}`);
};

test.describe('Stage1 playable vertical slice', () => {
  test('title-flow', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto('/');
    await expect.poll(async () => (await menuState(page)).scene).toBe('TitleScene');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await menuState(page)).scene).toBe('ControlsScene');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await menuState(page)).scene).toBe('SettingsScene');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await waitForStage1(page);
    expect(consoleErrors).toEqual([]);
  });

  test('stage1-keyboard-clear', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await startStage1(page);
    const result = await runKeyboardRouteToClear(page);
    expect(result.scene).toBe('StageClearScene');
    expect(result.e2eIntegrity?.debugTeleport).not.toBe(true);
    expect(result.e2eIntegrity?.hiddenClearStageCall).not.toBe(true);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile-controls', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await startStage1(page);
    await expect.poll(async () => (await state(page)).touch?.visible).toBe(true);
    const before = (await state(page)).player;
    expect(before).toBeTruthy();

    const left = await gamePoint(page, 80, 452);
    await page.mouse.move(left.x, left.y);
    await page.mouse.down();
    await page.waitForTimeout(220);
    await page.mouse.up();
    const afterLeft = (await state(page)).player;
    expect(afterLeft?.x).toBeLessThan(before!.x + 2);

    const jumpButton = await gamePoint(page, 748, 454);
    await page.mouse.move(jumpButton.x, jumpButton.y);
    await page.mouse.down();
    await page.waitForTimeout(180);
    await page.mouse.up();
    const afterJump = (await state(page)).player;
    expect(afterJump?.y).toBeLessThan(afterLeft!.y);

    const attackButton = await gamePoint(page, 866, 426);
    await page.mouse.move(attackButton.x, attackButton.y);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
    await expect.poll(async () => (await state(page)).player?.slashing).toBe(true);
    expect(consoleErrors).toEqual([]);
  });

  test('checkpoint-retry', async ({ page }) => {
    await startStage1(page);
    await page.keyboard.down('ArrowRight');
    let lastJump = 0;
    for (let i = 0; i < 1000; i += 1) {
      const current = await state(page);
      const player = current.player;
      if (player && player.x > 3600 && current.checkpointCount && current.checkpointCount >= 3) break;
      if (player && player.x > 1120 && player.x < 1700 && player.y > 280 && Date.now() - lastJump > 360) {
        lastJump = Date.now();
        await jump(page, 145);
      }
      if (player && player.x > 2040 && player.x < 2305 && Date.now() - lastJump > 360) {
        lastJump = Date.now();
        await jump(page, 80);
      }
      await page.waitForTimeout(50);
    }
    const checkpointState = await state(page);
    expect(checkpointState.checkpointCount).toBeGreaterThanOrEqual(3);

    const damageBefore = checkpointState.player?.damageTaken ?? 0;
    for (let i = 0; i < 420; i += 1) {
      const current = await state(page);
      const player = current.player;
      if ((player?.damageTaken ?? 0) > damageBefore || (player?.x ?? 0) > 4350) break;
      await page.waitForTimeout(50);
    }
    await page.keyboard.up('ArrowRight');
    expect((await state(page)).player?.damageTaken).toBeGreaterThan(damageBefore);
    await page.keyboard.press('p');
    await page.keyboard.press('r');
    await expect.poll(async () => (await state(page)).player?.x).toBeGreaterThan(3440);
    expect((await state(page)).player?.x).toBeLessThan(3610);
  });
});
