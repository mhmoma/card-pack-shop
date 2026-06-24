window.CardShop = window.CardShop || {};

window.CardShop.pokeApi = {
  cache: new Map(),

  getById(id) {
    return window.CardShop.pokemonData.byId[id];
  },

  async getPokemon(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const item = this.getById(id);
    if (!item) throw new Error(`pokemon ${id} missing`);
    const pokemon = { id: item.id, name: item.zh, sprite: item.sprite, types: item.types, stats: item.total };
    this.cache.set(id, pokemon);
    return pokemon;
  },

  getPool(packType) {
    const all = window.CardShop.pokemonData.sortedByTotal;
    const roll = Math.random();
    if (packType === 'premium') return this.pickTier(all, roll, [0, 330, 450, 530, 580], [0.2, 0.38, 0.28, 0.11, 0.03]);
    if (packType === 'shiny') return this.pickTier(all, roll, [0, 330, 450, 530, 580], [0.18, 0.36, 0.29, 0.13, 0.04]);
    if (packType === 'mystery') return this.pickTier(all, roll, [0, 330, 450, 530, 580], [0.3, 0.3, 0.23, 0.12, 0.05]);
    if (packType === 'type') return this.pickTier(all, roll, [0, 330, 450, 530, 580], [0.42, 0.34, 0.18, 0.05, 0.01]);
    return this.pickTier(all, roll, [0, 330, 450, 530, 580], [0.7, 0.22, 0.07, 0.009, 0.001]);
  },

  pickTier(all, roll, mins, chances) {
    let acc = 0;
    let tier = 0;
    for (let i = 0; i < chances.length; i++) {
      acc += chances[i];
      if (roll <= acc) { tier = i; break; }
    }
    const min = mins[tier];
    const max = mins[tier + 1] ?? Infinity;
    return all.filter((p) => p.total >= min && p.total < max);
  },

  async getRandomByPack(packType) {
    const pool = this.getPool(packType);
    const item = pool[Math.floor(Math.random() * pool.length)];
    return this.getPokemon(item.id);
  },
};
