window.CardShop = window.CardShop || {};

window.CardShop.pokeApi = {
  cache: new Map(),
  speciesCache: new Map(),

  async getPokemon(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`Pokemon data ${res.status}`);
    const data = await res.json();
    const pokemon = {
      id: data.id,
      name: await this.getChineseName(data.species.url, data.name),
      sprite: this.getBestSprite(data.sprites),
      types: data.types.map((t) => t.type.name),
      stats: data.stats.reduce((sum, item) => sum + item.base_stat, 0),
    };
    this.cache.set(id, pokemon);
    return pokemon;
  },

  getBestSprite(sprites) {
    return sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default
      || sprites?.other?.showdown?.front_default
      || sprites?.front_default
      || sprites?.other?.['official-artwork']?.front_default;
  },

  async getChineseName(url, fallback) {
    if (this.speciesCache.has(url)) return this.speciesCache.get(url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`species ${res.status}`);
      const data = await res.json();
      const item = data.names.find((n) => n.language.name === 'zh-Hans')
        || data.names.find((n) => n.language.name === 'zh-Hant');
      const name = item?.name || fallback;
      this.speciesCache.set(url, name);
      return name;
    } catch (err) {
      console.warn('pokemon name failed:', err.message);
      return fallback;
    }
  },

  async getRandom(maxId) {
    const id = 1 + Math.floor(Math.random() * maxId);
    return this.getPokemon(id);
  },
};
