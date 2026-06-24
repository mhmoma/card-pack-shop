window.CardShop = window.CardShop || {};

window.CardShop.ui = (() => {
  const { config, collection, income } = window.CardShop;
  const $ = (id) => document.getElementById(id);
  let priceFns = null;
  let collectionLimit = 48;

  function setup(fns) { priceFns = fns; }

  function renderAll(state) {
    $('gold').textContent = state.gold;
    renderRefreshText(state);
    renderShop(state);
    renderPacks(state);
    renderCards(state);
    renderMarket(state);
    renderIncome(state);
  }

  function renderRefreshText(state) {
    const left = Math.max(0, state.nextRefresh - Date.now());
    const m = String(Math.floor(left / 60000)).padStart(2, '0');
    const s = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    $('refreshText').textContent = `自动刷新 ${m}:${s} · 市场${state.marketMood?.name || '平稳'}`;
  }

  function renderShop(state) {
    $('shopGrid').innerHTML = `<div class="shelf-stage">
      <img class="scene-frame" src="${config.assets.shelfFrame}" alt="商店货架">
      ${state.shop.map((slot, index) => shelfPack(slot, index)).join('')}
    </div>`;
  }

  function renderPacks(state) {
    $('packsList').innerHTML = state.packs.length ? state.packs.map(packIcon).join('') : '<div class="empty">暂无卡包，去商店买一个吧。</div>';
  }

  function renderCards(state) {
    const filter = collection.normalizeFilter(state.collectionFilter || collection.defaultFilter());
    const shown = collection.filterCards(state.cards, filter);
    const page = shown.slice(0, collectionLimit);
    $('collectionInfo').textContent = `${collection.stats(state.cards, shown, filter)} · 已显示 ${page.length}/${shown.length}`;
    $('collectionFilters').innerHTML = filterGroup('region', collection.regions, filter.region)
      + filterGroup('generation', collection.generations, filter.generation)
      + filterGroup('quality', collection.qualities, filter.quality);
    $('cardsGrid').innerHTML = page.length ? page.map(collectionCardHtml).join('') : '<div class="empty">当前分类暂无卡片，换个地区或品质看看。</div>';
    $('loadMoreCards').classList.toggle('hidden', page.length >= shown.length);
  }

  function filterGroup(type, items, active) {
    return `<div class="filter-row">${items.map((item) =>
      `<button class="filter-chip ${item.key === active ? 'active' : ''}" data-filter-type="${type}" data-filter-value="${item.key}">${item.name}</button>`
    ).join('')}</div>`;
  }

  function renderIncome(state) { $('incomePanel').innerHTML = income.panel(state); }

  function renderMarket(state) {
    $('marketText').textContent = `当前行情：${state.marketMood.name}，售价倍率 ${state.marketMood.rate}x`;
    const dupes = state.cards.filter((c, i, arr) => arr.findIndex((x) => x.pokemonId === c.pokemonId) !== i);
    $('marketList').innerHTML = dupes.length ? dupes.map((c) =>
      `<div class="market-item">${cardHtml(c)}<button data-sell-card="${c.id}">出售 ${priceFns.card(c)} 金币</button><button data-list-card="${c.id}">上架交易</button></div>`
    ).join('') : '<div class="empty">没有重复卡可出售。未开卡包可在“卡包”页出售。</div>';
  }

  function shelfPack(slot, index) {
    const pack = config.packTypes[slot.type];
    const img = config.assets[pack.image];
    return `<div class="shelf-item pos-${index} ${slot.sold ? 'sold' : ''}" ${slot.sold ? '' : `data-preview-buy="${slot.id}"`}>
      <img class="shelf-pack-img" src="${img}" alt="${pack.name}">
    </div>`;
  }

  function packIcon(slot) {
    const pack = config.packTypes[slot.type];
    const img = config.assets[pack.image];
    return `<button class="pack-token" data-pack-preview="${slot.id}">
      <img src="${img}" alt="${pack.name}">
      <span>${pack.name}</span>
    </button>`;
  }

  function packCard(slot, owned) {
    const pack = config.packTypes[slot.type];
    const img = config.assets[pack.image];
    const price = owned ? priceFns.pack(slot) : slot.price;
    return `<article class="pack-card ${slot.sold ? 'sold' : ''}">
      <div class="pack-art"><img src="${img}" alt="${pack.name}"></div>
      <h3>${pack.name}</h3><p>${pack.cards} 张卡 · ${slot.hot ? '热门' : '常规'}</p>
      <strong>${price} 金币</strong></article>`;
  }

  function collectionCardHtml(card) {
    return `<div class="collection-trade">${cardHtml(card)}<button data-list-card="${card.id}">上架交易</button></div>`;
  }

  function cardHtml(card) {
    const data = window.CardShop.pokemonData.byId[card.pokemonId];
    const name = data?.zh || card.name;
    const types = data?.types || card.types;
    const sprite = card.shiny
      ? (card.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${card.pokemonId}.png`)
      : (data?.sprite || card.sprite);
    const bgKey = card.shiny ? 'cardBgShiny' : `cardBg${card.rarity.key[0].toUpperCase()}${card.rarity.key.slice(1)}`;
    return `<article class="poke-card ${card.rarity.key} ${card.shiny ? 'shiny' : ''}">
      <img class="card-bg" src="${config.assets[bgKey]}" alt="" loading="lazy">
      <img class="pokemon-art" src="${sprite}" alt="${name}" loading="lazy">
      <h3>${name}</h3><p>${types.join(' / ')}</p>
      <strong>价值 ${priceFns.card(card)}</strong></article>`;
  }

  function showModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modal').classList.remove('hidden');
  }

  function switchTab(tab) {
    ['shop', 'packs', 'collection', 'market'].forEach((name) => {
      $(`${name}View`).classList.toggle('hidden', name !== tab);
      document.querySelector(`[data-tab="${name}"]`).classList.toggle('active', name === tab);
    });
    document.body.classList.toggle('shop-active', tab === 'shop');
  }

  function renderSlots(slots) {
    $('saveSlots').innerHTML = slots.map((slot) => `<details class="save-slot" ${slot.slot === 1 ? 'open' : ''}>
      <summary><b>卡槽 ${slot.slot}</b><span>${slot.hasData ? `${slot.cards} 卡 · ${slot.packs} 包` : '空卡槽'}</span></summary>
      <p>${slot.hasData ? `金币 ${slot.gold} · ${slot.savedAt ? new Date(slot.savedAt).toLocaleString() : '旧存档'}` : '没有存档，可直接开始新游戏。'}</p>
      <div><button data-start-slot="${slot.slot}">${slot.hasData ? '读取' : '新游戏'}</button><button data-save-slot="${slot.slot}">存入</button></div>
    </details>`).join('');
  }

  function showCover() {
    $('coverScreen').classList.remove('hidden');
    $('loadingScreen').classList.add('hidden');
    $('app').classList.add('locked');
  }

  function showLoading(progress, text) {
    $('coverScreen').classList.add('hidden');
    $('loadingScreen').classList.remove('hidden');
    $('loadingText').textContent = text;
    $('loadingFill').style.width = `${Math.min(100, progress)}%`;
  }

  function enterGame() {
    $('coverScreen').classList.add('hidden');
    $('loadingScreen').classList.add('hidden');
    $('app').classList.remove('locked');
  }
  function resetCollectionLimit() { collectionLimit = 48; }
  function extendCollectionLimit() { collectionLimit += 48; }

  return { setup, renderAll, renderRefreshText, renderIncome, cardHtml, showModal, switchTab, renderSlots, showCover, showLoading, enterGame, resetCollectionLimit, extendCollectionLimit };
})();
