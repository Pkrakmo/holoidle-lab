const CARD_FILE = `${import.meta.env.BASE_URL}CollabCards.txt`;
const STORAGE_KEY = 'holoidle-bonus-card-board-v1';
const DIRECTIONS = {
  Top: '↑', Bottom: '↓', Left: '←', Right: '→',
  DiagonalTopLeft: '↖', DiagonalTopRight: '↗',
  DiagonalBottomLeft: '↙', DiagonalBottomRight: '↘'
};
const DIRECTION_ORDER = ['Top', 'Bottom', 'Left', 'Right', 'DiagonalTopLeft', 'DiagonalTopRight', 'DiagonalBottomLeft', 'DiagonalBottomRight'];
const DIRECTION_LABELS = { Top: 'Up', Bottom: 'Down', Left: 'Left', Right: 'Right', DiagonalTopLeft: 'Up left', DiagonalTopRight: 'Up right', DiagonalBottomLeft: 'Down left', DiagonalBottomRight: 'Down right' };
const tierNames = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const ASSET_DATA = [
  ['Fans', 0.1], ['Prime Fans', 1], ['Artist', 10], ['Shrine', 50], ['Coffee', 300], ['Karaoke', 1500],
  ['Chain', 7500], ['Trading', 40000], ['Concert', 250000], ['Gacha', 1.5e6], ['Talent Agency', 11e6],
  ['Museum', 65e6], ['Theme Park', 405e6], ['Resort', 2.5e9], ['Temple', 21e9], ['Royal Palace', 145e9],
  ['Ministry', 1e12], ['Research Institute', 9e12], ['Space Colony', 75e12], ['Multiverse', 505e12], ['Yagoo', 10.1973e15]
].map(([name, baseIpS], id) => ({ id, name, baseIpS }));
// Card data uses game-facing labels while the dashboard uses shorter names.
const ASSET_NAME_TRANSLATIONS = new Map([
  ['Fan', 'Fans'], ['Prime Fan', 'Prime Fans'], ['Idol Shrine', 'Shrine'], ['Karaoke Bar', 'Karaoke'],
  ['Chain Restaurant', 'Chain'], ['Trading Agency', 'Trading'], ['Concert Venue', 'Concert'],
  ['Gacha Casino', 'Gacha'], ['Themed Cafe', 'Coffee'], ['Talent Academy', 'Talent Agency'],
  ['Holo Museum', 'Museum'], ['Luxury Resort', 'Resort'], ['Idol Temple', 'Temple'],
  ['Governmental Ministry', 'Ministry'], ['Governamental Ministry', 'Ministry'],
  ['Research Facility', 'Research Institute'], ['Multiverse Device', 'Multiverse'],
  ['Statue of a Dreamer', 'Yagoo']
]);
const ASSET_NAMES = new Set(ASSET_DATA.map(asset => asset.name));
function canonicalAssetName(name) {
  const label = String(name ?? '').trim();
  const translated = ASSET_NAME_TRANSLATIONS.get(label) || label;
  return ASSET_NAMES.has(translated) ? translated : null;
}
function affectedAssetNames(card) {
  return [...new Set([card.PrimaryAsset1, card.PrimaryAsset2, card.PrimaryAsset3]
    .map(canonicalAssetName).filter(Boolean))];
}
function affectedAssetLine(card) {
  const names = affectedAssetNames(card);
  return names.length ? `<span class="card-assets">Assets: ${safe(names.join(' · '))}</span>` : '';
}
const PRIME_UPGRADE_TARGETS = new Map([[18, 2], [19, 3], [20, 4], [23, 5], [25, 6], [26, 7], [28, 8], [29, 9], [31, 10], [32, 11], [33, 12], [35, 13], [36, 14], [37, 15], [39, 16], [41, 17], [42, 18], [44, 19], [45, 20]]);
const FAN_UPGRADE_PER_ASSET = new Map([[3, 0.1], [4, 0.5], [5, 5], [6, 100], [7, 2000], [8, 40000], [9, 800000], [10, 16000000], [11, 320000000], [12, 6400000000], [13, 128000000000], [14, 2560000000000]]);
const board = document.querySelector('#board');
const collection = document.querySelector('#collection');
const search = document.querySelector('#search');
const hint = document.querySelector('#board-hint');
const saveFileInput = document.querySelector('#save-file');
const importStatus = document.querySelector('#import-status');
const copyPathStatus = document.querySelector('#copy-path-status');
const assetDashboardRows = document.querySelector('#asset-dashboard-rows');
const assetDashboardTotal = document.querySelector('#asset-dashboard-total');
const assetDashboardNote = document.querySelector('#asset-dashboard-note');
const assetDashboardCompare = document.querySelector('#asset-dashboard-compare');
const ownedFilter = document.querySelector('#owned-filter');
const unownedFilter = document.querySelector('#unowned-filter');
const ownershipNote = document.querySelector('#ownership-note');
const pageViews = new Map([...document.querySelectorAll('[data-page-view]')].map(view => [view.dataset.pageView, view]));
const pageButtons = [...document.querySelectorAll('.page-tab[data-page]')];
function setActivePage(page) {
  if (!pageViews.has(page)) return;
  document.querySelectorAll('.page-tab').forEach(tab => {
    const active = tab.dataset.page === page;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  pageViews.forEach((view, name) => {
    const active = name === page;
    view.hidden = !active;
    view.classList.toggle('active', active);
  });
}
pageButtons.forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const page = link.dataset.page;
  setActivePage(page);
  if (location.hash !== `#${page}`) history.pushState(null, '', `#${page}`);
}));
window.addEventListener('popstate', () => setActivePage(location.hash.slice(1) || 'planner'));
window.addEventListener('hashchange', () => setActivePage(location.hash.slice(1) || 'planner'));
setActivePage(location.hash.slice(1) || 'planner');
let cards = [];
let selectedId = null;
let activeTier = 'all';
let activeDirection = 'all';
let placements = loadPlacements();
let foilIds = new Set(loadFoils());
let importedSave = null;
let pendingSave = null;
let ownedCardCounts = new Map();
let hasOwnedCardData = false;
let ownershipFilter = 'all';
let affectedAssetsNow = new Set();
updateAffectedAssets(affectedAssetsNow);

