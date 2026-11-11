# dsh-team-profile-ui

DSH 插件：提供一个「团队构建器」UI 面板和一个自动组建智能体团队的智能体预设。团队协作基于 DSH v0.2.2-rc.2 的具名子代理 + 统一 control 工具体系。

## 组成

| 文件 | 作用 |
| --- | --- |
| `cordis.patch.yml` | 插入 Host 插件行 `team-profile-ui` 和智能体预设 `preset-team-builder` |
| `index.js` | Host 半边，空 `apply()`；团队能力来自 DSH base 层 + rc.2 模型面工具 |
| `client.js` | 浏览器半边：侧边栏图标 + `team-builder` 主面板（生成团队简报） |
| `locale/*.json` | 插件市场里的标题与描述 |
| `icon.svg` | 面板/插件图标 |

## 两层能力

1. **UI 交互**：侧边栏新增「团队构建器」图标，点开是表单——填团队目标、增删成员（名称 + 职责），生成结构化团队简报，一键复制。
2. **自动建队模式**：新增 `Team builder` 智能体预设。其 persona 要求 Lead 智能体收到任务后先拆分，用 `todo_write` 建共享任务板，用 `subagent` 一次性并发发起多个具名子代理（prompt 自包含），需要继承上下文时用 `subagent_fork`，用 `send_message` / `list_agents` 协调进度，只剩等待时结束本轮、靠完成通知唤醒，最后汇总结果。

团队协作能力来自 DSH base 层与 rc.2 模型面工具：

- DSH base 层：`@deepseek-ai/dsh-subagent` 服务 + `spawn` / `fork` provider
- `@deepseek-ai/dsh-tool-subagent`：模型工具 `subagent` / `subagent_fork`
- `@deepseek-ai/dsh-tool-subagent-control`：`send_message` / `interrupt_agent` / `list_agents`

可选：`@deepseek-ai/dsh-experimental-agent-team-profile` 是独立实验层，按会话开启，提供共用成员/任务面板 UI（开启时会改装为 `tool-agent-team` + `ui-agent-team`）。本插件不依赖它。

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
- 预设基于标准预设的插件清单，仅替换 persona；依赖 profile 已加载 DSH base 层的 `dsh-subagent` 服务与 rc.2 模型面工具。
- 预设展示语言策略：预设 `name` / `description` 为英文，persona 为中文。
