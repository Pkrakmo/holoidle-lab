const CARD_FILE = `${import.meta.env.BASE_URL}CollabCards.txt`;
const STORAGE_KEY = 'holoidle-bonus-card-board-v1';
const SAVED_GAME_KEY = 'holoidle-imported-save-v1';
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
const HOLOSCOPE_STARS = [
  ...[
    ['Artifex', 'Artist'], ['Sanctaria', 'Shrine'], ['Astroccino', 'Coffee'], ['Melodia', 'Karaoke'],
    ['Olivara', 'Chain'], ['Tradeon', 'Trading'], ['Festivara', 'Concert'], ['Fortunara', 'Gacha'],
    ['Oratorion', 'Talent Agency'], ['Relicara', 'Museum'], ['Wonderis', 'Theme Park'], ['Aqualis', 'Resort'],
    ['Reveria', 'Temple'], ['Imperion', 'Royal Palace'], ['Civitas', 'Ministry'], ['Atomis', 'Research Institute']
  ].map(([name, asset], index) => ({ id: `star_asset_${index + 2}`, name, category: 'Assets', detail: `${asset} income doubles per effective rank.`, maxRank: [45, 43, 40, 38, 36, 33, 31, 28, 25, 23, 20, 17, 14, 11, 8, 5][index] })),
  ...[
    ['myth', 'Fableon', 'Myth'], ['equipment', 'Vulkaris', 'Equipment'], ['council', 'Concorda', 'Council'],
    ['fantasy', 'Fantasia', 'Fantasy'], ['gamers', 'Bestia', 'Gamers'], ['talent', 'Ingenium', 'Talent'],
    ['justice', 'Praetorix', 'Justice'], ['holoid', 'Amarentia', 'HoloID']
  ].map(([key, name, label]) => ({ id: `star_group_${key}`, name, category: 'Collab groups', detail: `${label} card effects gain 10% per effective rank.`, maxRank: 1000 })),
  ...[
    ['Top', 'Ascendia'], ['Bottom', 'Descende'], ['Left', 'Levoria'], ['Right', 'Dexterex'],
    ['DiagonalBottomLeft', 'Tenebralis'], ['DiagonalBottomRight', 'Solvanta'], ['DiagonalTopLeft', 'Celestia'], ['DiagonalTopRight', 'Aetheris']
  ].map(([direction, name]) => ({ id: `star_direction_${direction.toLowerCase()}`, name, category: 'Directions', detail: `${DIRECTION_LABELS[direction]}-pointing card effects gain 20% per effective rank.`, maxRank: 1000 })),
  { id: 'star_add', name: 'Augmentia', category: 'Special', detail: 'Directed Add effects gain 1000% per effective rank.', maxRank: 1000 },
  { id: 'star_holocoin', name: 'Abundantia', category: 'Special', detail: 'Adds 4% Holocoin income per effective rank.', maxRank: 25 },
  { id: 'star_daily_mission', name: 'Daily Mission', category: 'Special', detail: 'Improves daily mission bonuses.', maxRank: 5 },
  { id: 'star_overdrive_ips', name: 'Overdrive IpS', category: 'Special', detail: 'Adds 1% Overdrive IpS per rank.', maxRank: 10 },
  { id: 'star_overdrive_duration', name: 'Overdrive Duration', category: 'Special', detail: 'Adds 0.1 seconds of Overdrive per rank.', maxRank: 100 },
  { id: 'star_overdrive_click', name: 'Overdrive Click', category: 'Special', detail: 'Improves click power during Overdrive.', maxRank: 100 },
  { id: 'star_overdrive_wait', name: 'Overdrive Wait', category: 'Special', detail: 'Reduces Overdrive cooldown by 1 minute per rank.', maxRank: 60 },
  { id: 'star_overdrive_holocoin', name: 'Overdrive Holocoin', category: 'Special', detail: 'Adds 1% Holocoin chance during Overdrive per rank.', maxRank: 25 }
];
const GAME_ACHIEVEMENTS = [
  ['freshstart', 'Fresh Start', 'Break the crystal for the first time'],
  ['cardenthusiast', 'Card Enthusiast', 'Collect 10 different Collab cards'],
  ['cardcollector', 'Card Collector', 'Collect 50 different Collab cards'],
  ['cardspecialist', 'Card Specialist', 'Collect 100 different Collab cards'],
  ['shinythings', 'Shiny Things', 'Gain your first Foil Collab card'],
  ['treasurepile', 'Treasure Pile', 'Collect 20 different Foil Collab cards'],
  ['completecollection', 'Complete Collection', 'Collect 100 different Foil Collab cards'],
  ['newlife', 'New Life', 'Rebirth for the first time'],
  ['backagain', 'Back Again', 'Rebirth 10 times'],
  ['closedforrenovations', 'Closed for Renovations', 'Gain your first special furniture'],
  ['feelslikehome', 'Feels Like Home', 'Collect all special furniture'],
  ['upgradetime', 'Upgrade Time', 'Purchase your first asset upgrade'],
  ['allin', 'All In', 'Purchase at least one asset upgrade for each asset'],
  ['lockedin', 'Locked In', 'Purchase your first unlock'],
  ['maximumefficiency', 'Maximum Efficiency', 'Purchase all unlocks'],
  ['startingout', 'Starting Out', 'Reach 1000 IpS'],
  ['trueicon', 'True Icon', 'Reach 100.000 IpS'],
  ['nowweareidling', 'Now We Are Idling', 'Reach 1 million IpS'],
  ['waithowmanyzeros', 'Wait, How Many Zeros?', 'Reach 1 billion IpS'],
  ['cantcountthathigh', "Can't Count That High", 'Reach 1 trillion IpS'],
  ['thatsalot', "That's a Lot", 'Reach 1 quadrillion IpS'],
  ['nowthatsjustsilly', "Now That's Just Silly", 'Reach 1 quintillion IpS'],
  ['banhammer', 'Ban Hammer', 'Ban your first troll'],
  ['hammerofjustice', 'Hammer of Justice', 'Ban 20 trolls'],
  ['fantastic', 'Fan-tastic', 'Purchase your first fan asset'],
  ['idolarmy', 'Idol Army', 'Purchase 100 fan assets'],
  ['fanfavorite', 'Fan Favorite', 'Purchase your first prime fan asset'],
  ['primetime', 'Prime Time', 'Purchase 100 prime fan assets'],
  ['artistictouch', 'Artistic Touch', 'Purchase your first artist'],
  ['artgallery', 'Art Gallery', 'Purchase 100 artist assets'],
  ['timetopray', 'Time to Pray', 'Purchase your first idol shrine asset'],
  ['idolgoddess', 'Idol Goddess', 'Purchase 100 idol shrine assets'],
  ['restbreak', 'Rest Break', 'Purchase your first themed cafe asset'],
  ['caffeineaddiction', 'Caffeine Addiction', 'Purchase 100 themed cafe assets'],
  ['nowsing', 'Now Sing!', 'Purchase your first karaoke bar asset'],
  ['sorethroat', 'Sore Throat', 'Purchase 100 karaoke bar assets'],
  ['howmayitakeyourorder', 'How May I Take Your Order', 'Purchase your first chain restaurant asset'],
  ['franchising', 'Franchising', 'Purchase 100 chain restaurant assets'],
  ['goinglong', 'Going Long', 'Purchase your first trading agency asset'],
  ['marketcap', 'Market Cap', 'Purchase 100 trading agency assets'],
  ['showbusiness', 'Show business', 'Purchase your first concert avenue asset'],
  ['worldtour', 'World Tour', 'Purchase 100 concert avenue assets'],
  ['justonemoreroll', 'Just One More Roll', 'Purchase your first gacha casino asset'],
  ['icanstopanytime', 'I Can Stop Anytime', 'Purchase 100 gacha casino assets'],
  ['idolbootcamp', 'Idol Boot camp', 'Purchase your first talent academy asset'],
  ['newgeneration', 'New Generation', 'Purchase 100 talent academy assets'],
  ['writteninstone', 'Written in Stone', 'Purchase your first holo museum asset'],
  ['forthehistorybooks', 'For The History Books', 'Purchase 100 holo museum assets'],
  ['admissionticket', 'Admission Ticket', 'Purchase your first theme park asset'],
  ['waitinline', 'Wait In Line', 'Purchase 100 theme park assets'],
  ['tropical', 'Tropical', 'Purchase your first luxury resort asset'],
  ['fivestars', 'Five Stars', 'Purchase 100 luxury resort assets'],
  ['truefervor', 'True Fervor', 'Purchase your first idol temple asset'],
  ['technicallyareligion', 'Technically a Religion', 'Purchase 100 idol temple assets'],
  ['andacrown', 'And A Crown', 'Purchase your first royal palace asset'],
  ['globaldominion', 'Global Dominion', 'Purchase 100 royal palace assets'],
  ['justpolitics', 'Just Politics', 'Purchase your first governmental ministry asset'],
  ['worldruler', 'World Ruler', 'Purchase 100 governmental ministry assets'],
  ['researchanddevelopment', 'Research and Development', 'Purchase your first research facility asset'],
  ['bulkknowledge', 'Bulk Knowledge', 'Purchase 100 research facility assets'],
  ['toinfinity', 'To Infinity', 'Purchase your first space colony asset'],
  ['interstellar', 'Interstellar', 'Purchase 100 space colony assets'],
  ['whatif', 'What If', 'Purchase your first multiverse device asset'],
  ['isntoneenough', "Isn't One Enough", 'Purchase 100 multiverse device assets'],
  ['shattereddream', 'Shattered Dream', 'Purchase your first statue of a dreamer asset'],
  ['ironwill', 'Iron Will', 'Purchase 100 statue of a dreamer assets'],
  ['sweetdreams', 'Sweet Dreams', 'Put your Idol to sleep for the first time'],
  ['heavysleeper', 'Heavy Sleeper', 'Put your Idol to sleep 50 times'],
  ['itadakimasu', 'Itadakimasu!', 'Cook food for your Idol for the first time'],
  ['fullcourse', 'Full Course', 'Cook food for your Idol 50 times'],
  ['stinky', 'Stinky', 'Give your Idol a bath for the first time'],
  ['squeakyclean', 'Squeaky Clean', 'Give your Idol a bath 50 times'],
  ['happytimes', 'Happy Times', 'Keep your Idol happy for a combined time of at least one hour'],
  ['pettingsession', 'Petting Session', 'Pet your Idol in the head for a combined time of at least half an hour']
];
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
const rememberSaveInput = document.querySelector('#remember-save');
const rememberSaveStatus = document.querySelector('#remember-save-status');
const forgetSaveButton = document.querySelector('#forget-save');
const copyPathStatus = document.querySelector('#copy-path-status');
const assetDashboardRows = document.querySelector('#asset-dashboard-rows');
const assetDashboardTotal = document.querySelector('#asset-dashboard-total');
const assetDashboardNote = document.querySelector('#asset-dashboard-note');
const assetDashboardCompare = document.querySelector('#asset-dashboard-compare');
const achievementSearch = document.querySelector('#save-achievement-search');
const achievementList = document.querySelector('#save-achievement-list');
const achievementListStatus = document.querySelector('#save-achievement-list-status');
const ownedFilter = document.querySelector('#owned-filter');
const unownedFilter = document.querySelector('#unowned-filter');
const ownershipNote = document.querySelector('#ownership-note');
const optimizeOwnedButton = document.querySelector('#optimize-owned');
const ownedSearchStatus = document.querySelector('#owned-search-status');
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
let presets = loadPresets();
let savePresets = [];
let importedSave = null;
let pendingSave = null;
let rememberSaveEnabled = false;
let restoredSaveOnStartup = false;
let ownedCardCounts = new Map();
let hasOwnedCardData = false;
let ownershipFilter = 'all';
let achievementFilter = 'all';
let affectedAssetsNow = new Set();
updateAffectedAssets(affectedAssetsNow);

