window.CardShop = window.CardShop || {};

window.CardShop.pokeApi = {
  cache: new Map(),

  async getPokemon(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`PokeAPI ${res.status}`);
    const data = await res.json();
    const pokemon = {
      id: data.id,
      name: data.name,
      sprite: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default,
      types: data.types.map((t) => t.type.name),
      stats: data.stats.reduce((sum, item) => sum + item.base_stat, 0),
    };
    this.cache.set(id, pokemon);
    return pokemon;
  },

  async getRandom(maxId) {
    const id = 1 + Math.floor(Math.random() * maxId);
    return this.getPokemon(id);
  },
};
