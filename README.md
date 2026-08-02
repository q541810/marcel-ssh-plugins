# Marcel SSH 插件市场

[Marcel SSH](https://github.com/q541810/Marcel-SSH) 的官方插件市场仓库。应用内的"插件市场"从此仓库的 `index.json` 拉取插件列表，并跳转插件仓库让用户自行下载安装。

## 目录结构

| 文件 | 说明 |
|---|---|
| `index.json` | **自动生成**的插件索引，应用侧数据源。**不要手改** |
| `plugins-meta.json` | 收录表（repo + 分类 + 图标），由机器人维护 |
| `scripts/build-index.mjs` | 索引生成器：遍历收录表 → 拉取各仓库 `plugin.json` → 聚合生成 `index.json` |
| `.github/workflows/submit-plugin.yml` | 上架自动化：收到 Issue → 校验 → 更新收录表 → 重新生成索引 → 评论结果 |

## 插件仓库规范

上架插件需要满足：

- **plugin.json 必须位于插件仓库根目录**，字段齐全（`id` / `version` / `name` 必填；`minAppVersion`、`description`、`capabilities` 等可选）。完整规范见 [Marcel SSH 插件 API 文档](https://github.com/q541810/Marcel-SSH/blob/main/docs/plugin-api.md)
- **建议**提供 `README.md`，包含功能介绍、安装方式、配置说明和使用示例
- 仓库必须公开

## 上架流程

1. 创建 [插件上架 Issue](../../issues/new?template=plugin-submit.md)
2. 按模板填写插件 ID、仓库地址、分类、图标，并勾选全部确认事项
3. 机器人自动校验（仓库可达 / plugin.json 合法 / ID 唯一），结果评论在 Issue 中：
   - ✅ 通过 → 自动收录并刷新 `index.json`
   - ❌ 失败 → 评论原因，修改 Issue 内容（编辑可重新触发）或重新提交

**更新插件**：修改插件仓库并发布新版本后，重新提交本模板（插件 ID 不变即视为更新），或编辑原 Issue 重新触发校验。

## index.json 协议

```jsonc
{
  "generatedAt": "2026-08-03T00:00:00.000Z",
  "plugins": [
    {
      "id": "long-term-memory",        // 插件 ID（plugin.json 提取）
      "name": "长期记忆",               // 显示名称
      "version": "1.0.3",              // 版本号（plugin.json 提取）
      "publisher": "棍母",             // 发布者
      "minAppVersion": "0.6.0",        // 最低兼容应用版本（null = 不限）
      "description": "让 Agent ...",   // 简介（plugin.json 提取）
      "capabilities": ["ssh.list"],    // 权限声明
      "category": "memory",            // 分类
      "icon": { "kind": "emoji", "value": "🧠" },  // 图标（emoji 或 img）
      "repoUrl": "https://github.com/q541810/long-term-memory",  // 插件仓库
      "updatedAt": "2026-08-03"
    }
  ]
}
```

## 本地维护

重新生成索引（需要 Node 18+，无需认证）：

```bash
node scripts/build-index.mjs
```
