/**
 * 空白模板 - 从这里开始创作
 *
 * 可用的 SDK API：
 *
 * 1. AI 对话（流式）
 *    await dzmm.completions({ model, messages: [{role, content}], maxTokens }, (text, done) => { ... })
 *
 * 2. AI 绘图
 *    const result = await dzmm.draw({ prompt: '描述' })
 *
 * 3. 持久化存储（替代 localStorage，沙箱内 localStorage 不可用）
 *    await dzmm.kv.put('key', value)
 *    const { value } = await dzmm.kv.get('key')
 *
 * 4. 用户信息
 *    const { name, avatarUrl } = await dzmm.user.info()
 *
 * 5. 可用模型列表
 *    const { models, defaultModel } = await dzmm.models.list()
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    ready: false,
    userName: null,
    userAvatar: null,
    modelId: null,

    async init() {
      // 等待 SDK 就绪（必须）
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve();
        }, 5000);
        const handler = (event) => {
          if (event.data?.type === 'dzmm:ready') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve();
          }
        };
        window.addEventListener('message', handler);
      });

      // 获取用户信息
      try {
        const info = await window.dzmm.user.info();
        this.userName = info?.name || null;
        this.userAvatar = info?.avatarUrl || null;
      } catch (e) { console.warn('[SDK] user.info failed:', e); }

      // 获取可用模型
      try {
        const models = await window.dzmm.models.list();
        const first = models?.models?.[0];
        this.modelId = models?.defaultModel || (typeof first === 'string' ? first : first?.internalName);
      } catch (e) { console.warn('[SDK] models.list failed:', e); }

      this.ready = true;
    },
  }));
});