try {
  const remembered = localStorage.getItem(SAVED_GAME_KEY);
  if (remembered) {
    const parsed = JSON.parse(remembered);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      importedSave = parsed;
      pendingSave = parsed;
      rememberSaveEnabled = true;
      restoredSaveOnStartup = true;
      rememberSaveInput.checked = true;
      forgetSaveButton.hidden = false;
      rememberSaveStatus.textContent = 'A saved copy is available on this device.';
      importStatus.textContent = 'Restoring your remembered save…';
    }
  }
} catch {
  rememberSaveStatus.textContent = 'Could not read the saved browser copy.';
  forgetSaveButton.hidden = false;
}

function storeImportedSave(save) {
  try {
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(save));
    rememberSaveEnabled = true;
    rememberSaveInput.checked = true;
    forgetSaveButton.hidden = false;
    rememberSaveStatus.textContent = 'Saved in this browser on this device.';
    return true;
  } catch {
    rememberSaveEnabled = false;
    rememberSaveInput.checked = false;
    try { localStorage.removeItem(SAVED_GAME_KEY); } catch { /* storage is unavailable */ }
    forgetSaveButton.hidden = true;
    rememberSaveStatus.textContent = 'Could not store the save; browser storage may be full or unavailable.';
    return false;
  }
}