function loadPlacements() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const parsed = Array.isArray(saved) ? saved : saved.placements;
    return Array.isArray(parsed) ? Array.from({ length: 8 }, (_, i) => Number.isInteger(parsed[i]) ? parsed[i] : null) : Array(8).fill(null);
  } catch { return Array(8).fill(null); }
}

function loadFoils() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) || !Array.isArray(saved.foilIds) ? [] : saved.foilIds.filter(Number.isInteger);
  } catch { return []; }
}

function parseCsvLine(line) {
  const cells = [];
  let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell);
  return cells;
}

function fromCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const fields = parseCsvLine(lines.shift());
  return lines.map(line => Object.fromEntries(parseCsvLine(line).map((value, i) => [fields[i], value])))
    .map(card => ({ ...card, ID: Number(card.ID), Tier: Number(card.Tier) }));
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function formatLargeNumber(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const suffixes = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion'];
  let scaled = Math.abs(value);
  let suffixIndex = 0;
  while (scaled >= 1000 && suffixIndex < suffixes.length - 1) { scaled /= 1000; suffixIndex++; }
  const rounded = Number(scaled.toFixed(3)).toString();
  const sign = value < 0 ? '−' : '';
  return suffixIndex ? `${sign}${rounded} ${suffixes[suffixIndex]}` : `${sign}${rounded}`;
}

