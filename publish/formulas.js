window.CardShop = window.CardShop || {};
window.CardShop.formulas = (() => {
  const shinyPremium = { common: 8, uncommon: 9.5, rare: 11, epic: 13, legendary: 16 };
  const shinyDamp = { common: 1, uncommon: .9, rare: .72, epic: .52, legendary: .36 };
  const money = (n) => Math.max(0, Math.floor(n));
  const rand = (min, max) => min + Math.random() * (max - min);

  function cardBase(total) {
    return 12 + Math.pow(total / 100, 2.15) * 8;
  }

  function cardValue(total, rarity, shiny) {
    const base = cardBase(total);
    const variance = rand(.92, 1.12);
    if (!shiny) return money(base * rarity.value * variance);
    return money((base * rarity.value * (shinyPremium[rarity.key] || 9) + 320) * variance);
  }

  function shinyChance(rarity, pack) {
    const bonus = pack?.shinyBonus || 0;
    const chance = rarity.shinyChance + bonus * (shinyDamp[rarity.key] || .8);
    return Math.min(.12, chance);
  }

  function packValue(pack) {
    const rareFactor = 1 + (pack.rareBoost || 0) * 3.2;
    const shinyFactor = 1 + (pack.shinyBonus || 0) * 8.5;
    const scarcity = 1 + Math.max(0, 25 - (pack.spawnWeight || 10)) * .018;
    return money((34 * pack.cards + 52) * rareFactor * shinyFactor * scarcity);
  }

  function packShopPrice(pack) {
    return money(packValue(pack) * rand(.92, 1.12));
  }

  function packMarketValue(pack, paidPrice, moodRate) {
    const fair = packValue(pack);
    const anchor = paidPrice || fair;
    return money((fair * .72 + anchor * .28) * pack.market * moodRate);
  }

  function weightedPackType(packTypes) {
    const entries = Object.entries(packTypes);
    const total = entries.reduce((sum, [, pack]) => sum + pack.spawnWeight, 0);
    let roll = Math.random() * total;
    for (const [type, pack] of entries) {
      roll -= pack.spawnWeight;
      if (roll <= 0) return type;
    }
    return 'common';
  }

  return { cardValue, shinyChance, packValue, packShopPrice, packMarketValue, weightedPackType };
})();
