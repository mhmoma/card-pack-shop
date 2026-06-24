window.CardShop = window.CardShop || {};
window.CardShop.marketTrends = (() => {
  const rarity = [
    { key: 'common', name: '普卡补全季', label: '普通卡 +25%', rate: 1.25 },
    { key: 'uncommon', name: '优秀卡收购', label: '优秀卡 +22%', rate: 1.22 },
    { key: 'rare', name: '稀有卡热卖', label: '稀有卡 +30%', rate: 1.3 },
    { key: 'epic', name: '史诗竞价', label: '史诗卡 +40%', rate: 1.4 },
    { key: 'legendary', name: '传说追猎', label: '传说卡 +55%', rate: 1.55 },
    { key: 'shiny', name: '闪光收藏夜', label: '闪光卡 +80%', rate: 1.8 },
  ];
  const region = [
    { key: '1', name: '关都怀旧展', label: '关都卡 +35%', rate: 1.35 },
    { key: '2', name: '城都巡回展', label: '城都卡 +35%', rate: 1.35 },
    { key: '3', name: '丰缘海报季', label: '丰缘卡 +35%', rate: 1.35 },
    { key: '4', name: '神奥古代展', label: '神奥卡 +35%', rate: 1.35 },
    { key: '5', name: '合众贸易节', label: '合众卡 +35%', rate: 1.35 },
    { key: '6', name: '卡洛斯沙龙', label: '卡洛斯卡 +35%', rate: 1.35 },
    { key: '7', name: '阿罗拉观光季', label: '阿罗拉卡 +35%', rate: 1.35 },
    { key: '8', name: '伽勒尔联赛周', label: '伽勒尔卡 +35%', rate: 1.35 },
    { key: '9', name: '帕底亚新星展', label: '帕底亚卡 +35%', rate: 1.35 },
  ];
  const pack = [
    { key: 'common', name: '新人补给潮', label: '普通卡包 +20%', rate: 1.2 },
    { key: 'type', name: '属性包订货季', label: '属性卡包 +28%', rate: 1.28 },
    { key: 'premium', name: '高级包缺货', label: '高级卡包 +35%', rate: 1.35 },
    { key: 'mystery', name: '神秘包传闻', label: '神秘卡包 +45%', rate: 1.45 },
    { key: 'shiny', name: '闪光包拍卖', label: '闪光卡包 +70%', rate: 1.7 },
  ];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function roll() {
    const mood = pick(window.CardShop.config.marketMoods);
    const r = pick(rarity), g = pick(region), p = pick(pack);
    return { ...mood, rarityBoost: r, regionBoost: g, packBoost: p, news: `商会公告：${r.name}、${g.name}与${p.name}同时开启。` };
  }
  function ensure(mood) { return mood?.rarityBoost ? mood : roll(); }
  function cardRate(card, mood) {
    let rate = mood.rate;
    const rb = mood.rarityBoost;
    if ((rb.key === 'shiny' && card.shiny) || rb.key === card.rarity?.key) rate *= rb.rate;
    if (card.regionTag === mood.regionBoost.key || card.generationTag === mood.regionBoost.key) rate *= mood.regionBoost.rate;
    return rate;
  }
  function packRate(packItem, mood) { return mood.packBoost.key === packItem.type ? mood.packBoost.rate : 1; }
  function html(mood) {
    return `<div class="trend-news">${mood.news}</div><div class="trend-chips"><span>${mood.rarityBoost.label}</span><span>${mood.regionBoost.label}</span><span>${mood.packBoost.label}</span></div>`;
  }
  return { roll, ensure, cardRate, packRate, html };
})();
