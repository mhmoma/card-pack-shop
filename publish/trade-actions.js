window.CardShop = window.CardShop || {};
(() => {
  const { tradeMarket, ui, pokemonData, config } = window.CardShop;
  const state = () => window.CardShop.gameState;
  const save = () => window.CardShop.saveGame?.();
  const toast = (msg) => window.dzmm?.toast?.info?.(msg) || alert(msg);
  let listingCardId = '';
  const $ = (id) => document.getElementById(id);

  window.CardShop.afterGameStart = async () => {
    try {
      const payout = await tradeMarket.claim();
      if (payout.gold > 0) {
        state().gold += payout.gold;
        await save();
        ui.renderAll(state());
        toast(`交易所成交收入 +${payout.gold} 金币`);
      }
      await tradeMarket.refresh(ui.cardHtml);
    } catch (err) { console.warn('trade claim failed:', err.message); }
  };

  function cardFromBuy(result) {
    const data = pokemonData.byId[result.card.pokemonId];
    const rarity = config.rarities.find((r) => r.key === result.card.rarityKey) || config.rarities[4];
    return { id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, pokemonId: result.card.pokemonId, name: data?.zh, sprite: result.card.shiny ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${result.card.pokemonId}.png` : data?.sprite, types: data?.types || [], rarity, shiny: result.card.shiny, value: result.price };
  }
  function closeListingPopup() {
    listingCardId = '';
    $('listingPopup')?.classList.add('hidden');
  }
  function showListingPopup(card) {
    listingCardId = card.id;
    $('listingPopupName').textContent = `上架 ${card.name || '宝可梦卡'}`;
    $('listingPriceInput').value = String(Math.max(card.value, 50));
    $('listingPopup').classList.remove('hidden');
    $('listingPriceInput').focus();
  }
  async function confirmListing() {
    const card = state().cards.find((x) => x.id === listingCardId);
    if (!card) return closeListingPopup();
    const price = Math.floor(Number($('listingPriceInput').value));
    if (!Number.isFinite(price) || price < 20) return toast('上架价格至少 20 金币');
    try {
      await tradeMarket.create(card, price);
      state().cards = state().cards.filter((x) => x.id !== card.id);
      closeListingPopup();
      await save(); ui.renderAll(state()); await tradeMarket.refresh(ui.cardHtml);
    } catch (err) { toast(err.message); }
  }

  document.addEventListener('click', async (e) => {
    const listBtn = e.target.closest('[data-list-card]');
    if (listBtn) {
      const card = state().cards.find((x) => x.id === listBtn.dataset.listCard);
      if (card) showListingPopup(card);
    }
    const buyBtn = e.target.closest('[data-buy-listing]');
    if (buyBtn) {
      const price = Number(buyBtn.dataset.price);
      if (state().gold < price) return toast('金币不足');
      try {
        const result = await tradeMarket.buy(buyBtn.dataset.buyListing);
        state().gold -= result.price;
        state().cards.push(cardFromBuy(result));
        await save(); ui.renderAll(state()); await tradeMarket.refresh(ui.cardHtml);
      } catch (err) { toast(err.message); }
    }
    const shopBtn = e.target.closest('[data-open-shop]');
    if (shopBtn) tradeMarket.openShop(shopBtn.dataset.openShop, ui.cardHtml);
    if (e.target.closest('[data-back-shops]')) tradeMarket.backShops(ui.cardHtml);
    if (e.target.id === 'loadMoreTrade') tradeMarket.list(ui.cardHtml, true);
    if (e.target.id === 'closeListingPopup') closeListingPopup();
    if (e.target.id === 'confirmListingBtn') confirmListing();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeListingPopup();
    if (e.key === 'Enter' && !$('listingPopup')?.classList.contains('hidden')) confirmListing();
  });
})();
