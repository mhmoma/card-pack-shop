(() => {
  const { config, storage, pokeApi, ui, collection, formulas } = window.CardShop;
  const key = 'card-shop-save-v1';
  const state = { gold: 0, shop: [], packs: [], cards: [], marketMood: null, nextRefresh: 0, tab: 'shop', collectionFilter: null };
  let selectedPackId = null;
  let selectedOwnedPackId = null;
  const $ = (id) => document.getElementById(id);
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function money(n) { return Math.max(0, Math.floor(n)); }
  function rarityByTotal(total) {
    return config.rarities.find((rarity) => total >= rarity.minTotal) || config.rarities[config.rarities.length - 1];
  }
  function cardValue(total, rarity, shiny) { return formulas.cardValue(total, rarity, shiny); }
  function shinySprite(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
  }
  function makeShop() {
    state.marketMood = pick(config.marketMoods);
    state.shop = Array.from({ length: 12 }, (_, i) => {
      const type = formulas.weightedPackType(config.packTypes);
      const base = config.packTypes[type];
      return { id: uid('slot'), type, price: formulas.packShopPrice(base), sold: false, hot: i === 0 && Math.random() < 0.5 };
    });
    state.nextRefresh = Date.now() + config.refreshMs;
  }
  function marketPackPrice(pack) {
    const base = config.packTypes[pack.type];
    return formulas.packMarketValue(base, pack.price, state.marketMood.rate);
  }
  function marketCardPrice(card) { return money(card.value * state.marketMood.rate); }
  async function save() { await storage.put(key, state); }
  async function load() {
    const saved = await storage.get(key);
    Object.assign(state, saved || { gold: config.initialGold });
    if (!state.nextRefresh || Date.now() >= state.nextRefresh || state.shop.length < 12) makeShop();
    if (!state.marketMood) state.marketMood = pick(config.marketMoods);
    collection.tagPokemonData(); collection.tagCards(state.cards);
    state.collectionFilter = collection.normalizeFilter(state.collectionFilter || collection.defaultFilter());
    ui.setup({ pack: marketPackPrice, card: marketCardPrice });
    await normalizeOldCards();
    ui.renderAll(state);
    ui.switchTab(state.tab || 'shop');
    setInterval(tick, 1000);
    await save();
  }
  function tick() {
    if (Date.now() >= state.nextRefresh) {
      makeShop();
      save();
      ui.renderAll(state);
    } else ui.renderRefreshText(state);
  }
  async function buyPack(id) {
    const slot = state.shop.find((x) => x.id === id);
    if (!slot || slot.sold || state.gold < slot.price) return toast('金币不足或商品已售罄');
    state.gold -= slot.price;
    slot.sold = true;
    state.packs.push({ ...slot, id: uid('pack'), boughtAt: Date.now() });
    await save();
    ui.renderAll(state);
  }
  async function openPack(id) {
    $('buyPopup').classList.add('hidden');
    const pack = state.packs.find((x) => x.id === id);
    if (!pack) return;
    const base = config.packTypes[pack.type];
    ui.showModal('开包中...', `<div class="pack-opening"><img class="opening-pack-art" src="${config.assets[base.image]}" alt="${base.name}"><div class="soft-sparkles"><i></i><i></i><i></i><i></i><i></i><i></i></div><p>封印正在解除，稀有卡牌即将显现...</p></div>`);
    try {
      const startedAt = Date.now();
      const cards = [];
      for (let i = 0; i < base.cards; i++) cards.push(await makeCard(pack.type));
      const remain = 1800 - (Date.now() - startedAt);
      if (remain > 0) await new Promise((resolve) => setTimeout(resolve, remain));
      state.cards.push(...cards);
      state.packs = state.packs.filter((x) => x.id !== id);
      await save();
      ui.renderAll(state);
      ui.showModal('开包结果', `<div class="opening-results">${cards.map(ui.cardHtml).join('')}</div>`);
    } catch (err) {
      console.error('open pack failed:', err.message, err.stack);
      ui.showModal('开包失败', '<div class="empty">网络异常，请稍后再试。卡包没有被消耗。</div>');
    }
  }
  async function makeCard(packType) {
    const p = await pokeApi.getRandomByPack(packType);
    const rarity = rarityByTotal(p.stats);
    const pack = config.packTypes[packType];
    const shiny = Math.random() < formulas.shinyChance(rarity, pack);
    const card = { id: uid('card'), pokemonId: p.id, name: p.name, sprite: shiny ? shinySprite(p.id) : p.sprite, types: p.types, rarity, shiny, value: cardValue(p.stats, rarity, shiny) };
    return collection.tagCard(card);
  }
  async function normalizeOldCards() {
    let changed = false;
    for (const card of state.cards) {
      const p = await pokeApi.getPokemon(card.pokemonId);
      const rarity = rarityByTotal(p.stats);
      if (card.name !== p.name || card.rarity?.key !== rarity.key) changed = true;
      card.name = p.name;
      card.sprite = card.shiny ? shinySprite(p.id) : (p.sprite || card.sprite);
      card.types = p.types;
      card.rarity = rarity;
      card.value = cardValue(p.stats, rarity, card.shiny);
      collection.tagCard(card);
    }
    if (changed) await save();
  }
  async function sellPack(id) {
    const pack = state.packs.find((x) => x.id === id);
    if (!pack) return;
    state.gold += marketPackPrice(pack);
    state.packs = state.packs.filter((x) => x.id !== id);
    await save();
    ui.renderAll(state);
  }
  async function sellCard(id) {
    const card = state.cards.find((x) => x.id === id);
    if (!card) return;
    state.gold += marketCardPrice(card);
    state.cards = state.cards.filter((x) => x.id !== id);
    await save();
    ui.renderAll(state);
  }
  function toast(msg) { if (window.dzmm?.toast) dzmm.toast.warning(msg); else alert(msg); }
  function showBuyPopup(id) {
    const slot = state.shop.find((x) => x.id === id);
    if (!slot || slot.sold) return;
    const pack = config.packTypes[slot.type]; selectedPackId = id;
    $('buyPopupName').textContent = pack.name;
    $('buyPopupPrice').textContent = `${slot.price} 金币 · ${pack.cards} 张卡`;
    $('buyPopup').classList.remove('hidden');
  }
  function showPackPopup(id) {
    const owned = state.packs.find((x) => x.id === id);
    if (!owned) return;
    const pack = config.packTypes[owned.type]; selectedOwnedPackId = id;
    $('packPopupName').textContent = pack.name;
    $('packPopupInfo').textContent = `${pack.cards} 张卡 · 市场价 ${marketPackPrice(owned)} 金币`;
    $('packPopup').classList.remove('hidden');
  }
  document.addEventListener('click', (e) => {
    const previewBuy = e.target.closest('[data-preview-buy]');
    if (previewBuy) showBuyPopup(previewBuy.dataset.previewBuy);
    const buy = e.target.closest('[data-buy]'); if (buy) buyPack(buy.dataset.buy);
    const packPreview = e.target.closest('[data-pack-preview]');
    if (packPreview) return showPackPopup(packPreview.dataset.packPreview);
    if (e.target.dataset.open) openPack(e.target.dataset.open);
    if (e.target.dataset.sellPack) sellPack(e.target.dataset.sellPack);
    if (e.target.dataset.sellCard) sellCard(e.target.dataset.sellCard);
    const filterBtn = e.target.closest('[data-filter-type]');
    if (filterBtn) {
      state.collectionFilter = collection.normalizeFilter(state.collectionFilter || collection.defaultFilter());
      state.collectionFilter[filterBtn.dataset.filterType] = filterBtn.dataset.filterValue;
      ui.renderAll(state);
      save();
      return;
    }
    if (e.target.dataset.tab) {
      $('buyPopup').classList.add('hidden');
      $('packPopup').classList.add('hidden');
      state.tab = e.target.dataset.tab;
      ui.switchTab(state.tab);
      save();
    }
  });
  $('closeModal').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('closeBuyPopup').addEventListener('click', () => $('buyPopup').classList.add('hidden'));
  $('closePackPopup').addEventListener('click', () => $('packPopup').classList.add('hidden'));
  async function useSelectedPack(action) {
    if (!selectedOwnedPackId) return;
    $('packPopup').classList.add('hidden'); await action(selectedOwnedPackId);
    selectedOwnedPackId = null;
  }
  $('openSelectedPack').addEventListener('click', () => useSelectedPack(openPack));
  $('sellSelectedPack').addEventListener('click', () => useSelectedPack(sellPack));
  $('confirmBuyBtn').addEventListener('click', async () => {
    if (!selectedPackId) return;
    await buyPack(selectedPackId);
    $('buyPopup').classList.add('hidden');
    selectedPackId = null;
  });
  load();
})();
