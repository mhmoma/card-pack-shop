export default async function (request: any, ctx: any) {
  const body = request.body ?? {};
  const method = String(body.method || 'list');
  if (method === 'list') return list(ctx, body);
  if (method === 'create') return create(ctx, body);
  if (method === 'buy') return buy(ctx, body);
  if (method === 'claim') return claim(ctx);
  if (method === 'cancel') return cancel(ctx, body);
  throw new Error('unknown market method');
}

const PAGE_SIZE = 40;
const LIST_KEY = 'trade_market_codes_v1';
const PAYOUT_PREFIX = 'trade_payout_v1_';
const DETAIL_PREFIX = 'trade_listing_v1_';
const rarityMap: any = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const rarityNames = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
function sellerLock(ctx: any) { return hashText(`${ctx.gameId}:${ctx.user?.id || 'guest'}`); }
function sellerTag(lock: string) { return `训练师#${lock.slice(-4).toUpperCase()}`; }
function encCard(card: any) {
  const id = Number(card?.pokemonId);
  const price = Number(card?.price);
  const r = rarityMap[String(card?.rarityKey || card?.rarity?.key || 'common')];
  if (!Number.isInteger(id) || id < 1 || id > 1025) throw new Error('invalid card id');
  if (!Number.isInteger(price) || price < 20 || price > 999999) throw new Error('invalid price');
  if (r === undefined) throw new Error('invalid rarity');
  return `${id.toString(36)}${card?.shiny ? 's' : 'n'}${r}`;
}
function decCard(cardCode: string) {
  const r = Number(cardCode.slice(-1));
  return { pokemonId: parseInt(cardCode.slice(0, -2), 36), shiny: cardCode.slice(-2, -1) === 's', rarityKey: rarityNames[r] || 'common' };
}
async function codes(ctx: any) { return ((await ctx.kv.global.get(LIST_KEY))?.value ?? []) as string[]; }
async function putCodes(ctx: any, list: string[]) { await ctx.kv.global.put(LIST_KEY, list.slice(0, 200)); }

async function list(ctx: any, body: any) {
  const page = Math.max(0, Number(body.page || 0));
  const all = await codes(ctx);
  const slice = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const items = [];
  for (const code of slice) {
    const v = (await ctx.kv.global.get(DETAIL_PREFIX + code))?.value;
    if (v) items.push({ code, card: decCard(v.cardCode), price: v.price, sellerTag: sellerTag(v.seller), createdAt: v.createdAt });
  }
  return { items, hasMore: all.length > (page + 1) * PAGE_SIZE };
}

async function create(ctx: any, body: any) {
  const lock = sellerLock(ctx);
  const current = await codes(ctx);
  let mine = 0;
  for (const code of current) {
    const v = (await ctx.kv.global.get(DETAIL_PREFIX + code))?.value;
    if (v?.seller === lock) mine++;
  }
  if (mine >= 4) throw new Error('每个玩家最多上架 4 个卡位');
  const cardCode = encCard(body.card);
  const code = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const price = Number(body.card.price);
  await ctx.kv.global.put(DETAIL_PREFIX + code, { cardCode, price, seller: lock, createdAt: Date.now() });
  await putCodes(ctx, [code, ...current]);
  return { code, sellerTag: sellerTag(lock), card: decCard(cardCode), price };
}

async function buy(ctx: any, body: any) {
  const code = String(body.code || '');
  const detailKey = DETAIL_PREFIX + code;
  const item = (await ctx.kv.global.get(detailKey))?.value;
  if (!item) throw new Error('商品已不存在');
  const buyer = sellerLock(ctx);
  if (item.seller === buyer) throw new Error('不能购买自己的上架');
  const listNow = (await codes(ctx)).filter((x: string) => x !== code);
  await putCodes(ctx, listNow);
  await ctx.kv.global.delete(detailKey);
  const payoutKey = PAYOUT_PREFIX + item.seller;
  const payout = (await ctx.kv.global.get(payoutKey))?.value ?? { gold: 0, sold: [] };
  payout.gold += item.price;
  payout.sold = [{ code, price: item.price, at: Date.now() }, ...(payout.sold || [])].slice(0, 20);
  await ctx.kv.global.put(payoutKey, payout);
  return { code, card: decCard(item.cardCode), price: item.price };
}

async function claim(ctx: any) {
  const key = PAYOUT_PREFIX + sellerLock(ctx);
  const payout = (await ctx.kv.global.get(key))?.value ?? { gold: 0, sold: [] };
  if (payout.gold > 0) await ctx.kv.global.put(key, { gold: 0, sold: [] });
  return payout;
}

async function cancel(ctx: any, body: any) {
  const code = String(body.code || '');
  const key = DETAIL_PREFIX + code;
  const item = (await ctx.kv.global.get(key))?.value;
  if (!item) throw new Error('商品已不存在');
  if (item.seller !== sellerLock(ctx)) throw new Error('只能撤回自己的上架');
  await ctx.kv.global.delete(key);
  await putCodes(ctx, (await codes(ctx)).filter((x: string) => x !== code));
  return { code, card: decCard(item.cardCode), price: item.price };
}
