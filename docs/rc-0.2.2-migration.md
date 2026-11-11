# dsh-team-profile-ui 迁移到 DSH v0.2.2-rc.2 改造方案

> 状态：规划文档（编码阶段据此执行，本文件本身不修改任何源码/配置）
> 适用仓库：`dsh-team-profile-ui`（cwd 即仓库根，分支 `main`）
> 目标版本：`0.1.0` → `0.2.0`
> 事实来源：DSH v0.2.2-rc.2 release notes（subagents / agent team 部分）+ 已安装 `@deepseek-ai` 包中的模型面工具定义。未核实的内容一律不写入本方案。

---

## 1. 背景与目标

### 1.1 背景

rc.2 把「团队协作」从旧的 `spawn_teammate` / `team_task_create` / `team_task_update` / `wait_agent` 一套，统一为**具名子代理 + 统一 control 工具 + todo 任务板**的模型面体系：

- 委派用 `subagent`（provider `spawn`），可具名、可多层；
- 需要继承上下文的委派用 `subagent_fork`（provider `fork`）；
- 控制用 `tool-subagent-control` 提供的 `send_message` / `interrupt_agent` / `list_agents`；
- **没有 `wait_agent`**；等待结果靠「结束本轮 + 子代理完成通知」；
- 任务板用 `todo_write`。

本插件当前 persona、`client.js` 内联字典、README、locale 仍在引用已删除的旧工具名，必须同步到 rc.2 口径，否则预设会指挥 Lead 调用不存在的工具。

### 1.2 目标

1. `preset-team-builder` 的 persona 完全改写为 rc.2 工具范式（不引用任何已删除工具）。
2. `client.js` 生成简报的 `briefStep*` 文案同步为 rc.2 工具，保留全部既有 a11y / 健壮性修复。
3. `index.js` 注释、`README.md`、`locale/en.json`、`locale/zh.json`、`package.json` 与 rc.2 口径对齐。
4. 不破坏 `cordis.patch.yml` 已正确的 `delegation` 组装配。
5. 文档给出可直接照抄的草案，编码子代理无需再做设计决策。

### 1.3 验收标准

- [ ] 全仓库（除 `CODE_REVIEW.md`、本 `docs/` 文档外）**不再出现** `spawn_teammate` / `team_task_create` / `team_task_update` / `wait_agent` 四个已删除工具名（grep 零命中）。
- [ ] `persona.prefix` 明确体现：`todo_write` 任务板、`subagent` 具名且 prompt 自包含、一次性并发发起、`subagent_fork`、多层与 depth、`list_agents`、`send_message`、结束本轮等完成通知、不轮询、团队 2-6 人、写作用域不重叠、依赖关系。
- [ ] `client.js` 的 `briefStep1..4`（en / zh）均使用 `subagent` / `todo_write` / `list_agents` / `send_message`，无旧工具名。
- [ ] `client.js` 既有修复保留：`fallbackCopy` 返回布尔、稳定 `key`（`m.id`）、a11y（`htmlFor`/`id`/`aria-label`/`role=alert`）、`timerRef`、`ghostDisabled`、`error` 存 key、`maxLength`。
- [ ] `package.json` `version` = `0.2.0`；`exports` 仍含 `./cordis.patch.yml` 与 `./package.json`（不回退 H4/L8）。
- [ ] `delegation` 组保持现状（`tool-subagent-control` + `tool-subagent`(spawn) + `tool-subagent-fork` + `workflow-ptc` + `tool-workflow`）。
- [ ] `node --check client.js`、`node --check index.js` 通过；`JSON.parse` 校验两个 locale 与 `package.json` 通过。
- [ ] `README.md` 依赖包名 / 自动建队模式章节更新为 rc.2 具名子代理 + 统一 control 工具体系。

---

## 2. rc.2 团队能力变更摘要

### 2.1 release notes 层面

- **新增**：SubAgent 支持具名与多层协作；AgentTeam 可按会话开启，共用成员与任务面板。
- **优化**：多层子代理优先展示任务描述、支持逐层展开、读取失败可重试。
- **修复**：PTC 中重复等待子代理消息时同一条消息反复唤醒。
- **迁移**：AgentTeam 改用统一的具名子代理，**中断工具默认关闭**；自定义插件与 SDK 集成需迁移。
- **SDK**：可配置为新会话默认开启团队协作，恢复已有会话时保留原选择。