function renderAssetDashboard(save = importedSave) {
  if (!save || !Array.isArray(save.assetsOwned)) {
    assetDashboardTotal.textContent = save ? 'NO ASSET DATA' : 'WAITING FOR SAVE';
    assetDashboardRows.innerHTML = '';
    assetDashboardNote.textContent = save ? 'This save does not contain an assetsOwned list.' : 'Load a save file to see owned assets, purchased upgrades, and calculated contribution.';
    assetDashboardCompare.hidden = true;
    return;
  }

  const warnings = [];
  if (save.assetsOwned.length !== ASSET_DATA.length) warnings.push(`Expected ${ASSET_DATA.length} asset records; found ${save.assetsOwned.length}.`);
  const owned = ASSET_DATA.map((asset, index) => {
    const record = save.assetsOwned[index] || {};
    if (record.id != null && Number(record.id) !== index) warnings.push(`${asset.name} record ID ${record.id} is in list position ${index}.`);
    const upgradeIds = Array.isArray(record.assetUpgradesOwned) ? record.assetUpgradesOwned.map(Number).filter(Number.isInteger) : [];
    const rangeStart = index === 0 ? 0 : index === 1 ? 15 : 50 + (index - 2) * 15;
    const rangeEnd = index === 0 ? 14 : index === 1 ? 49 : rangeStart + 14;
    const validUpgrades = [...new Set(upgradeIds.filter(id => id >= rangeStart && id <= rangeEnd))];
    const invalidCount = upgradeIds.filter(id => id < rangeStart || id > rangeEnd).length;
    if (invalidCount) warnings.push(`${asset.name} has ${invalidCount} upgrade ID(s) outside ${rangeStart}–${rangeEnd}.`);
    return { ...asset, count: Math.max(0, Number(record.owned) || 0), upgradeIds: validUpgrades, rangeStart, rangeEnd };
  });

  const nonFanCount = owned.slice(1).reduce((sum, asset) => sum + asset.count, 0);
  const primeFans = owned[1].count;
  const rebirthScale = Math.pow(Math.max(1, Number(save.rebirthCount) || 1), 1.5);
  const holoscopePower = Math.max(0, Number(save.holoscopePower) || 0);
  const stars = new Map((Array.isArray(save.stars) ? save.stars : []).map(star => [star.id, Number(star.rank) || 0]));
  const happinessRaw = (Number(save.happinessPercentage) || 0) - (Number(save.negativeHapppinessTrollPercentage) || 0);
  const minimumHappiness = Number.isFinite(Number(save.minimumHappinessPercentage)) ? Number(save.minimumHappinessPercentage) : -100;
  const happiness = Math.max(minimumHappiness, Math.min(100, happinessRaw));
  const happinessScale = 1 + happiness / 100;
  const primeTargets = new Set([...owned[1].upgradeIds].filter(id => PRIME_UPGRADE_TARGETS.has(id)).map(id => PRIME_UPGRADE_TARGETS.get(id)));
  let total = 0;

  const rows = owned.map(asset => {
    const purchased = new Set(asset.upgradeIds);
    const doubles = asset.id === 0
      ? [0, 1, 2].filter(id => purchased.has(id)).length
      : asset.id === 1 ? purchased.size : purchased.size;
    const upgradedBase = asset.baseIpS * Math.pow(2, doubles);
    let upgradeIps = 0;
    if (asset.id === 0) {
      const lastFanUpgrade = [...FAN_UPGRADE_PER_ASSET.keys()].filter(id => purchased.has(id)).sort((a, b) => b - a)[0];
      if (lastFanUpgrade !== undefined) upgradeIps = FAN_UPGRADE_PER_ASSET.get(lastFanUpgrade) * nonFanCount;
    } else if (primeTargets.has(asset.id)) {
      upgradeIps = upgradedBase * 0.01 * primeFans;
    }
    const rawAssetRank = stars.get(`star_asset_${asset.id}`) || 0;
    const activeRank = Math.floor(rawAssetRank * holoscopePower / 100);
    const holoscopeScale = holoscopePower > 0 && rawAssetRank > 0 ? Math.pow(2, activeRank) : 1;
    const beforeOwned = (upgradedBase + upgradeIps) * holoscopeScale;
    const contribution = beforeOwned * rebirthScale * asset.count * happinessScale;
    total += contribution;
    const upgradeTotal = asset.rangeEnd - asset.rangeStart + 1;
    return `<tr data-asset-name="${safe(asset.name)}"><td>${safe(asset.name)}${activeRank ? `<small class="asset-subline">Holoscope ×${formatLargeNumber(holoscopeScale)}</small>` : ''}</td><td>${asset.count.toLocaleString()}</td><td title="Purchased global upgrade IDs: ${asset.upgradeIds.join(', ') || 'none'}">${asset.upgradeIds.length} / ${upgradeTotal}</td><td>${formatLargeNumber(contribution)}</td></tr>`;
  }).join('');

  assetDashboardRows.innerHTML = `${rows}<tr class="asset-total-row"><td colspan="3">Calculated sum (includes happiness)</td><td>${formatLargeNumber(total)}</td></tr>`;
  updateAffectedAssets(affectedAssetsNow);
  assetDashboardTotal.textContent = `${formatLargeNumber(total)} ESTIMATED IpS`;
  assetDashboardNote.textContent = `Base asset income with purchased upgrades, Prime Fan boosts, rebirth scaling, asset Holoscope stars, and saved happiness (${happiness.toFixed(1)}%). Excludes collab-card asset bonuses, daily-mission multipliers, and Overdrive.`;
  const savedIps = Number(save.influencePerSecond);
  assetDashboardCompare.hidden = !Number.isFinite(savedIps);
  if (Number.isFinite(savedIps)) {
    const difference = savedIps - total;
    assetDashboardCompare.classList.toggle('warning', warnings.length > 0 || Math.abs(difference) > Math.max(1, Math.abs(savedIps) * 0.01));
    assetDashboardCompare.innerHTML = `<span>Save IpS <strong>${formatLargeNumber(savedIps)}</strong> · dashboard estimate <strong>${formatLargeNumber(total)}</strong></span><span>Difference <strong>${formatLargeNumber(difference)}</strong></span>`;
  }
  if (warnings.length) assetDashboardNote.textContent += ` Import warnings: ${warnings.join(' ')}`;
}

function groups(card) {
  return [card.CollabGroup1, card.CollabGroup2, card.CollabGroup3].filter(value => value && value !== 'None');
}

