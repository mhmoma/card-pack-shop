window.CardShop = window.CardShop || {};

window.CardShop.ui = (() => {
  const { config, collection } = window.CardShop;
  const $ = (id) => document.getElementById(id);
  let priceFns = null;

  function setup(fns) { priceFns = fns; }

  function renderAll(state) {
    $('gold').textContent = state.gold;
    renderRefreshText(state);
    renderShop(state);
    renderPacks(state);
    renderCards(state);
    renderMarket(state);
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
    $('packsList').innerHTML = state.packs.length ? state.packs.map((pack) =>
      `<div class="owned-pack">${packCard(pack, true)}
      <div class="row"><button data-open="${pack.id}">打开</button><button data-sell-pack="${pack.id}">出售</button></div></div>`
    ).join('') : '<div class="empty">暂无卡包，去商店买一个吧。</div>';
  }

  function renderCards(state) {
    const filter = collection.normalizeFilter(state.collectionFilter || collection.defaultFilter());
    const shown = collection.filterCards(state.cards, filter);
    $('collectionInfo').textContent = collection.stats(state.cards, shown, filter);
    $('collectionFilters').innerHTML = filterGroup('region', collection.regions, filter.region)
      + filterGroup('generation', collection.generations, filter.generation)
      + filterGroup('quality', collection.qualities, filter.quality);
    $('cardsGrid').innerHTML = shown.length ? shown.map(cardHtml).join('') : '<div class="empty">当前分类暂无卡片，换个地区或品质看看。</div>';
  }

  function filterGroup(type, items, active) {
    return `<div class="filter-row">${items.map((item) =>
      `<button class="filter-chip ${item.key === active ? 'active' : ''}" data-filter-type="${type}" data-filter-value="${item.key}">${item.name}</button>`
    ).join('')}</div>`;
  }

  function renderMarket(state) {
    $('marketText').textContent = `当前行情：${state.marketMood.name}，售价倍率 ${state.marketMood.rate}x`;
    const dupes = state.cards.filter((c, i, arr) => arr.findIndex((x) => x.pokemonId === c.pokemonId) !== i);
    $('marketList').innerHTML = dupes.length ? dupes.map((c) =>
      `<div class="market-item">${cardHtml(c)}<button data-sell-card="${c.id}">出售 ${priceFns.card(c)} 金币</button></div>`
    ).join('') : '<div class="empty">没有重复卡可出售。未开卡包可在“卡包”页出售。</div>';
  }

  function shelfPack(slot, index) {
    const pack = config.packTypes[slot.type];
    const img = config.assets[pack.image];
    return `<div class="shelf-item pos-${index} ${slot.sold ? 'sold' : ''}" ${slot.sold ? '' : `data-preview-buy="${slot.id}"`}>
      <img class="shelf-pack-img" src="${img}" alt="${pack.name}">
    </div>`;
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

  return { setup, renderAll, renderRefreshText, cardHtml, showModal, switchTab };
})();
