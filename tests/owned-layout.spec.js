import { expect, test } from '@playwright/test';

function ownedLayoutSave() {
  const assetsOwned = Array.from({ length: 21 }, (_, id) => ({ id, owned: 0, assetUpgradesOwned: [] }));
  assetsOwned[4].owned = 1;
  assetsOwned[10].owned = 100;
  return {
    assetsOwned,
    collabsOwned: [5, 8, 61],
    collabsEquipped: [],
    unlocksOwned: [
      { id: 15, purchased: true, owned: 1 },
      { id: 16, purchased: true, owned: 1 }
    ],
    collabPower: 1,
    rebirthCount: 1,
    happinessPercentage: 0,
    negativeHapppinessTrollPercentage: 0,
    minimumHappinessPercentage: -100,
    holoscopePower: 0,
    stars: []
  };
}

function fallbackLayoutSave() {
  const save = ownedLayoutSave();
  save.collabsOwned = [8]; // Danin: Coffee and Shrine, but not Talent Agency.
  return save;
}

test('owned layout search respects unlocked slots and tier cap while maximizing total added IpS', async ({ page }) => {
  await page.goto('/');
  await page.locator('#save-file').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(ownedLayoutSave()))
  });

  await expect(page.locator('#optimize-owned')).toBeEnabled();
  await page.locator('#optimize-owned').click();
  await expect(page.locator('#owned-search-status')).toContainText('Objective: total added IpS across all owned assets.');

  const slots = await page.locator('.slot.filled').evaluateAll(elements => elements.map(element => Number(element.dataset.slot)));
  expect(slots.length).toBeGreaterThan(0);
  expect(slots.every(slot => [0, 1, 4, 5].includes(slot))).toBeTruthy();
  const tiers = await page.locator('.slot.filled .card-tier').allTextContents();
  expect(tiers.every(tier => tier.trim() === 'TIER I')).toBeTruthy();
  await expect(page.locator('.slot.filled .card-name')).toContainText('Boxing Gloves');
  await expect(page.locator('[data-asset-name="Talent Agency"]')).toContainText('Cards +330 million');
});

test('navigation and board fit a narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.page-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('.page-nav').evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(366);
});

test('owned layout search falls back when no card improves the selected asset', async ({ page }) => {
  await page.goto('/');
  await page.locator('#save-file').setInputFiles({
    name: 'fallback-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fallbackLayoutSave()))
  });

  await page.locator('#owned-target-asset').selectOption({ label: 'Talent Agency' });
  await page.locator('#optimize-owned').click();
  await expect(page.locator('#owned-search-status')).toContainText('best overall positive layout');
  await expect(page.locator('.slot.filled .card-name')).toContainText('Danin');
});