function operate(value, operation, amount) {
  if (operation === 'Add') return value + amount;
  if (operation === 'Subtract') return value - amount;
  if (operation === 'Multiply') return value * amount;
  if (operation === 'Divide') return amount === 0 ? value : value / amount;
  return value;
}

function targetIndex(index, direction) {
  const offsets = { Top: [-1, 0], Bottom: [1, 0], Left: [0, -1], Right: [0, 1], DiagonalTopLeft: [-1, -1], DiagonalTopRight: [-1, 1], DiagonalBottomLeft: [1, -1], DiagonalBottomRight: [1, 1] };
  const offset = offsets[direction];
  if (!offset) return -1;
  const row = Math.floor(index / 4) + offset[0], column = index % 4 + offset[1];
  return row < 0 || row > 1 || column < 0 || column > 3 ? -1 : row * 4 + column;
}

function calculateBoardEffects() {
  const baseState = id => {
    const card = cards.find(item => item.ID === id);
    const multiplier = foilIds.has(id) ? 2 : 1;
    return { regular: Number(card.Value) * 3 * multiplier, conditional: Number(card.ConditionalValue) * 3 * multiplier };
  };
  const close = (a, b) => Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b));
  const sameStates = (a, b) => [...a.keys()].every(id => b.has(id) && close(a.get(id).regular, b.get(id).regular) && close(a.get(id).conditional, b.get(id).conditional));
  let previous = new Map(placements.filter(id => id !== null).map(id => [id, baseState(id)]));

  // Holoidle runs this ordered calculation every frame. Later-slot sources
  // have their prior-frame values available, so chains settle over passes.
  for (let pass = 0; pass < 16; pass++) {
    const current = new Map();
    placements.forEach((targetId, targetIndex) => {
      if (targetId === null) return;
      const target = cards.find(item => item.ID === targetId);
      if (!target) return;
      const state = baseState(targetId);
      const sources = placements.map((sourceId, sourceIndex) => ({ sourceId, sourceIndex }))
        .filter(({ sourceId, sourceIndex }) => sourceId !== null && sourceIndex !== targetIndex && targetIndexFor(sourceIndex, targetIndex))
        .sort((a, b) => a.sourceIndex - b.sourceIndex);

      for (const { sourceId, sourceIndex } of sources) {
        const source = cards.find(item => item.ID === sourceId);
        const sourceState = (sourceIndex < targetIndex ? current : previous).get(sourceId) || baseState(sourceId);
        const conditionGroups = [source.ConditionalGroup1, source.ConditionalGroup2, source.ConditionalGroup3].filter(group => group !== 'None');
        const matches = source.Conditional === 'TRUE' && conditionGroups.some(group => groups(target).includes(group));
        const operation = matches ? source.ConditionalOperation : source.EquipOperation;
        const amount = matches ? sourceState.conditional : sourceState.regular;
        state.regular = operate(state.regular, operation, amount);
        if (target.Conditional === 'TRUE') state.conditional = operate(state.conditional, operation, amount);
      }
      current.set(targetId, state);
    });
    if (sameStates(previous, current)) return current;
    previous = current;
  }
  return previous;
}

function targetIndexFor(sourceIndex, destinationIndex) {
  const source = cards.find(item => item.ID === placements[sourceIndex]);
  return source && targetIndex(sourceIndex, source.Direction) === destinationIndex;
}

function hasDirectionalLoop() {
  const next = new Map();
  placements.forEach((id, index) => {
    if (id === null) return;
    const card = cards.find(item => item.ID === id);
    const destination = targetIndex(index, card.Direction);
    if (destination >= 0 && placements[destination] !== null) next.set(index, destination);
  });
  const visited = new Set();
  for (const start of next.keys()) {
    const path = new Set();
    let current = start;
    while (next.has(current)) {
      if (path.has(current)) return true;
      if (visited.has(current)) break;
      path.add(current);
      current = next.get(current);
    }
    path.forEach(index => visited.add(index));
  }
  return false;
}

function updateAffectedAssets(names) {
  affectedAssetsNow = new Set(names);
  document.querySelectorAll('[data-asset-name]').forEach(row => {
    row.classList.toggle('card-affected', names.has(row.dataset.assetName));
  });
}

