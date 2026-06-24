window.CardShop = window.CardShop || {};

window.CardShop.collection = (() => {
  const regions = [
    { key: 'all', name: '全部地区', min: 1, max: 1025 },
    { key: '1', name: '关都', min: 1, max: 151 },
    { key: '2', name: '城都', min: 152, max: 251 },
    { key: '3', name: '丰缘', min: 252, max: 386 },
    { key: '4', name: '神奥', min: 387, max: 493 },
    { key: '5', name: '合众', min: 494, max: 649 },
    { key: '6', name: '卡洛斯', min: 650, max: 721 },
    { key: '7', name: '阿罗拉', min: 722, max: 809 },
    { key: '8', name: '伽勒尔', min: 810, max: 905 },
    { key: '9', name: '帕底亚', min: 906, max: 1025 },
  ];
  const generations = [
    { key: 'all', name: '全部世代' },
    { key: '1', name: '一世代' },
    { key: '2', name: '二世代' },
    { key: '3', name: '三世代' },
    { key: '4', name: '四世代' },
    { key: '5', name: '五世代' },
    { key: '6', name: '六世代' },
    { key: '7', name: '七世代' },
    { key: '8', name: '八世代' },
    { key: '9', name: '九世代' },
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
  const tagVersion = 'region-generation-v2';
  const legacy = { kanto: '1', johto: '2', hoenn: '3', sinnoh: '4', unova: '5', kalos: '6', alola: '7', galar: '8', paldea: '9', gen1: '1', gen2: '2', gen3: '3', gen4: '4', gen5: '5', gen6: '6', gen7: '7', gen8: '8', gen9: '9' };

  function defaultFilter() { return { region: 'all', generation: 'all', quality: 'all' }; }
  function regionOf(id) { return regions.find((r) => id >= r.min && id <= r.max) || regions[0]; }
  function uniqueCount(cards) { return new Set(cards.map((c) => c.pokemonId)).size; }
  function normalizeValue(value) { return legacy[value] || value || 'all'; }
  function normalizeFilter(filter) {
    return { region: normalizeValue(filter?.region), generation: normalizeValue(filter?.generation), quality: filter?.quality || 'all' };
  }

  function tagPokemonData() {
    const data = window.CardShop.pokemonData;
    if (!data || data.tagVersion === tagVersion) return;
    data.sortedByTotal.forEach((pokemon) => {
      const region = regionOf(Number(pokemon.id));
      pokemon.regionTag = region.key;
      pokemon.generationTag = region.key;
      if (data.byId[pokemon.id]) {
        data.byId[pokemon.id].regionTag = region.key;
        data.byId[pokemon.id].generationTag = region.key;
      }
    });
    data.tagVersion = tagVersion;
  }

  function tagCard(card) {
    const data = window.CardShop.pokemonData.byId[card.pokemonId];
    const region = data?.regionTag || regionOf(Number(card.pokemonId)).key;
    card.regionTag = region;
    card.generationTag = region;
    return card;
  }

  function tagCards(cards) { tagPokemonData(); cards.forEach(tagCard); return cards; }

  function match(card, rawFilter) {
    const filter = normalizeFilter(rawFilter);
    tagCard(card);
    if (filter.region !== 'all' && card.regionTag !== filter.region) return false;
    if (filter.generation !== 'all' && card.generationTag !== filter.generation) return false;
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

  function filterCards(cards, filter) { return sorted(tagCards(cards).filter((card) => match(card, filter))); }

  function stats(allCards, shownCards, rawFilter) {
    const filter = normalizeFilter(rawFilter);
    const shiny = shownCards.filter((card) => card.shiny).length;
    const total = `${allCards.length} 张 / ${uniqueCount(allCards)} 种`;
    const shown = `${shownCards.length} 张 / ${uniqueCount(shownCards)} 种`;
    const active = [filter.region, filter.generation, filter.quality].filter((v) => v !== 'all').length;
    return active ? `当前 ${shown} · 总收藏 ${total} · 闪光 ${shiny} 张` : `已收藏 ${total} · 闪光 ${shiny} 张`;
  }

  return { regions, generations, qualities, defaultFilter, normalizeFilter, filterCards, stats, tagPokemonData, tagCard, tagCards };
})();
