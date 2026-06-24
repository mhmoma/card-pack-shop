window.CardShop = window.CardShop || {};
(() => {
  const { tradeMarket, ui, pokemonData, config } = window.CardShop;
  const state = () => window.CardShop.gameState;
  const save = () => window.CardShop.saveGame?.();
  const toast = (msg) => window.dzmm?.toast?.info?.(msg) || alert(msg);

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

  document.addEventListener('click', async (e) => {
    const listBtn = e.target.closest('[data-list-card]');
    if (listBtn) {
      const card = state().cards.find((x) => x.id === listBtn.dataset.listCard);
      if (!card) return;
      const price = Number(prompt('输入上架价格', String(Math.max(card.value, 50))));
      if (!Number.isFinite(price) || price <= 0) return;
      try {
        await tradeMarket.create(card, Math.floor(price));
        state().cards = state().cards.filter((x) => x.id !== card.id);
        await save(); ui.renderAll(state()); await tradeMarket.refresh(ui.cardHtml);
      } catch (err) { toast(err.message); }
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
    if (e.target.id === 'loadMoreTrade') tradeMarket.list(ui.cardHtml, true);
  });
})();