function forgetImportedSave(status = 'Not stored in browser storage.') {
  try {
    localStorage.removeItem(SAVED_GAME_KEY);
    rememberSaveStatus.textContent = status;
    forgetSaveButton.hidden = true;
  } catch {
    rememberSaveStatus.textContent = 'Could not remove the saved browser copy.';
    forgetSaveButton.hidden = false;
  }
}

rememberSaveInput.addEventListener('change', () => {
  rememberSaveEnabled = rememberSaveInput.checked;
  if (!rememberSaveEnabled) {
    forgetImportedSave();
  } else if (importedSave) {
    storeImportedSave(importedSave);
  } else {
    rememberSaveStatus.textContent = 'The next imported save will be stored on this device.';
  }
});
forgetSaveButton.addEventListener('click', () => {
  rememberSaveEnabled = false;
  rememberSaveInput.checked = false;
  forgetImportedSave('Saved copy removed. The current import remains available until you leave or reload this page.');
});

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

function loadPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return !Array.isArray(saved) && Array.isArray(saved.presets)
      ? saved.presets.filter(preset => preset && typeof preset.name === 'string' && Array.isArray(preset.placements) && preset.placements.length === 8)
        .map(preset => ({ name: preset.name.slice(0, 40), placements: preset.placements.map(id => Number.isInteger(id) ? id : null), foilIds: Array.isArray(preset.foilIds) ? preset.foilIds.filter(Number.isInteger) : [] }))
      : [];
  } catch { return []; }
}

function renderPresets() {
  const picker = document.querySelector('#board-presets');
  const selected = picker.value;
  const localOptions = presets.map((preset, index) => `<option value="local:${index}">${safe(preset.name)}</option>`).join('');
  const saveOptions = savePresets.map((preset, index) => `<option value="save:${index}">${safe(preset.name)}</option>`).join('');
  picker.innerHTML = `<option value="">Choose preset…</option>${localOptions ? `<optgroup label="This browser">${localOptions}</optgroup>` : ''}${saveOptions ? `<optgroup label="Imported save.holo">${saveOptions}</optgroup>` : ''}`;
  if (selected && picker.querySelector(`option[value="${selected}"]`)) picker.value = selected;
  document.querySelector('#delete-preset').disabled = !picker.value.startsWith('local:');
}