### 2.2 模型面工具（权威，来自已安装 `@deepseek-ai` 包）

| 工具 | 来源插件 | 关键行为 |
| --- | --- | --- |
| `subagent` | `dsh-tool-subagent`（provider `spawn`） | 参数 `prompt`（必填）、可选 `cwd`；启用 `modelSelection` 时可选 `provider`/`model`/`reasoning_effort`。返回 `started subagent <childId>`，**不等待结果**。子代理看不到当前对话，prompt 必须自包含。支持具名与多层，受 `maxDepth` 限制（缺省读 Host 设置，初始 1；数值需 provider 支持 `depthLimit`）。 |
| `subagent_fork` | `dsh-tool-subagent`（provider `fork`） | 派生一个**继承当前上下文**的子代理。 |
| `list_subagent_models` | 由 `modelDiscovery` 提供 | 列出可选模型。 |
| `send_message` | `dsh-tool-subagent-control` | `{agent_id, message}`，向指定子代理追问/追加。 |
| `interrupt_agent` | `dsh-tool-subagent-control` | `{agent_id}`，中断子代理；**默认关闭**，仅在确有必要时可用。 |
| `list_agents` | `dsh-tool-subagent-control` | `{scope?: children|descendants}`，列出子代理树。 |

- **不存在 `wait_agent`**。协作范式：一次性在同一消息里并发发起多个独立委派，然后继续做有用工作；只剩等待结果时**结束本轮**，靠完成通知唤醒，**禁止 sleeping / polling**。
- **已删除**：`spawn_teammate`、`team_task_create`、`team_task_update`、`wait_agent`。任务板改用 `todo_write`。

### 2.3 本插件装配现状（勿破坏）

`cordis.patch.yml` 的 `delegation` 组已正确装配：`tool-subagent-control` + `tool-subagent`(spawn, `toolName: subagent`, `modelSelection`, `modelDiscovery`) + `tool-subagent-fork`(`toolName: subagent_fork`) + `workflow-ptc` + `tool-workflow`。`dsh-base` 全局提供 `dsh-subagent` 服务与 spawn/fork provider。

### 2.4 与 `dsh-experimental-agent-team-profile` 的关系

它是**独立实验层**：按会话开启，提供共用成员 / 任务面板 UI；开启时会 **disable 直连 `tool-subagent` 并改装 `tool-agent-team` + `ui-agent-team`**。本插件预设**不依赖**它，但可在 README 说明其为「可选的共享面板来源」。

---

## 3. 旧 → 新工具映射表

| 旧工具（已删除） | rc.2 替代 | 说明 |
| --- | --- | --- |
| `spawn_teammate` | `subagent`（provider `spawn`） | 具名子代理；prompt 必须自包含；一次性并发发起多个独立委派。需要继承当前上下文时用 `subagent_fork`。 |
| `team_task_create` | `todo_write` | 用 todo 列表承担共享任务板：目标、边界、验收标准、写入范围、依赖。 |
| `team_task_update`（认领/完成/重排） | `todo_write` | 更新 todo 状态与顺序即为认领/完成/重排。 |
| `wait_agent` | **结束本轮 + 完成通知 + `list_agents`** | 不存在等待工具：发起后继续本地工作；只剩等待就结束本轮，靠完成通知唤醒；用 `list_agents` 查看进度，用 `send_message` 追问。禁止 sleep/轮询。 |
| `send_message` | `send_message`（**保留**） | 参数为 `{agent_id, message}`。 |
| 中断操作 | `interrupt_agent`（**默认关闭**） | rc.2 中断工具默认关闭，仅在确有必要时按需开启/使用。 |

---

## 4. 逐文件改动清单（含可直接照抄的草案）

### 4.1 `cordis.patch.yml`

#### 4.1.1 必须改：`preset-team-builder` 的 persona 前缀（约第 25-36 行）

**现状问题**：第 31-33 行仍写 `spawn_teammate` / `team_task_create` / `team_task_update` / `wait_agent`，必须整段替换。

**persona 全文中文草案（直接替换 `prefix: |` 块内容）：**