function renderCalculator() {
  const results = document.querySelector('#calculation-results');
  const status = document.querySelector('#layout-status');
  const occupied = placements.map((id, index) => ({ id, index, card: cards.find(item => item.ID === id) })).filter(item => item.id !== null && item.card);
  if (occupied.length === 0) {
    status.className = 'layout-status';
    status.textContent = 'BOARD EMPTY';
    results.innerHTML = '<p class="calculator-empty">Place cards on the board to see their combined effects.</p>';
    updateAffectedAssets(new Set());
    return;
  }

  const effects = calculateBoardEffects();
  const assetBonuses = new Map();
  const affectionBonuses = new Map();
  const links = [];
  for (const { index, card } of occupied) {
    const destination = targetIndex(index, card.Direction);
    const target = destination >= 0 ? cards.find(item => item.ID === placements[destination]) : null;
    if (target) {
      const conditionGroups = [card.ConditionalGroup1, card.ConditionalGroup2, card.ConditionalGroup3].filter(group => group !== 'None');
      const conditional = card.Conditional === 'TRUE' && conditionGroups.some(group => groups(target).includes(group));
      links.push({ source: card, target, conditional });
    }

    const primaryAssets = [card.PrimaryAsset1, card.PrimaryAsset2, card.PrimaryAsset3]
      .map(canonicalAssetName).filter(Boolean);
    if (!primaryAssets.length) continue;
    const value = effects.get(card.ID)?.regular ?? Number(card.Value) * 3;
    if (!card.SecondaryAsset || card.SecondaryAsset === 'None') {
      primaryAssets.forEach(asset => assetBonuses.set(asset, (assetBonuses.get(asset) || 0) + value));
    } else {
      primaryAssets.forEach(asset => affectionBonuses.set(asset, { value, secondary: card.SecondaryAsset, card }));
    }
  }

  const affectedAssets = new Set([...assetBonuses.keys(), ...affectionBonuses.keys()].map(canonicalAssetName).filter(Boolean));
  updateAffectedAssets(affectedAssets);
  const bonusRows = [...assetBonuses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([asset, value]) => `<li class="result-row affected-asset"><span>${safe(asset)}<small>Boosted by placed cards</small></span><span class="result-value">${formatEffect('Add', value)}%</span></li>`);
  const affectionRows = [...affectionBonuses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([asset, entry]) => `<li class="result-row affected-asset"><span>${safe(asset)}<small class="asset-formula">${formatEffect('Add', entry.value)}% × floor(owned ${safe(entry.secondary)} / 10)</small></span><span class="result-value">affection</span></li>`);
  const linkRows = links.map(({ source, target, conditional }) => `<li class="result-row"><span>${safe(source.Name)} <span class="link-arrow">${DIRECTIONS[source.Direction]}</span> ${safe(target.Name)}</span><span class="result-value">${conditional ? 'conditional' : 'regular'} effect</span></li>`);
  const loop = hasDirectionalLoop();
  status.className = `layout-status ${loop ? 'invalid' : 'valid'}`;
  status.textContent = loop ? 'CYCLE · GAME REJECTS' : `${occupied.length} CARDS · NO CYCLE`;

  const sections = [];
  sections.push(`<section class="result-block"><h3 class="result-title">Directional links · ${links.length}</h3>${linkRows.length ? `<ul class="result-list">${linkRows.join('')}</ul>` : '<p class="calculator-empty">No placed card currently points to another card.</p>'}</section>`);
  sections.push(`<section class="result-block"><h3 class="result-title">Asset bonuses</h3>${bonusRows.length || affectionRows.length ? `<ul class="result-list">${bonusRows.join('')}${affectionRows.join('')}</ul>` : '<p class="calculator-empty">No placed card currently modifies an asset.</p>'}</section>`);
  if (loop) sections.push('<div class="calculator-warning">These arrows form a cycle. Holoidle rejects a card placement that creates a directional loop, so this combination cannot be equipped as shown.</div>');
  results.innerHTML = sections.join('');
}

function formatEffect(operation, value) {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
  const symbol = operation === 'Multiply' ? '×' : operation === 'Divide' ? '÷' : operation === 'Subtract' ? '−' : '+';
  return `${symbol}${rounded}`;
}

function effect(card, adjusted = null, isFoil = foilIds.has(card.ID)) {
  const direction = DIRECTIONS[card.Direction];
  const base = Number(card.Value) * 3 * (isFoil ? 2 : 1);
  const shownBase = adjusted ? adjusted.regular : base;
  let result = `${direction ? `<span class="direction" title="Points ${safe(DIRECTION_LABELS[card.Direction] || card.Direction)}">${direction}</span>` : ''}${formatEffect(card.EquipOperation, shownBase)}`;
  if (adjusted && shownBase !== base) result += `<span class="base-value"> (base ${formatEffect(card.EquipOperation, base)})</span>`;
  if (card.Conditional === 'TRUE') {
    const conditionGroups = [card.ConditionalGroup1, card.ConditionalGroup2, card.ConditionalGroup3].filter(x => x !== 'None');
    const condBase = Number(card.ConditionalValue) * 3 * (isFoil ? 2 : 1);
    const condValue = adjusted ? adjusted.conditional : condBase;
    result += `<span class="conditional-effect"> · ${formatEffect(card.ConditionalOperation, condValue)} if ${safe(conditionGroups.join(' + '))}</span>`;
  }
  return result;
}