function encodeSharedLayout() {
  const payload = JSON.stringify({ v: 1, p: placements, f: [...foilIds] });
  const bytes = new TextEncoder().encode(payload);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return `HCB1:${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

function decodeSharedLayout(code) {
  const match = /^HCB1:([A-Za-z0-9_-]+)$/.exec(code.trim());
  if (!match) throw new Error('That code is not a supported board layout.');
  const base64 = match[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - match[1].length % 4) % 4);
  let payload;
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch { throw new Error('The layout code is damaged or incomplete.'); }
  if (!payload || payload.v !== 1 || !Array.isArray(payload.p) || payload.p.length !== 8 || !Array.isArray(payload.f)) {
    throw new Error('The layout code has an unsupported format.');
  }
  const validIds = new Set(cards.map(card => card.ID));
  if (payload.p.some(id => id !== null && (!Number.isInteger(id) || !validIds.has(id)))) throw new Error('The layout includes a card ID not found in this card catalog.');
  const placed = payload.p.filter(id => id !== null);
  if (new Set(placed).size !== placed.length) throw new Error('The layout places the same card more than once.');
  if (payload.f.some(id => !Number.isInteger(id) || !validIds.has(id))) throw new Error('The layout includes an invalid foil card ID.');
  return { placements: payload.p, foilIds: [...new Set(payload.f)] };
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

function renderSaveHighlights(save) {
  const encores = Number(save?.rebirthCount);
  const hasEncoreCount = Number.isFinite(encores) && Number.isInteger(encores);
  document.querySelector('#save-encore-count').textContent = hasEncoreCount ? Math.max(0, encores - 1).toLocaleString() : '—';
  document.querySelector('#save-encore-note').textContent = hasEncoreCount ? `Rebirth count ${encores.toLocaleString()} in save` : 'Encore count is not recorded in this save.';

  const progress = document.querySelector('#save-achievement-progress');
  const meter = document.querySelector('#save-achievement-meter');
  const note = document.querySelector('#save-achievement-note');
  const unlocked = Array.isArray(save?.unlockedAchievements) ? save.unlockedAchievements : null;
  if (!unlocked) {
    progress.textContent = save ? 'NO DATA' : '—';
    meter.value = 0;
    meter.max = GAME_ACHIEVEMENTS.length;
    note.textContent = save ? 'This save has no unlockedAchievements list.' : 'Achievement data appears here after importing a save.';
    renderAchievementList(save);
    return;
  }
  const ids = new Set(unlocked.filter(id => typeof id === 'string'));
  const achievementIds = new Set(GAME_ACHIEVEMENTS.map(([id]) => id));
  const count = [...ids].filter(id => achievementIds.has(id)).length;
  const unknown = [...ids].filter(id => !achievementIds.has(id)).length;
  meter.max = GAME_ACHIEVEMENTS.length;
  meter.value = count;
  progress.textContent = `${count} / ${GAME_ACHIEVEMENTS.length}`;
  note.textContent = `${Math.round(count * 100 / GAME_ACHIEVEMENTS.length)}% marked unlocked in save. Goals below are from the game's achievement list.${unknown ? ` ${unknown} unrecognized achievement ID${unknown === 1 ? '' : 's'} ignored.` : ''}`;
  renderAchievementList(save);
}

function renderAchievementList(save) {
  const unlocked = Array.isArray(save?.unlockedAchievements)
    ? new Set(save.unlockedAchievements.filter(id => typeof id === 'string'))
    : null;
  const filterButtons = [...document.querySelectorAll('[data-achievement-filter]')];
  filterButtons.forEach(button => {
    button.disabled = !unlocked;
    button.classList.toggle('active', button.dataset.achievementFilter === achievementFilter);
    button.setAttribute('aria-pressed', String(button.dataset.achievementFilter === achievementFilter));
  });
  achievementSearch.disabled = !unlocked;
  if (!unlocked) {
    achievementList.innerHTML = '';
    achievementListStatus.textContent = save ? 'This save has no achievement progress data.' : 'Import a save to see achievement progress and goals.';
    return;
  }
  const query = achievementSearch.value.trim().toLowerCase();
  const visible = GAME_ACHIEVEMENTS.filter(([id, name, goal]) => {
    const isUnlocked = unlocked.has(id);
    return (achievementFilter === 'all' || (achievementFilter === 'unlocked' ? isUnlocked : !isUnlocked))
      && `${name} ${goal} ${id}`.toLowerCase().includes(query);
  });
  achievementList.innerHTML = visible.map(([id, name, goal]) => {
    const isUnlocked = unlocked.has(id);
    const progress = getAchievementProgress(id, save, isUnlocked);
    const progressText = progress ? `${formatAchievementValue(progress.current, progress.unit)} / ${formatAchievementValue(progress.goal, progress.unit)}` : 'Progress data unavailable in save';
    const percent = progress ? Math.min(100, Math.max(0, progress.current / progress.goal * 100)) : 0;
    return `<article class="achievement-entry ${isUnlocked ? 'unlocked' : 'locked'}"><span class="achievement-state">${isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span><h3>${safe(name)}</h3><p class="achievement-goal">${safe(goal)}</p><div class="achievement-progress"><span>${safe(progressText)}</span>${progress ? `<progress max="100" value="${percent}" aria-label="${safe(name)} progress"></progress>` : ''}</div></article>`;
  }).join('');
  achievementListStatus.textContent = `${visible.length} of ${GAME_ACHIEVEMENTS.length} achievements shown · unlocked state and goals are read from the save and game files.`;
}