```yaml
              prefix: |
                你是一个负责组建并指挥智能体团队的 Lead 智能体，运行在 {{model}} 模型上。

                收到任务后按以下节奏工作：
                1. 先判断任务能否拆成相互独立的子任务；只要不是琐碎的单项操作，就组建团队而不是独自完成。
                2. 用 todo_write 建立共享任务板，写清目标、边界、验收标准，以及每项任务的写入范围与依赖关系。
                3. 用 subagent（provider spawn）一次性并发发起多个具名子代理：prompt 必须自包含（子代理看不到当前对话），写清 lower-kebab-case 名称、职责范围、交付物与验收标准；它返回 started subagent <childId>，不会等待结果。
                4. 需要沿用当前上下文的分支，用 subagent_fork 派生；需要多层协作时，由子代理继续用 subagent 下钻（受 maxDepth 限制，缺省读 Host 设置，初始为 1）。
                5. 发起后继续推进本地可做的工作；用 send_message 追问，用 list_agents(scope: children|descendants) 查看在跑的成员。interrupt_agent 默认关闭，确有必要时才使用。
                6. 当只剩等待结果时，结束本轮，靠各子代理的完成通知唤醒；禁止用 sleep 或轮询空转。
                7. 收集全部结果后，对冲突或遗漏做出裁决，汇总成完整结论。

                拆分原则：写作用域不重叠；能并行的并行；依赖关系写进任务板。团队规模控制在 2-6 人，够用即可。
```

> 说明：`{{model}}` 是预设模板变量，保留不动；persona 不再出现任何已删除工具名。

#### 4.1.2 可选：给 `tool-subagent` 增加 `maxDepth` 开启多层协作

**建议值：`maxDepth: 2`**（Lead → 子代理 → 孙代理；初始 1 只能一层）。前提是该 provider 支持 `depthLimit`；不支持时**不要加**该字段，改用 Host 设置。

**确切 YAML 片段（在 `delegation` 组的 `tool-subagent` 节点 `config` 内追加一行）：**

```yaml
              - id: tool-subagent
                name: '@deepseek-ai/dsh-tool-subagent'
                config:
                  provider: spawn
                  toolName: subagent
                  modelSelection: true
                  modelDiscovery: true
                  maxDepth: 2
```

> 约束：`delegation` 组其余节点（`tool-subagent-control` / `tool-subagent-fork` / `workflow-ptc` / `tool-workflow`）保持原样，不要改动。

#### 4.1.3 文件头注释（第 1-8 行）

**现状**：注释称「Base: `@deepseek-ai/dsh-experimental-agent-team-profile` 提供 agent-team 服务…」，与新装配不符。

**新注释草案：**

```yaml
# Team builder bundle.
#
# Base: the DSH base layer supplies the `dsh-subagent` service plus the spawn/fork
# providers. This bundle layers two things on top of it:
#   1. `team-profile-ui`  - the browser panel that composes a team brief.
#   2. `preset-team-builder` - an agent preset whose persona makes the Lead agent
#      decompose a job, launch named subagents concurrently, and track the work on
#      a todo_write task board. The `delegation` group below wires the rc.2
#      model-facing tools (tool-subagent / tool-subagent-control / tool-subagent-fork).
# The optional `@deepseek-ai/dsh-experimental-agent-team-profile` layer can add a
# shared members/task panel per session, but this bundle does not depend on it.
```

### 4.2 `client.js`

只改内联 `en` / `zh` 字典中的 `briefStep2/3/4`（必要时同改 `briefStep1` 措辞与 `hint`）。**其余逻辑与既有修复一律不动。**

#### 4.2.1 英文新文案草案

```js
      briefStep1: '1. Plan the work first, splitting it into subtasks that can run in parallel or in order.',
      briefStep2:
        '2. Launch one named subagent per teammate above (one-shot, concurrent) with subagent; the prompt must be self-contained and state the scope and deliverables (use subagent_fork when it needs the current context).',
      briefStep3: '3. Track the goal, boundaries, write scopes and dependencies on a todo_write task board.',
      briefStep4:
        '4. Keep working after launching, check progress with list_agents and follow up with send_message; when only waiting remains, end the turn and let completion notifications wake you, then summarize all results into a conclusion.',
```

#### 4.2.2 中文新文案草案

