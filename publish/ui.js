window.CardShop = window.CardShop || {};

window.CardShop.ui = (() => {
  const { config } = window.CardShop;
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
    $('collectionInfo').textContent = `${state.cards.length} 张卡 · ${new Set(state.cards.map((c) => c.pokemonId)).size} 种宝可梦`;
    $('cardsGrid').innerHTML = state.cards.length ? state.cards.map(cardHtml).join('') : '<div class="empty">还没有收藏，打开卡包试试。</div>';
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
    return `<div class="shelf-item pos-${index} ${slot.sold ? 'sold' : ''}" ${slot.sold ? '' : `data-buy="${slot.id}"`}>
      <img class="shelf-pack-img" src="${img}" alt="${pack.name}">
      <div class="shelf-price"><b>${pack.name}</b><span>${slot.sold ? '已售罄' : `${slot.price} 金币`}</span></div>
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
    return `<article class="poke-card ${card.rarity.key} ${card.shiny ? 'shiny' : ''}">
      <span class="tag">${card.rarity.name}${card.shiny ? ' 闪' : ''}</span>
      <img src="${card.sprite}" alt="${card.name}" loading="lazy">
      <h3>#${card.pokemonId} ${card.name}</h3><p>${card.types.join(' / ')}</p>
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
  }

  return { setup, renderAll, renderRefreshText, cardHtml, showModal, switchTab };
})();