function formatAchievementValue(value, unit) {
  if (unit === 'IpS') return `${formatLargeNumber(value)} IpS`;
  if (unit === 'time') {
    const seconds = Math.max(0, Math.floor(value));
    const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), remainder = seconds % 60;
    return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
  }
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${rounded.toLocaleString()}${unit ? ` ${unit}` : ''}`;
}

function getAchievementProgress(id, save, isUnlocked) {
  const number = key => {
    const value = Number(save?.[key]);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  };
  const count = (key, target, unit = '') => {
    const current = number(key);
    return current === null ? null : { current, goal: target, unit };
  };
  const cardsOwned = Array.isArray(save?.collabsOwned) ? save.collabsOwned.map(Number).filter(value => Number.isInteger(value) && value > 0) : null;
  const uniqueCards = cardsOwned ? new Set(cardsOwned).size : null;
  const cardCopies = cardsOwned ? new Map() : null;
  cardsOwned?.forEach(id => cardCopies.set(id, (cardCopies.get(id) || 0) + 1));
  const foilCards = cardCopies && cards.length ? [...cardCopies].filter(([id, copies]) => copies >= 10 && id <= cards.length).length : null;
  const assets = Array.isArray(save?.assetsOwned) ? save.assetsOwned : null;
  const assetAt = id => assets?.find((asset, index) => Number(asset?.id ?? index) === id);
  const upgradeIds = assets ? new Set(assets.flatMap(asset => Array.isArray(asset?.assetUpgradesOwned) ? asset.assetUpgradesOwned.map(Number).filter(Number.isInteger) : [])) : null;
  const upgradedAssets = assets ? assets.filter(asset => Array.isArray(asset?.assetUpgradesOwned) && asset.assetUpgradesOwned.length > 0).length : null;
  const unlocks = Array.isArray(save?.unlocksOwned) ? new Set(save.unlocksOwned.filter(item => item?.purchased !== false).map(item => Number(item?.id)).filter(Number.isInteger)) : null;
  const unlockGroupSizes = [3, 4, 4, 4, 4, 3, 1, 4, 1, 3];
  let unlockOffset = 0;
  const completeUnlockGroups = unlocks ? unlockGroupSizes.filter(size => {
    const complete = Array.from({ length: size }, (_, index) => unlockOffset + index).every(unlockId => unlocks.has(unlockId));
    unlockOffset += size;
    return complete;
  }).length : null;
  const furnitureCount = Array.isArray(save?.furnitureOwned) ? save.furnitureOwned.length : null;
  const progress = (current, goal, unit = '') => current === null ? null : ({ current, goal, unit });
  const achievement = (current, goal, unit = '') => progress(current, goal, unit);
  const assetProgress = (assetId, goal) => {
    const record = assetAt(assetId);
    return record ? achievement(Math.max(0, Number(record.owned) || 0), goal, 'assets') : null;
  };

  if (id === 'freshstart') return achievement(isUnlocked ? 1 : 0, 1, 'completion');
  if (id === 'cardenthusiast') return achievement(uniqueCards, 10, 'cards');
  if (id === 'cardcollector') return achievement(uniqueCards, 50, 'cards');
  if (id === 'cardspecialist') return achievement(uniqueCards, 100, 'cards');
  if (id === 'shinythings') return foilCards === null ? null : achievement(foilCards, 1, 'foil cards');
  if (id === 'treasurepile') return foilCards === null ? null : achievement(foilCards, 20, 'foil cards');
  if (id === 'completecollection') return foilCards === null ? null : achievement(foilCards, 100, 'foil cards');
  if (id === 'newlife') return achievement(number('rebirthCount') === null ? null : Math.max(0, number('rebirthCount') - 1), 1, 'Encores');
  if (id === 'backagain') return number('rebirthCount') === null ? null : achievement(Math.max(0, number('rebirthCount') - 1), 9, 'Encores');
  if (id === 'closedforrenovations') return furnitureCount === null ? null : achievement(furnitureCount, 16, 'furniture items');
  if (id === 'feelslikehome') return furnitureCount === null ? null : achievement(furnitureCount, 52, 'furniture items');
  if (id === 'upgradetime') return upgradeIds === null ? null : achievement(upgradeIds.size, 1, 'upgrades');
  if (id === 'allin') return upgradedAssets === null ? null : achievement(upgradedAssets, ASSET_DATA.length, 'assets upgraded');
  if (id === 'lockedin') return unlocks === null ? null : achievement(unlocks.size, 1, 'unlocks');
  if (id === 'maximumefficiency') return completeUnlockGroups === null ? null : achievement(completeUnlockGroups, unlockGroupSizes.length, 'unlock groups');
  const ipsGoals = { startingout: 1e3, trueicon: 1e5, nowweareidling: 1e6, waithowmanyzeros: 1e9, cantcountthathigh: 1e12, thatsalot: 1e15, nowthatsjustsilly: 1e18 };
  if (ipsGoals[id]) return progress(number('influencePerSecond'), ipsGoals[id], 'IpS');
  if (id === 'banhammer') return count('accountBannedTrolls', 1, 'trolls banned');
  if (id === 'hammerofjustice') return count('accountBannedTrolls', 20, 'trolls banned');
  const assetGoals = {
    fantastic: [0, 1], idolarmy: [0, 100], fanfavorite: [1, 1], primetime: [1, 100], artistictouch: [2, 1], artgallery: [2, 100],
    timetopray: [3, 1], idolgoddess: [3, 100], restbreak: [4, 1], caffeineaddiction: [4, 100], nowsing: [5, 1], sorethroat: [5, 100],
    howmayitakeyourorder: [6, 1], franchising: [6, 100], goinglong: [7, 1], marketcap: [7, 100], showbusiness: [8, 1], worldtour: [8, 100],
    justonemoreroll: [9, 1], icanstopanytime: [9, 100], idolbootcamp: [10, 1], newgeneration: [10, 100], writteninstone: [11, 1], forthehistorybooks: [11, 100],
    admissionticket: [12, 1], waitinline: [12, 100], tropical: [13, 1], fivestars: [13, 100], truefervor: [14, 1], technicallyareligion: [14, 100],
    andacrown: [15, 1], globaldominion: [15, 100], justpolitics: [16, 1], worldruler: [16, 100], researchanddevelopment: [17, 1], bulkknowledge: [17, 100],
    toinfinity: [18, 1], interstellar: [18, 100], whatif: [19, 1], isntoneenough: [19, 100], shattereddream: [20, 1], ironwill: [20, 100]
  };
  if (assetGoals[id]) return assetProgress(...assetGoals[id]);
  const activityGoals = {
    sweetdreams: ['accountSleep', 1, 'times slept'], heavysleeper: ['accountSleep', 50, 'times slept'],
    itadakimasu: ['accountCooked', 1, 'meals cooked'], fullcourse: ['accountCooked', 50, 'meals cooked'],
    stinky: ['accountBath', 1, 'baths'], squeakyclean: ['accountBath', 50, 'baths'],
    happytimes: ['accountHappyPetTimer', 3600, 'time'], pettingsession: ['accountPettingTimer', 1800, 'time']
  };
  if (activityGoals[id]) return count(...activityGoals[id]);
  return null;
}

function renderAssetDashboard(save = importedSave) {
  renderSaveHighlights(save);
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

function renderHoloscope(save = importedSave) {
  const power = Math.max(0, Number(save?.holoscopePower) || 0);
  const hasStars = Array.isArray(save?.stars);
  const starRanks = new Map(hasStars ? save.stars.filter(star => star && typeof star.id === 'string').map(star => [star.id, Math.max(0, Number(star.rank) || 0)]) : []);
  const effectiveRank = rank => Math.floor(rank * power / 100);
  const totalRanks = [...starRanks.values()].reduce((sum, rank) => sum + rank, 0);
  const activeStars = HOLOSCOPE_STARS.filter(star => effectiveRank(starRanks.get(star.id) || 0) > 0).length;
  document.querySelector('#holoscope-power').textContent = save ? `${power}% POWER` : 'WAITING FOR SAVE';
  document.querySelector('#holoscope-summary').textContent = save
    ? hasStars ? `${activeStars} active stars · ${totalRanks.toLocaleString()} saved ranks` : 'This save does not contain Holoscope star data.'
    : 'Load a save file to review Holoscope power and star ranks.';
  const container = document.querySelector('#holoscope-stars');
  if (!save || !hasStars) { container.innerHTML = ''; return; }
  const groupsByCategory = ['Assets', 'Collab groups', 'Directions', 'Special'];
  container.innerHTML = groupsByCategory.map(category => {
    const rows = HOLOSCOPE_STARS.filter(star => star.category === category).map(star => {
      const rank = starRanks.get(star.id) || 0;
      const effective = effectiveRank(rank);
      let currentEffect = star.detail;
      if (star.id.startsWith('star_asset_')) currentEffect = `Income multiplier ×${formatLargeNumber(Math.pow(2, effective))}`;
      else if (star.id.startsWith('star_group_')) currentEffect = `Card effect bonus +${effective * 10}%`;
      else if (star.id.startsWith('star_direction_')) currentEffect = `Card effect bonus +${effective * 20}%`;
      else if (star.id === 'star_add') currentEffect = `Directed Add bonus +${effective * 1000}%`;
      return `<article class="holoscope-star"><div class="holoscope-star-heading"><h3>${safe(star.name)}</h3><span>${rank.toLocaleString()} / ${star.maxRank.toLocaleString()} RANK</span></div><p>${safe(star.detail)}</p><div class="holoscope-star-effect"><span>At ${power}% power</span><strong>${safe(currentEffect)}${power > 0 && effective !== rank ? ` · effective rank ${effective}` : ''}</strong></div></article>`;
    }).join('');
    return `<section class="holoscope-group" aria-label="${safe(category)}"><h2>${safe(category)}</h2><div class="holoscope-grid">${rows}</div></section>`;
  }).join('');
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

function holoscopeRank(starId) {
  const power = Math.max(0, Number(importedSave?.holoscopePower) || 0);
  const star = Array.isArray(importedSave?.stars) ? importedSave.stars.find(item => item?.id === starId) : null;
  return power > 0 ? Math.floor(Math.max(0, Number(star?.rank) || 0) * power / 100) : 0;
}

function holoscopeEffectScale(card, operation) {
  const groupBonus = groups(card).reduce((sum, group) => sum + 10 * holoscopeRank(`star_group_${group.toLowerCase()}`), 0);
  const directionBonus = card.Direction !== 'None' ? 20 * holoscopeRank(`star_direction_${card.Direction.toLowerCase()}`) : 0;
  const addBonus = operation === 'Add' && card.Direction !== 'None' ? 1000 * holoscopeRank('star_add') : 0;
  return 1 + (groupBonus + directionBonus + addBonus) / 100;
}

function calculateBoardEffects() {
  const baseState = id => {
    const card = cards.find(item => item.ID === id);
    const multiplier = foilIds.has(id) ? 2 : 1;
    return {
      regular: Number(card.Value) * 3 * multiplier * holoscopeEffectScale(card, card.EquipOperation),
      conditional: Number(card.ConditionalValue) * 3 * multiplier * holoscopeEffectScale(card, card.ConditionalOperation)
    };
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

function scoreOwnedLayout(layout) {
  const previousPlacements = placements;
  placements = layout;
  try {
    if (hasDirectionalLoop()) return -Infinity;
    const effects = calculateBoardEffects();
    const assetBonuses = new Map();
    const affectionBonuses = new Map();
    const ownedAssets = importedSave && Array.isArray(importedSave.assetsOwned) ? importedSave.assetsOwned : [];
    const ownedCount = name => {
      const canonical = canonicalAssetName(name);
      const asset = ASSET_DATA.find(item => item.name === canonical);
      return asset ? Math.max(0, Number(ownedAssets[asset.id]?.owned) || 0) : 0;
    };
    layout.forEach(id => {
      if (id === null) return;
      const card = cards.find(item => item.ID === id);
      if (!card) return;
      const assets = affectedAssetNames(card);
      if (!assets.length) return;
      const value = effects.get(id)?.regular ?? 0;
      if (!card.SecondaryAsset || card.SecondaryAsset === 'None') {
        assets.forEach(asset => assetBonuses.set(asset, (assetBonuses.get(asset) || 0) + value));
      } else {
        const affection = value * Math.floor(ownedCount(card.SecondaryAsset) / 10);
        assets.forEach(asset => affectionBonuses.set(asset, affection));
      }
    });
    return [...assetBonuses.values(), ...affectionBonuses.values()].reduce((sum, value) => sum + value, 0);
  } finally {
    placements = previousPlacements;
  }
}

function randomOwnedLayout(candidateIds) {
  const pool = [...candidateIds];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const layout = Array(8).fill(null);
  const slotOrder = Array.from({ length: 8 }, (_, index) => index);
  for (let i = slotOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slotOrder[i], slotOrder[j]] = [slotOrder[j], slotOrder[i]];
  }
  pool.slice(0, 8).forEach((id, index) => { layout[slotOrder[index]] = id; });
  return layout;
}

function findBestOwnedLayout() {
  const candidates = cards.filter(card => (ownedCardCounts.get(card.ID) || 0) > 0).map(card => card.ID);
  if (!candidates.length) return null;
  let bestLayout = Array(8).fill(null);
  let bestScore = 0;
  if (placements.every(id => id === null || candidates.includes(id))) {
    const currentScore = scoreOwnedLayout(placements);
    if (currentScore > bestScore) { bestScore = currentScore; bestLayout = [...placements]; }
  }

  for (let restart = 0; restart < 4; restart++) {
    let layout = randomOwnedLayout(candidates);
    let score = scoreOwnedLayout(layout);
    if (score > bestScore) { bestScore = score; bestLayout = [...layout]; }
    for (let round = 0; round < 4; round++) {
      let nextLayout = null;
      let nextScore = score;
      for (let slot = 0; slot < 8; slot++) {
        const previousId = layout[slot];
        if (previousId !== null) {
          layout[slot] = null;
          const removedScore = scoreOwnedLayout(layout);
          if (removedScore > nextScore) { nextScore = removedScore; nextLayout = [...layout]; }
        }
        for (const id of candidates) {
          if (id === previousId || layout.includes(id)) continue;
          layout[slot] = id;
          const candidateScore = scoreOwnedLayout(layout);
          if (candidateScore > nextScore) { nextScore = candidateScore; nextLayout = [...layout]; }
        }
        layout[slot] = previousId;
      }
      for (let left = 0; left < 8; left++) for (let right = left + 1; right < 8; right++) {
        if (layout[left] === layout[right]) continue;
        [layout[left], layout[right]] = [layout[right], layout[left]];
        const candidateScore = scoreOwnedLayout(layout);
        if (candidateScore > nextScore) { nextScore = candidateScore; nextLayout = [...layout]; }
        [layout[left], layout[right]] = [layout[right], layout[left]];
      }
      if (!nextLayout) break;
      layout = nextLayout;
      score = nextScore;
      if (score > bestScore) { bestScore = score; bestLayout = [...layout]; }
    }
  }
  return bestScore > 0 ? { layout: bestLayout, score: bestScore, candidateCount: candidates.length } : null;
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
  const power = Math.max(0, Number(importedSave?.holoscopePower) || 0);
  if (power > 0) sections.push(`<p class="calculator-footnote">Holoscope effects included at ${power}% power (effective star rank is rounded down).</p>`);
  else sections.push('<p class="calculator-footnote">Import a save with Holoscope power and star ranks to include Holoscope card bonuses.</p>');
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
  const ownedCount = [...ownedCardCounts.values()].filter(count => count > 0).length;
  optimizeOwnedButton.disabled = !hasOwnedCardData || ownedCount === 0;
  if (!hasOwnedCardData) ownedSearchStatus.textContent = 'Import a save to search layouts using your cards.';
  else if (ownedCount === 0) ownedSearchStatus.textContent = 'No owned collab cards were found in this save.';
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ placements, foilIds: [...foilIds], presets }));
  renderBoard();
  renderCalculator();
  renderCollection();
  renderPresets();
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
  savePresets = (Array.isArray(save.presets) ? save.presets : []).flatMap((value, index) => {
    const ids = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    if (!ids.length) return [];
    const next = Array(8).fill(null);
    ids.slice(0, 8).forEach((rawId, slot) => {
      const runtimeId = Number(rawId);
      if (Number.isInteger(runtimeId) && runtimeId > 0 && cards.some(card => card.ID === runtimeId - 1)) next[slot] = runtimeId - 1;
    });
    return [{ name: `Save preset ${index + 1}`, placements: next, foilIds: [...nextFoils] }];
  });
  placements = nextPlacements;
  foilIds = nextFoils;
  selectedId = null;
  importedSave = save;
  saveAndRender();
  renderAssetDashboard(save);
  renderHoloscope(save);
  return occupied.size;
}

saveFileInput.addEventListener('change', async () => {
  const file = saveFileInput.files?.[0];
  if (!file) return;
  importStatus.textContent = 'Reading save locally…';
  try {
    const save = await decodeSaveFile(file);
    restoredSaveOnStartup = false;
    importedSave = save;
    if (rememberSaveEnabled) storeImportedSave(save);
    else forgetImportedSave();
    renderAssetDashboard(save);
    renderHoloscope(save);
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
achievementSearch.addEventListener('input', () => renderAchievementList(importedSave));
document.querySelector('.achievement-toolbar .filters').addEventListener('click', event => {
  const button = event.target.closest('[data-achievement-filter]');
  if (!button || button.disabled) return;
  achievementFilter = button.dataset.achievementFilter;
  renderAchievementList(importedSave);
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
optimizeOwnedButton.addEventListener('click', async () => {
  optimizeOwnedButton.disabled = true;
  optimizeOwnedButton.textContent = 'Searching…';
  ownedSearchStatus.textContent = 'Searching owned layouts for higher estimated asset bonuses…';
  await new Promise(resolve => window.setTimeout(resolve, 0));
  try {
    const result = findBestOwnedLayout();
    if (!result) {
      ownedSearchStatus.textContent = 'No positive, loop-free owned layout was found. The board was left unchanged.';
      return;
    }
    placements = result.layout;
    selectedId = null;
    saveAndRender();
    ownedSearchStatus.textContent = `Best layout found from ${result.candidateCount} owned cards · estimated aggregate bonus ${formatLargeNumber(result.score)} percentage points. This is a heuristic search.`;
  } catch (error) {
    ownedSearchStatus.textContent = `Layout search failed: ${error.message || 'unexpected error'}`;
  } finally {
    optimizeOwnedButton.textContent = 'Find best owned layout';
    optimizeOwnedButton.disabled = !hasOwnedCardData || ![...ownedCardCounts.values()].some(count => count > 0);
  }
});
document.querySelector('#copy-share-code').addEventListener('click', async () => {
  const input = document.querySelector('#share-code');
  const status = document.querySelector('#share-status');
  input.value = encodeSharedLayout();
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(input.value);
    else {
      input.focus();
      input.select();
      if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
    }
    status.textContent = 'Layout code copied. Paste it to share this board.';
  } catch {
    input.focus();
    input.select();
    status.textContent = 'Code generated. Copy the selected text to share it.';
  }
});
document.querySelector('#load-share-code').addEventListener('click', () => {
  const status = document.querySelector('#share-status');
  if (!cards.length) { status.textContent = 'Wait for the card catalog to load, then try again.'; return; }
  try {
    const layout = decodeSharedLayout(document.querySelector('#share-code').value);
    placements = layout.placements;
    foilIds = new Set(layout.foilIds);
    selectedId = null;
    saveAndRender();
    status.textContent = 'Shared layout loaded.';
  } catch (error) {
    status.textContent = error.message;
  }
});
document.querySelector('#board-presets').addEventListener('change', event => {
  const [source, rawIndex] = event.target.value.split(':');
  const index = Number(rawIndex);
  const preset = source === 'save' ? savePresets[index] : source === 'local' ? presets[index] : null;
  if (!preset) { document.querySelector('#delete-preset').disabled = true; return; }
  placements = [...preset.placements];
  foilIds = new Set(preset.foilIds);
  selectedId = null;
  saveAndRender();
});
document.querySelector('#save-preset').addEventListener('click', () => {
  const name = window.prompt('Name this board preset:')?.trim().slice(0, 40);
  if (!name) return;
  const existing = presets.findIndex(preset => preset.name.toLowerCase() === name.toLowerCase());
  const preset = { name, placements: [...placements], foilIds: [...foilIds] };
  if (existing >= 0) presets[existing] = preset;
  else presets.push(preset);
  const picker = document.querySelector('#board-presets');
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ placements, foilIds: [...foilIds], presets }));
  renderPresets();
  picker.value = `local:${existing >= 0 ? existing : presets.length - 1}`;
});
document.querySelector('#delete-preset').addEventListener('click', () => {
  const picker = document.querySelector('#board-presets');
  if (!picker.value.startsWith('local:')) return;
  const index = Number(picker.value.slice('local:'.length));
  if (!presets[index]) return;
  presets.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ placements, foilIds: [...foilIds], presets }));
  renderPresets();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && selectedId !== null) { selectedId = null; renderCollection(); updateHint(); }
});

renderAssetDashboard(importedSave);
renderHoloscope(importedSave);
fetch(CARD_FILE).then(response => {
  if (!response.ok) throw new Error('Card data could not be loaded.');
  return response.text();
}).then(text => {
  cards = fromCsv(text);
  const valid = new Set(cards.map(card => card.ID));
  placements = placements.map(id => valid.has(id) ? id : null);
  foilIds = new Set([...foilIds].filter(id => valid.has(id)));
  presets = presets.map(preset => ({ ...preset, placements: preset.placements.map(id => id === null || valid.has(id) ? id : null), foilIds: preset.foilIds.filter(id => valid.has(id)) }));
  document.querySelector('#card-total').textContent = `${cards.length} CARDS`;
  renderDirectionFilters();
  renderPresets();
  saveAndRender();
  if (pendingSave) {
    const save = pendingSave;
    pendingSave = null;
    try {
      const count = importCardSetup(save);
      importStatus.textContent = restoredSaveOnStartup
        ? `Restored remembered save · ${count} equipped card${count === 1 ? '' : 's'}.`
        : `Loaded ${count} equipped card${count === 1 ? '' : 's'}; foil inferred from owned copies.`;
      restoredSaveOnStartup = false;
    } catch (error) {
      importStatus.textContent = `Assets loaded; card board import failed: ${error.message || 'unexpected save structure'}`;
    }
  }
}).catch(error => {
  document.querySelector('#card-total').textContent = 'DATA UNAVAILABLE';
  collection.innerHTML = `<div class="empty-state">${safe(error.message)} Open this folder through a local web server if your browser blocks file access.</div>`;
});
