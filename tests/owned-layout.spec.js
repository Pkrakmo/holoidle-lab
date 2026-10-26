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

function eightSlotLayoutSave() {
  const save = ownedLayoutSave();
  save.assetsOwned.forEach(asset => { asset.owned = 1; });
  // Eight distinct Tier I cards with no directional links. Save card IDs are
  // one-based while the catalog IDs used by the board are zero-based.
  save.collabsOwned = [5, 8, 9, 12, 13, 16, 18, 19];
  save.unlocksOwned = [15, 16, 17, 18].map(id => ({ id, purchased: true, owned: 1 }));
  return save;
}

function secondaryAssetSave() {
  const assetsOwned = Array.from({ length: 21 }, (_, id) => ({ id, owned: 0, assetUpgradesOwned: [] }));
  assetsOwned[2].owned = 23; // Artist, the source for Bau Bau.
  assetsOwned[4].owned = 11; // Coffee, the source for Smol Raora.
  assetsOwned[18].owned = 1; // Space Colony, Bau Bau's target.
  return {
    assetsOwned,
    collabsOwned: [95], // Bau Bau is CSV ID 94, while saves are one-based.
    collabsEquipped: [{ collabID: 95, slotIndex: 0 }],
    unlocksOwned: [],
    collabPower: 1,
    rebirthCount: 1,
    happinessPercentage: 0,
    negativeHapppinessTrollPercentage: 0,
    minimumHappinessPercentage: -100,
    holoscopePower: 0,
    stars: []
  };
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

test('owned layout search fills every unlocked slot when enough eligible cards are available', async ({ page }) => {
  await page.goto('/');
  await page.locator('#save-file').setInputFiles({
    name: 'eight-slots.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(eightSlotLayoutSave()))
  });

  await page.locator('#optimize-owned').click();
  await expect(page.locator('#owned-search-status')).toContainText('Filled all 8 unlocked slots.');

  const slots = await page.locator('.slot.filled').evaluateAll(elements => elements.map(element => Number(element.dataset.slot)).sort((a, b) => a - b));
  expect(slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  const cards = await page.locator('.slot.filled .card-id').allTextContents();
  expect(new Set(cards).size).toBe(8);
});

test('secondary-asset cards show imported group-of-ten bonuses in the collection and on the board', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-card="94"] .secondary-asset-calculation')).toHaveCount(0);
  await page.locator('#save-file').setInputFiles({
    name: 'secondary-assets.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(secondaryAssetSave()))
  });

  const bauBauCalculation = 'Artist: 23 owned → 2 × +150% = +300% Space Colony';
  await expect(page.locator('[data-card="94"] .secondary-asset-calculation')).toHaveText(bauBauCalculation);
  await expect(page.locator('.slot.filled .secondary-asset-calculation')).toHaveText(bauBauCalculation);
  await expect(page.locator('[data-card="108"] .secondary-asset-calculation')).toHaveText('Coffee: 11 owned → 1 × +60% = +60% Chain');
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
