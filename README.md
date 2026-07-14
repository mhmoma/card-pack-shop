# 卡包商店

卡包收集向小游戏：卡槽存档 + 云端冷启动后进入商店。

## 结构

```
publish/     # 游戏前端（静态资源）
functions/   # 云端函数（存档/冷启动等）
uploads/     # 上传资源
```

## 本地预览

```bash
cd publish
npx serve .
```

打开页面后选择存档卡槽即可进入。

## 说明

- 前端为可缓存的静态资源，部署后若样式/脚本不更新，请按平台习惯刷新 CDN 缓存或带版本查询参数。
- 云端存档依赖 `functions/`，需与对应托管平台（如 Cloudflare Pages Functions）一并部署。
