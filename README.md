# dsh-team-profile-ui

DSH 插件：在 `@deepseek-ai/dsh-experimental-agent-team-profile` 之上，提供一个「团队构建器」UI 面板和一个自动组建智能体团队的智能体预设。

## 组成

| 文件 | 作用 |
| --- | --- |
| `cordis.patch.yml` | 插入 Host 插件行 `team-profile-ui` 和智能体预设 `preset-team-builder` |
| `index.js` | Host 半边，空 `apply()`；团队能力由 agent-team-profile 提供 |
| `client.js` | 浏览器半边：侧边栏图标 + `team-builder` 主面板（生成团队简报） |
| `locale/*.json` | 插件市场里的标题与描述 |
| `icon.svg` | 面板/插件图标 |

## 两层能力

1. **UI 交互**：侧边栏新增「团队构建器」图标，点开是表单——填团队目标、增删成员（名称 + 职责），生成结构化团队简报，一键复制。
2. **自动建队模式**：新增 `Team builder` 智能体预设。其 persona 要求 Lead 智能体收到任务后先拆分、用 `spawn_teammate` 建具名队友、用 `team_task_create` 建共享任务板、用 `send_message` / `wait_agent` 协调，最后汇总结果。

团队服务、模型工具与 roster 面板来自基础包：

- `@deepseek-ai/dsh-experimental-agent-team`（`ctx.agentTeams` 服务）
- `@deepseek-ai/dsh-experimental-tool-agent-team`（模型工具）
- `@deepseek-ai/dsh-experimental-client-ui-agent-team`（会话头部 roster UI）

## 安装

```powershell
# 在 DSH 里让 Lead 执行：
# plugin_manager install_bundle target = 本目录绝对路径
```

安装后：

- 「团队构建器」面板出现在左侧栏图标区；
- 新建会话时，预设选择器里出现 `Team builder`。

## 当前范围（骨架）

- 面板只生成并复制简报，不直接调用 `ctx.agentTeams` 建队（客户端到 Host 的写 RPC 留作下一步）。
- 预设基于标准预设的插件清单，仅替换 persona；依赖 profile 已加载 agent-team 服务。
