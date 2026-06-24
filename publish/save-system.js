window.CardShop = window.CardShop || {};
window.CardShop.saveSystem = (() => {
  const { storage, config } = window.CardShop;
  const slotKey = (slot) => `card-shop-save-slot-${slot}`;
  const legacyKey = 'card-shop-save-v1';
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let activeSlot = 1;

  async function coldStart(update) {
    update?.(8, '云端存档冷启动中...');
    await sleep(700);
  }

  async function readSlot(slot) {
    const data = await storage.get(slotKey(slot));
    if (!data && Number(slot) === 1) return storage.get(legacyKey);
    return data;
  }

  async function prepare(slot, update) {
    activeSlot = Number(slot) || 1;
    await coldStart(update);
    update?.(24, `读取卡槽 ${activeSlot}...`);
    const saveTask = readSlot(activeSlot);
    const assetTask = preloadAssets(update);
    const [saved] = await Promise.all([saveTask, assetTask]);
    update?.(100, '准备进入商店...');
    await sleep(220);
    return saved;
  }

  async function preloadAssets(update) {
    const list = Object.values(config.assets).filter(Boolean);
    let done = 0;
    await Promise.all(list.map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        done += 1;
        update?.(30 + Math.floor((done / list.length) * 66), `加载素材 ${done}/${list.length}...`);
        resolve();
      };
      img.src = src;
    })));
  }

  async function save(state) { return saveTo(activeSlot, state); }

  async function saveTo(slot, state) {
    activeSlot = Number(slot) || activeSlot;
    await storage.put(slotKey(activeSlot), { ...state, savedAt: Date.now(), activeSlot });
  }

  async function slotMetas() {
    const slots = [1, 2, 3];
    return Promise.all(slots.map(async (slot) => {
      const data = await readSlot(slot);
      return { slot, hasData: !!data, gold: data?.gold || 0, cards: data?.cards?.length || 0, packs: data?.packs?.length || 0, savedAt: data?.savedAt || 0 };
    }));
  }

  return { prepare, save, saveTo, slotMetas };
})();