function renderDirectionFilters() {
  const options = [{ value: 'all', symbol: '✦', label: 'All' }, { value: 'none', symbol: '·', label: 'No direction' }, ...DIRECTION_ORDER.map(direction => ({ value: direction, symbol: DIRECTIONS[direction], label: DIRECTION_LABELS[direction] }))];
  document.querySelector('#direction-filters').innerHTML = options.map(option => `<button class="direction-filter${activeDirection === option.value ? ' active' : ''}" data-direction="${option.value}" aria-label="${safe(option.label)}" title="${safe(option.label)}">${option.symbol}</button>`).join('');
}

function renderBoard() {
  const effects = calculateBoardEffects();
  board.innerHTML = placements.map((id, index) => {
    const card = cards.find(item => item.ID === id);
    const position = `0${Math.floor(index / 4) + 1} · 0${index % 4 + 1}`;
    if (!card) return `<button class="slot empty" data-slot="${index}" data-position="${position}" aria-label="Empty slot ${position}"></button>`;
    const isFoil = foilIds.has(card.ID);
    const copies = ownedCardCounts.get(card.ID) || 0;
    const ownershipBadge = hasOwnedCardData ? `<span class="ownership-badge ${copies ? 'owned' : 'unowned'}">${copies ? `OWNED ×${copies}` : 'NOT OWNED'}</span>` : '';
    const multiplier = isFoil ? 2 : 1;
    return `<div class="slot filled" data-slot="${index}" role="group" aria-label="${safe(card.Name)}, slot ${position}${hasOwnedCardData ? copies ? `, owned ${copies}` : ', not owned' : ''}"><span class="board-card${isFoil ? ' foil-card' : ''}"><span class="card-top"><span class="card-tier">TIER ${tierNames[card.Tier]}</span><span class="board-card-tools">${ownershipBadge}<span class="card-id">#${String(card.ID).padStart(3, '0')}</span><label class="foil-control" data-foil-control title="${isFoil ? 'Foil effect values are doubled' : 'Mark this card as foil'}"><input type="checkbox" data-foil="${card.ID}" ${isFoil ? 'checked' : ''} aria-label="Mark ${safe(card.Name)} as foil"><span>FOIL ×2</span></label><button class="remove-card" data-remove-slot="${index}" aria-label="Remove ${safe(card.Name)}">×</button></span></span><span class="card-name">${safe(card.Name)}</span><span class="card-meta">${safe(groups(card).join(' · ') || 'Collab card')}</span>${affectedAssetLine(card)}<span class="effect">${effect(card, effects.get(id) || { regular: Number(card.Value) * 3 * multiplier, conditional: Number(card.ConditionalValue) * 3 * multiplier }, isFoil)}</span></span></div>`;
  }).join('');
  document.querySelector('#placed-count').textContent = placements.filter(id => id !== null).length;
}

