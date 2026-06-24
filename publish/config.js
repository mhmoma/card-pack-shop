window.CardShop = window.CardShop || {};

window.CardShop.config = {
  refreshMs: 5 * 60 * 1000,
  manualRefreshCost: 80,
  initialGold: 1200,
  assets: {
    shopBg: './assets/generated/shop-background.7289aaf8.webp',
    shelfFrame: './assets/generated/shelf-frame.f5d57463.webp',
    commonPack: './assets/generated/pack-common.6c28cdde.webp',
    premiumPack: './assets/generated/pack-premium.3641f824.webp',
    mysteryPack: './assets/generated/pack-mystery.79d21089.webp',
  },
  packTypes: {
    common: { name: '普通卡包', price: 100, cards: 3, image: 'commonPack', rareBoost: 0, market: 0.75 },
    type: { name: '属性卡包', price: 180, cards: 3, image: 'commonPack', rareBoost: 0.08, market: 0.82 },
    premium: { name: '高级卡包', price: 350, cards: 5, image: 'premiumPack', rareBoost: 0.16, market: 0.9 },
    shiny: { name: '闪光卡包', price: 600, cards: 5, image: 'premiumPack', rareBoost: 0.24, market: 1.05 },
    mystery: { name: '神秘卡包', price: 420, cards: 4, image: 'mysteryPack', rareBoost: 0.18, market: 1.15 },
  },
  rarities: [
    { key: 'common', name: '普通', chance: 0.6, value: 1, maxId: 600 },
    { key: 'uncommon', name: '优秀', chance: 0.25, value: 1.7, maxId: 850 },
    { key: 'rare', name: '稀有', chance: 0.1, value: 3.2, maxId: 950 },
    { key: 'epic', name: '史诗', chance: 0.04, value: 6, maxId: 1010 },
    { key: 'legendary', name: '传说', chance: 0.01, value: 12, maxId: 1025 },
  ],
  marketMoods: [
    { name: '低迷', rate: 0.72 },
    { name: '平稳', rate: 1 },
    { name: '火热', rate: 1.38 },
    { name: '收藏热潮', rate: 1.82 },
  ],
};
