(() => {
  const { config, storage, pokeApi, ui } = window.CardShop;
  const key = 'card-shop-save-v1';
  const state = { gold: 0, shop: [], packs: [], cards: [], marketMood: null, nextRefresh: 0, tab: 'shop' };
  let selectedPackId = null;
  const $ = (id) => document.getElementById(id);

  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function money(n) { return Math.max(0, Math.floor(n)); }
  function typeName(type) {
    return ({ normal: '一般', fire: '火', water: '水', electric: '电', grass: '草', ice: '冰', fighting: '格斗', poison: '毒', ground: '地面', flying: '飞行', psychic: '超能', bug: '虫', rock: '岩石', ghost: '幽灵', dragon: '龙', dark: '恶', steel: '钢', fairy: '妖精' })[type] || type;
  }

  function rollRarity(boost = 0) {
    const r = Math.random();
    let acc = 0;
    for (const rarity of config.rarities) {
      const bonus = ['rare', 'epic', 'legendary'].includes(rarity.key) ? boost : -boost / 3;
      acc += Math.max(0.01, rarity.chance + bonus);
      if (r <= acc) return rarity;
    }
    return config.rarities[0];
  }

  function makeShop() {
    const types = Object.keys(config.packTypes);
    state.marketMood = pick(config.marketMoods);
    state.shop = Array.from({ length: 12 }, (_, i) => {
      const type = Math.random() < 0.12 ? 'mystery' : pick(types);
      const base = config.packTypes[type];
      return { id: uid('slot'), type, price: money(base.price * (0.85 + Math.random() * 0.35)), sold: false, hot: i === 0 && Math.random() < 0.5 };
    });
    state.nextRefresh = Date.now() + config.refreshMs;
  }

  function marketPackPrice(pack) {
    const base = config.packTypes[pack.type];
    return money((pack.price || base.price) * base.market * state.marketMood.rate);
  }
  function marketCardPrice(card) { return money(card.value * state.marketMood.rate); }

  async function save() { await storage.put(key, state); }

  async function load() {
    const saved = await storage.get(key);
    Object.assign(state, saved || { gold: config.initialGold });
    if (!state.nextRefresh || Date.now() >= state.nextRefresh || state.shop.length < 12) makeShop();
    if (!state.marketMood) state.marketMood = pick(config.marketMoods);
    ui.setup({ pack: marketPackPrice, card: marketCardPrice });
    await localizeOldCards();
    ui.renderAll(state);
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
    ui.showModal('开包中...', '<div class="empty">正在拆封卡包，卡牌能量正在显现...</div>');
    try {
      const cards = [];
      for (let i = 0; i < base.cards; i++) cards.push(await makeCard(base.rareBoost));
      state.cards.push(...cards);
      state.packs = state.packs.filter((x) => x.id !== id);
      await save();
      ui.renderAll(state);
      ui.showModal('开包结果', cards.map(ui.cardHtml).join(''));
    } catch (err) {
      console.error('open pack failed:', err.message, err.stack);
      ui.showModal('开包失败', '<div class="empty">网络异常，请稍后再试。卡包没有被消耗。</div>');
    }
  }

  async function makeCard(boost) {
    const rarity = rollRarity(boost);
    const p = await pokeApi.getRandom(rarity.maxId);
    const shiny = Math.random() < 0.035 + boost / 4;
    return { id: uid('card'), pokemonId: p.id, name: p.name, sprite: p.sprite, types: p.types, rarity, shiny, value: money((20 + p.stats / 8) * rarity.value * (shiny ? 3 : 1)) };
  }

  async function localizeOldCards() {
    const oldCards = state.cards.filter((c) => /[a-z]/i.test(c.name));
    if (!oldCards.length) return;
    for (const card of oldCards) {
      const p = await pokeApi.getPokemon(card.pokemonId);
      card.name = p.name;
      card.sprite = p.sprite || card.sprite;
      card.types = p.types;
    }
    await save();
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
    const pack = config.packTypes[slot.type];
    selectedPackId = id;
    $('buyPopupName').textContent = pack.name;
    $('buyPopupPrice').textContent = `${slot.price} 金币 · ${pack.cards} 张卡`;
    $('buyPopup').classList.remove('hidden');
  }

  document.addEventListener('click', (e) => {
    const previewBuy = e.target.closest('[data-preview-buy]');
    if (previewBuy) showBuyPopup(previewBuy.dataset.previewBuy);
    const buy = e.target.closest('[data-buy]');
    if (buy) buyPack(buy.dataset.buy);
    if (e.target.dataset.open) openPack(e.target.dataset.open);
    if (e.target.dataset.sellPack) sellPack(e.target.dataset.sellPack);
    if (e.target.dataset.sellCard) sellCard(e.target.dataset.sellCard);
    if (e.target.dataset.tab) {
      $('buyPopup').classList.add('hidden');
      ui.switchTab(e.target.dataset.tab);
    }
  });

  $('closeModal').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('closeBuyPopup').addEventListener('click', () => $('buyPopup').classList.add('hidden'));
  $('confirmBuyBtn').addEventListener('click', async () => {
    if (!selectedPackId) return;
    await buyPack(selectedPackId);
    $('buyPopup').classList.add('hidden');
    selectedPackId = null;
  });
  load();
})();
