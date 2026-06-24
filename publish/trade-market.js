window.CardShop = window.CardShop || {};
window.CardShop.tradeMarket = (() => {
  const { pokemonData, config } = window.CardShop;
  let page = 0;
  let loading = false;
  let playerName = '';
  let lastItems = [];
  let selectedShop = '';
  let shopKeys = [];
  let lastHasMore = false;

  function available() { return !!window.dzmm?.fn?.invoke; }
  async function invoke(method, args = {}) {
    if (!available()) throw new Error('交易所需要在游戏环境中使用');
    return window.dzmm.fn.invoke('trade-market', { method, ...args });
  }
  async function currentName() {
    if (playerName) return playerName;
    try { const info = await window.dzmm?.user?.info?.(); playerName = info?.name || info?.nickname || info?.username || ''; } catch (_) {}
    return playerName;
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
    return `<div class="trade-item">${cardHtml(card)}<p>${item.price} 金币</p><button data-buy-listing="${item.code}" data-price="${item.price}">购买</button></div>`;
  }
  function safeAttr(value) { return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function shopHtml(name, items, key) {
    const top = cardFromMarket(items[0]);
    return `<button class="trainer-shop" data-open-shop="${key}"><b>${name}</b><span>${items.length} 张上架</span><em>最低 ${Math.min(...items.map((x) => x.price))} 金币</em><small>${top.shiny ? '闪光 ' : ''}${safeAttr(top.name)}</small></button>`;
  }
  function groupedShops() {
    const groups = Object.create(null);
    lastItems.forEach((x) => { groups[x.sellerTag] = [...(groups[x.sellerTag] || []), x]; });
    shopKeys = Object.keys(groups);
    return groups;
  }
  function render(cardHtml) {
    const box = document.getElementById('tradeList');
    const groups = groupedShops();
    if (selectedShop) {
      const items = groups[selectedShop] || [];
      box.innerHTML = `<button class="trade-back" data-back-shops="1">返回店铺列表</button>` + (items.length ? items.map((x) => listingHtml(x, cardHtml)).join('') : '<div class="empty">这个店铺暂无上架卡片。</div>');
    } else {
      const shops = Object.entries(groups);
      box.innerHTML = shops.length ? shops.map(([name, items], i) => shopHtml(name, items, i)).join('') : '<div class="empty">交易所暂无上架卡片。</div>';
    }
  }
  async function list(cardHtml, append = false) {
    if (loading) return;
    loading = true;
    try {
      const res = await invoke('list', { page, sellerName: await currentName() });
      lastItems = append ? lastItems.concat(res.items) : res.items;
      lastHasMore = res.hasMore;
      render(cardHtml);
      document.getElementById('loadMoreTrade').classList.toggle('hidden', !lastHasMore || !!selectedShop);
      if (lastHasMore) page += 1;
    } catch (err) {
      document.getElementById('tradeList').innerHTML = `<div class="empty">交易所暂不可用：${err.message}</div>`;
    } finally { loading = false; }
  }

  async function refresh(cardHtml) { page = 0; selectedShop = ''; lastHasMore = false; await list(cardHtml, false); }
  function openShop(key, cardHtml) {
    selectedShop = shopKeys[Number(key)] || '';
    render(cardHtml);
    document.getElementById('loadMoreTrade').classList.add('hidden');
  }
  function backShops(cardHtml) {
    selectedShop = '';
    render(cardHtml);
    document.getElementById('loadMoreTrade').classList.toggle('hidden', !lastHasMore);
  }
  async function create(card, price) { return invoke('create', { sellerName: await currentName(), card: { pokemonId: card.pokemonId, shiny: card.shiny, rarityKey: card.rarity.key, price } }); }
  async function buy(code) { return invoke('buy', { code }); }
  async function claim() { return available() ? invoke('claim') : { gold: 0, sold: [] }; }

  return { refresh, list, create, buy, claim, cardFromMarket, openShop, backShops };
})();
