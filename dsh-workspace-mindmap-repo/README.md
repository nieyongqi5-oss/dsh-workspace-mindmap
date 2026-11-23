# dsh-workspace-mindmap

A DeepSeek Harness (DSH) web bundle that turns workspace history into a mind-map home page and folds the left sidebar entries into a top navigation bar.

## What it does

- **Top navigation bar** — 新会话 / 会话 / 工作区 / 思维导图 / 插件 / 定时任务, drawn into the `shell.overlay` slot so the shipped layout stays untouched.
- **Mind-map panel** — registers a `mindmap` key on the `main` slot. It reads real sessions from `sessions.list`, groups them by title keywords into 9 apps, splits each app into 进行中 / 已完成, and shows two leaves per group plus a "… 还有 N 条" row.
- Click an app to fly the camera to it and expand that group; single-click a leaf for its summary, double-click to open the session.
- Search box, four leaf densities (text / dot / bar / full), and a `← 全览` button.

## Install

```bash
dsh plugin install <path-to-this-directory>
```

or in DSH: 插件 → 从本地安装 → point at this directory, then reload the page.

## Compatibility

Built against the DSH web shell (`@deepseek-ai/dsh-client-ui-layout`). The top bar positions itself relative to the shipped `.frame`, so a large DSH layout change may require a small adjustment.

## License

MIT
