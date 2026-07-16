import { expect, test, type Page } from '@playwright/test';

type MenuState = {
  readonly scene?: string;
  readonly selectedIndex?: number;
  readonly items?: readonly string[];
};

type StageState = {
  readonly scene?: string;
  readonly player?: { readonly x: number };
};

const menuState = async (page: Page): Promise<MenuState> =>
  page.evaluate(() => window.__NEON_RONIN_STAGE1_MENU__ ?? {});

const stageState = async (page: Page): Promise<StageState> =>
  page.evaluate(() => window.__NEON_RONIN_STAGE1__ ?? {});

const waitForMenuScene = async (page: Page, scene: string, timeout = 20_000): Promise<void> => {
  await expect.poll(async () => (await menuState(page)).scene, { timeout }).toBe(scene);
};

const selectTitleMenuItem = async (page: Page, label: string): Promise<void> => {
  await waitForMenuScene(page, 'TitleScene');
  const current = await menuState(page);
  const items = current.items ?? [];
  const targetIndex = items.indexOf(label);
  expect(targetIndex, `Title menu item not found: ${label}`).toBeGreaterThanOrEqual(0);

  const selectedIndex = current.selectedIndex ?? 0;
  const forwardSteps = (targetIndex - selectedIndex + items.length) % items.length;
  const backwardSteps = (selectedIndex - targetIndex + items.length) % items.length;
  const direction = forwardSteps <= backwardSteps ? 1 : -1;
  const key = direction === 1 ? 'ArrowDown' : 'ArrowUp';
  const stepCount = Math.min(forwardSteps, backwardSteps);

  for (let step = 1; step <= stepCount; step += 1) {
    const expectedIndex = (selectedIndex + direction * step + items.length) % items.length;
    await page.keyboard.press(key);
    await expect.poll(async () => (await menuState(page)).selectedIndex).toBe(expectedIndex);
  }

  await page.keyboard.press('Enter');
};

test('@smoke title-flow', async ({ page }) => {
  test.setTimeout(90_000);
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));

  await page.goto('/');
  await waitForMenuScene(page, 'TitleScene', 60_000);

  await selectTitleMenuItem(page, 'CONTROLS');
  await waitForMenuScene(page, 'ControlsScene');
  await page.keyboard.press('Escape');
  await waitForMenuScene(page, 'TitleScene');

  await selectTitleMenuItem(page, 'SETTINGS');
  await waitForMenuScene(page, 'SettingsScene');
  await page.keyboard.press('Escape');
  await waitForMenuScene(page, 'TitleScene');

  await selectTitleMenuItem(page, 'START STAGE 1');
  await expect.poll(async () => (await stageState(page)).scene, { timeout: 20_000 }).toBe('Stage1Scene');
  const startX = (await stageState(page)).player?.x;
  expect(startX, 'Player state was not published after Stage 1 started').toBeDefined();

  await page.locator('canvas').click();
  await page.keyboard.down('ArrowRight');
  try {
    await expect
      .poll(async () => (await stageState(page)).player?.x ?? Number.NEGATIVE_INFINITY, { timeout: 8_000 })
      .toBeGreaterThan(startX! + 12);
  } finally {
    await page.keyboard.up('ArrowRight');
  }

  expect(runtimeErrors, 'Browser console/page errors').toEqual([]);
});