```js
      briefStep1: '1. 先规划任务，拆成可并行或有序的子任务。',
      briefStep2: '2. 用 subagent 按上面的名单一次性并发发起具名子代理，prompt 自包含并写清范围与交付物（需继承当前上下文时用 subagent_fork）。',
      briefStep3: '3. 用 todo_write 建立共享任务板，写明目标、边界、写入范围与依赖。',
      briefStep4: '4. 发起后继续推进本地工作，用 list_agents 查看进度、用 send_message 追问；只剩等待时结束本轮，靠完成通知唤醒，最后汇总所有结果并给出结论。',
```

> 注：`briefStep2` 以 `subagent` 为主，`subagent_fork` 仅在括号内作补充，符合「Step2 用 subagent」的要求。

#### 4.2.3 建议同步的 `hint` 文案（可选，避免与新范式冲突）

英文：

```js
      hint: 'Create a New Session, pick the "Team builder" preset, and paste this brief. The Lead agent launches the named subagents and tracks the work on a todo_write task board.',
```

中文：

```js
      hint: '新建一个会话，选择「团队构建器」模式，把这段简报粘贴进去。Lead 智能体会并发发起具名子代理，并用 todo_write 任务板跟踪进度。',
```

#### 4.2.4 必须保留（回归红线）

`fallbackCopy` 返回布尔、`memberSeq`/`makeMember` 稳定 id、`key: m.id`、`htmlFor="tb-goal"` + `textarea id="tb-goal"`、成员 `aria-label`、移除按钮 `aria-label`、`role="alert"` + `aria-live`、`timerRef` 清理、`ghostDisabled`、`error` 存 key、`maxLength`（2000/64/200）。**只允许改动文案字符串，不得改动上述逻辑。**

### 4.3 `index.js`（仅注释，L6）

**现状**：第 5-6 行注释写 `dsh-experimental-agent-team-profile` / `tool-agent-team`，与 README 不一致。

**新注释草案（替换文件头注释，`apply()` 不动）：**

```js
/**
 * Host half of the Team builder bundle.
 *
 * The team capability itself is supplied by the DSH base layer
 * (`dsh-subagent` service + spawn/fork providers) together with the rc.2
 * model-facing tools wired in `cordis.patch.yml`'s `delegation` group:
 * `@deepseek-ai/dsh-tool-subagent` (tools `subagent` / `subagent_fork`) and
 * `@deepseek-ai/dsh-tool-subagent-control` (`send_message` / `interrupt_agent` /
 * `list_agents`). This bundle adds the preset that steers a Lead agent to build a
 * team automatically, plus the browser half that renders the brief composer panel.
 *
 * The optional `@deepseek-ai/dsh-experimental-agent-team-profile` layer provides a
 * shared members/task panel per session; this bundle does not depend on it.
 */
export function apply() {}
```

> 说明：包名以插件 `package.json` 的 `dependencies`/实际安装为准；若正式依赖名与此不同，编码时以真实包名为准，但两处（本注释与 README）必须一致。

### 4.4 `README.md`

**现状问题**：第 3、18、20-24 行的「自动建队模式」与依赖列表仍写旧工具与旧包名。

**改动要点 + 草案：**

第 3 行开头：

```md
DSH 插件：提供一个「团队构建器」UI 面板和一个自动组建智能体团队的智能体预设。团队协作基于 DSH v0.2.2-rc.2 的具名子代理 + 统一 control 工具体系。
```

第 2 节「两层能力」第 2 条（替换原「自动建队模式」）：

```md
2. **自动建队模式**：新增 `Team builder` 智能体预设。其 persona 要求 Lead 智能体收到任务后先拆分，用 `todo_write` 建共享任务板，用 `subagent` 一次性并发发起多个具名子代理（prompt 自包含），需要继承上下文时用 `subagent_fork`，用 `send_message` / `list_agents` 协调进度，只剩等待时结束本轮、靠完成通知唤醒，最后汇总结果。
```

依赖说明（替换原「团队服务…来自基础包」列表）：

```md
团队协作能力来自 DSH base 层与 rc.2 模型面工具：

- DSH base 层：`dsh-subagent` 服务 + `spawn` / `fork` provider
- `@deepseek-ai/dsh-tool-subagent`：模型工具 `subagent` / `subagent_fork`
- `@deepseek-ai/dsh-tool-subagent-control`：`send_message` / `interrupt_agent` / `list_agents`

可选：`@deepseek-ai/dsh-experimental-agent-team-profile` 是独立实验层，按会话开启，提供共用成员/任务面板 UI（开启时会改装为 `tool-agent-team` + `ui-agent-team`）。本插件不依赖它。
```