function renderCollection() {
  const query = search.value.trim().toLowerCase();
  const placed = new Set(placements.filter(id => id !== null));
  const visible = cards.filter(card => {
    const assetNames = [card.PrimaryAsset1, card.PrimaryAsset2, card.PrimaryAsset3, card.SecondaryAsset]
      .filter(asset => asset && asset !== 'None')
      .flatMap(asset => [asset, canonicalAssetName(asset)]).filter(Boolean);
    const text = [card.Name, ...groups(card), ...assetNames, card.Direction, card.EquipOperation, card.Value, card.ConditionalGroup1, card.ConditionalGroup2, card.ConditionalGroup3].join(' ').toLowerCase();
    const copies = ownedCardCounts.get(card.ID) || 0;
    return (ownershipFilter === 'all' || (ownershipFilter === 'owned' ? copies > 0 : copies === 0)) && (activeTier === 'all' || card.Tier === Number(activeTier)) && (activeDirection === 'all' || (activeDirection === 'none' ? card.Direction === 'None' : card.Direction === activeDirection)) && text.includes(query);
  });
  collection.innerHTML = visible.map(card => {
    const isPlaced = placed.has(card.ID);
    const copies = ownedCardCounts.get(card.ID) || 0;
    const ownershipBadge = hasOwnedCardData ? `<span class="ownership-badge ${copies ? 'owned' : 'unowned'}">${copies ? `OWNED ×${copies}` : 'NOT OWNED'}</span>` : '';
    return `<button class="card${foilIds.has(card.ID) ? ' foil-card' : ''}${isPlaced ? ' placed' : ''}${selectedId === card.ID ? ' selected' : ''}" data-card="${card.ID}" ${isPlaced ? 'disabled' : ''} aria-label="${safe(card.Name)}, tier ${card.Tier}${hasOwnedCardData ? copies ? `, owned ${copies}` : ', not owned' : ''}${foilIds.has(card.ID) ? ', foil' : ''}${isPlaced ? ', placed' : ''}"><span class="card-top"><span class="card-tier">TIER ${tierNames[card.Tier]}</span><span class="collection-card-tools">${ownershipBadge}${foilIds.has(card.ID) ? '<span class="foil-badge">FOIL ×2</span>' : ''}<span class="card-id">#${String(card.ID).padStart(3, '0')}</span></span></span><span class="card-name">${safe(card.Name)}</span><span class="card-meta">${safe(groups(card).join(' · ') || 'Collab card')}</span>${affectedAssetLine(card)}<span class="effect">${effect(card, null, foilIds.has(card.ID))}</span></button>`;
  }).join('');
  document.querySelector('#empty-state').hidden = visible.length > 0;
  ownedFilter.disabled = !hasOwnedCardData;
  unownedFilter.disabled = !hasOwnedCardData;
  ownedFilter.classList.toggle('active', ownershipFilter === 'owned');
  unownedFilter.classList.toggle('active', ownershipFilter === 'unowned');
  ownedFilter.setAttribute('aria-pressed', String(ownershipFilter === 'owned'));
  unownedFilter.setAttribute('aria-pressed', String(ownershipFilter === 'unowned'));
  const ownedKinds = [...ownedCardCounts.values()].filter(count => count > 0).length;
  document.querySelector('#card-total').textContent = hasOwnedCardData ? `${ownedKinds} OWNED · ${cards.length} CARDS` : `${cards.length} CARDS`;
  const copyTotal = [...ownedCardCounts.values()].reduce((sum, count) => sum + count, 0);
  ownershipNote.textContent = hasOwnedCardData ? `${ownedKinds} owned cards · ${copyTotal} total copies. Foil is inferred from 10+ copies. Unowned cards remain selectable for hypothetical combinations.` : 'Load a save to see which cards you own. Unowned cards remain available for hypothetical combinations.';
}

function updateHint() {
  const selected = cards.find(card => card.ID === selectedId);
  hint.textContent = selected ? `Placing ${selected.Name} · choose an empty slot (Esc to cancel).` : 'Select a card below, then choose a slot.';
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ placements, foilIds: [...foilIds] }));
  renderBoard();
  renderCalculator();
  renderCollection();
  updateHint();
}

