window.CardShop = window.CardShop || {};

window.CardShop.pokeApi = {
  cache: new Map(),

  getById(id) {
    return window.CardShop.pokemonData.sortedByTotal.find((p) => p.id === id);
  },

  async getPokemon(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const item = this.getById(id);
    if (!item) throw new Error(`pokemon ${id} missing`);
    const pokemon = {
      id: item.id,
      name: item.zh,
      sprite: item.sprite,
      types: item.types,
      stats: item.total,
    };
    this.cache.set(id, pokemon);
    return pokemon;
  },

  translateName(name) {
    return window.CardShop.pokemonData.nameMap[name] || name;
  },

  async getRandom(maxId) {
    const pool = window.CardShop.pokemonData.sortedByTotal.filter((p) => p.id <= maxId);
    const item = pool[Math.floor(Math.random() * pool.length)];
    return this.getPokemon(item.id);
  },
};
