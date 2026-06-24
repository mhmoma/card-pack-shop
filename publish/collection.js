window.CardShop = window.CardShop || {};

window.CardShop.collection = (() => {
  const regions = [
    { key: 'all', name: '全部地区', gen: 'all', min: 1, max: 1025 },
    { key: 'kanto', name: '关都', gen: 'gen1', min: 1, max: 151 },
    { key: 'johto', name: '城都', gen: 'gen2', min: 152, max: 251 },
    { key: 'hoenn', name: '丰缘', gen: 'gen3', min: 252, max: 386 },
    { key: 'sinnoh', name: '神奥', gen: 'gen4', min: 387, max: 493 },
    { key: 'unova', name: '合众', gen: 'gen5', min: 494, max: 649 },
    { key: 'kalos', name: '卡洛斯', gen: 'gen6', min: 650, max: 721 },
    { key: 'alola', name: '阿罗拉', gen: 'gen7', min: 722, max: 809 },
    { key: 'galar', name: '伽勒尔', gen: 'gen8', min: 810, max: 905 },
    { key: 'paldea', name: '帕底亚', gen: 'gen9', min: 906, max: 1025 },
  ];
  const generations = [
    { key: 'all', name: '全部世代' },
    { key: 'gen1', name: '一世代' },
    { key: 'gen2', name: '二世代' },
    { key: 'gen3', name: '三世代' },
    { key: 'gen4', name: '四世代' },
    { key: 'gen5', name: '五世代' },
    { key: 'gen6', name: '六世代' },
    { key: 'gen7', name: '七世代' },
    { key: 'gen8', name: '八世代' },
    { key: 'gen9', name: '九世代' },
  ];
  const qualities = [
    { key: 'all', name: '全部品质' },
    { key: 'shiny', name: '闪光' },
    { key: 'legendary', name: '传说' },
    { key: 'epic', name: '史诗' },
    { key: 'rare', name: '稀有' },
    { key: 'uncommon', name: '优秀' },
    { key: 'common', name: '普通' },
  ];
  const rank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

  function defaultFilter() { return { region: 'all', generation: 'all', quality: 'all' }; }
  function regionOf(id) { return regions.find((r) => id >= r.min && id <= r.max) || regions[0]; }
  function uniqueCount(cards) { return new Set(cards.map((c) => c.pokemonId)).size; }

  function match(card, filter) {
    const region = regionOf(card.pokemonId);
    if (filter.region !== 'all' && region.key !== filter.region) return false;
    if (filter.generation !== 'all' && region.gen !== filter.generation) return false;
    if (filter.quality === 'shiny') return card.shiny;
    if (filter.quality !== 'all' && card.rarity.key !== filter.quality) return false;
    return true;
  }

  function sorted(cards) {
    return [...cards].sort((a, b) => {
      if (a.shiny !== b.shiny) return a.shiny ? -1 : 1;
      const rarityDiff = (rank[b.rarity.key] || 0) - (rank[a.rarity.key] || 0);
      if (rarityDiff) return rarityDiff;
      if (b.value !== a.value) return b.value - a.value;
      return a.pokemonId - b.pokemonId;
    });
  }

  function filterCards(cards, filter) { return sorted(cards.filter((card) => match(card, filter))); }

  function stats(allCards, shownCards, filter) {
    const shiny = shownCards.filter((card) => card.shiny).length;
    const total = `${allCards.length} 张 / ${uniqueCount(allCards)} 种`;
    const shown = `${shownCards.length} 张 / ${uniqueCount(shownCards)} 种`;
    const active = [filter.region, filter.generation, filter.quality].filter((v) => v !== 'all').length;
    return active ? `当前 ${shown} · 总收藏 ${total} · 闪光 ${shiny} 张` : `已收藏 ${total} · 闪光 ${shiny} 张`;
  }

  return { regions, generations, qualities, defaultFilter, filterCards, stats };
})();