async function decodeSaveFile(file) {
  const contents = (await file.text()).replace(/^\uFEFF/, '').trim();
  if (contents.startsWith('{')) return JSON.parse(contents);
  // Local save.holo files are Base64 AES-CBC ciphertext in the game source.
  const keyBytes = new TextEncoder().encode('iHNS7HayeJ3tkUX3H49tSHSTyprermmY');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
  const binary = atob(contents);
  const ciphertext = Uint8Array.from(binary, char => char.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: new Uint8Array(16) }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function importCardSetup(save) {
  if (!Array.isArray(save.collabsEquipped)) throw new Error('This save has no equipped-card data.');
  const nextPlacements = Array(8).fill(null);
  const occupied = new Set();
  for (const [arrayIndex, slot] of save.collabsEquipped.entries()) {
    const position = Number.isInteger(slot?.slotIndex) ? slot.slotIndex : arrayIndex;
    const runtimeId = Number(slot?.collabID);
    if (!Number.isInteger(position) || position < 0 || position >= 8 || !runtimeId) continue;
    // The game assigns runtime IDs 1..N in CSV row order; CSV IDs are 0..N-1.
    const card = cards.find(item => item.ID === runtimeId - 1);
    if (!card) continue;
    if (occupied.has(position)) throw new Error(`Save contains multiple cards in slot ${position + 1}.`);
    occupied.add(position);
    nextPlacements[position] = card.ID;
  }
  const counts = new Map();
  for (const value of Array.isArray(save.collabsOwned) ? save.collabsOwned : []) {
    const runtimeId = Number(value);
    if (Number.isInteger(runtimeId) && runtimeId > 0) counts.set(runtimeId, (counts.get(runtimeId) || 0) + 1);
  }
  hasOwnedCardData = Array.isArray(save.collabsOwned);
  ownedCardCounts = new Map([...counts].map(([runtimeId, count]) => [runtimeId - 1, count]));
  const nextFoils = new Set();
  for (const [runtimeId, count] of counts) {
    if (count >= 10) {
      const card = cards.find(item => item.ID === runtimeId - 1);
      if (card) nextFoils.add(card.ID);
    }
  }
  placements = nextPlacements;
  foilIds = nextFoils;
  selectedId = null;
  importedSave = save;
  saveAndRender();
  renderAssetDashboard(save);
  return occupied.size;
}

saveFileInput.addEventListener('change', async () => {
  const file = saveFileInput.files?.[0];
  if (!file) return;
  importStatus.textContent = 'Reading save locally…';
  try {
    const save = await decodeSaveFile(file);
    importedSave = save;
    renderAssetDashboard(save);
    if (!cards.length) {
      pendingSave = save;
      importStatus.textContent = 'Save read; waiting for the card catalog…';
      return;
    }
    const count = importCardSetup(save);
    importStatus.textContent = `Loaded ${count} equipped card${count === 1 ? '' : 's'}; foil inferred from owned copies.`;
  } catch (error) {
    const message = error.message || 'unrecognized format';
    importStatus.textContent = `Could not load save: ${message}`;
    assetDashboardTotal.textContent = 'IMPORT FAILED';
    assetDashboardNote.textContent = `Save import failed: ${message}`;
  } finally {
    saveFileInput.value = '';
  }
});

board.addEventListener('click', event => {
  if (event.target.closest('[data-foil-control]')) return;
  const slot = event.target.closest('[data-slot]');
  if (!slot) return;
  const index = Number(slot.dataset.slot);
  if (placements[index] !== null) {
    placements[index] = null;
    saveAndRender();
    return;
  }
  if (selectedId === null) return;
  placements[index] = selectedId;
  selectedId = null;
  saveAndRender();
});
board.addEventListener('change', event => {
  const checkbox = event.target.closest('[data-foil]');
  if (!checkbox) return;
  const id = Number(checkbox.dataset.foil);
  if (checkbox.checked) foilIds.add(id);
  else foilIds.delete(id);
  saveAndRender();
});

collection.addEventListener('click', event => {
  const card = event.target.closest('[data-card]');
  if (!card) return;
  const id = Number(card.dataset.card);
  selectedId = selectedId === id ? null : id;
  renderCollection();
  updateHint();
});

search.addEventListener('input', renderCollection);
document.querySelectorAll('[data-copy-path]').forEach(button => button.addEventListener('click', async () => {
  const path = button.dataset.copyPath;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(path);
    } else {
      const input = document.createElement('textarea');
      input.value = path;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    copyPathStatus.textContent = `${button.textContent.trim().replace(/^Copied · /, '')} copied.`;
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = 'Copy path'; }, 1500);
  } catch {
    copyPathStatus.textContent = 'Could not copy path. Select and copy it manually.';
  }
}));
ownedFilter.addEventListener('click', () => {
  if (!hasOwnedCardData) return;
  ownershipFilter = ownershipFilter === 'owned' ? 'all' : 'owned';
  renderCollection();
});
unownedFilter.addEventListener('click', () => {
  if (!hasOwnedCardData) return;
  ownershipFilter = ownershipFilter === 'unowned' ? 'all' : 'unowned';
  renderCollection();
});
document.querySelector('#filters').addEventListener('click', event => {
  const button = event.target.closest('[data-tier]');
  if (!button) return;
  activeTier = button.dataset.tier;
  document.querySelectorAll('.filter').forEach(filter => filter.classList.toggle('active', filter === button));
  renderCollection();
});
document.querySelector('#direction-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-direction]');
  if (!button) return;
  activeDirection = button.dataset.direction;
  renderDirectionFilters();
  renderCollection();
});
document.querySelector('#clear-board').addEventListener('click', () => {
  placements = Array(8).fill(null);
  selectedId = null;
  saveAndRender();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && selectedId !== null) { selectedId = null; renderCollection(); updateHint(); }
});

fetch(CARD_FILE).then(response => {
  if (!response.ok) throw new Error('Card data could not be loaded.');
  return response.text();
}).then(text => {
  cards = fromCsv(text);
  const valid = new Set(cards.map(card => card.ID));
  placements = placements.map(id => valid.has(id) ? id : null);
  foilIds = new Set([...foilIds].filter(id => valid.has(id)));
  document.querySelector('#card-total').textContent = `${cards.length} CARDS`;
  renderDirectionFilters();
  saveAndRender();
  if (pendingSave) {
    const save = pendingSave;
    pendingSave = null;
    try {
      const count = importCardSetup(save);
      importStatus.textContent = `Loaded ${count} equipped card${count === 1 ? '' : 's'}; foil inferred from owned copies.`;
    } catch (error) {
      importStatus.textContent = `Assets loaded; card board import failed: ${error.message || 'unexpected save structure'}`;
    }
  }
}).catch(error => {
  document.querySelector('#card-total').textContent = 'DATA UNAVAILABLE';
  collection.innerHTML = `<div class="empty-state">${safe(error.message)} Open this folder through a local web server if your browser blocks file access.</div>`;
});