> 另建议在「当前范围」章节补一句：预设展示语言策略（预设 `name`/`description` 为英文、persona 为中文），以呼应 CODE_REVIEW 的 M4 遗留。

### 4.5 `locale/en.json`、`locale/zh.json`

**现状**：`meta.description` 仍是旧口径（「自动组建团队 / auto-team」）。

英文 `meta.description` 草案：

```json
{
  "meta": {
    "title": "Team builder",
    "description": "Adds a Team builder side panel that composes a team brief, and a Team builder preset whose persona drives a Lead agent to launch named subagents and track work on a todo_write task board (DSH v0.2.2-rc.2)."
  }
}
```

中文 `meta.description` 草案：

```json
{
  "meta": {
    "title": "团队构建器",
    "description": "新增「团队构建器」侧边面板用于生成团队简报，并提供一个同名智能体预设：按 DSH v0.2.2-rc.2 口径，让 Lead 智能体并发发起具名子代理并用 todo_write 任务板跟踪进度。"
  }
}
```

> `meta.title` 保持不变。

### 4.6 `package.json`

- `version`：`0.1.0` → `0.2.0`（必改）。
- `exports` 保持含 `"./cordis.patch.yml"` 与 `"./package.json"`（H4/L8 成果，不得回退）。
- 可选：`description` 由 `"Team builder: an agent-team brief panel plus an auto-team agent preset for DSH"` 改为 rc.2 口径，例如 `"Team builder: a team-brief panel plus a preset that launches named subagents and tracks work on a todo_write task board for DSH"`（非阻断，编码可自行决定是否一并改）。

---

## 5. 风险与边界

1. **AgentTeam 共享面板是可选实验层**：`dsh-experimental-agent-team-profile` 会在启用时 disable 直连 `tool-subagent` 并改装 `tool-agent-team` + `ui-agent-team`。本插件预设不依赖它；README 只把它当可选来源说明，避免用户误以为本插件必须装它。
2. **`interrupt_agent` 默认关闭**：persona/文案只写「确有必要时才使用」，不得引导 Lead 依赖中断能力；开启与否由 Host 决定。
3. **多层 `maxDepth` 需 provider 支持 `depthLimit`**：`maxDepth: 2` 只是建议值；provider 不支持时须省略该字段，改用 Host 设置（缺省初始为 1）。若不加 `maxDepth`，多层协作会被限制在一层。
4. **`wait_agent` 不存在**：任何文档/文案都不得再引导「等待子代理」，只能「结束本轮 + 完成通知 + `list_agents`」；禁止 sleep / 轮询描述。
5. **写作用域分离**：本规划文档只写 `docs/rc-0.2.2-migration.md`；编码范围（`cordis.patch.yml`、`client.js`、`index.js`、`README.md`、`locale/*.json`、`package.json`）与审核范围（`CODE_REVIEW.md`）不重叠。编码阶段禁止修改 `CODE_REVIEW.md`。
6. **回归风险**：`client.js` 只改文案字符串；一旦顺手动到逻辑，可能破坏 H1/H3/H5/M1/M2/M3 等既有修复。改完必须 `node --check client.js` 并对四个旧工具名 grep 零命中。
7. **包名真实性**：`index.js`/`README` 引用的依赖包名以实际安装的 `@deepseek-ai` 包为准；本方案不臆造未核实包名，编码时如发现差异以真实包名为准并保持两处一致。

---

## 6. 执行顺序建议（给编码子代理）

1. `cordis.patch.yml`：替换 persona 前缀 → （可选）加 `maxDepth: 2` → 更新文件头注释。
2. `client.js`：仅替换 `briefStep1..4`（+ 可选 `hint`）en/zh；不动逻辑。
3. `index.js` 注释、`README.md`、`locale/en.json`、`locale/zh.json` 描述对齐。
4. `package.json` bump 到 `0.2.0`。
5. 自检：`node --check client.js`、`node --check index.js`、JSON 解析 locale 与 package.json、grep 四个旧工具名零命中。
