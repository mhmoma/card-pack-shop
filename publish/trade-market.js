window.CardShop = window.CardShop || {};
window.CardShop.tradeMarket = (() => {
  const { pokemonData, config } = window.CardShop;
  let page = 0;
  let loading = false;

  function available() { return !!window.dzmm?.fn?.invoke; }
  async function invoke(method, args = {}) {
    if (!available()) throw new Error('交易所需要在游戏环境中使用');
    return window.dzmm.fn.invoke('trade-market', { method, ...args });
  }

  function cardFromMarket(item) {
    const data = pokemonData.byId[item.card.pokemonId];
    const rarity = config.rarities.find((r) => r.key === item.card.rarityKey) || config.rarities[4];
    return {
      id: `trade-${item.code}`,
      pokemonId: item.card.pokemonId,
      name: data?.zh || '未知卡片',
      sprite: item.card.shiny ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${item.card.pokemonId}.png` : data?.sprite,
      types: data?.types || [],
      rarity,
      shiny: item.card.shiny,
      value: item.price,
    };
  }

  function listingHtml(item, cardHtml) {
    const card = cardFromMarket(item);
    return `<div class="trade-item">${cardHtml(card)}<p>${item.sellerTag} · 暗号 ${item.code}</p><button data-buy-listing="${item.code}" data-price="${item.price}">购买 ${item.price} 金币</button></div>`;
  }

  async function list(cardHtml, append = false) {
    if (loading) return;
    loading = true;
    try {
      const res = await invoke('list', { page });
      const html = res.items.length ? res.items.map((x) => listingHtml(x, cardHtml)).join('') : '<div class="empty">交易所暂无上架卡片。</div>';
      const box = document.getElementById('tradeList');
      box.innerHTML = append ? box.innerHTML + html : html;
      document.getElementById('loadMoreTrade').classList.toggle('hidden', !res.hasMore);
      if (res.hasMore) page += 1;
    } catch (err) {
      document.getElementById('tradeList').innerHTML = `<div class="empty">交易所暂不可用：${err.message}</div>`;
    } finally { loading = false; }
  }

  async function refresh(cardHtml) { page = 0; await list(cardHtml, false); }
  async function create(card, price) { return invoke('create', { card: { pokemonId: card.pokemonId, shiny: card.shiny, rarityKey: card.rarity.key, price } }); }
  async function buy(code) { return invoke('buy', { code }); }
  async function claim() { return available() ? invoke('claim') : { gold: 0, sold: [] }; }

  return { refresh, list, create, buy, claim, cardFromMarket };
})();
