window.CardShop = window.CardShop || {};
window.CardShop.income = (() => {
  const cooldown = 3 * 60 * 1000;
  function ensure(state) { state.income = state.income || { nextAt: 0, total: 0 }; }
  function amount(state) {
    const scale = Math.min(180, (state.cards?.length || 0) * 5 + (state.packs?.length || 0) * 12);
    const relief = (state.gold || 0) < 150 ? 220 : 0;
    return Math.floor(160 + scale + relief);
  }
  function left(state) { ensure(state); return Math.max(0, state.income.nextAt - Date.now()); }
  function canClaim(state) { return left(state) <= 0; }
  function claim(state) {
    if (!canClaim(state)) return 0;
    const gold = amount(state);
    state.gold += gold;
    state.income.nextAt = Date.now() + cooldown;
    state.income.total = (state.income.total || 0) + gold;
    return gold;
  }
  function panel(state) {
    ensure(state);
    const wait = left(state);
    const m = String(Math.floor(wait / 60000)).padStart(2, '0');
    const s = String(Math.floor((wait % 60000) / 1000)).padStart(2, '0');
    const ready = wait <= 0;
    return `<div><b>商会委托</b><span>${ready ? '周转金币已备好' : `下次委托 ${m}:${s}`}</span></div><p>低金币时会追加补助，防止市场停滞。</p><button data-claim-income="1" ${ready ? '' : 'disabled'}>领取 ${amount(state)} 金币</button>`;
  }
  return { ensure, claim, panel };
})();
